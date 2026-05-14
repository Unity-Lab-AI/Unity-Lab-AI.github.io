// DUNGEON MASTER: THE HUNT — mic input via MediaRecorder → Pollinations transcribe.
// Captures audio from the user's mic, sends to Pollinations STT, returns transcript.

(function () {
  'use strict';

  let mediaRecorder = null;
  let chunks = [];
  let stream = null;
  let startedAt = 0;

  function isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  function isRecording() { return mediaRecorder && mediaRecorder.state === 'recording'; }

  async function start() {
    if (!isSupported()) throw new Error('MediaRecorder not supported in this browser');
    if (isRecording()) throw new Error('already recording');
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRecorder.start();
    startedAt = Date.now();
  }

  async function stopAndTranscribe() {
    if (!isRecording()) throw new Error('not recording');
    const blob = await new Promise(resolve => {
      mediaRecorder.onstop = () => {
        const b = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
        resolve(b);
      };
      mediaRecorder.stop();
    });
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    mediaRecorder = null;

    // Send to Pollinations transcribe endpoint
    const apiKey = window.DMTHConfig.POLLINATIONS.apiKey;
    if (!apiKey) return { ok: false, error: 'no-pollinations-key', durationMs: Date.now() - startedAt };

    // Pollinations audio transcription: use the text endpoint with an audio input via multipart.
    // The pollinations_transcribe MCP tool normally handles this — here we inline a direct POST.
    try {
      const form = new FormData();
      form.append('file', blob, 'recording.webm');
      form.append('model', 'whisper');
      // Try the Pollinations audio endpoint
      const res = await fetch('https://audio.pollinations.ai/transcribe', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: form
      });
      if (!res.ok) {
        // Fallback — many proxies for pollinations-transcribe use text.pollinations.ai/openai
        return { ok: false, error: `transcribe HTTP ${res.status}`, durationMs: Date.now() - startedAt };
      }
      const data = await res.json().catch(() => null);
      const transcript = data?.text || data?.transcript || '';
      return { ok: true, transcript: transcript.trim(), durationMs: Date.now() - startedAt };
    } catch (err) {
      return { ok: false, error: err.message, durationMs: Date.now() - startedAt };
    }
  }

  async function cancel() {
    if (isRecording()) mediaRecorder.stop();
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    mediaRecorder = null;
    chunks = [];
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.voiceIn = Object.freeze({ isSupported, isRecording, start, stopAndTranscribe, cancel });
})();
