#!/usr/bin/env node
/**
 * Unity AI Lab — MCP Proxy Launcher
 *
 * Constant entry point for the unity-admin-portal MCP server, so settings.local.json
 * can ship a single hard-coded entry that works for every user/bot without editing.
 *
 * Behavior:
 *   1. Scan THIS file's directory for `unity-proxy-*.js` (or `.mjs`)
 *   2. Skip the launcher itself
 *   3. If 0 found  -> log help to stderr + exit 1 (Claude Code shows MCP error)
 *   4. If 1 found  -> dynamic-import it (proxy runs in-process, inherits stdio,
 *                     so MCP JSON-RPC over stdin/stdout flows through transparently)
 *   5. If >1 found -> pick the newest by mtime, log which one was chosen
 *
 * Why dynamic import instead of child_process.spawn:
 *   - No extra process. Proxy's main() runs in this process, attaches its own
 *     readline/WebSocket handlers to OUR stdin/stdout — exactly what Claude Code
 *     piped to us. Zero overhead, no fd shuffling.
 *
 * Drop your downloaded `unity-proxy-<bot_id>.js` into this folder and you're done.
 */

import { readdirSync, statSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SELF = basename(fileURLToPath(import.meta.url));

const log = (...args) => process.stderr.write(`[unity-proxy-launcher] ${args.join(' ')}\n`);

const candidates = readdirSync(__dirname)
  .filter((f) => f !== SELF && /^unity-proxy-.+\.(js|mjs)$/.test(f))
  .map((f) => {
    const path = join(__dirname, f);
    return { f, path, mtime: statSync(path).mtimeMs };
  })
  .sort((a, b) => b.mtime - a.mtime);

if (candidates.length === 0) {
  log(`no unity-proxy-*.js found in ${__dirname}`);
  log('download a per-bot proxy from the admin portal and drop it in this folder.');
  process.exit(1);
}

if (candidates.length > 1) {
  log(`${candidates.length} proxies found; using newest by mtime: ${candidates[0].f}`);
  log(`  others: ${candidates.slice(1).map((c) => c.f).join(', ')}`);
}

await import(pathToFileURL(candidates[0].path).href);
