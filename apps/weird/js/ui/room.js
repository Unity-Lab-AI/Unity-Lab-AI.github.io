// DUNGEON MASTER: THE HUNT — individual girl's room (the core interaction view).

(function () {
  'use strict';

  // Module-scoped per-girl in-memory caches that survive state.onChange re-renders of
  // the room template. Without these, typing in the Custom Pose textarea or the result
  // image were both wiped every time the 30-second tick fired and triggered a re-render.
  const customPoseDrafts = new Map();    // girlId → draft text
  const customPoseResults = new Map();   // girlId → { url, staging, ts }

  // Button-action-ID mapping for drug/feed/water handlers so they route through
  // applyAction. The 11 ACTIONS entries (drug-coke, drug-weed, drug-mdma, drug-acid,
  // drug-whiskey, drug-ketamine, drug-tranquilizer, feed-basic, feed-gourmet, water-bottled,
  // water-filtered) were previously dead code because the handlers bypassed applyAction
  // and mutated state directly.
  const DRUG_ACTION_MAP = {
    coke:        'drug-coke',
    weed:        'drug-weed',
    mdma:        'drug-mdma',
    acid:        'drug-acid',
    whiskey:     'drug-whiskey',
    ketamine:    'drug-ketamine',
    tranquilizer:'drug-tranquilizer'
  };
  const FEED_ACTION_MAP = {
    'basic-meal':   'feed-basic',
    'gourmet-meal': 'feed-gourmet'
  };
  const WATER_ACTION_MAP = {
    'bottled-water': 'water-bottled',
    'filtered-water':'water-filtered'
  };

  function render(el, params) {
    const girlId = params.girl || window.DMTHGame.state.current?.settings?.activeGirlId;
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) {
      el.innerHTML = `<div class="panel"><h2>No captive selected</h2><a href="#roster" class="btn-small">Roster</a></div>`;
      return;
    }
    const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
    const dungeonTpl = dungeon && window.DMTHAssets.getById('dungeon', dungeon.templateId);

    const activeDrugs = window.DMTHGame.drugs.summarize(girl);
    const currentOutfit = (girl.wardrobe || []).find(w => w.id === girl.currentOutfit);
    // Tranquilizer state. While she's tranquilized: chat / feed /
    // water / sex / derobe / strip-everything buttons disabled; live mm:ss countdown
    // surfaced; auto-wakeup logged when timer hits 0.
    const tranqEntry = window.DMTHGame.drugs.isUnconscious ? window.DMTHGame.drugs.isUnconscious(girl) : null;
    const isUnconscious = !!tranqEntry;
    // Postmortem state — encounterState === 'dead' means body persists in the hold for
    // postmortem use. Chat stays available (Ollama returns narration-only output per
    // room_postmortem scene), sex acts continue, drugs/feed/water/heal are disabled.
    const isDead = girl.encounterState === 'dead';
    const decayMinutes = girl.body?.decayedMinutes || 0;
    const decayDays = decayMinutes / 1440;
    function fmtCountdown(ms) {
      const secs = Math.max(0, Math.floor(ms / 1000));
      const m = Math.floor(secs / 60), s = secs % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // Body stat bars + stamina/health + stress band + drug HUD + tranq banner.
    // Lives in #body-stats-panel so the state.onChange listener can refresh it on every
    // mutation without rebuilding the entire room. Reads fresh state every call so
    // applyAction body deltas (arousal / wetness / cumLoad / bruises / high / stamina /
    // health) reflect immediately in the bars. Pure display markup — no event handlers
    // in here, safe to innerHTML-replace.
    function renderBodyStatsHTML() {
      const g = window.DMTHGame.state.getGirl(girlId);
      if (!g) return '';
      // Defensive null-safe reads — old saves pre-date several body fields. Migration
      // in state.js load() backfills these, but the renderer also guards on every access
      // so a pre-migration crash doesn't take the whole room view down.
      g.body = g.body || {};
      const drugsNow = window.DMTHGame.drugs?.summarize ? window.DMTHGame.drugs.summarize(g) : [];
      const tranqNow = window.DMTHGame.drugs?.isUnconscious ? window.DMTHGame.drugs.isUnconscious(g) : null;
      const isUnc = !!tranqNow;
      const arousal = g.body.arousal ?? 0;
      const wetness = g.body.wetness ?? 0;
      const cumLoad = Number(g.body.cumLoad) || 0;
      const bruises = g.body.bruises ?? 0;
      const high    = g.body.high ?? 0;
      const stam = g.body.stamina ?? 70;
      const hp = g.body.health ?? 100;
      const stamClass = stam >= 60 ? '' : stam >= 30 ? 'warn' : 'danger';
      const hpClass = hp >= 60 ? '' : hp >= 30 ? 'warn' : 'danger';
      const streakMin = g.body?.stressStreakMin || 0;
      const sTier = g.bonuses?.stressBonusTier || 0;
      const sMul = g.bonuses?.stressFilmMultiplier || 1.0;
      const streakDays = streakMin / 1440;
      const inBand = (g.body?.health ?? 100) >= 25 && (g.body?.health ?? 100) <= 55;
      const T1 = 5, T2 = 15;
      let stressLine;
      if (sTier === 2) {
        stressLine = `<span class="gold">⚡ Super stress bonus unlocked · ${sMul}× film multiplier permanent</span>`;
      } else if (sTier === 1) {
        stressLine = `<span class="gold">💢 Stress bonus tier 1 unlocked · ${sMul}× film multiplier · ${(T2 - streakDays).toFixed(1)} more days in band → super bonus</span>`;
      } else if (inBand) {
        stressLine = `💢 In stress band · streak ${streakDays.toFixed(1)}d / ${T1}d (tier 1) → ${(T1 - streakDays).toFixed(1)}d to bonus`;
      } else {
        stressLine = `<span class="muted">Stress band 25-55 HP · keep her here ${T1}d for tier-1 bonus (+$500 + 1.15× film mul), ${T2}d for super (+$2000 + 1.35×)</span>`;
      }
      return `
          <h3>Body</h3>
          <div class="bar-row" data-tooltip="Sexual arousal 0-100. Driven by foreplay + her kinks + bond level."><label>Arousal</label><div class="bar"><div class="bar-fill" style="width:${arousal}%"></div></div><b>${arousal}</b></div>
          <div class="bar-row" data-tooltip="Wetness 0-100. Tracks her physical readiness. High wetness = receptive."><label>Wetness</label><div class="bar"><div class="bar-fill" style="width:${wetness}%"></div></div><b>${wetness}</b></div>
          <div class="bar-row" data-tooltip="Cum load in liters (cumulative). >=1.0 with vaginal-cum tag fires pregnancy conception roll."><label>Cum L</label><div class="bar"><div class="bar-fill" style="width:${Math.min(100, cumLoad*25)}%"></div></div><b>${cumLoad.toFixed(1)}</b></div>
          <div class="bar-row" data-tooltip="Bruise count 0-99. >=15 triggers chronic-injury health drain. Heal action resets."><label>Bruises</label><div class="bar"><div class="bar-fill danger" style="width:${Math.min(100, bruises*5)}%"></div></div><b>${bruises}</b></div>
          <div class="bar-row" data-tooltip="Composite drug intoxication 0-100. Auto-decays as drugs wear off."><label>High</label><div class="bar"><div class="bar-fill highgreen" style="width:${high}%"></div></div><b>${high}</b></div>
          <div class="bar-row" data-tooltip="Stamina 0-100. Drained by sex/violence/johns/drugs (some). Regenerated by rest ticks + feed/water/heal. Below ${window.DMTHGame.actionEffects.STAMINA_THRESHOLD_FOR_STRAIN} = strain: actions take bigger health hits + mood penalties. Drives john happiness payout."><label>Stamina</label><div class="bar"><div class="bar-fill ${stamClass}" style="width:${stam}%"></div></div><b>${stam}</b></div>
          <div class="bar-row" data-tooltip="Health 0-100. Drained by bruises ≥ 15 / starvation / dehydration / violence. Restored only by heal action + feed/water. Below 30 = severe — survival risk."><label>Health</label><div class="bar"><div class="bar-fill ${hpClass}" style="width:${hp}%"></div></div><b>${hp}</b></div>
          <div class="stat-row small" data-tooltip="Maintain body.health in the 25-55 range to accumulate the stress streak. Tier 1 awards $500 + 1.15× permanent film multiplier at 5 game days; tier 2 awards $2000 + 1.35× at 15 game days. Streak resets when she leaves the band.">${stressLine}</div>
          ${drugsNow.length > 0 ? `<div class="drug-hud small">${drugsNow.map(d => `<span class="drug-pill">💊 ${d.name} · mag ${d.mag} · ${d.remainingMin}m left</span>`).join(' ')}</div>` : ''}
          ${isUnc ? `<div class="tranq-banner panel" style="border:1px solid #b00;background:rgba(180,0,0,.08);padding:8px;margin:8px 0">
            <b>💉 TRANQUILIZED — OUT COLD</b>
            <span class="muted small">· countdown</span>
            <b id="tranq-countdown" data-wear-off="${tranqNow.wearOffAt}">${fmtCountdown(tranqNow.wearOffAt - Date.now())}</b>
            <div class="small muted">She's limp, eyes closed, deeply sedated. Chat / feed / water / sex / wardrobe actions disabled until wake-up. Image prompts render her unconscious automatically.</div>
          </div>` : ''}
          ${(() => {
            // Postmortem (dead) banner. Replaces normal Body display intent — body is
            // inert, decay tracked in game days since death, forced disposal threshold
            // at POSTMORTEM_DECAY_LIMIT (7 game days). Chat still works (narration-only
            // via room_postmortem scene); drugs/feed/water/heal disabled in main render
            // flow. Sex acts continue and accrue cumLoad.
            if (g.encounterState !== 'dead') return '';
            const dMin = g.body?.decayedMinutes || 0;
            const dDays = (dMin / 1440).toFixed(1);
            const limit = window.DMTHGame.lifespan?.POSTMORTEM_DECAY_LIMIT || 10080;
            const limitDays = limit / 1440;
            const overdue = dMin >= limit;
            return `<div class="dead-banner panel" style="border:1px solid #444;background:rgba(80,80,80,.25);padding:8px;margin:8px 0">
              <b>☠️ DECEASED — POSTMORTEM USE</b>
              <span class="muted small">· decay</span>
              <b>${dDays} / ${limitDays.toFixed(0)} game days</b>
              ${overdue ? '<span class="danger" style="margin-left:8px"><b>· OVERDUE — DISPOSE NOW</b></span>' : ''}
              <div class="small muted">Body preserved in the hold. Chat returns narration-only (no spoken dialogue — she can\\'t speak). Sex acts still apply and accrue cumLoad. Drugs / feed / water / heal disabled. Whore-out continues with postmortem-john archetype (premium niche pay, declining as decay advances). Forced disposal nudge at ${limitDays.toFixed(0)} game days.</div>
              <div class="btn-row" style="margin-top:6px">
                <a class="btn-small btn-danger" href="#dispose?girl=${g.id}" data-tooltip="Dispose of the body. Bury / lose-at-sea / incinerate / finalization-film — frees the hold and removes her from the dungeon.">⚱️ Dispose now</a>
              </div>
            </div>`;
          })()}
      `;
    }

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
          ${girl.captiveAffect ? `<div class="stat-row"><span>Captive-affect</span><b>${girl.captiveAffect}</b></div>` : ''}
          <div class="stat-row"><span>Stockholm rating</span><b>L${girl.bond.bondLevel}/9</b> <span class="muted small">(${['terrified','wary','acclimating','curious','ambivalent','reciprocated','dependent','partner','devoted','fully-bonded'][girl.bond.bondLevel]} · xp ${girl.bond.bondXP}, debt ${girl.bond.bondDebt})</span></div>
          <div class="stat-row"><span>Escape risk</span><b>${Math.round((girl.escape?.currentRisk||0)*100)}%</b></div>
          ${window.DMTHGame.lifespan ? (() => {
            const ls = window.DMTHGame.lifespan.describeLifespan(girl);
            return `<div class="stat-row"><span>Lifespan</span><b>${ls.label}</b></div>
                    <div class="stat-row small"><span>Days held / age</span><b>${ls.daysCaptive} days · age ${ls.currentAge}</b></div>
                    <div class="bar-row"><label>Life meter</label><div class="bar"><div class="bar-fill ${ls.score < 30 ? 'danger' : ''}" style="width:${ls.score}%"></div></div><b>${ls.score}</b></div>`;
          })() : ''}
          <div class="stat-row"><span>Wearing</span><b>${currentOutfit?.displayName || 'default'}</b> <a href="#wardrobe?girl=${girl.id}" class="btn-small">👗 Wardrobe</a></div>
          ${currentOutfit?.source === 'captured-with' && currentOutfit?.description ? `<div class="small muted" style="padding-left:8px">Captured wearing: ${currentOutfit.description}</div>` : ''}
          <div class="stat-row">
            <span>Voice</span>
            <select id="voice-picker" class="inline-select">
              ${window.DMTHVoices.VOICES.map(v =>
                `<option value="${v.id}" ${v.id === girl.voiceId ? 'selected' : ''}>${v.displayName} — ${v.timbre}</option>`
              ).join('')}
            </select>
            <button id="voice-preview" class="btn-small" title="Hear a sample in this voice">🔊</button>
          </div>
          <div id="body-stats-panel">${renderBodyStatsHTML()}</div>
          <h3>Stats</h3>
          <div class="stat-grid">
            ${Object.entries(girl.stats || {}).map(([k, v]) =>
              `<div class="stat-pill"><span>${k}</span><b>${v}</b></div>`
            ).join('')}
          </div>
          <h3>Hold supplies</h3>
          ${(() => {
            // Supplies live in the HOLD (not the
            // girl). Player drops food/water into the hold reserve; the captive
            // self-serves from the reserve on tick when she gets hungry/thirsty.
            // Player can pickup reserve back into inventory (lossy bulk conversion)
            // to starve her on purpose. Plumbed holds (toilet ≥ 2 or waterSupply
            // ≥ 2) auto-supply water — no reserve needed.
            const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
            const holdIdx = girl.assignedHoldIdx ?? 0;
            const hold = dungeon?.holds?.[holdIdx];
            const foodReserve = hold?.foodReserve ?? 0;
            const waterReserve = hold?.waterReserve ?? 0;
            const toiletTier = hold?.upgrades?.toilet ?? 0;
            const waterSupplyTier = hold?.upgrades?.waterSupply ?? 0;
            const waterPlumbed = toiletTier >= 2 || waterSupplyTier >= 2;
            const clock = window.DMTHGame.gameClock;
            const dSinceFed = clock ? clock.daysSince(girl.body?.lastFedAt) : 0;
            const dSinceWat = clock ? clock.daysSince(girl.body?.lastWateredAt) : 0;
            const daysToStarve = Math.max(0, 5 - dSinceFed);
            const daysToDehydrate = waterPlumbed ? '∞' : Math.max(0, 3 - dSinceWat).toFixed(1);
            const inv = window.DMTHGame.state.current.inventory || {};
            const has = id => (inv[id] || 0) > 0;
            return `
              <div class="stat-row" data-tooltip="Food units stocked in her hold. She auto-eats one when she gets hungry. Drop more to keep her fed; pick up to starve her.">
                <span>🍱 Food reserve</span><b>${foodReserve} units</b>
                <span class="small muted" style="margin-left:8px">· ${daysToStarve.toFixed(1)} game days until starvation</span>
              </div>
              <div class="bar-row" data-tooltip="Visual food reserve. Each unit feeds her once."><div class="bar"><div class="bar-fill" style="width:${Math.min(100, foodReserve * 5)}%; background: linear-gradient(90deg, var(--warn), #ffd166);"></div></div></div>
              <div class="btn-row" style="margin: 4px 0 10px">
                <button class="btn-small ${has('basic-meal') ? 'btn-primary' : ''}" data-drop-food="basic-meal" ${has('basic-meal') ? '' : 'disabled'} data-tooltip="Drop 1 basic meal in the hold — adds 3 food units to the reserve. She'll eat one when she gets hungry.">+3 (basic-meal)</button>
                <button class="btn-small ${has('gourmet-meal') ? 'btn-primary' : ''}" data-drop-food="gourmet-meal" ${has('gourmet-meal') ? '' : 'disabled'} data-tooltip="Drop 1 gourmet meal in the hold — adds 7 food units to the reserve.">+7 (gourmet)</button>
                <button class="btn-small btn-danger" data-pickup-food ${foodReserve >= 3 ? '' : 'disabled'} data-tooltip="Pull 3 food units out of the hold and convert back to 1 basic-meal in inventory. Cruel but useful to starve a captive.">Pickup −3</button>
              </div>

              <div class="stat-row" data-tooltip="${waterPlumbed ? 'Plumbed hold — water is fully automatic. Reserve no longer needed.' : 'Water units stocked in her hold. She auto-drinks when she gets thirsty.'}">
                <span>💧 Water reserve</span>
                ${waterPlumbed ? `<b class="gold">∞ plumbed</b>` : `<b>${waterReserve} units</b>`}
                <span class="small muted" style="margin-left:8px">· ${daysToDehydrate} game days until dehydration</span>
              </div>
              ${waterPlumbed ? '' : `
                <div class="bar-row" data-tooltip="Visual water reserve. Each unit hydrates her once."><div class="bar"><div class="bar-fill" style="width:${Math.min(100, waterReserve * 3)}%; background: linear-gradient(90deg, #6ad1ff, #aae8ff);"></div></div></div>
                <div class="btn-row" style="margin: 4px 0 10px">
                  <button class="btn-small ${has('bottled-water') ? 'btn-primary' : ''}" data-drop-water="bottled-water" ${has('bottled-water') ? '' : 'disabled'} data-tooltip="Drop 1 24-pack in the hold — adds 6 water units to the reserve.">+6 (bottled)</button>
                  <button class="btn-small ${has('filtered-water') ? 'btn-primary' : ''}" data-drop-water="filtered-water" ${has('filtered-water') ? '' : 'disabled'} data-tooltip="Drop 1 filtered jug — adds 12 water units to the reserve.">+12 (filtered)</button>
                  <button class="btn-small btn-danger" data-pickup-water ${waterReserve >= 6 ? '' : 'disabled'} data-tooltip="Pull 6 water units out of the hold and convert back to 1 bottled-water in inventory. Useful for dehydrating a captive.">Pickup −6</button>
                </div>
              `}
            `;
          })()}

          ${(() => {
            // Whore-out panel. Toggle + rate + condom-required +
            // session totals + recent ledger + cashout button.
            if (!window.DMTHGame.whoreOut) return '';
            const wo = window.DMTHGame.whoreOut.getWhoreOut(girl);
            const totals = wo.sessionTotals || {};
            const ledger = (wo.johnLedger || []).slice(-5).reverse();
            const happy = window.DMTHGame.actionEffects?.johnHappinessForGirl
              ? window.DMTHGame.actionEffects.johnHappinessForGirl(girl)
              : null;
            const happyPct = happy ? Math.round(happy.multiplier * 100) : 100;
            return `<h3>💸 Whore-out</h3>
              <div class="stat-row" data-tooltip="Passive john arrivals per tick at the selected rate. Cash accrues in unclaimedEarnings until you cash out.">
                <span>Enabled</span>
                <b>${wo.enabled ? '✅ ON' : '⛔ off'}</b>
                <button class="btn-small ${wo.enabled ? 'btn-danger' : 'btn-primary'}" data-whore-toggle data-tooltip="${wo.enabled ? 'Stop john arrivals.' : 'Open her up to john arrivals. Each tick rolls per the rate setting.'}">${wo.enabled ? 'Disable' : 'Enable'}</button>
              </div>
              ${wo.enabled ? (() => {
                // Game-time cadence. Replaces the old low/standard/premium/all-comers
                // %-per-tick enum — explicit "1 john / Nm game time" options + a visible
                // countdown so the player always knows when the next one's coming.
                const minutesToNext = window.DMTHGame.whoreOut.gameMinutesToNextArrival(window.DMTHGame.state.getGirl(girl.id));
                const perTick = window.DMTHGame.whoreOut.expectedArrivalsPerTick(wo.rate);
                const buzzMul = window.DMTHGame.whoreOut.buzzMultiplier();
                const countdownTxt = (wo.rate === 'off' || !Number.isFinite(minutesToNext))
                  ? '— no arrivals while off'
                  : window.DMTHGame.gameClock.formatDuration(minutesToNext);
                const buzzNow = Math.round((window.DMTHGame.state.getBuzz?.() || 0));
                return `
                <div class="stat-row" data-tooltip="Cadence of john arrivals in GAME time. rapid = 1 every 10 game min · steady = 1 every 30 game min · casual = 1 every 60 game min · trickle = 1 every 120 game min · off = none. Each tick is 30 game min. BUZZ multiplier folds in on top — at BUZZ 100, arrivals double.">
                  <span>Cadence</span>
                  <select id="whore-rate" class="inline-select">
                    ${['off','trickle','casual','steady','rapid'].map(r => {
                      const params = window.DMTHGame.whoreOut.RATE_PARAMS[r];
                      return `<option value="${r}" ${wo.rate === r ? 'selected' : ''}>${r} (${params.displayName})</option>`;
                    }).join('')}
                  </select>
                </div>
                <div class="stat-row" data-tooltip="Countdown to the next expected john arrival, in GAME time. Cadence × BUZZ multiplier determines this. Fractional arrivals carry forward — at 'rapid' BUZZ 100 you'll see ~6 johns per real-time tick (30 game min)."><span>Next john in</span><b>${countdownTxt}</b><span class="muted small" style="margin-left:8px">· ~${perTick.toFixed(2)} johns/tick · BUZZ×${buzzMul.toFixed(2)} (🐝 ${buzzNow})</span></div>
                <div class="stat-row" data-tooltip="If on, every john MUST use a condom (override their compliance rate). Blocks pregnancy conception via this path.">
                  <span>Condom required</span>
                  <label><input type="checkbox" id="whore-condom" ${wo.condomRequired ? 'checked' : ''}/> enforce</label>
                </div>`;
              })() + `
                <div class="stat-row" data-tooltip="Pay multiplier from her current stats (bond × stamina × health × mood × outfit). Higher = bigger payouts per john. Better-trained girls earn more.">
                  <span>John happiness multiplier</span>
                  <b class="${happyPct > 110 ? 'gold' : happyPct < 80 ? 'danger' : ''}">${(happy?.multiplier || 1).toFixed(2)}×</b>
                </div>
              ` : ''}
              ${totals.encounters > 0 ? `
                <div class="stat-row small" data-tooltip="Cumulative session count of johns this girl has serviced"><span>Total encounters</span><b>${totals.encounters}</b></div>
                <div class="stat-row small" data-tooltip="Cumulative gross + tips this session"><span>Lifetime earnings</span><b>$${((totals.gross||0) + (totals.tips||0)).toLocaleString()}</b></div>
              ` : ''}
              ${wo.unclaimedEarnings > 0 ? `
                <div class="stat-row" data-tooltip="Cash that has accrued but hasn't been moved to treasury yet. Click cashout to claim.">
                  <span>💰 Unclaimed earnings</span>
                  <b class="gold">$${wo.unclaimedEarnings.toLocaleString()}</b>
                  <button class="btn-small btn-primary" data-whore-cashout data-tooltip="Move all unclaimed earnings to your wallet. Resets the unclaimed counter to 0.">💰 Cashout</button>
                </div>
              ` : ''}
              ${ledger.length > 0 ? `
                <div class="small muted" style="margin-top:6px"><b>Recent johns (last ${ledger.length}):</b></div>
                <ul class="small muted">
                  ${ledger.map(e => {
                    const ago = Math.max(0, Math.round((Date.now() - e.ts) / 60000));
                    return `<li data-tooltip="${(e.notes || '').replace(/"/g, '&quot;')}">${ago}min ago · ${e.johnDescription} · $${e.totalPaid}${e.tip > 0 ? ` (+$${e.tip} tip)` : ''}${e.condomUsed ? ' · 🎈' : ' · 🚫'} · ${e.acts.join(', ')}</li>`;
                  }).join('')}
                </ul>
              ` : ''}`;
          })()}

          ${(() => {
            // Pregnancy panel — always visible so the player can see her current
            // reproductive state. Shows NOT PREGNANT explicitly when status is 'none',
            // never hides. Status icon + tooltip explain what the icon means.
            const preg = girl.pregnancy || { status: 'none' };
            const methods = window.DMTHGame.pregnancy
              ? window.DMTHGame.pregnancy.allAbortionMethodsForDisplay(girl)
              : [];
            const statusEmoji = {
              none: '🚫', pregnant: '🤰', aborted: '⚪', miscarried: '🩸',
              'stillbirth-trash': '🩸', 'firestation-drop': '🚒',
              'sold-to-black-market': '💸', 'abandoned-trash': '🗑️',
              'lost-to-authorities': '🚨', birthed: '🍼', lost: '🚨'
            }[preg.status] || '·';
            const statusLabel = preg.status === 'none' ? 'NOT PREGNANT' : preg.status.toUpperCase().replace(/-/g, ' ');
            const statusTip = {
              none: 'Not currently pregnant. Vaginal cum + no condom + bond < L9 fires a conception roll at 30% base chance.',
              pregnant: 'Pregnant. Gestation advances ~1 game day per trimester (3 game days = full term).',
              aborted: 'Pregnancy terminated by abortion method.',
              miscarried: 'Pregnancy lost — back-alley complication or other adverse outcome.',
              'stillbirth-trash': 'Stillborn at full term. Body disposed quietly. +1 notoriety, mild bond debt.',
              'firestation-drop': 'Newborn dropped off anonymously at a firestation. No paper trail.',
              'sold-to-black-market': 'Newborn sold to a black-market broker. Real money, moderate notoriety.',
              'abandoned-trash': 'Newborn dumped — river, dumpster, shallow grave. Small chance of being found.',
              'lost-to-authorities': 'Delivery reported. Heavy notoriety hit. She talked or someone saw.',
              birthed: 'Delivered.',
              lost: 'Pregnancy lost.'
            }[preg.status] || 'Pregnancy state.';
            return `<h3 data-tooltip="${statusTip}">${statusEmoji} Pregnancy: ${statusLabel}</h3>
              <div class="stat-row" data-tooltip="${statusTip}"><span>Status</span><b>${statusEmoji} ${statusLabel}</b></div>
              ${preg.status === 'pregnant' ? `
                <div class="stat-row"><span>Gestation</span><b>day ${preg.gestationDays}/280 · trimester ${preg.trimester}</b></div>
                <div class="bar-row"><label>Term</label><div class="bar"><div class="bar-fill" style="width:${Math.min(100, Math.round((preg.gestationDays/280)*100))}%"></div></div><b>${Math.round((preg.gestationDays/280)*100)}%</b></div>
                <div class="small muted">Source: ${preg.conceptionSource || 'organic'}${preg.johnEncounterId ? ' · john ledger: ' + preg.johnEncounterId : ''}</div>
                <div class="btn-row" style="margin-top:6px">
                  ${methods.map(m => `<button class="btn-small ${m.inWindow && m.inStock ? 'btn-danger' : ''}" data-abort="${m.id}" ${m.inWindow && m.inStock ? '' : 'disabled'} title="${m.label}${!m.inStock ? ' — none in inventory' : ''}${!m.inWindow ? ' — outside window (' + m.windowDays[0] + '-' + m.windowDays[1] + ')' : ''} · ${Math.round(m.complications*100)}% complication · +${m.notorietyHit} notoriety">${m.emoji} ${m.label}${m.owned > 0 ? ` (${m.owned})` : ''}</button>`).join('')}
                </div>
              ` : ''}
              ${preg.outcomeHistory && preg.outcomeHistory.length ? `
                <div class="small muted" style="margin-top:6px"><b>History:</b></div>
                <ul class="small muted">
                  ${preg.outcomeHistory.slice(-5).map(h => `<li>${h.status}${h.method ? ' via ' + h.method : ''} · day ${h.day}${h.notes ? ' — ' + h.notes : ''}</li>`).join('')}
                </ul>
              ` : ''}`;
          })()}

          <h3>Drugs</h3>
          <div class="btn-row">
            ${(() => {
              // Drug buttons. Tooltip = descriptive text + compact stat preview from
              // action-effects ACTIONS spec so the player sees what the drug
              // does to stamina/health/mood/arousal before clicking.
              const pc = window.DMTHGame.actionEffects?.previewCost || (() => '');
              const dt = (id, label) => {
                const c = pc(id);
                return c ? `${label}\n📊 ${c}` : label;
              };
              return `
                <button class="btn-small" data-drug="coke" data-tooltip="${escapeHtml(dt('drug-coke', 'Line of coke. Rapid-fire chatter, jaw clench, dilated pupils. 45-min curve.'))}">❄️ Line of coke</button>
                <button class="btn-small" data-drug="weed" data-tooltip="${escapeHtml(dt('drug-weed', 'Roll her a joint. Slow blinks, drifty word choice, relaxed posture. 2-hour curve.'))}">🌿 Roll a joint</button>
                <button class="btn-small" data-drug="mdma" data-tooltip="${escapeHtml(dt('drug-mdma', "Share a molly. Emotional flooding, 'i love you' leak, glowing skin. 4-hour curve."))}">💊 Share molly</button>
                <button class="btn-small" data-drug="acid" data-tooltip="${escapeHtml(dt('drug-acid', "Tab of acid. Things-aren't-real perception, blown pupils, time dilation. 10-hour curve."))}">🧪 Tab of acid</button>
                <button class="btn-small" data-drug="whiskey" data-tooltip="${escapeHtml(dt('drug-whiskey', 'Pour whiskey. Slurred, looser-tongued, more honest. 90-min curve.'))}">🥃 Pour whiskey</button>
                <button class="btn-small" data-drug="ketamine" data-tooltip="${escapeHtml(dt('drug-ketamine', 'Bump of K. Dissociated stare, slack jaw, limp posture. 40-min curve. NOT a knockout.'))}">🐴 Bump of K</button>
                <button class="btn-small btn-danger" data-drug="tranquilizer" data-tooltip="${escapeHtml(dt('drug-tranquilizer', 'Tranquilizer dart. FULL knockout — eyes closed, limp, unresponsive. 4-min unconscious window. Consumes 1 from inventory.'))}">🎯 Tranquilizer (4-min knockout)</button>
              `;
            })()}
          </div>

          <h3>Actions</h3>
          <div class="btn-row">
            <button id="record-toggle" class="btn-small" data-tooltip="${window.DMTHGame.film.isRecording() && window.DMTHGame.film.activeSession().girlId === girl.id ? 'Stop the recording. Film gets cover-image generated and listed on the market.' : 'Start recording this session. Every turn captured; sells passive on tick.'}">${window.DMTHGame.film.isRecording() && window.DMTHGame.film.activeSession().girlId === girl.id ? '⏹ Stop recording' : '🎬 Start recording'}</button>
            <button id="selfie-btn" class="btn-small" data-tooltip="Make her pose for a Pollinations-generated selfie. Random pose from the library. Uses her locked face seed.">📸 Demand selfie</button>
            <button id="derobe-btn" class="btn-small ${girl.currentOutfit === 'nude' ? 'btn-primary' : ''}" data-tooltip="${girl.currentOutfit === 'nude' ? 'Currently nude — click to put her captured-at outfit back on.' : 'Strip her nude. Front-loads nudity in image prompts. Accessories still allowed if equipped.'}">🍑 ${girl.currentOutfit === 'nude' ? 'Re-dress' : 'Derobe (nude)'}</button>
            <button id="strip-all-btn" class="btn-small ${girl.currentOutfit === 'none' ? 'btn-primary' : ''}" data-tooltip="${girl.currentOutfit === 'none' ? 'Currently stripped of everything — click to put her captured-at outfit back on.' : 'Strip EVERYTHING — no garments, no accessories, no jewelry, no collar, no restraints. Raw nakedness.'}">🚫 ${girl.currentOutfit === 'none' ? 'Re-dress' : 'Strip everything'}</button>
            <button id="heal-btn" class="btn-small" data-tooltip="Heal her bruises + reset mood to baseline. Sometimes you patch them up before they break.">❤️‍🩹 Heal (reset damage)</button>
            <button class="btn-small" data-mode="sexy" data-tooltip="Sexy mode — default register. Sex acts emphasized in Ollama replies.">Mode: Sexy</button>
            <button class="btn-small" data-mode="hurtme" data-tooltip="Hurt Me mode — violence register. Bruises accumulate; pain emphasized.">Mode: Hurt Me</button>
            <a class="btn-small" href="#dispose?girl=${girl.id}" data-tooltip="End the relationship. Bury / lose-at-sea / incinerate / release / final film / trade-away. Each method has different notoriety + premium-content tradeoffs.">⚱️ Dispose / trade</a>
            <button id="list-sale" class="btn-small" data-tooltip="List her on the slave market. Buyers tick in over time. Price scales with Stockholm rating + training.">⛓️ List on slave market</button>
            <a class="btn-small" href="#timeline?girl=${girl.id}" data-tooltip="Her full history — every turn, every drug, every milestone.">📖 Timeline</a>
            <a class="btn-small" href="#gallery?girl=${girl.id}" data-tooltip="Every past image of her — view, download, open fullscreen.">🖼️ Gallery</a>
          </div>
          <div id="selfie-slot"></div>

          ${(() => {
            // Custom image-prompt input. User types a free-form scene description; Ollama
            // composes a full prompt with all the existing guardrails (8-position canonical
            // ordering, adult-floor, full-body framing, nudity / pregnancy / drug markers);
            // Pollinations fires. Draft text + last result image restore from module-scoped
            // per-girl caches so state.onChange re-renders don't wipe them.
            const draft = customPoseDrafts.get(girl.id) || '';
            const lastResult = customPoseResults.get(girl.id);
            const lastResultHtml = lastResult && lastResult.url ? `
              <div class="panel">
                <img src="${lastResult.url}" alt="${girl.name} custom pose" class="gen-img" onerror="this.outerHTML='<a href=\\'${lastResult.url}\\' target=\\'_blank\\' class=\\'img-link-fallback\\'>🔗 ${girl.name}</a>'" />
                <p class="small muted">${girl.name} · custom pose: "${(lastResult.staging || '').slice(0, 80)}${(lastResult.staging || '').length > 80 ? '…' : ''}"</p>
                <p class="small"><a href="${lastResult.url}" target="_blank" rel="noopener">🔗 open in tab</a> · <a href="#gallery?girl=${girl.id}">🖼️ view gallery</a></p>
              </div>` : '';
            return `<div class="panel" style="margin-top:8px">
              <h3>🎨 Custom pose / scene</h3>
              <p class="small muted">Describe the scene + pose you want. Ollama composes a valid image prompt with all guardrails — you stage her how you want.</p>
              <textarea id="custom-pose-in" rows="3" placeholder="e.g. 'kneeling on the bed, looking up at the camera with submissive eyes, biting her lower lip, hands clasped between her thighs, soft warm bedroom lighting'">${draft.replace(/</g, '&lt;')}</textarea>
              <div class="btn-row" style="margin-top:6px">
                <button id="custom-pose-fire" class="btn-small btn-primary" data-tooltip="Send your description to Ollama → composed prompt → Pollinations generation. Image appears below + saves to gallery.">🎨 Generate custom pose</button>
                <button id="custom-pose-clear" class="btn-small" data-tooltip="Clear the input box.">Clear</button>
                <span class="small muted" id="custom-pose-status"></span>
              </div>
              <div id="custom-pose-slot">${lastResultHtml}</div>
            </div>`;
          })()}
        </section>

        <section class="panel">
          <h2>Log
            <span style="float:right;display:inline-flex;gap:6px;font-weight:normal;">
              <button id="log-voice-toggle" class="btn-small" data-tooltip="Toggle Kokoro TTS voice playback for this session. Same toggle as the 🔊 in the top chrome bar.">🔊</button>
              <button id="log-clear-chat" class="btn-small btn-danger" data-tooltip="Clear this captive's chat log. Affects only her — other captives' logs are untouched.">🗑️ Clear chat</button>
            </span>
          </h2>
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

    // Log renderer — selection-safe + incremental append:
    //  1. Every state.onChange (john arrivals, drug curves, achievements, lifespan ticks)
    //     used to blast `logEl.innerHTML = ...` which killed any in-flight text selection.
    //     Now we skip re-render while the user is actively selecting text inside the log.
    //  2. Full-DOM-rebuild on every state change is gone — incremental append only. We
    //     track `lastRenderedTurnCount` so subsequent renders only push NEW turns to the
    //     end. Full repaint only when turn-count shrinks (history trimmed / save loaded).
    const logEl = el.querySelector('#log');
    let lastRenderedTurnCount = 0;
    function renderLog() {
      // If the user has an active selection inside the log, defer this render so we don't
      // wipe their selection. The next state.onChange will retry.
      const sel = (typeof window.getSelection === 'function') ? window.getSelection() : null;
      if (sel && !sel.isCollapsed && sel.anchorNode && logEl.contains(sel.anchorNode)) {
        return;
      }
      const turns = window.DMTHGame.state.getTurns(girl.id, 50);
      if (turns.length < lastRenderedTurnCount) {
        // History shrank (cleared / replaced) — full repaint
        logEl.innerHTML = turns.map(t =>
          `<div class="log-entry ${t.role}"><b>${t.role === 'user' ? 'Master' : girl.name}:</b> ${escapeHtml(t.text)}</div>`
        ).join('');
      } else if (turns.length > lastRenderedTurnCount) {
        // Append only the new turns since last render
        const frag = document.createDocumentFragment();
        for (const t of turns.slice(lastRenderedTurnCount)) {
          const div = document.createElement('div');
          div.className = `log-entry ${t.role}`;
          div.innerHTML = `<b>${t.role === 'user' ? 'Master' : girl.name}:</b> ${escapeHtml(t.text)}`;
          frag.appendChild(div);
        }
        logEl.appendChild(frag);
      }
      lastRenderedTurnCount = turns.length;
      logEl.scrollTop = logEl.scrollHeight;
    }
    renderLog();

    // Per-girl chat clear — other captives' logs untouched. Resets the incremental-append
    // counter so the next renderLog starts from zero.
    const clearChatBtn = el.querySelector('#log-clear-chat');
    if (clearChatBtn) {
      clearChatBtn.onclick = () => {
        if (!confirm(`Clear ${girl.name}'s chat log? Her turns will be gone — other captives' logs are untouched.`)) return;
        window.DMTHGame.state.clearTurns(girl.id);
        lastRenderedTurnCount = 0;
        logEl.innerHTML = '';
      };
    }

    // In-room TTS mute/unmute — same VOICE_KEY storage as the chrome-bar toggle in
    // game.html, so flipping it here also updates the chrome button on next sync.
    const VOICE_KEY = 'dmth_voice_on';
    const voiceBtn = el.querySelector('#log-voice-toggle');
    function syncVoiceBtn() {
      if (!voiceBtn) return;
      const on = localStorage.getItem(VOICE_KEY) !== 'off';
      voiceBtn.textContent = on ? '🔊' : '🔇';
      voiceBtn.title = on ? 'Voice ON — click to mute' : 'Voice OFF — click to unmute';
    }
    syncVoiceBtn();
    if (voiceBtn) {
      voiceBtn.onclick = () => {
        const wasOn = localStorage.getItem(VOICE_KEY) !== 'off';
        localStorage.setItem(VOICE_KEY, wasOn ? 'off' : 'on');
        // Mid-response mute — kill any in-flight TTS immediately
        if (wasOn && window.DMTHVoiceQueue) window.DMTHVoiceQueue.cancel();
        syncVoiceBtn();
        // Mirror to chrome button so it updates without reload
        const chromeBtn = document.getElementById('chrome-voice');
        if (chromeBtn) {
          chromeBtn.textContent = wasOn ? '🔇' : '🔊';
          chromeBtn.title = wasOn ? 'Voice OFF — click to enable' : 'Voice ON — click to mute';
        }
      };
    }

    // Quick actions — one-click sends preset user turns.
    const qaEl = el.querySelector('#quick-actions');
    if (qaEl) {
      const mode = window.DMTHGame.state.current.settings.mode || 'sexy';
      window.DMTHQuickActions.render(qaEl, girl, mode, (text) => {
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
      el.querySelectorAll('.qa-btn, [data-drug], [data-feed], [data-water], #selfie-btn, #heal-btn, [data-mode], #record-toggle, #list-sale')
        .forEach(b => { b.disabled = on; });
      const status = el.querySelector('#stream-status');
      if (status) status.textContent = on ? '⏳ waiting for her to finish…' : '';
    }

    // Shared send path used by both the typed input and the quick-action clicks
    async function sendTurn(text) {
      if (!text) return;
      // Block chat while tranquilized. She can't speak.
      const tranqNow = window.DMTHGame.drugs.isUnconscious && window.DMTHGame.drugs.isUnconscious(
        window.DMTHGame.state.getGirl(girl.id)
      );
      if (tranqNow) {
        const status = el.querySelector('#stream-status');
        if (status) {
          status.textContent = '💉 she\'s tranquilized — out cold. Wait for wake-up.';
          setTimeout(() => { if (status) status.textContent = ''; }, 2000);
        }
        return;
      }
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
      if (window.DMTHVoiceQueue) window.DMTHVoiceQueue.cancel();
      el.querySelector('#user-in').value = '';
      window.DMTHGame.state.appendTurn(girl.id, 'user', text);

      // Heal verb check
      if (window.DMTHGame.damage.shouldHeal(text)) {
        window.DMTHGame.damage.heal(girl.id);
        renderLog();
        window.DMTHRouter.handle();
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
        const mode = window.DMTHGame.state.current.settings.mode || 'sexy';
        // Postmortem branch — dead captive uses the narration-only scene so the model
        // emits asterisk-action only (no spoken dialogue, no mood, no bond). TTS still
        // plays the narration aloud per the asterisk-strip path established in BUG.22.
        const isDead = girl.encounterState === 'dead';
        const sceneKey = isDead ? 'room_postmortem' : 'room_regular';
        const decayMinutes = girl.body?.decayedMinutes || 0;
        const decayDays = (decayMinutes / 1440).toFixed(1);
        const sceneVars = isDead ? {
          ROOM_AMBIENCE: `${dungeonTpl?.displayName || 'hideout'}, ${dungeonTpl?.plotTokens || 'bare'}`,
          DECAY_DAYS: decayDays,
          BOND_LEVEL: girl.bond.bondLevel,
          BOND_NAME: 'deceased',
          BODY_SUMMARY: `deceased — ${decayDays} game days since death`,
          MOOD: 'deceased'
        } : {
          ROOM_AMBIENCE: `${dungeonTpl?.displayName || 'hideout'}, ${dungeonTpl?.plotTokens || 'bare'}`,
          BOND_LEVEL: girl.bond.bondLevel,
          BOND_NAME: ['terrified','wary','acclimating','curious','ambivalent','reciprocated','dependent','partner','devoted','fully-bonded'][girl.bond.bondLevel],
          BODY_SUMMARY: `arousal=${girl.body.arousal}, wetness=${girl.body.wetness}, bruises=${girl.body.bruises}, high=${girl.body.high}`,
          MOOD: girl.mood.mood
        };
        const { raw, parsed } = await window.DMTHGame.ollama.runTurn({
          girl, mode, sceneKey, sceneVars,
          userText: text,
          room: { ambience: dungeonTpl?.plotTokens || '', upgrades: {} },
          onChunk: (chunk, full) => {
            // Strip delta block + any XML scaffolding the model hallucinates while streaming.
            // Also scrub system-prompt rule-text leakage and third-person Master-action
            // asterisk narration mid-stream so the leak never lands visibly before the
            // final cleanup replaces it.
            let view = full
              .replace(/<delta>[\s\S]*?<\/delta>/g, '')
              .replace(/<delta>[\s\S]*$/g, '')   // delta still being written
              .replace(/<\/?(sentence|asterisk-action|action|response|reply|narration)[^>]*>/gi, '')
              .replace(/```[a-z]*\n?|```/gi, '')
              .trim();
            if (window.DMTHTemplates?.scrubSystemPromptLeakage) {
              view = window.DMTHTemplates.scrubSystemPromptLeakage(view);
            }
            if (window.DMTHTemplates?.scrubMasterAsteriskNarration) {
              view = window.DMTHTemplates.scrubMasterAsteriskNarration(view);
            }
            if (window.DMTHTemplates?.scrubPlaintextDeltaTail) {
              // Strip plaintext delta tails (arousal:+10; wetness:-25; ...) the model
              // sometimes emits instead of the <delta>...</delta> envelope. Final-pass
              // extractDelta also parses + strips, but doing it streaming keeps the
              // leak from rendering visibly mid-bubble.
              view = window.DMTHTemplates.scrubPlaintextDeltaTail(view);
            }
            txtEl.textContent = view;
            logEl.scrollTop = logEl.scrollHeight;
          }
        });
        const clean = (parsed.cleanText || raw).trim();
        // Stream finished cleanly — remove the transient streaming bubble. state.appendTurn
        // below fires state.onChange which triggers renderLog's incremental append, drawing
        // the canonical .log-entry for this assistant turn. Keeping the streamDiv around
        // would result in TWO bubbles (streamDiv + the new appended entry). Error path
        // below intentionally keeps streamDiv to display the error + repair button.
        streamDiv.remove();
        window.DMTHGame.state.appendTurn(girl.id, 'assistant', clean || '*…*');
        if (parsed.delta) window.DMTHGame.delta.applyDelta(girl.id, parsed.delta);
        if (mode === 'hurtme') window.DMTHGame.damage.accumulateFromText(girl.id, clean);

        // Auto-regenerate room-scene image when state-hash shifts meaningfully
        if (window.DMTHGame.imaging && window.DMTHGame.imaging.isAvailable()) {
          const refreshed = window.DMTHGame.state.getGirl(girl.id);
          const hashNow = roomStateHash(refreshed);
          const prev = refreshed._lastRoomStateHash;
          if (prev !== hashNow) {
            window.DMTHGame.state.updateGirl(girl.id, { _lastRoomStateHash: hashNow });
            window.DMTHGame.imaging.roomScene(girl.id).then(url => {
              if (url) {
                const slot = el.querySelector('#profile-img-slot');
                if (slot) slot.innerHTML = `<img src="${url}" alt="${girl.name}" class="gen-img profile-img" />`;
              }
            }).catch(() => {});
          }
        }

        // Voice — speak ONLY if toggle is on AND Kokoro finished loading
        {
          const voiceToggleOn = !window.DMTHIsVoiceOn || window.DMTHIsVoiceOn();
          if (voiceToggleOn && window.DMTHKokoro && window.DMTHKokoro.isReady()) {
            // Keep asterisk-action content (read it aloud as narration), just strip the
            // wrapping asterisk characters so Kokoro doesn't pronounce them. The action
            // text fills audible space between short spoken fragments, producing one
            // continuous longer clip instead of a stop-start "yes Master." …silence…
            // "I don't want this" rhythm. Net result: a single Kokoro call for the
            // whole turn that actually carries the scene.
            const speakable = clean.replace(/\*([^*]+)\*/g, '$1').replace(/\s+/g, ' ').trim();
            // Lonely-yes-Master detector — if the spoken portion after asterisk-stripping
            // is <= 3 words, the model violated the SPEECH-FIRST RULE (asterisk action led,
            // spoken line was a single trailing "Yes Master"). Surface a NotifyToast so the
            // user knows TTS got starved instead of silently mumbling.
            const speakableWords = speakable.split(/\s+/).filter(w => w.length > 0);
            if (speakableWords.length > 0 && speakableWords.length <= 3) {
              console.warn('[tts] lonely-yes-Master detected — spoken portion <= 3 words after asterisk strip:', JSON.stringify(speakable));
              if (window.DMTHNotify) {
                window.DMTHNotify.show(`🔇 TTS only got ${speakableWords.length} word${speakableWords.length === 1 ? '' : 's'} — model violated SPEECH-FIRST RULE (asterisk action led). Try /unity or a better-tuned model.`, { type: 'warn', durationMs: 4500 });
              }
            }
            if (speakable.length > 0) {
              // Validate voiceId against the live catalog — legacy saves may have an invalid voiceId
              // (e.g., af_jadzia which was removed when we discovered it's not a real Kokoro voice).
              const validIds = new Set(window.DMTHVoices.VOICES.map(v => v.id));
              let voice = girl.voiceId;
              if (!voice || !validIds.has(voice)) {
                voice = 'af_nicole';   // safe default for unity-ish / adult-female default
                if (girl.id) window.DMTHGame.state.updateGirl(girl.id, { voiceId: voice });
              }
              const emo = window.DMTHVoices.pickEmotion({ ...girl, mode, bondLevel: girl.bond.bondLevel, activeDrugs: (girl.body.activeDrugs || []).map(d => d.name || d) });
              const profile = window.DMTHVoices.getEmotionProfile(emo);
              const spoken = profile ? profile.preprocess(speakable) : speakable;
              // Sentence-aware queued playback — splits on . ! ? … and plays
              // each clip in order with the next one pipelined-generating
              // behind it.  Avoids Kokoro's long-input truncation problem and
              // lets us cancel cleanly mid-response.  Fire-and-forget; the
              // queue runs to completion on its own.  Cancel triggers on next
              // sendTurn (top of this function) or voice toggle off (chrome).
              if (window.DMTHVoiceQueue) {
                window.DMTHVoiceQueue.enqueue(spoken, voice, profile?.speed)
                  .catch(err => console.debug('[voice] queue error:', err));
              } else {
                // Defensive fallback — voice-queue module not loaded
                try {
                  const url = await window.DMTHKokoro.speak(spoken, voice, profile?.speed);
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
        if (isCorrupt && window.DMTHOllamaRepairOverlay) {
          const repairBtn = document.createElement('button');
          repairBtn.className = 'btn-small btn-primary';
          repairBtn.style.marginLeft = '8px';
          repairBtn.textContent = `🔧 Repair ${cls.modelId || 'model'}`;
          repairBtn.onclick = async () => {
            const result = await window.DMTHOllamaRepairOverlay.show({
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
            const result = await window.DMTHOllamaRepairOverlay.show({
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
      if (window.DMTHGame.film.isRecording() && window.DMTHGame.film.activeSession().girlId === girl.id) {
        const film = window.DMTHGame.film.stopRecording();
        alert(`Film recorded: ${film.title}\nList price: $${film.currentListPrice}\nListed in market.`);
      } else {
        const tags = [];
        if (!window.DMTHGame.state.current.films.some(f => f.girlId === girl.id)) tags.push('first-capture');
        window.DMTHGame.film.startRecording(girl.id, tags);
      }
      window.DMTHRouter.handle();
    };

    // Mode buttons
    el.querySelectorAll('[data-mode]').forEach(b => {
      b.onclick = () => {
        window.DMTHGame.state.current.settings.mode = b.dataset.mode;
        window.DMTHGame.state.save();
        window.DMTHRouter.handle();
      };
    });

    // Feed buttons. applyAction fires FIRST for spec-driven stamina/health/mood/
    // arousal/bondXP deltas; legacy stock+tier bump follows.
    //
    // Drop-into-hold + pickup-from-hold handlers:
    //   Drop  — consume 1 inventory item → add N units to hold reserve (per-item ratio).
    //   Pickup — consume N units from hold reserve → add 1 basic-meal / bottled-water
    //            back to inventory (intentionally lossy — bulk gets converted back to
    //            the cheapest stack format, with leftover units forfeit).
    const DROP_FOOD_RATIOS = { 'basic-meal': 3, 'gourmet-meal': 7 };
    const DROP_WATER_RATIOS = { 'bottled-water': 6, 'filtered-water': 12 };
    function holdRef() {
      const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
      if (!dungeon) return null;
      const idx = girl.assignedHoldIdx ?? 0;
      return { dungeon, idx, hold: dungeon.holds[idx] };
    }
    function patchHold(patch) {
      const ref = holdRef();
      if (!ref) return;
      const newHolds = ref.dungeon.holds.map((h, i) => i === ref.idx ? { ...h, ...patch } : h);
      window.DMTHGame.state.updateDungeon(ref.dungeon.id, { holds: newHolds });
    }
    el.querySelectorAll('[data-drop-food]').forEach(b => {
      b.onclick = () => {
        const itemId = b.dataset.dropFood;
        const units = DROP_FOOD_RATIOS[itemId] || 1;
        const inv = window.DMTHGame.state.current.inventory || {};
        if (!inv[itemId] || inv[itemId] <= 0) { alert('out of ' + itemId); return; }
        window.DMTHGame.state.consumeItem(itemId, 1);
        const ref = holdRef();
        if (!ref) return;
        patchHold({ foodReserve: (ref.hold.foodReserve || 0) + units });
        window.DMTHRouter.handle();
      };
    });
    el.querySelectorAll('[data-pickup-food]').forEach(b => {
      b.onclick = () => {
        const ref = holdRef();
        if (!ref) return;
        const reserve = ref.hold.foodReserve || 0;
        if (reserve < 3) { alert('need at least 3 food units in the reserve to pick up'); return; }
        patchHold({ foodReserve: reserve - 3 });
        window.DMTHGame.state.addItem('basic-meal', 1);
        window.DMTHRouter.handle();
      };
    });
    el.querySelectorAll('[data-drop-water]').forEach(b => {
      b.onclick = () => {
        const itemId = b.dataset.dropWater;
        const units = DROP_WATER_RATIOS[itemId] || 1;
        const inv = window.DMTHGame.state.current.inventory || {};
        if (!inv[itemId] || inv[itemId] <= 0) { alert('out of ' + itemId); return; }
        window.DMTHGame.state.consumeItem(itemId, 1);
        const ref = holdRef();
        if (!ref) return;
        patchHold({ waterReserve: (ref.hold.waterReserve || 0) + units });
        window.DMTHRouter.handle();
      };
    });
    el.querySelectorAll('[data-pickup-water]').forEach(b => {
      b.onclick = () => {
        const ref = holdRef();
        if (!ref) return;
        const reserve = ref.hold.waterReserve || 0;
        if (reserve < 6) { alert('need at least 6 water units in the reserve to pick up'); return; }
        patchHold({ waterReserve: reserve - 6 });
        window.DMTHGame.state.addItem('bottled-water', 1);
        window.DMTHRouter.handle();
      };
    });

    el.querySelectorAll('[data-feed]').forEach(b => {
      b.onclick = () => {
        const itemId = b.dataset.feed;
        try {
          window.DMTHGame.shop.use(itemId, { girlId: girl.id, action: 'feed' });
          const actionId = FEED_ACTION_MAP[itemId];
          if (actionId && window.DMTHGame.actionEffects?.applyAction) {
            window.DMTHGame.actionEffects.applyAction(girl.id, actionId);
          }
          const refreshed = window.DMTHGame.state.getGirl(girl.id);
          const cs = { ...refreshed.consumables };
          cs.food.stock = (cs.food.stock || 0) + (itemId === 'gourmet-meal' ? 7 : 3);
          cs.food.tier = Math.max(cs.food.tier || 0, itemId === 'gourmet-meal' ? 3 : 1);
          window.DMTHGame.state.updateGirl(girl.id, { consumables: cs });
        } catch (e) { alert(e.message); }
      };
    });

    // Water buttons — mirror the feed pattern. Bottled water = 6 stock + 1 bondXP at tier 1;
    // filtered water = 12 stock + 2 bondXP at tier 2. Water decay is gated by the hold's
    // toilet/waterSupply tier so plumbed holds (toilet >= 2) stop consuming this entirely
    // — but the buttons stay available for manual top-ups regardless.
    el.querySelectorAll('[data-water]').forEach(b => {
      b.onclick = () => {
        const itemId = b.dataset.water;
        try {
          window.DMTHGame.shop.use(itemId, { girlId: girl.id, action: 'water' });
          // applyAction first for spec deltas
          const actionId = WATER_ACTION_MAP[itemId];
          if (actionId && window.DMTHGame.actionEffects?.applyAction) {
            window.DMTHGame.actionEffects.applyAction(girl.id, actionId);
          }
          const refreshed = window.DMTHGame.state.getGirl(girl.id);
          const cs = { ...refreshed.consumables };
          if (!cs.water) cs.water = { tier: 0, stock: 0, decayPerTick: 1, unitCost: 1 };
          cs.water.stock = (cs.water.stock || 0) + (itemId === 'filtered-water' ? 12 : 6);
          cs.water.tier = Math.max(cs.water.tier || 0, itemId === 'filtered-water' ? 2 : 1);
          window.DMTHGame.state.updateGirl(girl.id, { consumables: cs });
        } catch (e) { alert(e.message); }
      };
    });

    // Whore-out controls.
    const toggleBtn = el.querySelector('[data-whore-toggle]');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const wo = window.DMTHGame.whoreOut.getWhoreOut(girl);
        const next = !wo.enabled;
        if (next && !confirm(`Open ${girl.name} up to john arrivals? Johns drain her stamina + accrue passive income.`)) return;
        window.DMTHGame.whoreOut.toggle(girl.id, next);
        window.DMTHRouter.handle();
      };
    }
    const rateSel = el.querySelector('#whore-rate');
    if (rateSel) {
      rateSel.onchange = () => {
        window.DMTHGame.whoreOut.updateSettings(girl.id, { rate: rateSel.value });
      };
    }
    const condomChk = el.querySelector('#whore-condom');
    if (condomChk) {
      condomChk.onchange = () => {
        window.DMTHGame.whoreOut.updateSettings(girl.id, { condomRequired: condomChk.checked });
      };
    }
    const cashoutBtn = el.querySelector('[data-whore-cashout]');
    if (cashoutBtn) {
      cashoutBtn.onclick = () => {
        try {
          const r = window.DMTHGame.whoreOut.cashout(girl.id);
          if (!r.ok) { alert(r.reason || 'cashout failed'); return; }
          if (window.DMTHNotify) window.DMTHNotify.show(`💰 Cashed out $${r.amount.toLocaleString()} from ${girl.name}'s johns.`, { type: 'success', durationMs: 2500 });
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    }

    // Abortion method buttons. Each consumes 1 of the corresponding catalog
    // item from inventory and applies the resolver. Confirmation dialog before firing.
    el.querySelectorAll('[data-abort]').forEach(b => {
      b.onclick = () => {
        const methodId = b.dataset.abort;
        const method = window.DMTHGame.pregnancy?.ABORT_METHODS?.[methodId];
        if (!method) { alert('unknown abort method'); return; }
        const complicationPct = Math.round(method.complications * 100);
        const msg = `Apply ${method.label} to ${girl.name}?\n\n` +
          `· Window: gestation day ${method.windowDays[0]}-${method.windowDays[1]}\n` +
          `· Complication chance: ${complicationPct}%\n` +
          `· Notoriety: +${method.notorietyHit}\n` +
          `· Mood penalty: -${method.moodPenalty}\n\n` +
          `Consumes 1× ${methodId} from inventory.`;
        if (!confirm(msg)) return;
        try {
          const r = window.DMTHGame.pregnancy.applyAbortion(girl.id, methodId);
          if (!r.ok) { alert(r.reason); return; }
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });

    // Drug buttons. applyAction first for spec stamina/health/mood/arousal/wetness deltas;
    // drug-scheduler.offer() runs second to add to activeDrugs.
    // curve + consume inventory.
    el.querySelectorAll('[data-drug]').forEach(b => {
      b.onclick = () => {
        try {
          // Tranquilizer admin cancels any in-flight Kokoro audio from a prior turn so
          // the unconscious banner isn't contradicted by her
          // still-speaking voice.
          if (b.dataset.drug === 'tranquilizer' && window.DMTHVoiceQueue) {
            window.DMTHVoiceQueue.cancel();
          }
          const actionId = DRUG_ACTION_MAP[b.dataset.drug];
          if (actionId && window.DMTHGame.actionEffects?.applyAction) {
            window.DMTHGame.actionEffects.applyAction(girl.id, actionId);
          }
          const r = window.DMTHGame.drugs.offer(girl.id, b.dataset.drug);
          window.DMTHGame.state.appendTurn(girl.id, 'user', `*offers ${b.dataset.drug}*`);
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });

    // Voice picker — changes this specific girl's voiceId, persists to save.
    const voicePicker = el.querySelector('#voice-picker');
    if (voicePicker) {
      voicePicker.onchange = () => {
        window.DMTHGame.state.updateGirl(girl.id, { voiceId: voicePicker.value });
        if (window.DMTHNotify) window.DMTHNotify.show(`🎙️ ${girl.name} voice → ${voicePicker.options[voicePicker.selectedIndex].textContent.split(' — ')[0]}`, { type: 'success', durationMs: 1500 });
      };
    }
    const voicePreview = el.querySelector('#voice-preview');
    if (voicePreview) {
      voicePreview.onclick = async () => {
        const pickedId = voicePicker.value;
        if (!window.DMTHKokoro || !window.DMTHKokoro.isReady()) {
          alert('Voice still loading or off. Click the 🔊 toggle in the top bar first.');
          return;
        }
        voicePreview.disabled = true;
        voicePreview.textContent = '⏳';
        try {
          const sample = `Hi Master. This is how ${girl.name} sounds.`;
          const url = await window.DMTHKokoro.speak(sample, pickedId, 1.0);
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

    // Heal button. Routed through applyAction so the central action-effects spec is
    // the single source of truth for stat mutations. Falls back to the
    // legacy damage.heal() for full bruise reset since the central spec only does -10.
    el.querySelector('#heal-btn').onclick = () => {
      if (confirm(`Heal ${girl.name}? Resets bruises and mood to baseline.`)) {
        // Spec-driven first pass (stamina+10, health+20, mood+6, bruises-10)
        if (window.DMTHGame.actionEffects?.applyAction) {
          window.DMTHGame.actionEffects.applyAction(girl.id, 'heal');
        }
        // Then legacy full-reset for bruises + damage tracking
        window.DMTHGame.damage.heal(girl.id);
        window.DMTHRouter.handle();
      }
    };

    // Derobe / Re-dress toggle — equip built-in 'nude' pseudo-outfit OR revert to 'default'.
    el.querySelector('#derobe-btn').onclick = () => {
      if (girl.currentOutfit === 'nude') {
        window.DMTHGame.wardrobe.equip(girl.id, 'default');
      } else {
        window.DMTHGame.wardrobe.derobe(girl.id);
      }
      forceRegenProfileImage();
      window.DMTHRouter.handle();
    };

    // Strip everything / Re-dress toggle — equip built-in 'none' pseudo-outfit
    // OR revert to 'default'. Distinct from derobe: 'none' strips garments AND accessories
    // (jewelry, collar, restraints, everything). The image prompt uses the more-aggressive
    // 'stripped' nudity block per imaging.js.
    el.querySelector('#strip-all-btn').onclick = () => {
      if (girl.currentOutfit === 'none') {
        window.DMTHGame.wardrobe.equip(girl.id, 'default');
      } else {
        window.DMTHGame.wardrobe.stripEverything(girl.id);
      }
      forceRegenProfileImage();
      window.DMTHRouter.handle();
    };

    function forceRegenProfileImage() {
      if (!window.DMTHGame.imaging?.isAvailable()) return;
      window.DMTHGame.imaging.generateFor(girl.id, { situation: 'profile', forceRegenerate: true })
        .then(result => {
          if (result?.url) {
            const slot = el.querySelector('#profile-img-slot');
            if (slot) slot.innerHTML = `<img src="${result.url}" alt="${girl.name}" class="gen-img profile-img" />`;
          }
        })
        .catch(() => {});
    }

    // Mic-in button for voice turns
    const sendBar = el.querySelector('.input-row');
    if (sendBar && window.DMTHGame.voiceIn.isSupported()) {
      const micBtn = document.createElement('button');
      micBtn.id = 'mic-btn';
      micBtn.className = 'btn-small';
      micBtn.textContent = '🎤 Voice';
      sendBar.appendChild(micBtn);
      let recording = false;
      micBtn.onclick = async () => {
        if (!recording) {
          try {
            await window.DMTHGame.voiceIn.start();
            recording = true;
            micBtn.textContent = '⏹ Stop + send';
            micBtn.classList.add('btn-danger');
          } catch (err) { alert(err.message); }
        } else {
          micBtn.textContent = 'transcribing…';
          const result = await window.DMTHGame.voiceIn.stopAndTranscribe();
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

    // Custom pose handler. User text → Ollama-as-prompt-writer → Pollinations. Stashed
    // in image history automatically via the generateFor pipeline. Input event updates
    // the draft cache on every keystroke so typing survives state.onChange re-renders.
    const customTextarea = el.querySelector('#custom-pose-in');
    if (customTextarea) {
      customTextarea.addEventListener('input', () => {
        customPoseDrafts.set(girl.id, customTextarea.value);
      });
    }
    const customClearBtn = el.querySelector('#custom-pose-clear');
    if (customClearBtn) {
      customClearBtn.onclick = () => {
        const ta = el.querySelector('#custom-pose-in');
        if (ta) ta.value = '';
        customPoseDrafts.delete(girl.id);
      };
    }
    const customFireBtn = el.querySelector('#custom-pose-fire');
    if (customFireBtn) {
      customFireBtn.onclick = async () => {
        const ta = el.querySelector('#custom-pose-in');
        const text = (ta?.value || '').trim();
        const status = el.querySelector('#custom-pose-status');
        const slot = el.querySelector('#custom-pose-slot');
        if (!text) { if (status) status.textContent = 'type a description first'; return; }
        if (!window.DMTHGame.imaging?.isAvailable()) {
          if (status) status.textContent = 'Pollinations not configured — paste a pk_ key in Settings';
          return;
        }
        // When Ollama is unavailable, composePrompt fallback accepts
        // userStaging as customPose so it still produces a real prompt instead of silently
        // discarding the user's staging text.
        customFireBtn.disabled = true;
        if (status) status.textContent = '⏳ Ollama composing prompt + Pollinations generating…';
        if (slot) slot.innerHTML = `<div class="panel"><p class="small muted">Generating custom pose…</p></div>`;
        try {
          const result = await window.DMTHGame.imaging.generateFor(girl.id, {
            situation: 'custom-pose',
            userStaging: text,
            customPose: text,   // fallback path uses customPose if Ollama is down
            forceRegenerate: true
          });
          if (result?.url) {
            // Persist result to module-scoped cache so state.onChange
            // re-renders restore it from the template render path.
            customPoseResults.set(girl.id, { url: result.url, staging: text, ts: Date.now() });
            if (slot) slot.innerHTML = `
              <div class="panel">
                <img src="${result.url}" alt="${girl.name} custom pose" class="gen-img" onerror="this.outerHTML='<a href=\\'${result.url}\\' target=\\'_blank\\' class=\\'img-link-fallback\\'>🔗 ${girl.name}</a>'" />
                <p class="small muted">${girl.name} · custom pose: "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}"</p>
                <p class="small"><a href="${result.url}" target="_blank" rel="noopener">🔗 open in tab</a> · <a href="#gallery?girl=${girl.id}">🖼️ view gallery</a></p>
              </div>`;
            if (status) status.textContent = '✓ done — saved to gallery';
          } else {
            if (slot) slot.innerHTML = `<div class="panel danger"><p>Custom pose failed: ${result?.error || 'unknown'}</p></div>`;
            if (status) status.textContent = 'failed';
          }
        } catch (err) {
          if (slot) slot.innerHTML = `<div class="panel danger"><p>Error: ${err.message}</p></div>`;
          if (status) status.textContent = `error: ${err.message}`;
        } finally {
          customFireBtn.disabled = false;
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
        const result = await window.DMTHGame.imaging.generateFor(girl.id, { situation: pose });
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
        const result = await window.DMTHGame.imaging.generateFor(girl.id, { situation: 'profile' });
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
      const price = window.DMTHGame.slaveMarket.computeSellPrice(girl);
      if (confirm(`List ${girl.name} on the slave market for $${price}?`)) {
        window.DMTHGame.slaveMarket.listForSale(girl.id, price);
        alert('Listed.');
        window.DMTHRouter.go('slave-market');
      }
    };

    // If she's currently tranquilized, broad-disable interaction buttons
    // (drugs/feed/water/derobe/strip-everything/quick-actions/selfie/heal/mode/record/list-sale)
    // and the typed-input Send button. They re-enable when the page re-renders post-wake-up.
    if (isUnconscious) {
      el.querySelectorAll('.qa-btn, [data-drug], [data-feed], [data-water], #selfie-btn, #heal-btn, [data-mode], #record-toggle, #list-sale, #derobe-btn, #strip-all-btn, #send, #mic-btn')
        .forEach(b => { b.disabled = true; b.title = (b.title || '') + (b.title ? ' · ' : '') + 'she\'s tranquilized — out cold'; });
      const userIn = el.querySelector('#user-in');
      if (userIn) { userIn.disabled = true; userIn.placeholder = 'she\'s tranquilized — wait for wake-up'; }
    }

    // Postmortem (dead) state gating. Disable drugs/feed/water/heal/abortion/mode/list-
    // sale — none of those make sense on a corpse. KEEP quick-actions (sex acts still
    // apply + accrue cumLoad), KEEP chat send (room_postmortem scene returns narration
    // only), KEEP selfie/derobe/strip/record (still pose + record the body).
    if (isDead) {
      el.querySelectorAll('[data-drug], [data-feed], [data-water], [data-drop-food], [data-drop-water], [data-pickup-food], [data-pickup-water], #heal-btn, [data-mode], #list-sale, [data-abort]')
        .forEach(b => { b.disabled = true; b.title = (b.title || '') + (b.title ? ' · ' : '') + 'she\'s deceased — body cannot metabolize / heal / sell'; });
    }

    // Live mm:ss countdown ticker. Updates every second; on wake-up, fires
    // a NotifyToast and re-renders the page so the disabled buttons come back online.
    let tranqTicker = null;
    if (isUnconscious) {
      tranqTicker = setInterval(() => {
        const el2 = el.querySelector('#tranq-countdown');
        if (!el2) { clearInterval(tranqTicker); tranqTicker = null; return; }
        const wearOffAt = Number(el2.dataset.wearOff || 0);
        const remaining = wearOffAt - Date.now();
        if (remaining <= 0) {
          clearInterval(tranqTicker);
          tranqTicker = null;
          if (window.DMTHNotify) {
            window.DMTHNotify.show(`💉 ${girl.name} woke up from the tranquilizer.`, { type: 'info', durationMs: 3000 });
          }
          window.DMTHGame.state.appendTurn(girl.id, 'system', `*${girl.name} stirs and groans, regaining consciousness from the tranquilizer*`);
          window.DMTHRouter.handle();
          return;
        }
        el2.textContent = fmtCountdown(remaining);
      }, 1000);
    }

    const unsub = window.DMTHGame.state.onChange(() => {
      if (!location.hash.startsWith('#room')) return;
      renderLog();
      // Refresh body stat bars in place — without this, the bars stay frozen at
      // render-time values even though applyAction is correctly mutating
      // girl.body.{arousal,wetness,cumLoad,bruises,high,stamina,health}. The bars are
      // pure display (no event handlers), so innerHTML replacement is safe; tooltips
      // re-bind via the document-level delegation engine in tooltips.js.
      const bodyPanel = el.querySelector('#body-stats-panel');
      if (bodyPanel) bodyPanel.innerHTML = renderBodyStatsHTML();
    });
    return () => {
      if (tranqTicker) { clearInterval(tranqTicker); tranqTicker = null; }
      if (typeof unsub === 'function') unsub();
    };
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // Body-state hash — quantized so small fluctuations don't retrigger regen.
  // Bands of 20 on arousal/wetness/high; bands of 5 on bruises; bond level itself.
  // Extended to include active-drug list + pregnancy trimester so tranquilizer image
  // overrides + per-trimester pregnancy regen both fire correctly.
  function roomStateHash(girl) {
    const b = girl.body || {};
    const drugSig = (b.activeDrugs || [])
      .map(d => (typeof d === 'string' ? d : d?.name || ''))
      .filter(Boolean).sort().join(',');
    return [
      Math.floor((b.arousal  || 0) / 20),
      Math.floor((b.wetness  || 0) / 20),
      Math.floor((b.high     || 0) / 20),
      Math.floor((b.bruises  || 0) / 5),
      Math.round((b.cumLoad  || 0) * 2),
      girl.bond?.bondLevel ?? 0,
      girl.currentOutfit || 'default',
      (b.outfitState || 'intact'),
      drugSig || '-',
      girl.pregnancy?.trimester || 0,
      b.activeBondage || '-',
      // Encounter state — alive vs dead transitions trigger image regen so postmortem
      // markers + corpse pose land. Decay bucketed at 1-day granularity so the marker
      // tier (fresh / early / mid / late) changes trigger a fresh image too.
      girl.encounterState || 'captive',
      Math.floor((b.decayedMinutes || 0) / 1440)
    ].join('|');
  }

  window.DMTHRouter.register('room', render);
})();
