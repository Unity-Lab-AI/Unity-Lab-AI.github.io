// DUNGEON MASTER: THE HUNT — running in-game day clock.
//
// Time model:
//   1 real second  = 1  game minute
//   60 real sec    = 1  game hour
//   24 real min    = 1  game day  (= 1440 game minutes)
//
// Per-tick advancement: tick.js fires every 30 real seconds, so each tick
// advances game time by 30 game minutes. The clock can also be advanced
// continuously between ticks via `now()` which reads the real-clock delta.

(function () {
  'use strict';

  const MIN_PER_DAY = 24 * 60;          // 1440

  // The anchor is intentionally NOT persisted across page reloads. If we kept
  // the old anchor in the save and the user came back to the tab 3 real days
  // later, the clock would fast-forward 3×24×60 = 4320 game days at boot. The
  // game-clock only runs while the tab is open; closing the tab pauses time.
  // Each module load resets the anchor to Date.now(), so realDelta is measured
  // from the boot of THIS tab session.
  let anchorRealMs = null;

  function ensureSeed() {
    const s = window.DMTHGame.state.current;
    if (!s) return null;
    if (typeof s.gameMinutes !== 'number') {
      s.gameMinutes = 0;
    }
    if (anchorRealMs == null) {
      anchorRealMs = Date.now();
    }
    return s;
  }

  // Continuous game-time read. Returns gameMinutes including the real-clock
  // delta since the last anchor (boot, or last advanceFromTick).
  function now() {
    const s = ensureSeed();
    if (!s) return 0;
    const realDeltaSec = Math.max(0, (Date.now() - anchorRealMs) / 1000);
    return s.gameMinutes + realDeltaSec;   // 1 real second = 1 game minute
  }

  // Advance the persisted gameMinutes by the real-clock delta since last anchor,
  // then re-anchor to NOW. Called by tick.js at the top of each tick.
  function advanceFromTick() {
    const s = ensureSeed();
    if (!s) return;
    const realDeltaSec = Math.max(0, (Date.now() - anchorRealMs) / 1000);
    s.gameMinutes += realDeltaSec;
    anchorRealMs = Date.now();
  }

  // Convert a game-minutes timestamp delta into days.
  function minutesToDays(min) {
    return min / MIN_PER_DAY;
  }

  // Days elapsed since a stored game-minutes timestamp. Returns 0 if the
  // timestamp is null/undefined (treat as "just now") so a brand-new captive
  // doesn't trigger starvation on first tick.
  function daysSince(stampGameMinutes) {
    if (stampGameMinutes == null) return 0;
    return Math.max(0, (now() - stampGameMinutes) / MIN_PER_DAY);
  }

  // Format current game-time as "Day N, HH:MM"
  function formatNow() {
    const m = now();
    const day = Math.floor(m / MIN_PER_DAY) + 1;
    const dayMin = Math.floor(m % MIN_PER_DAY);
    const hh = Math.floor(dayMin / 60);
    const mm = Math.floor(dayMin % 60);
    return `Day ${day}, ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // Format a game-minutes timestamp (for "last fed: X" / "last watered: X" displays).
  function formatStamp(stampGameMinutes) {
    if (stampGameMinutes == null) return '—';
    const day = Math.floor(stampGameMinutes / MIN_PER_DAY) + 1;
    const dayMin = Math.floor(stampGameMinutes % MIN_PER_DAY);
    const hh = Math.floor(dayMin / 60);
    const mm = Math.floor(dayMin % 60);
    return `Day ${day} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // Format a duration (in game minutes) compactly. Examples:
  //   45  → "45m"
  //   90  → "1h 30m"
  //   2880 → "2d"
  function formatDuration(min) {
    if (!Number.isFinite(min) || min < 0) return '—';
    if (min < 60) return `${Math.round(min)}m`;
    if (min < MIN_PER_DAY) {
      const h = Math.floor(min / 60);
      const m = Math.floor(min % 60);
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    const d = Math.floor(min / MIN_PER_DAY);
    const remMin = min - d * MIN_PER_DAY;
    const h = Math.floor(remMin / 60);
    return h === 0 ? `${d}d` : `${d}d ${h}h`;
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.gameClock = Object.freeze({
    now,
    advanceFromTick,
    daysSince,
    minutesToDays,
    formatNow,
    formatStamp,
    formatDuration,
    MIN_PER_DAY
  });
})();
