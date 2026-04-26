// WebSocket client with exponential-backoff reconnect.

import { config } from './config.js';

export class WSClient extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.subscribed = new Set();
    this.reconnectDelay = 1000;
    this.shouldReconnect = true;
  }

  connect() {
    this.shouldReconnect = true;
    this._open();
  }

  _open() {
    try {
      this.ws = new WebSocket(config.WS_URL);
    } catch (e) {
      this._scheduleReconnect();
      return;
    }
    this.ws.addEventListener('open', () => {
      this.reconnectDelay = 1000;
      this.dispatchEvent(new CustomEvent('open'));
      // Re-subscribe to rooms after reconnect
      for (const r of this.subscribed) {
        this.send({ op: 'subscribe', room_id: r });
      }
    });
    this.ws.addEventListener('message', (evt) => {
      let parsed;
      try { parsed = JSON.parse(evt.data); } catch { return; }
      this.dispatchEvent(new CustomEvent('message', { detail: parsed }));
    });
    this.ws.addEventListener('close', () => {
      this.dispatchEvent(new CustomEvent('close'));
      if (this.shouldReconnect) this._scheduleReconnect();
    });
    this.ws.addEventListener('error', () => {
      this.dispatchEvent(new CustomEvent('error'));
    });
  }

  _scheduleReconnect() {
    setTimeout(() => this._open(), this.reconnectDelay);
    this.reconnectDelay = Math.min(30000, this.reconnectDelay * 2);
  }

  send(obj) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  subscribe(roomId) {
    this.subscribed.add(roomId);
    this.send({ op: 'subscribe', room_id: roomId });
  }

  close() {
    this.shouldReconnect = false;
    this.ws?.close();
  }
}
