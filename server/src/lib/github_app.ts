/**
 * GitHub App integration.
 *
 * Per ADMIN_PORTAL_TODO.md AP-175 through AP-178.
 *
 * The portal authenticates to GitHub as an installed App:
 *   1. Mint App JWT (RS256, signed with App private key, 10-min TTL, iss=app_id)
 *   2. Exchange App JWT for installation access token (1h TTL, cached)
 *   3. Use installation token to call GitHub API
 *
 * No PAT (personal access token) ever — App tokens are auditable per-installation
 * and revocable independently of any user account.
 *
 * Phase 1 implementation: minimal — generate App JWT, fetch installation token,
 * provide a thin client wrapper for the operations the coordinator needs:
 *   - openPullRequest
 *   - mergePullRequest
 *   - getPullRequestStatus
 *   - getCommitStatus
 *   - getDeploymentStatus
 */

import { SignJWT, importPKCS8 } from 'jose';
import type { AppEnv } from '../config/env.js';
import { logger } from './logger.js';

let cachedInstallationToken: { token: string; expires_at: number } | null = null;

async function mintAppJwt(env: AppEnv): Promise<string> {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) {
    throw new Error('GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set');
  }
  const pem = env.GITHUB_APP_PRIVATE_KEY.includes('\n')
    ? env.GITHUB_APP_PRIVATE_KEY
    : env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  const key = await importPKCS8(pem, 'RS256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 60) // clock-skew buffer
    .setExpirationTime('10m')
    .setIssuer(env.GITHUB_APP_ID)
    .sign(key);
}

async function getInstallationToken(env: AppEnv): Promise<string> {
  if (cachedInstallationToken && cachedInstallationToken.expires_at > Date.now() + 60_000) {
    return cachedInstallationToken.token;
  }
  if (!env.GITHUB_APP_INSTALLATION_ID) {
    throw new Error('GITHUB_APP_INSTALLATION_ID must be set');
  }
  const appJwt = await mintAppJwt(env);
  const res = await fetch(
    `https://api.github.com/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`installation token fetch failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { token: string; expires_at: string };
  cachedInstallationToken = {
    token: data.token,
    expires_at: new Date(data.expires_at).getTime(),
  };
  logger.info('GitHub installation token fetched, expires ' + data.expires_at);
  return cachedInstallationToken.token;
}

async function gh(env: AppEnv, method: string, path: string, body?: unknown): Promise<any> {
  const token = await getInstallationToken(env);
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const github = {
  /** Open a PR */
  async openPullRequest(env: AppEnv, opts: { repo: string; head: string; base: string; title: string; body?: string }) {
    return gh(env, 'POST', `/repos/${opts.repo}/pulls`, {
      head: opts.head,
      base: opts.base,
      title: opts.title,
      body: opts.body,
    });
  },

  /** Merge a PR */
  async mergePullRequest(env: AppEnv, opts: { repo: string; pull_number: number; merge_method?: 'merge' | 'squash' | 'rebase'; commit_title?: string }) {
    return gh(env, 'PUT', `/repos/${opts.repo}/pulls/${opts.pull_number}/merge`, {
      merge_method: opts.merge_method ?? 'squash',
      commit_title: opts.commit_title,
    });
  },

  /** Get PR status */
  async getPullRequest(env: AppEnv, opts: { repo: string; pull_number: number }) {
    return gh(env, 'GET', `/repos/${opts.repo}/pulls/${opts.pull_number}`);
  },

  /** Get combined commit status */
  async getCommitStatus(env: AppEnv, opts: { repo: string; ref: string }) {
    return gh(env, 'GET', `/repos/${opts.repo}/commits/${opts.ref}/status`);
  },

  /** List workflow runs for a branch */
  async listWorkflowRuns(env: AppEnv, opts: { repo: string; branch?: string; per_page?: number }) {
    const params = new URLSearchParams();
    if (opts.branch) params.set('branch', opts.branch);
    if (opts.per_page) params.set('per_page', String(opts.per_page));
    return gh(env, 'GET', `/repos/${opts.repo}/actions/runs?${params}`);
  },

  /** Get latest deployment + status */
  async getDeployments(env: AppEnv, opts: { repo: string; environment?: string; per_page?: number }) {
    const params = new URLSearchParams();
    if (opts.environment) params.set('environment', opts.environment);
    if (opts.per_page) params.set('per_page', String(opts.per_page));
    return gh(env, 'GET', `/repos/${opts.repo}/deployments?${params}`);
  },
};
