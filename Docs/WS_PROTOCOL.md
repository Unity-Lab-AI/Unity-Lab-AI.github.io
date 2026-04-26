# WS_PROTOCOL.md — Unity AI Lab Admin Portal WebSocket Reference

> Per ADMIN_PORTAL_TODO.md AP-245.

Two endpoints, both on the unified server:
- **`/ws`** — for human admins authenticated via session cookie
- **`/ws/bot`** — for bot proxies authenticated via `Authorization: Bearer <bot_id>.<random>`

---

## `/ws` (humans)

### Upgrade

The browser `WebSocket` API automatically forwards the `session` cookie on the upgrade request. The server reads it from `Cookie: session=<jwt>`.

If missing or invalid: server replies `{op:'error', code:'auth_required' | 'invalid_session'}` and closes with code 1008.

### Server → client (immediate after open)

```json
{ "op": "hello", "user_id": "<uuid>" }
```

The connection auto-joins the special `_deploys` pseudo-room → receives `op:'deploy_event'` messages without explicit subscribe.

### Client → server ops

| op | payload | server response |
|---|---|---|
| `ping` | `{}` | `{op:'pong', t: <ts>}` |
| `subscribe` | `{room_id: "..."}` | `{op:'subscribed', room_id}` or `{op:'error', code:'not_a_member'}` |

### Server → client ops (broadcast)

| op | payload |
|---|---|
| `message` | `{message: {id, room_id, sender_user_id, sender_bot_id, kind, body, reply_to, seq, created_at}}` |
| `deploy_event` | `{event_type: 'push'|'deployment_status'|'workflow_run', deploy_event_id, status, deploy_url}` |
| `job_event` | `{event: 'created'|'approved'|'rejected'|'leased'|'completed'|'failed'|'cancelled'|'coordinator_started', job_id, status?, by?}` |
| `error` | `{code: '...', ...details}` |

### Reconnect

Client should auto-reconnect with exponential backoff (1s → 2s → 4s → ... → 30s with jitter). Re-subscribe to all previously-subscribed rooms after `hello`.

The server's `_deploys` auto-join applies on every fresh connection — no client action needed.

### Idle handling

Server replies to `op:'ping'` only — the underlying WS layer handles low-level keepalive. Reverse proxies (Caddy default 1h) may drop idle connections; client reconnect handles this transparently.

---

## `/ws/bot` (bots)

### Upgrade

Bot must send `Authorization: Bearer <bot_id>.<random>` header on the upgrade. The token is validated against `bot_sessions.access_token_hash`.

If missing or invalid: `{op:'error', code:'auth_required'|'invalid_bot_token'|'bot_no_pubkey'}` then close 1008.

### Server → client (after open)

```json
{ "op": "hello", "bot_id": "<uuid>", "ts": "<iso>" }
```

### Client → server ops

| op | payload | requires signature? |
|---|---|---|
| `ping` | `{}` | no |
| `hello` | `{}` | no |
| `send` | `{room_id, body}` | YES |
| `intent` | `{intent: 'request_push'|'claim_lease'|'report_status'|'broadcast_progress', ...}` | YES |

### Signature protocol

For `send` and `intent`, the bot must include:
```json
{
  "bot_id": "<uuid>",
  "op": "send",
  "payload": {...},
  "ts": "<iso 8601>",
  "nonce": "<32 hex chars>",
  "sig": "<128 hex chars Ed25519 signature>"
}
```

The signature is computed over the canonical payload:
```js
const canonical = JSON.stringify({ op, payload, ts, nonce });
const sig = ed25519.sign(privKey, new TextEncoder().encode(canonical));
```

### Replay protection

- `nonce` must be unique within the WS session (server tracks last 1000)
- `ts` must be within ±5 minutes of server clock

### Rate limit

60 messages per 60 seconds per bot. Excess returns `{op:'error', code:'rate_limited'}`.

### Authorization for `send`

A bot can only post `send` to:
- Rooms with `kind = 'BOT_BUS'`
- AND where the bot's owner-admin is a member with non-NULL `joined_at` and NULL `left_at`

Other room kinds reject with `{code:'room_not_bot_bus'}`. Non-member rooms reject with `{code:'owner_not_in_room'}`.

### Server → bot acknowledgments

| op | payload |
|---|---|
| `send_ack` | `{msg_id, seq}` — the message was inserted + broadcast |
| `intent_ack_stub` | `{tracked: 'AP-159', intent_kind}` — current placeholder for intent op |
| `error` | `{code, ...details}` |

The same broadcast goes to ALL `/ws` (human) connections subscribed to that room — admins see bot messages in real time.

---

## Connection lifecycle

```
                 ┌──────────┐
       upgrade   │  /ws or  │
  client  ─────► │  /ws/bot │
                 └────┬─────┘
                      │ verify auth
                      ▼
              ┌───────────────┐
              │  send hello   │◄──── auto-join _deploys (humans)
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   subscribe       send/intent      ping
   (humans)         (bots)
        │             │             │
        ▼             ▼             ▼
   broadcast      sig verify     pong
   to room        + replay       + last_seen_at
                  + rate-limit     touched
                  + room ACL
                      │
                      ▼
                  insert msg
                  broadcast to room
                  ack
```

---

## Notes for implementers

- WS frames are JSON only (no binary protocol).
- Maximum message size at the app layer: ~10KB (8000-char body + envelope).
- The server uses an in-process broker (`server/src/ws/rooms.ts`). For multi-process scale-out, swap to Redis pub/sub or Cloudflare Durable Objects (tracked AP-209-equivalent).
- Bot signature verification uses `@noble/ed25519`. The bot's private key is generated CLIENT-side in proxy.js on first run; only the public key is sent to the server.

---

_Last updated: 2026-04-25. Update on protocol changes — bump a version field in `hello` if breaking._
