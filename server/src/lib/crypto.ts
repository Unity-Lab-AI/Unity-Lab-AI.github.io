/**
 * Crypto helpers.
 * - Random tokens (Web Crypto API in Node 20+)
 * - Ed25519 keypairs for JWT signing + bot signature verification
 * - HMAC for CSRF + webhook verification
 * - Constant-time comparison
 *
 * In dev mode, ensureDevKeys() generates server signing keys to local-keys/ on first boot.
 * In prod, signing keys come from secrets manager via env vars.
 */

import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

// Required for @noble/ed25519 v2+ to enable sync API
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const KEYS_DIR = resolve(process.cwd(), 'server/local-keys');

/** URL-safe random token, default 32 bytes -> ~43 char base64url. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hash of a value, returned as base64url. */
export function sha256(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('base64url');
}

/** HMAC-SHA-256 with constant-time comparison helper. */
export function hmacSha256(key: string | Buffer, payload: string | Buffer): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Generate a fresh Ed25519 keypair. Returns hex strings. */
export async function generateEd25519Keypair(): Promise<{ privateKey: string; publicKey: string }> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKey(privateKey);
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
  };
}

export async function ed25519Sign(privHex: string, payload: Uint8Array): Promise<string> {
  const sig = await ed.sign(payload, Buffer.from(privHex, 'hex'));
  return Buffer.from(sig).toString('hex');
}

export async function ed25519Verify(
  pubHex: string,
  payload: Uint8Array,
  sigHex: string,
): Promise<boolean> {
  try {
    return await ed.verify(Buffer.from(sigHex, 'hex'), payload, Buffer.from(pubHex, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Dev-only: ensure server signing keys exist in local-keys/.
 * Generates Ed25519 JWT signing key + CSRF secret if not already present.
 * Loads them into process.env so the rest of the app can read them like normal secrets.
 */
export async function ensureDevKeys(): Promise<void> {
  if (!existsSync(KEYS_DIR)) mkdirSync(KEYS_DIR, { recursive: true });

  const jwtKeyPath = resolve(KEYS_DIR, 'jwt-signing.hex');
  if (!process.env.JWT_SIGNING_KEY) {
    if (existsSync(jwtKeyPath)) {
      process.env.JWT_SIGNING_KEY = readFileSync(jwtKeyPath, 'utf8').trim();
    } else {
      const { privateKey } = await generateEd25519Keypair();
      writeFileSync(jwtKeyPath, privateKey, { mode: 0o600 });
      process.env.JWT_SIGNING_KEY = privateKey;
    }
  }

  const csrfPath = resolve(KEYS_DIR, 'csrf-secret.txt');
  if (!process.env.CSRF_COOKIE_SECRET) {
    if (existsSync(csrfPath)) {
      process.env.CSRF_COOKIE_SECRET = readFileSync(csrfPath, 'utf8').trim();
    } else {
      const secret = randomToken(48);
      writeFileSync(csrfPath, secret, { mode: 0o600 });
      process.env.CSRF_COOKIE_SECRET = secret;
    }
  }

  const webhookPath = resolve(KEYS_DIR, 'webhook-hmac.txt');
  if (!process.env.GITHUB_WEBHOOK_HMAC_SECRET) {
    if (existsSync(webhookPath)) {
      process.env.GITHUB_WEBHOOK_HMAC_SECRET = readFileSync(webhookPath, 'utf8').trim();
    } else {
      const secret = randomToken(32);
      writeFileSync(webhookPath, secret, { mode: 0o600 });
      process.env.GITHUB_WEBHOOK_HMAC_SECRET = secret;
    }
  }
}
