/**
 * File storage abstraction.
 *
 * Two implementations:
 *   - LocalStorage (dev/test) — files on disk under FILE_STORAGE_LOCAL_PATH, "signed URLs" are
 *     short-TTL HMAC-signed paths served by the unified server itself
 *   - R2Storage (prod) — Cloudflare R2 / any S3-compatible object store, real signed URLs
 *
 * Both expose the same interface so api/files.ts works against either.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { hmacSha256, constantTimeEqual } from './crypto.js';
import type { AppEnv } from '../config/env.js';

export interface SignedUploadInstructions {
  /** URL the client PUTs the file to */
  upload_url: string;
  /** HTTP method */
  method: 'PUT' | 'POST';
  /** Headers to send (e.g. content-type) */
  headers: Record<string, string>;
  /** TTL in seconds */
  expires_in: number;
}

export interface SignedDownloadInstructions {
  download_url: string;
  expires_in: number;
}

export interface FileStorage {
  kind: 'local' | 'r2';
  /** Sign an upload — returns instructions for the client */
  signUpload(opts: { storage_key: string; mime: string; max_size: number }): Promise<SignedUploadInstructions>;
  /** Sign a download */
  signDownload(opts: { storage_key: string; filename: string }): Promise<SignedDownloadInstructions>;
  /** Delete an object */
  del(storage_key: string): Promise<void>;
  /** Check existence + size (post-upload validation) */
  stat(storage_key: string): Promise<{ exists: boolean; size?: number }>;
  /** Read raw bytes (used by the local-fs signed-download server route) */
  read(storage_key: string): Promise<Buffer>;
  /** Write raw bytes (used by the local-fs signed-upload server route) */
  write(storage_key: string, data: Buffer): Promise<void>;
}

class LocalStorage implements FileStorage {
  readonly kind = 'local';
  constructor(
    private root: string,
    private signSecret: string,
    private publicBaseUrl: string,
  ) {
    if (!existsSync(this.root)) mkdirSync(this.root, { recursive: true });
  }

  private path(storage_key: string): string {
    // Prevent path traversal — storage_key must be a simple key without ..
    if (storage_key.includes('..') || storage_key.startsWith('/') || storage_key.startsWith('\\')) {
      throw new Error('invalid storage_key');
    }
    return resolve(this.root, storage_key);
  }

  private signToken(action: 'put' | 'get', storage_key: string, expiresAt: number): string {
    const payload = `${action}|${storage_key}|${expiresAt}`;
    return hmacSha256(this.signSecret, payload);
  }

  /** Internal — verify a signed URL token. Used by the server's local-storage routes. */
  verifyToken(action: 'put' | 'get', storage_key: string, expiresAt: number, token: string): boolean {
    if (Date.now() > expiresAt) return false;
    const expected = this.signToken(action, storage_key, expiresAt);
    return constantTimeEqual(expected, token);
  }

  async signUpload(opts: { storage_key: string; mime: string; max_size: number }): Promise<SignedUploadInstructions> {
    const ttl = 5 * 60; // 5 min
    const expiresAt = Date.now() + ttl * 1000;
    const token = this.signToken('put', opts.storage_key, expiresAt);
    const url = `${this.publicBaseUrl}/api/files/_local/${encodeURIComponent(opts.storage_key)}?exp=${expiresAt}&t=${encodeURIComponent(token)}`;
    return {
      upload_url: url,
      method: 'PUT',
      headers: { 'Content-Type': opts.mime },
      expires_in: ttl,
    };
  }

  async signDownload(opts: { storage_key: string; filename: string }): Promise<SignedDownloadInstructions> {
    const ttl = 5 * 60;
    const expiresAt = Date.now() + ttl * 1000;
    const token = this.signToken('get', opts.storage_key, expiresAt);
    const url = `${this.publicBaseUrl}/api/files/_local/${encodeURIComponent(opts.storage_key)}?exp=${expiresAt}&t=${encodeURIComponent(token)}&dl=${encodeURIComponent(opts.filename)}`;
    return { download_url: url, expires_in: ttl };
  }

  async del(storage_key: string): Promise<void> {
    const p = this.path(storage_key);
    if (existsSync(p)) unlinkSync(p);
  }

  async stat(storage_key: string): Promise<{ exists: boolean; size?: number }> {
    const p = this.path(storage_key);
    if (!existsSync(p)) return { exists: false };
    return { exists: true, size: statSync(p).size };
  }

  async read(storage_key: string): Promise<Buffer> {
    return readFileSync(this.path(storage_key));
  }

  async write(storage_key: string, data: Buffer): Promise<void> {
    const p = this.path(storage_key);
    const dir = dirname(p);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(p, data);
  }
}

/**
 * Cloudflare R2 (or any S3-compatible) storage.
 * Lazy-imports @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner so the dep is
 * only required when FILE_STORAGE_KIND=r2.
 *
 * Add to package.json dependencies BEFORE setting FILE_STORAGE_KIND=r2:
 *   "@aws-sdk/client-s3": "^3.668.0"
 *   "@aws-sdk/s3-request-presigner": "^3.668.0"
 */
class R2Storage implements FileStorage {
  readonly kind = 'r2';
  private clientPromise: Promise<any> | null = null;
  private bucket: string;

  constructor(private env: AppEnv) {
    if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
      throw new Error('R2 requires R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET');
    }
    this.bucket = env.R2_BUCKET;
  }

  private async getClient() {
    if (this.clientPromise) return this.clientPromise;
    this.clientPromise = (async () => {
      // @ts-ignore — optional dep, only required when FILE_STORAGE_KIND=r2
      const sdk = await import('@aws-sdk/client-s3').catch(() => {
        throw new Error('R2 storage requires @aws-sdk/client-s3. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
      });
      // @ts-ignore — optional dep
      const presigner = await import('@aws-sdk/s3-request-presigner');
      const client = new sdk.S3Client({
        region: 'auto', // R2 ignores region but the SDK requires one
        endpoint: this.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: this.env.R2_ACCESS_KEY_ID,
          secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });
      return { sdk, presigner, client };
    })();
    return this.clientPromise;
  }

  async signUpload(opts: { storage_key: string; mime: string; max_size: number }): Promise<SignedUploadInstructions> {
    const { sdk, presigner, client } = await this.getClient();
    const cmd = new sdk.PutObjectCommand({
      Bucket: this.bucket,
      Key: opts.storage_key,
      ContentType: opts.mime,
    });
    const url = await presigner.getSignedUrl(client, cmd, { expiresIn: 300 });
    return {
      upload_url: url,
      method: 'PUT',
      headers: { 'Content-Type': opts.mime },
      expires_in: 300,
    };
  }

  async signDownload(opts: { storage_key: string; filename: string }): Promise<SignedDownloadInstructions> {
    const { sdk, presigner, client } = await this.getClient();
    const cmd = new sdk.GetObjectCommand({
      Bucket: this.bucket,
      Key: opts.storage_key,
      ResponseContentDisposition: `attachment; filename="${opts.filename.replace(/"/g, '')}"`,
    });
    const url = await presigner.getSignedUrl(client, cmd, { expiresIn: 300 });
    return { download_url: url, expires_in: 300 };
  }

  async del(storage_key: string): Promise<void> {
    const { sdk, client } = await this.getClient();
    await client.send(new sdk.DeleteObjectCommand({ Bucket: this.bucket, Key: storage_key }));
  }

  async stat(storage_key: string): Promise<{ exists: boolean; size?: number }> {
    const { sdk, client } = await this.getClient();
    try {
      const r = await client.send(new sdk.HeadObjectCommand({ Bucket: this.bucket, Key: storage_key }));
      return { exists: true, size: r.ContentLength ?? undefined };
    } catch (e: any) {
      if (e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404) return { exists: false };
      throw e;
    }
  }

  async read(storage_key: string): Promise<Buffer> {
    // Not used in R2 path (downloads go via signed URL directly)
    throw new Error('R2 read() should not be called — clients fetch via signed URLs');
  }

  async write(_storage_key: string, _data: Buffer): Promise<void> {
    throw new Error('R2 write() should not be called — clients PUT via signed URLs');
  }
}

let cached: FileStorage | null = null;

export function getStorage(env: AppEnv): FileStorage {
  if (cached) return cached;
  if (env.FILE_STORAGE_KIND === 'local') {
    const root = resolve(process.cwd(), env.FILE_STORAGE_LOCAL_PATH);
    const secret = process.env.CSRF_COOKIE_SECRET || 'dev-fallback-secret-not-for-prod';
    cached = new LocalStorage(root, secret, env.PUBLIC_BASE_URL);
  } else {
    cached = new R2Storage(env);
  }
  return cached;
}
