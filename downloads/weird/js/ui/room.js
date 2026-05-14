// SEX SLAVE DUNGEON — individual girl's room (the core interaction view).

(function () {
  'use strict';

  function render(el, params) {
    const girlId = params.girl || window.SSDGame.state.current?.settings?.activeGirlId;
    const girl = window.SSDGame.state.getGirl(girlId);
    if (!girl) {
      el.innerHTML = `<div class="panel"><h2>No captive selected</h2><a href="#roster" class="btn-small">Roster</a></div>`;
      return;
    }
    const dungeon = window.SSDGame.state.getDungeon(girl.assignedDungeonId);
    const dungeonTpl = dungeon && window.SSDAssets.getById('dungeon', dungeon.templateId);

    const activeDrugs = window.SSDGame.drugs.summarize(girl);
    const currentOutfit = (girl.wardrobe || []).find(w => w.id === girl.currentOutfit);

    el.innerHTML = `
      <div class="grid-2">

        <section class="panel">
          <h2>${girl.mood.moodEmoji} ${girl.name} <span class="muted small">(${girl.archetypeTemplate}, ${girl.age})</span></h2>
          <p class="small muted">${girl.backstoryFragment}</p>
          <p class="small">📍 ${dungeonTpl?.displayName || 'Unknown'} · hold ${(girl.assignedHoldIdx ?? 0) + 1}</p>
          <div class="room-profile-img" id="profile-img-slot">
            <div class="small muted">generating profile image…</div>
          </div>
          <div class="stat-row"><span>Mood</span><b>${girl.mood.mood}</b></div>
          <div class="stat-row"><span>Bond L</span><b>${girl.bond.bondLevel}/9</b> <span class="muted small">(xp ${girl.bond.bondXP}, debt ${girl.bond.bondDebt})</span></div>
          <div class="stat-row"><span>Escape risk</span><b>${Math.round((girl.escape?.currentRisk||0)*100)}%</b></div>
          ${window.SSDGame.lifespan ? (() => {
            const ls = window.SSDGame.lifespan.describeLifespan(girl);
            return `<div class="stat-row"><span>Lifespan</span><b>${ls.label}</b></div>
                    <div class="stat-row small"><span>Days held / age</span><b>${ls.daysCaptive} days · age ${ls.currentAge}</b></div>
                    <div class="bar-row"><label>Life meter</label><div class="bar"><div class="bar-fill ${ls.score < 30 ? 'danger' : ''}" style="width:${ls.score}%"></div></div><b>${ls.score}</b></div>`;
          })() : ''}
          <div class="stat-row"><span>Wearing</span><b>${currentOutfit?.displayName || 'default'}</b> <a href="#wardrobe?girl=${girl.id}" class="btn-small">👗 Wardrobe</a></div>
          <div class="stat-row">
            <span>Voice</span>
            <select id="voice-picker" class="inline-select">
              ${window.SSDVoices.VOICES.map(v =>
                `<option value="${v.id}" ${v.id === girl.voiceId ? 'selected' : ''}>${v.displayName} — ${v.timbre}</option>`
              ).join('')}
            </select>
            <button id="voice-preview" class="btn-small" title="Hear a sample in this voice">🔊</button>
          </div>
          <h3>Body</h3>
          <div class="bar-row"><label>Arousal</label><div class="bar"><div class="bar-fill" style="width:${girl.body.arousal}%"></div></div><b>${girl.body.arousal}</b></div>
          <div class="bar-row"><label>Wetness</label><div class="bar"><div class="bar-fill" style="width:${girl.body.wetness}%"></div></div><b>${girl.body.wetness}</b></div>
          <div class="bar-row"><label>Cum L</label><div class="bar"><div class="bar-fill" style="width:${Math.min(100, girl.body.cumLoad*25)}%"></div></div><b>${girl.body.cumLoad.toFixed(1)}</b></div>
          <div class="bar-row"><label>Bruises</label><div class="bar"><div class="bar-fill danger" style="width:${Math.min(100, girl.body.bruises*5)}%"></div></div><b>${girl.body.bruises}</b></div>
          <div class="bar-row"><label>High</label><div class="bar"><div class="bar-fill highgreen" style="width:${girl.body.high}%"></div></div><b>${girl.body.high}</b></div>
          ${activeDrugs.length > 0 ? `<div class="drug-hud small">${activeDrugs.map(d => `<span class="drug-pill">💊 ${d.name} · mag ${d.mag} · ${d.remainingMin}m left</span>`).join(' ')}</div>` : ''}
          <h3>Stats</h3>
          <div class="stat-grid">
            ${Object.entries(girl.stats || {}).map(([k, v]) =>
              `<div class="stat-pill"><span>${k}</span><b>${v}</b></div>`
            ).join('')}
          </div>
          <h3>Supplies</h3>
          <div class="stat-row"><span>🍱 Food</span><b>${girl.consumables?.food?.stock ?? '?'}</b>
            <button class="btn-small" data-feed="basic-meal">Feed (basic)</button>
            <button class="btn-small" data-feed="gourmet-meal">Feed (gourmet)</button>
          </div>
          <div class="stat-row"><span>💧 Water</span><b>${girl.consumables?.water?.stock ?? '?'}</b></div>

          <h3>Drugs</h3>
          <div class="btn-row">
            <button class="btn-small" data-drug="coke">❄️ Line of coke</button>
            <button class="btn-small" data-drug="weed">🌿 Roll a joint</button>
            <button class="btn-small" data-drug="mdma">💊 Share molly</button>
            <button class="btn-small" data-drug="acid">🧪 Tab of acid</button>
            <button class="btn-small" data-drug="whiskey">🥃 Pour whiskey</button>
            <button class="btn-small" data-drug="ketamine">🐴 Bump of K</button>
          </div>

          <h3>Actions</h3>
          <div class="btn-row">
            <button id="record-toggle" class="btn-small">${window.SSDGame.film.isRecording() && window.SSDGame.film.activeSession().girlId === girl.id ? '⏹ Stop recording' : '🎬 Start recording'}</button>
            <button id="selfie-btn" class="btn-small">📸 Demand selfie</button>
            <button id="derobe-btn" class="btn-small ${girl.currentOutfit === 'nude' ? 'btn-primary' : ''}" title="${girl.currentOutfit === 'nude' ? 'Currently nude — click to put default outfit back on' : 'Strip her nude (front-loads nudity in image prompts)'}">🍑 ${girl.currentOutfit === 'nude' ? 'Re-dress' : 'Derobe (nude)'}</button>
            <button id="heal-btn" class="btn-small">❤️‍🩹 Heal (reset damage)</button>
            <button class="btn-small" data-mode="sexy">Mode: Sexy</button>
            <button class="btn-small" data-mode="hurtme">Mode: Hurt Me</button>
            <a class="btn-small" href="#dispose?girl=${girl.id}">⚱️ Dispose / trade</a>
            <button id="list-sale" class="btn-small">⛓️ List on slave market</button>
            <a class="btn-small" href="#timeline?girl=${girl.id}">📖 Timeline</a>
          </div>
          <div id="selfie-slot"></div>
        </section>

        <section class="panel">
          <h2>Log</h2>
          <div id="log" class="log"></div>
          <div id="quick-actions"></div>
          <div class="input-row">
            <textarea id="user-in" rows="2" placeholder="optional — or just click an action above"></textarea>
            <button id="send" class="btn-primary">Send</button>
          </div>
          <div class="small muted" id="stream-status"></div>
        </section>

      </div>
    `;

    // Log renderer
    const logEl = el.querySelector('#log');
    function renderLog() {
      const turns = window.SSDGame.state.getTurns(girl.id, 50);
      logEl.innerHTML = turns.map(t =>
        `<div class="log-entry ${t.role}"><b>${t.role === 'user' ? 'Master' : girl.name}:</b> ${escapeHtml(t.text)}</div>`
      ).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
    renderLog();

    // Quick actions — one-click sends preset user turns.
    const qaEl = el.querySelector('#quick-actions');
    if (qaEl) {
      const mode = window.SSDGame.state.current.settings.mode || 'sexy';
      window.SSDQuickActions.render(qaEl, girl, mode, (text) => {
        sendTurn(text);
      });
    }

    // In-flight lock — only ONE Ollama turn at a time
    let inFlight = false;

    function setInFlight(on) {
      inFlight = on;
      el.classList.toggle('inflight', on);
      const sendBtn = el.querySelector('#send');
      if (sendBtn) sendBtn.disabled = on;
      el.querySelectorAll('.qa-btn, [data-drug], [data-feed], #selfie-btn, #heal-btn, [data-mode], #record-toggle, #list-sale')
        .forEach(b => { b.disabled = on; });
      const status = el.querySelector('#stream-status');
      if (status) status.textContent = on ? '⏳ waiting for her to finish…' : '';
    }

    // Shared send path used by both the typed input and the quick-action clicks
    async function sendTurn(text) {
      if (!text) return;
      if (inFlight) {
        // Drop the click silently — user is already waiting on a response
        const status = el.querySelector('#stream-status');
        if (status) {
          status.textContent = '⏳ wait — she\'s still answering…';
          setTimeout(() => { if (!inFlight && status) status.textContent = ''; }, 1500);
        }
        return;
      }
      // Cancel any in-flight TTS from the previous response — new turn,
      // old audio shouldn't keep talking over the user.
      if (window.SSDVoiceQueue) window.SSDVoiceQueue.cancel();
      el.querySelector('#user-in').value = '';
      window.SSDGame.state.appendTurn(girl.id, 'user', text);

      // Heal verb check
      if (window.SSDGame.damage.shouldHeal(text)) {
        window.SSDGame.damage.heal(girl.id);
        renderLog();
        window.SSDRouter.handle();
        return;
      }

      renderLog();
      setInFlight(true);
      try {
        await streamOllamaResponse(text);
      } finally {
        setInFlight(false);
      }
    }

    async function streamOllamaResponse(text) {
      const statusEl = el.querySelector('#stream-status');
      statusEl.textContent = 'calling Ollama…';

      const streamDiv = document.createElement('div');
      streamDiv.className = 'log-entry assistant streaming';
      streamDiv.innerHTML = `<b>${girl.name}:</b> <span id="stream-txt"></span>`;
      logEl.appendChild(streamDiv);
      const txtEl = streamDiv.querySelector('#stream-txt');

      try {
        const mode = window.SSDGame.state.current.settings.mode || 'sexy';
        const sceneKey = 'room_regular';
        const sceneVars = {
          ROOM_AMBIENCE: `${dungeonTpl?.displayName || 'hideout'}, ${dungeonTpl?.plotTokens || 'bare'}`,
          BOND_LEVEL: girl.bond.bondLevel,
          BOND_NAME: ['terrified','wary','acclimating','curious','ambivalent','reciprocated','dependent','partner','devoted','fully-bonded'][girl.bond.bondLevel],
          BODY_SUMMARY: `arousal=${girl.body.arousal}, wetness=${girl.body.wetness}, bruises=${girl.body.bruises}, high=${girl.body.high}`,
          MOOD: girl.mood.mood
        };
        const { raw, parsed } = await window.SSDGame.ollama.runTurn({
          girl, mode, sceneKey, sceneVars,
          userText: text,
          room: { ambience: dungeonTpl?.plotTokens || '', upgrades: {} },
          onChunk: (chunk, full) => {
            // Strip delta block + any XML scaffolding the model hallucinates while streaming
            const view = full
              .replace(/<delta>[\s\S]*?<\/delta>/g, '')
              .replace(/<delta>[\s\S]*$/g, '')   // delta still being written
              .replace(/<\/?(sentence|asterisk-action|action|response|reply|narration)[^>]*>/gi, '')
              .replace(/```[a-z]*\n?|```/gi, '')
              .trim();
            txtEl.textContent = view;
            logEl.scrollTop = logEl.scrollHeight;
          }
        });
        const clean = (parsed.cleanText || raw).trim();
        streamDiv.classList.remove('streaming');
        // Now that stream is done, replace the visible text with the FULLY cleaned version
        // (extractDelta strips XML hallucinations, system-prompt leakage, etc.)
        if (clean && clean.length > 0) {
          txtEl.textContent = clean;
        } else {
          // Model returned only a delta block with no narration — show a placeholder
          txtEl.textContent = '*…*';
        }
        window.SSDGame.state.appendTurn(girl.id, 'assistant', clean || '*…*');
        if (parsed.delta) window.SSDGame.delta.applyDelta(girl.id, parsed.delta);
        if (mode === 'hurtme') window.SSDGame.damage.accumulateFromText(girl.id, clean);

        // T25.6 — Auto-regenerate room-scene image when state-hash shifts meaningfully
        if (window.SSDGame.imaging && window.SSDGame.imaging.isAvailable()) {
          const refreshed = window.SSDGame.state.getGirl(girl.id);
          const hashNow = roomStateHash(refreshed);
          const prev = refreshed._lastRoomStateHash;
          if (prev !== hashNow) {
            window.SSDGame.state.updateGirl(girl.id, { _lastRoomStateHash: hashNow });
            window.SSDGame.imaging.roomScene(girl.id).then(url => {
              if (url) {
                const slot = el.querySelector('#profile-img-slot');
                if (slot) slot.innerHTML = `<img src="${url}" alt="${girl.name}" class="gen-img profile-img" />`;
              }
            }).catch(() => {});
          }
        }

        // Voice — speak ONLY if toggle is on AND Kokoro finished loading
        {
          const voiceToggleOn = !window.SSDIsVoiceOn || window.SSDIsVoiceOn();
          if (voiceToggleOn && window.SSDKokoro && window.SSDKokoro.isReady()) {
            // Strip asterisk-action tokens so TTS doesn't pronounce "asterisk gasps asterisk"
            const speakable = clean.replace(/\*[^*]*\*/g, '').replace(/\s+/g, ' ').trim();
            if (speakable.length > 0) {
              // Validate voiceId against the live catalog — legacy saves may have an invalid voiceId
              // (e.g., af_jadzia which was removed when we discovered it's not a real Kokoro voice).
              const validIds = new Set(window.SSDVoices.VOICES.map(v => v.id));
              let voice = girl.voiceId;
              if (!voice || !validIds.has(voice)) {
                voice = 'af_nicole';   // safe default for unity-ish / adult-female default
                if (girl.id) window.SSDGame.state.updateGirl(girl.id, { voiceId: voice });
              }
              const emo = window.SSDVoices.pickEmotion({ ...girl, mode, bondLevel: girl.bond.bondLevel, activeDrugs: (girl.body.activeDrugs || []).map(d => d.name || d) });
              const profile = window.SSDVoices.getEmotionProfile(emo);
              const spoken = profile ? profile.preprocess(speakable) : speakable;
              // Sentence-aware queued playback — splits on . ! ? … and plays
              // each clip in order with the next one pipelined-generating
              // behind it.  Avoids Kokoro's long-input truncation problem and
              // lets us cancel cleanly mid-response.  Fire-and-forget; the
              // queue runs to completion on its own.  Cancel triggers on next
              // sendTurn (top of this function) or voice toggle off (chrome).
              if (window.SSDVoiceQueue) {
                window.SSDVoiceQueue.enqueue(spoken, voice, profile?.speed)
                  .catch(err => console.debug('[voice] queue error:', err));
              } else {
                // Defensive fallback — voice-queue module not loaded
                try {
                  const url = await window.SSDKokoro.speak(spoken, voice, profile?.speed);
                  const audio = new Audio(url);
                  audio.play().catch(err => console.debug('[voice] autoplay blocked:', err));
                } catch (err) { console.debug('[voice] speak error:', err); }
              }
            }
          }
        }

        statusEl.textContent = 'done';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      } catch (err) {
        streamDiv.classList.remove('streaming');
        const cls = err.classification;
        const isCorrupt = cls && (cls.code === 'corrupt' || cls.code === 'missing');
        // Real message — no more bare "HTTP 400". If we have a classification,
        // show the human label + a repair button right inside the chat bubble.
        const friendly = cls ? `[${cls.label}] ${cls.detail || err.message}` : `[ollama error: ${err.message}]`;
        txtEl.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = friendly;
        txtEl.appendChild(span);
        if (isCorrupt && window.SSDOllamaRepairOverlay) {
          const repairBtn = document.createElement('button');
          repairBtn.className = 'btn-small btn-primary';
          repairBtn.style.marginLeft = '8px';
          repairBtn.textContent = `🔧 Repair ${cls.modelId || 'model'}`;
          repairBtn.onclick = async () => {
            const result = await window.SSDOllamaRepairOverlay.show({
              diagnosis: cls,
              modelId: cls.modelId,
              reason: 'corruption detected on chat call'
            });
            if (result && result.repaired) {
              // Re-fire the original turn — user shouldn't have to retype.
              sendTurn(text);
            }
          };
          txtEl.appendChild(repairBtn);
          // Also auto-open the overlay so user doesn't have to find the button
          (async () => {
            const result = await window.SSDOllamaRepairOverlay.show({
              diagnosis: cls,
              modelId: cls.modelId,
              reason: 'corruption detected on chat call'
            });
            if (result && result.repaired) sendTurn(text);
          })();
        }
        statusEl.textContent = cls ? `${cls.label}` : `error: ${err.message}`;
      }
    }

    // Typed-input send button just delegates to the shared path
    el.querySelector('#send').onclick = () => {
      const text = el.querySelector('#user-in').value.trim();
      sendTurn(text);
    };

    // Also: Enter-to-send in the textarea (shift-enter newlines), still one-hand friendly
    el.querySelector('#user-in').addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        el.querySelector('#send').click();
      }
    });

    // Record toggle
    el.querySelector('#record-toggle').onclick = () => {
      if (window.SSDGame.film.isRecording() && window.SSDGame.film.activeSession().girlId === girl.id) {
        const film = window.SSDGame.film.stopRecording();
        alert(`Film recorded: ${film.title}\nList price: $${film.currentListPrice}\nListed in market.`);
      } else {
        const tags = [];
        if (!window.SSDGame.state.current.films.some(f => f.girlId === girl.id)) tags.push('first-capture');
        window.SSDGame.film.startRecording(girl.id, tags);
      }
      window.SSDRouter.handle();
    };

    // Mode buttons
    el.querySelectorAll('[data-mode]').forEach(b => {
      b.onclick = () => {
        window.SSDGame.state.current.settings.mode = b.dataset.mode;
        window.SSDGame.state.save();
        window.SSDRouter.handle();
      };
    });

    // Feed buttons
    el.querySelectorAll('[data-feed]').forEach(b => {
      b.onclick = () => {
        const itemId = b.dataset.feed;
        try {
          window.SSDGame.shop.use(itemId, { girlId: girl.id, action: 'feed' });
          const cs = { ...girl.consumables };
          cs.food.stock = (cs.food.stock || 0) + (itemId === 'gourmet-meal' ? 7 : 3);
          cs.food.tier = Math.max(cs.food.tier || 0, itemId === 'gourmet-meal' ? 3 : 1);
          window.SSDGame.state.updateGirl(girl.id, { consumables: cs });
          const newBond = { ...girl.bond, bondXP: girl.bond.bondXP + (itemId === 'gourmet-meal' ? 3 : 1) };
          window.SSDGame.state.updateGirl(girl.id, { bond: newBond });
        } catch (e) { alert(e.message); }
      };
    });

    // Drug buttons
    el.querySelectorAll('[data-drug]').forEach(b => {
      b.onclick = () => {
        try {
          const r = window.SSDGame.drugs.offer(girl.id, b.dataset.drug);
          window.SSDGame.state.appendTurn(girl.id, 'user', `*offers ${b.dataset.drug}*`);
          window.SSDRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });

    // Voice picker — changes this specific girl's voiceId, persists to save.
    const voicePicker = el.querySelector('#voice-picker');
    if (voicePicker) {
      voicePicker.onchange = () => {
        window.SSDGame.state.updateGirl(girl.id, { voiceId: voicePicker.value });
        if (window.SSDNotify) window.SSDNotify.show(`🎙️ ${girl.name} voice → ${voicePicker.options[voicePicker.selectedIndex].textContent.split(' — ')[0]}`, { type: 'success', durationMs: 1500 });
      };
    }
    const voicePreview = el.querySelector('#voice-preview');
    if (voicePreview) {
      voicePreview.onclick = async () => {
        const pickedId = voicePicker.value;
        if (!window.SSDKokoro || !window.SSDKokoro.isReady()) {
          alert('Voice still loading or off. Click the 🔊 toggle in the top bar first.');
          return;
        }
        voicePreview.disabled = true;
        voicePreview.textContent = '⏳';
        try {
          const sample = `Hi Master. This is how ${girl.name} sounds.`;
          const url = await window.SSDKokoro.speak(sample, pickedId, 1.0);
          const audio = new Audio(url);
          audio.play().catch(err => alert('Autoplay blocked — click the page once, then try again. ' + err.message));
        } catch (err) {
          alert('Voice preview failed: ' + err.message);
        } finally {
          voicePreview.disabled = false;
          voicePreview.textContent = '🔊';
        }
      };
    }

    // Heal button
    el.querySelector('#heal-btn').onclick = () => {
      if (confirm(`Heal ${girl.name}? Resets bruises and mood to baseline.`)) {
        window.SSDGame.damage.heal(girl.id);
        window.SSDRouter.handle();
      }
    };

    // Derobe / Re-dress toggle — equip the built-in 'nude' pseudo-outfit OR revert to 'default'.
    // Triggers room-scene image regen via the existing body-state-hash watcher in streamOllamaResponse.
    el.querySelector('#derobe-btn').onclick = () => {
      if (girl.currentOutfit === 'nude') {
        window.SSDGame.wardrobe.equip(girl.id, 'default');
      } else {
        window.SSDGame.wardrobe.derobe(girl.id);
      }
      // Force-regen the profile image since the outfit just flipped.
      if (window.SSDGame.imaging && window.SSDGame.imaging.isAvailable()) {
        window.SSDGame.imaging.generateFor(girl.id, { situation: 'profile', forceRegenerate: true })
          .then(result => {
            if (result?.url) {
              const slot = el.querySelector('#profile-img-slot');
              if (slot) slot.innerHTML = `<img src="${result.url}" alt="${girl.name}" class="gen-img profile-img" />`;
            }
          })
          .catch(() => {});
      }
      window.SSDRouter.handle();
    };

    // Mic-in button for voice turns
    const sendBar = el.querySelector('.input-row');
    if (sendBar && window.SSDGame.voiceIn.isSupported()) {
      const micBtn = document.createElement('button');
      micBtn.id = 'mic-btn';
      micBtn.className = 'btn-small';
      micBtn.textContent = '🎤 Voice';
      sendBar.appendChild(micBtn);
      let recording = false;
      micBtn.onclick = async () => {
        if (!recording) {
          try {
            await window.SSDGame.voiceIn.start();
            recording = true;
            micBtn.textContent = '⏹ Stop + send';
            micBtn.classList.add('btn-danger');
          } catch (err) { alert(err.message); }
        } else {
          micBtn.textContent = 'transcribing…';
          const result = await window.SSDGame.voiceIn.stopAndTranscribe();
          recording = false;
          micBtn.classList.remove('btn-danger');
          micBtn.textContent = '🎤 Voice';
          if (result.ok && result.transcript) {
            el.querySelector('#user-in').value = result.transcript;
            // Auto-send
            el.querySelector('#send').click();
          } else {
            alert(`voice error: ${result.error || 'no transcript'}`);
          }
        }
      };
    }

    // Selfie button — Pollinations overlay. Tries fetch; falls back to direct <img src> if CORS/403.
    el.querySelector('#selfie-btn').onclick = async () => {
      const slot = el.querySelector('#selfie-slot');
      const poses = ['selfie-topless','selfie-midsection','selfie-panties','selfie-lounge','selfie-kneeling','selfie-spread','selfie-bent-over'];
      const pose = poses[Math.floor(Math.random() * poses.length)];
      slot.innerHTML = `<div class="panel"><p class="small muted">Generating selfie (${pose})…</p></div>`;
      try {
        const result = await window.SSDGame.imaging.generateFor(girl.id, { situation: pose });
        if (result.url) {
          const hint = result.directUrl ? ' (direct — not cached)' : (result.cached ? ' (cached)' : '');
          slot.innerHTML = `
            <div class="panel">
              <img src="${result.url}" alt="${girl.name}" class="gen-img" />
              <p class="small muted">${girl.name} · ${pose}${hint}</p>
              <p class="small"><a href="${result.url}" target="_blank" rel="noopener">🔗 open image link</a></p>
            </div>`;
          const img = slot.querySelector('img');
          img.onerror = () => {
            img.outerHTML = `<a href="${result.url}" target="_blank" rel="noopener" class="img-link-fallback">🔗 ${girl.name}</a>`;
          };
        } else {
          slot.innerHTML = `
            <div class="panel danger">
              <p>Selfie failed: ${result.error || 'unknown'}</p>
              ${result.url ? `<p class="small"><a href="${result.url}" target="_blank" rel="noopener">🔗 try link directly</a></p>` : ''}
            </div>`;
        }
      } catch (err) {
        slot.innerHTML = `<div class="panel danger"><p>Selfie error: ${err.message}</p></div>`;
      }
    };

    // Profile image — Pollinations overlay, optional. Renders via <img src=> so it works
    // even when CORS/fetch blocks the blob cache.  On <img> error, fall back to a clickable
    // link so the user can still open the generated image in a new tab.
    (async () => {
      const slot = el.querySelector('#profile-img-slot');
      if (!slot) return;
      try {
        const result = await window.SSDGame.imaging.generateFor(girl.id, { situation: 'profile' });
        if (result && result.url) {
          slot.innerHTML = `<img src="${result.url}" alt="${girl.name}" class="gen-img profile-img" />`;
          const img = slot.querySelector('img');
          img.onerror = () => {
            slot.innerHTML = `<a href="${result.url}" target="_blank" rel="noopener" class="img-link-fallback">🔗 ${girl.name}</a>`;
          };
        } else {
          slot.style.display = 'none';
        }
      } catch {
        slot.style.display = 'none';
      }
    })();

    // List for sale
    el.querySelector('#list-sale').onclick = () => {
      const price = window.SSDGame.slaveMarket.computeSellPrice(girl);
      if (confirm(`List ${girl.name} on the slave market for $${price}?`)) {
        window.SSDGame.slaveMarket.listForSale(girl.id, price);
        alert('Listed.');
        window.SSDRouter.go('slave-market');
      }
    };

    const unsub = window.SSDGame.state.onChange(() => {
      if (location.hash.startsWith('#room')) renderLog();
    });
    return unsub;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // Body-state hash — quantized so small fluctuations don't retrigger regen.
  // Bands of 20 on arousal/wetness/high; bands of 5 on bruises; bond level itself.
  function roomStateHash(girl) {
    const b = girl.body || {};
    return [
      Math.floor((b.arousal  || 0) / 20),
      Math.floor((b.wetness  || 0) / 20),
      Math.floor((b.high     || 0) / 20),
      Math.floor((b.bruises  || 0) / 5),
      Math.round((b.cumLoad  || 0) * 2),
      girl.bond?.bondLevel ?? 0,
      girl.currentOutfit || 'default',
      (b.outfitState || 'intact')
    ].join('|');
  }

  window.SSDRouter.register('room', render);
})();
