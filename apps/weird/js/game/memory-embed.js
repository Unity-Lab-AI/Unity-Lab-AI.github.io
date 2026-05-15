// DUNGEON MASTER: THE HUNT — embedding memory via Ollama nomic-embed-text.
// Embeds each turn, persists vectors in IDB, returns top-K most relevant past turns for prompt context.

(function () {
  'use strict';

  const EMBED_MODEL = 'nomic-embed-text';
  const TOP_K = 5;
  const MIN_TURN_LENGTH = 20;   // don't bother embedding very short turns

  function cfg() { return window.DMTHConfig.OLLAMA; }

  // One-time availability check, cached.  If the embed model isn't pulled OR the endpoint
  // doesn't exist on this Ollama build, we disable embedding entirely so we don't spam 404s.
  let _availability = null;  // null=unchecked, true=available, false=disabled
  async function checkAvailability() {
    if (_availability !== null) return _availability;
    try {
      const res = await fetch(`${cfg().endpoint}/api/tags`, { mode: 'cors' });
      if (!res.ok) { _availability = false; return false; }
      const data = await res.json();
      const models = (data.models || []).map(m => m.name || m.model).filter(Boolean);
      _availability = models.some(m => m.includes('nomic-embed') || m.includes('embed'));
      if (!_availability) console.debug('[memory-embed] no embedding model pulled — embedding disabled for this session');
      return _availability;
    } catch {
      _availability = false;
      return false;
    }
  }

  // Current Ollama uses /api/embed (since Jul 2024).  Older builds use /api/embeddings.
  // We try the new name first and fall back once if it 404s — and remember which one worked.
  let _embedEndpoint = null;   // resolved lazily
  async function embedText(text) {
    if (!(await checkAvailability())) return null;
    const tryEndpoint = async (path) => {
      const res = await fetch(`${cfg().endpoint}${path}`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: EMBED_MODEL, prompt: text, input: text })  // both old + new payload shapes
      });
      if (res.status === 404) return { notFound: true };
      if (!res.ok) throw new Error(`embed HTTP ${res.status}`);
      const data = await res.json();
      // /api/embed returns { embeddings: [[...]] }, /api/embeddings returns { embedding: [...] }
      return { vector: (data.embeddings?.[0]) || data.embedding || null };
    };
    if (_embedEndpoint) {
      const out = await tryEndpoint(_embedEndpoint);
      return out.vector || null;
    }
    // First call — probe /api/embed then /api/embeddings
    try {
      const first = await tryEndpoint('/api/embed');
      if (!first.notFound) { _embedEndpoint = '/api/embed'; return first.vector || null; }
    } catch {}
    try {
      const second = await tryEndpoint('/api/embeddings');
      if (!second.notFound) { _embedEndpoint = '/api/embeddings'; return second.vector || null; }
    } catch {}
    _availability = false;
    console.debug('[memory-embed] neither /api/embed nor /api/embeddings responded — embedding disabled for this session');
    return null;
  }

  function cosine(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom > 0 ? dot / denom : 0;
  }

  // Persist an embedding record for a turn
  async function recordTurn(girlId, role, text, ts) {
    if (!text || text.length < MIN_TURN_LENGTH) return null;
    try {
      const vector = await embedText(text);
      if (!vector) return null;
      const record = { girlId, role, text, ts: ts || Date.now(), vector };
      const key = `mem:${girlId}:${record.ts}`;
      await window.DMTHStorage.cache.put(key, record);
      return key;
    } catch (err) {
      // Silent — embedding is optional enhancement
      return null;
    }
  }

  // Retrieve top-K relevant past turns for a girl given a query string
  async function retrieveRelevant(girlId, queryText, k = TOP_K) {
    if (!queryText || queryText.length < MIN_TURN_LENGTH) return [];
    let queryVec;
    try {
      queryVec = await embedText(queryText);
    } catch {
      return [];
    }
    if (!queryVec) return [];

    // Load all memory records for this girl
    const all = await window.DMTHStorage.cache.getAll();
    const records = (all || []).filter(r => r && r.girlId === girlId && r.vector);
    if (records.length === 0) return [];

    // Score by cosine similarity
    const scored = records.map(r => ({ ...r, score: cosine(queryVec, r.vector) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(r => ({
      role: r.role, text: r.text, ts: r.ts, score: r.score
    }));
  }

  // Check if embedding support is available (Ollama reachable + embed model pullable)
  // Uses the cached availability result — only probes Ollama once per session.
  async function isAvailable() {
    return await checkAvailability();
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.memoryEmbed = Object.freeze({
    embedText, cosine, recordTurn, retrieveRelevant, isAvailable, EMBED_MODEL, TOP_K
  });
})();
