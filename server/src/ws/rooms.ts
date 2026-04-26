/**
 * In-process room broadcast registry.
 * Maps room_id → set of WebSocket connections.
 * For multi-process scale: replace with Redis pub/sub or Workers Durable Objects.
 */

interface WSLike {
  send(data: string): void;
  readyState?: number;
}

const rooms = new Map<string, Set<WSLike>>();

export function joinRoom(roomId: string, ws: WSLike): void {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId)!.add(ws);
}

export function leaveRoom(roomId: string, ws: WSLike): void {
  rooms.get(roomId)?.delete(ws);
}

export function leaveAllRooms(ws: WSLike): void {
  for (const set of rooms.values()) set.delete(ws);
}

export function broadcastToRoom(roomId: string, payload: unknown): void {
  const set = rooms.get(roomId);
  if (!set) return;
  const msg = JSON.stringify(payload);
  for (const ws of set) {
    try {
      ws.send(msg);
    } catch {
      // Drop stale connections silently
      set.delete(ws);
    }
  }
}

export function roomMemberCount(roomId: string): number {
  return rooms.get(roomId)?.size ?? 0;
}
