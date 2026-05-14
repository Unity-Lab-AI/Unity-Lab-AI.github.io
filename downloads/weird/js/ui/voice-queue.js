// DUNGEON MASTER: THE HUNT — sentence-aware Kokoro TTS playback queue.
//
// Why this exists: TTS playback gets cut off on long paragraphs. The queue plays each
// sentence one at a time in order, waiting for the first to complete before moving to
// the next.
//
// Kokoro-js has a soft length ceiling — long inputs get truncated mid-sentence
// or generated at degraded quality. Splitting on sentence terminators and
// playing each clip sequentially side-steps the ceiling AND lets us cancel
// cleanly mid-response (new turn / voice-off toggle / room navigation).
//
// Pipeline design: while sentence N is PLAYING, sentence N+1 is GENERATING.
// That way Kokoro's render latency (~50-300ms for short sentences) is hidden
// behind playback, so there's no audible gap between sentences.
//
// Cancellation: a monotonically-incremented `activeToken` invalidates any
// in-flight loop when a new enqueue() / cancel() lands. The current <audio>
// element is paused. The next sentence-gen Promise resolves but its result
// is discarded once the token mismatch is detected.

(function () {
  'use strict';

  let activeToken = 0;
  let activeAudio = null;

  // Threshold under which we pass the whole text to Kokoro as ONE generation. Under
  // this length, sentence-splitting adds 4-6 extra Kokoro round-trips for no benefit —
  // the network + render latency stacks up to 20-30 sec instead of ~3-5 sec for the
  // same audio. Kokoro's soft truncation ceiling sits around 350-400 chars; 280 leaves
  // safe headroom. Long paragraphs (rare in chat) still get sentence-split.
  const SINGLE_SHOT_MAX_CHARS = 280;

  // Split text into sentence-ish chunks. Matches one of:
  //   - run of non-terminator chars followed by one-or-more terminators
  //   - trailing fragment (no terminator at end)
  // Terminators: . ! ? …
  // Strips empty / whitespace-only chunks.
  // Edge case: text with no terminators OR text under SINGLE_SHOT_MAX_CHARS returns
  // the whole text as one chunk for a single fast Kokoro call.
  function splitSentences(text) {
    if (!text || typeof text !== 'string') return [];
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.length <= SINGLE_SHOT_MAX_CHARS) return [trimmed];
    const raw = trimmed.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g);
    if (!raw) return [trimmed];
    const out = [];
    for (const s of raw) {
      const t = s.trim();
      if (t.length > 0) out.push(t);
    }
    return out;
  }

  function cancel() {
    activeToken++;
    if (activeAudio) {
      try { activeAudio.pause(); } catch {}
      try { activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
  }

  function isActive() {
    return activeAudio !== null;
  }

  // Sequentially play TTS for each sentence in `text`. Returns when the last
  // sentence finishes OR when cancelled. Safe to call concurrently — a second
  // call cancels the first and takes over.
  async function enqueue(text, voice, speed) {
    if (!window.DMTHKokoro || !window.DMTHKokoro.isReady()) {
      console.debug('[voice-queue] Kokoro not ready, skipping');
      return;
    }
    cancel();
    const myToken = ++activeToken;

    const sentences = splitSentences(text);
    if (sentences.length === 0) return;

    // Kick off generation of sentence 0 immediately; we'll await it in the loop.
    let nextGen = safeSpeak(sentences[0], voice, speed);

    for (let i = 0; i < sentences.length; i++) {
      if (myToken !== activeToken) return;

      let url;
      try {
        url = await nextGen;
      } catch (err) {
        console.debug('[voice-queue] gen error for sentence', i, err);
        // Move on — skip this sentence rather than aborting the whole queue.
        if (i + 1 < sentences.length) {
          nextGen = safeSpeak(sentences[i + 1], voice, speed);
        }
        continue;
      }

      if (myToken !== activeToken) return;

      // Start generating the NEXT sentence in parallel with this sentence's
      // playback. Hides Kokoro render latency behind the audio playing.
      if (i + 1 < sentences.length) {
        nextGen = safeSpeak(sentences[i + 1], voice, speed);
      }

      // Play this sentence and await its end. Tied to the token so cancel()
      // resolves us out of the wait immediately.
      await new Promise((resolve) => {
        const audio = new Audio(url);
        activeAudio = audio;
        const done = () => {
          if (activeAudio === audio) activeAudio = null;
          resolve();
        };
        audio.onended = done;
        audio.onerror = (e) => { console.debug('[voice-queue] play error:', e); done(); };
        audio.play().catch((err) => {
          // Autoplay blocked is common before user gesture — silent debug.
          console.debug('[voice-queue] autoplay blocked:', err && err.message);
          done();
        });
      });
    }
  }

  // Wrap Kokoro speak with a try/catch so a single bad sentence doesn't
  // poison the whole pipelined generation chain.
  function safeSpeak(text, voice, speed) {
    return Promise.resolve().then(() => window.DMTHKokoro.speak(text, voice, speed));
  }

  window.DMTHVoiceQueue = Object.freeze({
    enqueue,
    cancel,
    isActive,
    splitSentences
  });
})();
