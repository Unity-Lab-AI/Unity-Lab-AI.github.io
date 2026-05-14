// SEX SLAVE DUNGEON — Ollama error classifier + in-game repair flow.
//
// Why this exists: Ollama's /api/tags endpoint reads the manifest dir to list
// "installed" models, but a model whose weights blob has been deleted (Windows
// Storage Sense, CCleaner, manual purge, partial pull) still shows in the list.
// The first real chat/generate call then fails with a misleading HTTP 400 body
// like `"<model>" does not support chat` / `model "<model>" not found, try
// pulling it first` / `"<model>" does not support generate` — all symptoms of
// missing weights even though the manifest is intact.
//
// This module:
//   1. classifyError(httpStatus, bodyText) — returns a structured diagnosis
//   2. parseErrorBody(res)                 — best-effort body→message extract
//   3. probeModelHealth(modelId)           — sends a 1-token ping, classifies
//   4. repairModel(modelId, onProgress)    — wraps SSDModels.pullModel for the
//                                            in-game repair path
//
// Detection signatures live in CORRUPT_SIGNATURES — keep this list in sync with
// what real Ollama 0.16.x returns when weights are missing.

(function () {
  'use strict';

  const cfg = () => window.SSDConfig;

  // Body fragments that mean "the on-disk blob this manifest points to is gone."
  // Case-insensitive substring match.
  const CORRUPT_SIGNATURES = [
    'does not support chat',
    'does not support generate',
    'does not support embeddings',
    'not found, try pulling',
    'no such file or directory',
    'no model file found',
    'failed to load model'
  ];

  // Body fragments meaning the model literally was never pulled (different fix
  // from corruption — both fixed by `ollama pull`, but the message is different).
  const MISSING_SIGNATURES = [
    'pull the model first',
    'model not found'
  ];

  // Classify an Ollama HTTP failure.
  // Returns: { code, label, modelId, detail, fix }
  //   code: 'corrupt' | 'missing' | 'unreachable' | 'unknown'
  function classifyError(httpStatus, bodyText, modelId) {
    const body = String(bodyText || '').toLowerCase();
    const status = Number(httpStatus) || 0;

    // Network / CORS class — happens before any HTTP status fires
    if (status === 0) {
      return {
        code: 'unreachable',
        label: 'Ollama unreachable',
        modelId: modelId || null,
        detail: 'Cannot connect to Ollama. Daemon may not be running, or browser CORS blocked the request.',
        fix: 'Start Ollama. On Windows: launch the Ollama app from Start menu. Make sure OLLAMA_ORIGINS includes this site.'
      };
    }

    // Corruption — blob missing despite manifest present
    for (const sig of CORRUPT_SIGNATURES) {
      if (body.includes(sig)) {
        return {
          code: 'corrupt',
          label: 'Model weights missing on disk',
          modelId: modelId || null,
          detail: 'Ollama has the manifest but the underlying weights blob is gone. Most likely Windows Storage Sense, Defender, or a disk-cleanup tool nuked the multi-GB blob file in ~/.ollama/models/blobs/.',
          fix: `Re-pull the model: ollama pull ${modelId || '<modelId>'} — or click Repair below to do it from inside the game.`
        };
      }
    }

    for (const sig of MISSING_SIGNATURES) {
      if (body.includes(sig)) {
        return {
          code: 'missing',
          label: 'Model never pulled',
          modelId: modelId || null,
          detail: `The model "${modelId}" is not installed on this Ollama daemon.`,
          fix: `Pull it: ollama pull ${modelId || '<modelId>'} — or click Repair below.`
        };
      }
    }

    return {
      code: 'unknown',
      label: `Ollama HTTP ${status}`,
      modelId: modelId || null,
      detail: bodyText ? bodyText.slice(0, 400) : 'No response body.',
      fix: 'Check Ollama logs and the network tab. If this is a CORS error, ensure OLLAMA_ORIGINS is set.'
    };
  }

  // Read a Response body once, return its text. Never throws.
  async function readBodyOnce(res) {
    try { return await res.text(); }
    catch { return ''; }
  }

  // Extract the `error` field from an Ollama-style JSON error body. Falls back
  // to the raw body text. Never throws.
  function parseErrorBody(bodyText) {
    if (!bodyText) return '';
    try {
      const j = JSON.parse(bodyText);
      if (j && typeof j === 'object' && j.error) return String(j.error);
    } catch {}
    return String(bodyText);
  }

  // Send a tiny /api/chat ping at `modelId` to verify the weights actually load.
  // Returns: { status: 'ok' | 'corrupt' | 'missing' | 'unreachable' | 'unknown',
  //            diagnosis: <classification object>, raw: <body text> }
  async function probeModelHealth(modelId) {
    if (!modelId) {
      return { status: 'unknown', diagnosis: null, raw: '' };
    }
    let res;
    try {
      res = await fetch(`${cfg().OLLAMA.endpoint}/api/chat`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'hi' }],
          stream: false,
          options: { num_predict: 1, temperature: 0 }
        })
      });
    } catch (err) {
      // Network / CORS — never made it
      const diag = classifyError(0, String(err?.message || err), modelId);
      return { status: 'unreachable', diagnosis: diag, raw: String(err?.message || err) };
    }
    const bodyText = await readBodyOnce(res);
    if (res.ok) {
      return { status: 'ok', diagnosis: null, raw: bodyText };
    }
    const errMsg = parseErrorBody(bodyText);
    const diag = classifyError(res.status, errMsg, modelId);
    return { status: diag.code, diagnosis: diag, raw: bodyText };
  }

  // Re-pull a model using the existing streaming pull flow.
  // onProgress(msg) gets every Ollama pull-status JSON message in real time.
  async function repairModel(modelId, onProgress) {
    if (!window.SSDModels || !window.SSDModels.pullModel) {
      throw new Error('SSDModels not available — js/setup/models.js must be loaded before repair.');
    }
    if (!modelId) throw new Error('No modelId given to repair.');
    return await window.SSDModels.pullModel(modelId, onProgress);
  }

  // HARD repair — delete the stale manifest entry FIRST, then pull fresh.
  // Use this when a soft `repairModel` (pull only) would short-circuit because
  // Ollama sees the manifest as "already installed" and refuses to re-download
  // the missing weight blob.  This is the path the user asked for after
  // diagnosing that `ollama pull` was lying about completion:
  //   *"it not correctly downloading the model on set up it thinks its there
  //   but its not we need to clear the ollam log that shows its installed or
  //   something"*  (Gee verbatim 2026-05-13)
  //
  // Flow:
  //   1. DELETE /api/delete  — clears the manifest entry + orphan blobs
  //   2. POST /api/pull      — fresh download, no short-circuit
  //   3. probeModelHealth    — verify the model loads and responds
  //
  // onProgress signature is the same as the regular pull — receives Ollama's
  // streaming pull-status JSON messages.  Two synthetic status messages are
  // injected so the UI can show the delete phase:
  //   { status: 'clearing stale manifest', phase: 'delete' }
  //   { status: 'manifest cleared, starting fresh pull', phase: 'pulled-cleared' }
  async function hardRepairModel(modelId, onProgress) {
    if (!window.SSDModels || !window.SSDModels.pullModel || !window.SSDModels.deleteModel) {
      throw new Error('SSDModels not available — js/setup/models.js must be loaded before hard repair.');
    }
    if (!modelId) throw new Error('No modelId given to hard repair.');

    if (onProgress) onProgress({ status: 'clearing stale manifest', phase: 'delete' });
    // Delete may 404 if the manifest is already gone (already-clean state).
    // Either way we proceed to pull — that's the whole point.
    try {
      await window.SSDModels.deleteModel(modelId);
    } catch (err) {
      const msg = String(err?.message || err);
      // 404 = manifest already gone = fine.  Anything else we surface as a
      // pre-pull warning but keep going (the pull may still succeed).
      if (!/404|not found/i.test(msg)) {
        if (onProgress) onProgress({ status: `delete warning: ${msg} — continuing with pull anyway`, phase: 'delete-warn' });
      }
    }
    if (onProgress) onProgress({ status: 'manifest cleared, starting fresh pull', phase: 'pulled-cleared' });

    return await window.SSDModels.pullModel(modelId, onProgress);
  }

  window.SSDOllamaRepair = Object.freeze({
    classifyError,
    parseErrorBody,
    readBodyOnce,
    probeModelHealth,
    repairModel,
    hardRepairModel,
    CORRUPT_SIGNATURES,
    MISSING_SIGNATURES
  });
})();
