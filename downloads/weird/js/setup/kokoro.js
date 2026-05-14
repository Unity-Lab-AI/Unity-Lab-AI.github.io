// SEX SLAVE DUNGEON — Kokoro TTS loader + in-browser synthesis.
// Uses kokoro-js from CDN. Model weights cached to IndexedDB on first load via the library's own cache.

(function () {
  'use strict';

  const cfg = () => window.SSDConfig;

  let state = {
    tts: null,
    loading: false,
    ready: false,
    error: null,
    progress: 0
  };

  const listeners = new Set();
  function emit() { for (const fn of listeners) { try { fn(state); } catch {} } }

  async function ensureLoaded(onProgress) {
    if (state.ready) return state.tts;
    if (state.loading) {
      // Already loading — wait.
      return new Promise(res => {
        const check = () => state.ready ? res(state.tts) : setTimeout(check, 200);
        check();
      });
    }
    state.loading = true;
    state.error = null;
    emit();

    try {
      const mod = await import(cfg().KOKORO.cdnUrl);
      const KokoroTTS = mod.KokoroTTS || mod.default?.KokoroTTS;
      if (!KokoroTTS) throw new Error('kokoro-js did not export KokoroTTS');

      // Progress callback — kokoro-js reports progress via a callback during download.
      const progressCb = (p) => {
        // p may be { status, file, progress, total }
        const pct = p.progress ?? 0;
        state.progress = pct;
        emit();
        onProgress?.(p);
      };

      state.tts = await KokoroTTS.from_pretrained(cfg().KOKORO.modelId, {
        dtype: cfg().KOKORO.dtype,
        progress_callback: progressCb
      });
      state.ready = true;
      state.loading = false;
      emit();
      return state.tts;
    } catch (err) {
      state.error = err;
      state.loading = false;
      emit();
      throw err;
    }
  }

  async function speak(text, voiceId, speedOverride) {
    if (!state.ready) await ensureLoaded();
    const voice = voiceId || cfg().KOKORO.defaultFemaleVoice;
    const speed = speedOverride ?? cfg().KOKORO.defaultSpeed;

    // kokoro-js returns audio as Tensor / Blob — use generate() for modern versions.
    const audio = await state.tts.generate(text, { voice, speed });

    // audio has .save() / .audio / .sampling_rate depending on version.
    // We normalize to a playable Blob URL.
    let blob;
    if (audio instanceof Blob) blob = audio;
    else if (audio.toBlob) blob = audio.toBlob();
    else if (audio.audio && audio.sampling_rate) {
      blob = pcmToWavBlob(audio.audio, audio.sampling_rate);
    } else {
      throw new Error('unknown kokoro output shape');
    }
    return URL.createObjectURL(blob);
  }

  // Fallback PCM-to-WAV encoder for when kokoro-js returns raw Float32Array + sample rate.
  function pcmToWavBlob(float32, sampleRate) {
    const len = float32.length;
    const buffer = new ArrayBuffer(44 + len * 2);
    const view = new DataView(buffer);
    const write = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    write(0,  'RIFF');
    view.setUint32(4, 36 + len * 2, true);
    write(8,  'WAVE');
    write(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, 'data');
    view.setUint32(40, len * 2, true);
    let off = 44;
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  function isReady() { return state.ready; }
  function isLoading() { return state.loading; }
  function getProgress() { return state.progress; }
  function getError() { return state.error; }
  function onStateChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  window.SSDKokoro = Object.freeze({
    ensureLoaded,
    speak,
    isReady,
    isLoading,
    getProgress,
    getError,
    onStateChange
  });
})();
