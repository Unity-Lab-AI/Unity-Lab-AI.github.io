// DUNGEON MASTER: THE HUNT — Ollama HTTP client with streaming + prompt assembly.

(function () {
  'use strict';

  function cfg() { return window.DMTHConfig.OLLAMA; }

  // Build the system prompt from persona scaffolding + girl overlay + mode + scene.
  function buildSystemPrompt(girl, mode, sceneKey, sceneVars) {
    return window.DMTHTemplates.buildSystemPrompt(girl, mode, sceneKey, sceneVars);
  }

  function buildContextBlock(girl, girlState, room, recentTurns, memory) {
    return window.DMTHTemplates.buildContextBlock(girl, girlState, room, recentTurns, memory);
  }

  function baseOptions() {
    return {
      temperature: cfg().temperature,
      top_p: cfg().topP,
      repeat_penalty: cfg().repeatPenalty,
      num_predict: cfg().maxTokens,
      stop: cfg().stopSequences || []
    };
  }

  // Truncate long responses client-side to max N sentences / M words.
  // Defaults are deliberately TIGHT — one spoken sentence + one action is the target shape.
  function truncateResponse(text, { maxSentences = 2, maxWords = 40 } = {}) {
    if (!text) return text;
    // Always preserve the <delta>...</delta> block at the end
    const deltaMatch = text.match(/<delta>[\s\S]*?<\/delta>/);
    const deltaBlock = deltaMatch ? deltaMatch[0] : '';
    const body = deltaMatch ? text.replace(deltaMatch[0], '').trim() : text.trim();

    // Sentence split — keep asterisk actions together
    const sentences = body.match(/\*[^*]+\*|[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [body];
    let kept = [];
    let wordCount = 0;
    for (const s of sentences) {
      const words = s.trim().split(/\s+/).filter(Boolean);
      if (kept.length >= maxSentences || wordCount + words.length > maxWords) break;
      kept.push(s.trim());
      wordCount += words.length;
    }
    let truncated = kept.join(' ').trim();
    if (truncated !== body) {
      if (!/[.!?…*]$/.test(truncated)) truncated += '…';
    }
    return deltaBlock ? `${truncated}\n${deltaBlock}` : truncated;
  }

  // Build a classified Error from a failed fetch Response. Reads the body once
  // and attaches classification metadata so callers (room.js etc.) can route to
  // the repair overlay when the failure is corruption-shaped.
  async function buildOllamaError(res, modelId) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch {}
    const repair = window.DMTHOllamaRepair;
    const errMsg = repair ? repair.parseErrorBody(bodyText) : bodyText;
    const classification = repair
      ? repair.classifyError(res.status, errMsg, modelId)
      : null;
    const labelPart = classification ? `${classification.label}: ` : '';
    const detailPart = errMsg ? errMsg.slice(0, 240) : `HTTP ${res.status}`;
    const err = new Error(`Ollama ${labelPart}${detailPart}`);
    err.httpStatus = res.status;
    err.bodyText = bodyText;
    err.classification = classification;
    err.modelId = modelId;
    return err;
  }

  // Non-streaming chat — returns {raw, parsed: {cleanText, delta}}.
  async function chat({ system, messages }) {
    const modelId = cfg().activeModel;
    const res = await fetch(`${cfg().endpoint}/api/chat`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: system },
          ...messages
        ],
        stream: false,
        options: baseOptions()
      })
    });
    if (!res.ok) throw await buildOllamaError(res, modelId);
    const data = await res.json();
    // Non-stream path trusts num_predict + stop sequences; no post-truncation.
    const raw = data.message?.content || '';
    const parsed = window.DMTHTemplates.extractDelta(raw);
    return { raw, parsed };
  }

  // Streaming chat — yields text chunks via onChunk, then returns final {raw, parsed}.
  async function chatStream({ system, messages, onChunk }) {
    const modelId = cfg().activeModel;
    const res = await fetch(`${cfg().endpoint}/api/chat`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: system },
          ...messages
        ],
        stream: true,
        options: baseOptions()
      })
    });
    if (!res.ok) throw await buildOllamaError(res, modelId);
    if (!res.body) throw new Error('No stream body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let raw = '';
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (!value) continue;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        try {
          const msg = JSON.parse(s);
          const chunk = msg.message?.content || '';
          if (chunk) { raw += chunk; if (onChunk) onChunk(chunk, raw); }
        } catch {}
      }
    }
    if (buf.trim()) {
      try {
        const msg = JSON.parse(buf.trim());
        const chunk = msg.message?.content || '';
        if (chunk) { raw += chunk; if (onChunk) onChunk(chunk, raw); }
      } catch {}
    }
    // No post-stream truncation. Earlier this function clipped the model's response
    // to 3 sentences / 50 words to enforce the SPEECH-FIRST RULE shape, but that
    // produced a visible "collapse" — the live stream showed the model's full reply,
    // and then the bubble snapped to a shortened version once parsing finished.
    // The model now chooses its own length; the scrubbers in extractDelta still
    // strip system-prompt leakage + third-person Master narration, but never trim
    // for length.
    const parsed = window.DMTHTemplates.extractDelta(raw);
    return { raw, parsed };
  }

  // High-level: run a turn for a girl — assembles full prompt, streams, returns parsed.
  async function runTurn({ girl, mode, sceneKey, sceneVars, userText, room, onChunk }) {
    const system = buildSystemPrompt(girl, mode, sceneKey, sceneVars);
    const girlState = { body: girl.body, mood: girl.mood, bond: girl.bond, stats: girl.stats };
    const recentTurns = window.DMTHGame.state.getTurns(girl.id, 6).map(t => ({ role: t.role, text: t.text }));

    // Retrieve top-K relevant past memories via embedding (fire-and-forget, best-effort)
    let memory = [];
    try {
      if (window.DMTHGame.memoryEmbed) {
        const relevant = await window.DMTHGame.memoryEmbed.retrieveRelevant(girl.id, userText, 5);
        memory = relevant.map(r => `[${r.role}, ${new Date(r.ts).toLocaleDateString()}] ${r.text}`);
      }
    } catch {}

    const context = buildContextBlock(girl, girlState, room, recentTurns, memory);
    // Restructure so Master's action is the FIRST and LAST thing the model sees in the
    // user message. Recent context goes in the middle as supporting state, but the action
    // is bookended for prominence. Previous structure buried the action below the long
    // context block — the model latched onto generic body state and ignored the specific
    // act, producing replies like "your hands feel real" when the action was "spit in
    // her mouth". The bookend pattern forces specific reaction.
    const messages = [
      { role: 'user', content:
`MASTER JUST DID THIS — react to this EXACT act, name what he did, describe how it lands on YOUR specific body part(s) he touched, how you respond physically + verbally in this moment. Do NOT respond generically. Do NOT recycle body state unrelated to this act.

>>> ${userText} <<<

(supporting context — current body / bond / drugs / location / recent turns):
${context}

NOW REACT — to the line between >>> <<< above. Your reply names what he did and reacts specifically. End with the <delta> block.`
      }
    ];
    const result = await chatStream({ system, messages, onChunk });

    // Record this turn + response for future retrieval (fire-and-forget)
    if (window.DMTHGame.memoryEmbed && userText) {
      window.DMTHGame.memoryEmbed.recordTurn(girl.id, 'user', userText).catch(() => {});
    }
    const clean = (result.parsed.cleanText || result.raw).trim();
    if (window.DMTHGame.memoryEmbed && clean) {
      window.DMTHGame.memoryEmbed.recordTurn(girl.id, 'assistant', clean).catch(() => {});
    }
    return result;
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.ollama = Object.freeze({ chat, chatStream, runTurn, buildSystemPrompt, buildContextBlock, truncateResponse });
})();
