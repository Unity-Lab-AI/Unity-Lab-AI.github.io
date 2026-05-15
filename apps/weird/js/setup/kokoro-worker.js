// DUNGEON MASTER: THE HUNT — Kokoro TTS Web Worker.
//
// Runs Kokoro inference off the main thread so the browser's "Page unresponsive"
// detector never fires during synthesis. The main thread stays free to handle
// clicks, scrolls, animations, and tick work while audio is being generated.
//
// Loaded as a module worker from js/setup/kokoro.js. Communicates via postMessage:
//   { type: 'init',    cdnUrl, modelId, dtype }     → loads the model
//   → { type: 'progress', payload }                  (during model fetch)
//   → { type: 'ready' }                              (model loaded)
//   → { type: 'error',    message }                  (load failed)
//
//   { type: 'speak',   id, text, voice, speed }     → synthesize speech
//   → { type: 'speakResult', id, format: 'blob'|'pcm', bytes, mime?, sampleRate? }
//   → { type: 'speakResult', id, error }             (synthesis failed)

const kokoro = { tts: null, loading: false };

self.onmessage = async (e) => {
  const msg = e.data || {};

  if (msg.type === 'init') {
    if (kokoro.tts || kokoro.loading) return;
    kokoro.loading = true;
    try {
      const mod = await import(msg.cdnUrl);
      const KokoroTTS = mod.KokoroTTS || (mod.default && mod.default.KokoroTTS);
      if (!KokoroTTS) throw new Error('kokoro-js did not export KokoroTTS');
      kokoro.tts = await KokoroTTS.from_pretrained(msg.modelId, {
        dtype: msg.dtype,
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p })
      });
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: String((err && err.message) || err) });
    } finally {
      kokoro.loading = false;
    }
    return;
  }

  if (msg.type === 'speak') {
    const id = msg.id;
    if (!kokoro.tts) {
      self.postMessage({ type: 'speakResult', id, error: 'kokoro not loaded yet' });
      return;
    }
    try {
      const audio = await kokoro.tts.generate(msg.text, { voice: msg.voice, speed: msg.speed });
      if (audio instanceof Blob) {
        const buf = await audio.arrayBuffer();
        self.postMessage({ type: 'speakResult', id, format: 'blob', bytes: buf, mime: audio.type || 'audio/wav' }, [buf]);
      } else if (audio && audio.audio && typeof audio.sampling_rate === 'number') {
        const src = audio.audio;
        const buf = src.buffer.slice(src.byteOffset || 0, (src.byteOffset || 0) + src.byteLength);
        self.postMessage({ type: 'speakResult', id, format: 'pcm', bytes: buf, sampleRate: audio.sampling_rate }, [buf]);
      } else if (audio && typeof audio.toBlob === 'function') {
        const blob = await audio.toBlob();
        const buf = await blob.arrayBuffer();
        self.postMessage({ type: 'speakResult', id, format: 'blob', bytes: buf, mime: blob.type || 'audio/wav' }, [buf]);
      } else {
        self.postMessage({ type: 'speakResult', id, error: 'unknown kokoro output shape' });
      }
    } catch (err) {
      self.postMessage({ type: 'speakResult', id, error: String((err && err.message) || err) });
    }
    return;
  }
};
