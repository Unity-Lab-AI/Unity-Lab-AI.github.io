/**
 * Unity AI Lab — Gothic Landing
 * Interactive smoke / ash particle system — v2
 *
 * Click   = puff explodes at cursor
 * Hold    = charge a smoke ball (animated, crimson intensifies as it charges)
 * Drag+go = throw the ball; it bounces off walls, leaves a wisp trail,
 *           and explodes on text — also showering embers
 *
 * Visual upgrades over v1:
 *  - DPR-aware canvas for crisp retina rendering
 *  - Trail-fade compositing (low-alpha black overlay) for atmospheric haze
 *  - Lumpy metaball-style draw (3 offset blobs per puff, jittered per-frame)
 *  - Curl-noise turbulence for eddy-shaped drift, not random jitter
 *  - Ember sparks: glowing crimson/orange points with gravity + decay
 *  - Charging ball: animated rotating inner ring + intensity ramp
 *  - Dense wisp trail behind thrown balls
 */
(function () {
  'use strict';

  function initGothicSmoke() {
    if (document.getElementById('vD-smoke-canvas')) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'vD-smoke-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d', { alpha: true });
    // cap DPR aggressively — smoke is soft, doesn't need retina
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    // perf limits — leaner than v2 to keep 60fps on mid-range laptops
    var MAX_PARTICLES = 320;
    var POOL = 600;
    var MAX_PUFFS = 6;
    var HARD_LIMIT_PUFFS = 10;
    var HARD_LIMIT_BALLS = 6;
    var MAX_EMBERS = 50;

    // adaptive perf throttle: when frames run long, drop spawn rates
    var perfScale = 1.0;     // 0..1 multiplier on spawn counts
    var avgFrame = 16.7;

    var particles = [];
    var pool = [];
    var puffs = [];
    var balls = [];
    var embers = [];

    // mouse / touch state
    var mx = 0, my = 0, lmx = 0, lmy = 0;
    var mvx = 0, mvy = 0;
    var lastMove = Date.now();
    var moving = false;
    var down = false;
    var downT = 0, downX = 0, downY = 0;
    var charging = null;

    var textCache = [];
    var t0 = Date.now();
    var now = function () { return (Date.now() - t0) / 1000; };

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cacheText();
    }
    resize();
    window.addEventListener('resize', resize);

    function W() { return canvas.width / dpr; }
    function H() { return canvas.height / dpr; }

    var measureCanvas = document.createElement('canvas');
    var mctx = measureCanvas.getContext('2d');

    // Spatial grid for text rects, so per-particle deflection only checks
    // nearby cells instead of the full O(N) cache.
    var GRID_CELL = 220;
    var textGrid = {};
    function gridKey(cx, cy) { return cx + ',' + cy; }

    function cacheText() {
      textCache = [];
      textGrid = {};
      if (!mctx) return;
      var els = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, a, span, li, button, ' +
        '.vD-nav-links a, .vD-h2, .vD-title, .vD-srv h3, .vD-feat h3'
      );
      var buf = 200;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (rect.bottom < -buf || rect.top > window.innerHeight + buf) continue;
        if (rect.right < -buf || rect.left > window.innerWidth + buf) continue;

        var text = (el.textContent || '').trim();
        if (!text) continue;

        var style = window.getComputedStyle(el);
        mctx.font = style.fontSize + ' ' + style.fontFamily;
        var metrics = mctx.measureText(text);
        var fontSize = parseFloat(style.fontSize) || 16;
        var tw = Math.min(metrics.width, rect.width);
        var th = Math.min(fontSize * 1.2, rect.height);
        var tx = rect.left + (parseFloat(style.paddingLeft) || 0);
        var ty = rect.top + (parseFloat(style.paddingTop) || 0);

        var rec = {
          x: tx, y: ty, width: tw, height: th,
          centerX: tx + tw / 2, centerY: ty + th / 2,
          influenceRange: Math.max(tw, th) / 2 + 30,
        };
        textCache.push(rec);

        // file into every grid cell the influence radius overlaps
        var infR = rec.influenceRange;
        var c0x = Math.floor((rec.centerX - infR) / GRID_CELL);
        var c1x = Math.floor((rec.centerX + infR) / GRID_CELL);
        var c0y = Math.floor((rec.centerY - infR) / GRID_CELL);
        var c1y = Math.floor((rec.centerY + infR) / GRID_CELL);
        for (var gx = c0x; gx <= c1x; gx++) {
          for (var gy = c0y; gy <= c1y; gy++) {
            var k = gridKey(gx, gy);
            (textGrid[k] || (textGrid[k] = [])).push(rec);
          }
        }
      }
    }
    cacheText();

    var lastScrollCache = 0;
    window.addEventListener('scroll', function () {
      var t = Date.now();
      if (t - lastScrollCache > 500) { cacheText(); lastScrollCache = t; }
    }, { passive: true });
    setInterval(cacheText, 3000);

    // -------- pre-baked sprite textures --------
    // Drawing radial gradients every frame is the #1 cost. Bake once,
    // blit with drawImage + globalAlpha + globalCompositeOperation.
    function makeSprite(stops, sz) {
      var c = document.createElement('canvas');
      c.width = sz; c.height = sz;
      var x = c.getContext('2d');
      var g = x.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
      for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
      x.fillStyle = g;
      x.fillRect(0, 0, sz, sz);
      return c;
    }
    var SPRITE_SZ = 128;
    var sprWisp = makeSprite([
      [0,    'rgba(180, 162, 154, 1)'],
      [0.35, 'rgba(128, 100, 96, 0.65)'],
      [0.7,  'rgba(76, 50, 52, 0.3)'],
      [1,    'rgba(24, 12, 14, 0)'],
    ], SPRITE_SZ);
    var sprNormal = makeSprite([
      [0,    'rgba(158, 138, 130, 1)'],
      [0.35, 'rgba(110, 78, 76, 0.65)'],
      [0.7,  'rgba(60, 30, 36, 0.3)'],
      [1,    'rgba(16, 8, 10, 0)'],
    ], SPRITE_SZ);
    var sprPuffCool = makeSprite([
      [0,    'rgba(200, 168, 152, 1)'],
      [0.35, 'rgba(148, 84, 78, 0.65)'],
      [0.7,  'rgba(72, 30, 36, 0.3)'],
      [1,    'rgba(22, 8, 12, 0)'],
    ], SPRITE_SZ);
    var sprPuffWarm = makeSprite([
      [0,    'rgba(230, 156, 128, 1)'],
      [0.35, 'rgba(172, 76, 70, 0.65)'],
      [0.7,  'rgba(90, 30, 36, 0.3)'],
      [1,    'rgba(22, 8, 12, 0)'],
    ], SPRITE_SZ);
    var sprEmberHalo = makeSprite([
      [0,    'rgba(255, 180, 110, 0.85)'],
      [0.4,  'rgba(220, 80, 60, 0.55)'],
      [1,    'rgba(120, 20, 30, 0)'],
    ], 64);
    var sprEmberCore = makeSprite([
      [0, 'rgba(255, 240, 210, 1)'],
      [1, 'rgba(255, 140, 60, 0)'],
    ], 16);
    var sprAura = makeSprite([
      [0,   'rgba(220, 70, 80, 1)'],
      [0.5, 'rgba(140, 40, 50, 0.5)'],
      [1,   'rgba(40, 10, 14, 0)'],
    ], 128);

    // -------- curl-noise drift (cheap pseudo-noise via summed sines) --------
    function curlX(x, y, t) {
      return Math.sin(x * 0.005 + t * 0.6) * 0.6
           + Math.cos(y * 0.0073 - t * 0.4) * 0.35;
    }
    function curlY(x, y, t) {
      return Math.cos(x * 0.0061 - t * 0.5) * 0.5
           + Math.sin(y * 0.0048 + t * 0.7) * 0.4;
    }

    // -------- particle pool --------
    function blank() {
      return {
        x: 0, y: 0, vx: 0, vy: 0,
        size: 0, maxSize: 0, alpha: 0, life: 0,
        decayRate: 0, growRate: 0, type: 'normal',
        rotation: 0, rotSpeed: 0,
        active: false, accumulated: false,
        targetX: 0, targetY: 0,
        // jitter offsets for metaball-style lumps (one set per particle, drifts over time)
        j1x: 0, j1y: 0, j2x: 0, j2y: 0,
        // hot core color shift seed
        warmth: 0,
        // ember-only fields
        trail: 0,
      };
    }
    for (var i = 0; i < POOL; i++) pool.push(blank());

    function take(x, y, vx, vy, size, type) {
      var p;
      for (var k = 0; k < pool.length; k++) {
        if (!pool[k].active) { p = pool[k]; break; }
      }
      if (!p) p = particles.shift() || blank();

      p.active = true;
      p.x = x; p.y = y;
      p.vx = vx !== undefined ? vx : (Math.random() - 0.5) * 0.5;
      p.vy = vy !== undefined ? vy : -Math.random() * 1.5 - 0.5;
      p.size = size || Math.random() * 15 + 8;
      p.maxSize = p.size * (type === 'puff' ? 4 : 3.5);
      p.alpha = type === 'ember' ? 1.0 : 0.7;
      p.life = 1.0;
      p.type = type || 'normal';

      var puffOver = puffs.length;
      var dissipationMul = puffOver > MAX_PUFFS
        ? Math.min(3.0, 1 + (puffOver - MAX_PUFFS) * 0.5) : 1.0;
      p.decayRate = type === 'puff' ? (0.0028 * dissipationMul)
        : (type === 'wisp' ? 0.008
        : (type === 'ember' ? 0.012
        : 0.005));
      p.growRate = type === 'puff' ? 0.95
        : (type === 'wisp' ? 0.2
        : (type === 'ember' ? 0
        : 0.35));
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.03;
      p.accumulated = false;
      p.targetX = mx; p.targetY = my;
      p.j1x = Math.random() * Math.PI * 2;
      p.j1y = Math.random() * Math.PI * 2;
      p.j2x = Math.random() * Math.PI * 2;
      p.j2y = Math.random() * Math.PI * 2;
      p.warmth = Math.random();
      p.trail = 0;
      return p;
    }

    // -------- physics step --------
    function step(p) {
      if (!p.active) return false;
      var t = now();

      if (p.type === 'ember') {
        // simple ballistic with light air drag + faint curl
        p.vx *= 0.985;
        p.vy = p.vy * 0.99 + 0.06; // gravity (embers fall)
        p.vx += curlX(p.x, p.y, t) * 0.05;
        p.vy += curlY(p.x, p.y, t) * 0.05;
        p.x += p.vx; p.y += p.vy;
        p.alpha = p.life;
        p.life -= p.decayRate;
        // hard floor: fade fast if hits ground
        if (p.y > H() - 4) p.life -= 0.04;
        return p.life > 0;
      }

      if (p.accumulated) {
        var dx = p.targetX - p.x, dy = p.targetY - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) { p.vx = dx * 0.08; p.vy = dy * 0.08; }
        else { p.vx *= 0.95; p.vy *= 0.95; }
      } else {
        var ddx = mx - p.x, ddy = my - p.y;
        var dd = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dd < 150 && moving && !down) {
          var f = (150 - dd) / 150 * 0.3;
          p.vx += (ddx / dd) * f * mvx * 0.01;
          p.vy += (ddy / dd) * f * mvy * 0.01;
        }

        // text deflection — push away from rect, curl around influence radius.
        // Spatial grid keeps this O(nearby) instead of O(all text).
        // Skip for short-lived wisps; they don't live long enough to matter.
        if (p.type !== 'wisp') {
          var gx = Math.floor(p.x / GRID_CELL), gy = Math.floor(p.y / GRID_CELL);
          var bucket = textGrid[gridKey(gx, gy)];
          if (bucket) {
            for (var ti = 0; ti < bucket.length; ti++) {
              var tx = bucket[ti];
              var maxD = tx.influenceRange + p.size;
              if (Math.abs(p.x - tx.centerX) > maxD || Math.abs(p.y - tx.centerY) > maxD) continue;
              var tdx = p.x - tx.centerX, tdy = p.y - tx.centerY;
              var tdsq = tdx * tdx + tdy * tdy;
              var infSq = tx.influenceRange * tx.influenceRange;
              if (tdsq < infSq) {
                var td = Math.sqrt(tdsq);
                if (td < 0.001) td = 0.001;
                if (p.x >= tx.x && p.x <= tx.x + tx.width &&
                    p.y >= tx.y && p.y <= tx.y + tx.height) {
                  p.vx += (tdx / td) * 0.8;
                  p.vy += (tdy / td) * 0.8;
                } else {
                  var ang = Math.atan2(tdy, tdx);
                  var curl = (tx.influenceRange - td) / tx.influenceRange * 0.15;
                  p.vx += Math.cos(ang + Math.PI / 2) * curl;
                  p.vy += Math.sin(ang + Math.PI / 2) * curl;
                  p.vx += (tdx / td) * curl * 0.5;
                  p.vy += (tdy / td) * curl * 0.5;
                }
              }
            }
          }
        }

        // turbulent curl drift instead of random jitter
        p.vx += curlX(p.x, p.y, t) * 0.05;
        p.vy += curlY(p.x, p.y, t) * 0.05;
        p.vx *= 0.985;
        p.vy -= 0.022; // buoyancy
      }

      p.y += p.vy;
      p.x += p.vx;

      var damp = 0.6, m = p.size;
      if (p.x - m < 0)        { p.x = m;             p.vx =  Math.abs(p.vx) * damp; p.life -= 0.05; }
      if (p.x + m > W())      { p.x = W() - m;       p.vx = -Math.abs(p.vx) * damp; p.life -= 0.05; }
      if (p.y - m < 0)        { p.y = m;             p.vy =  Math.abs(p.vy) * damp; p.life -= 0.05; }
      if (p.y + m > H())      { p.y = H() - m;       p.vy = -Math.abs(p.vy) * damp; p.life -= 0.05; }

      if (p.size < p.maxSize) p.size += p.growRate;
      p.life -= p.decayRate;
      p.alpha = p.life * 0.7;
      p.rotation += p.rotSpeed;

      // jitter offsets drift slowly so the lumps wobble
      p.j1x += 0.04; p.j1y += 0.037;
      p.j2x += 0.029; p.j2y += 0.043;

      return p.life > 0;
    }

    // -------- draw a lumpy smoke particle (3 offset sprite blits) --------
    function drawSmoke(p) {
      if (!p.active) return;

      var spr;
      if (p.type === 'wisp') spr = sprWisp;
      else if (p.type === 'puff') spr = p.warmth > 0.4 ? sprPuffWarm : sprPuffCool;
      else spr = sprNormal;

      // 3 offset lumps — produces volumetric, non-circular silhouette
      // Each lump is a sprite blit, MUCH cheaper than createRadialGradient.
      var s0 = p.size * 2;                    // sprite is drawn at 2× radius
      var s1 = p.size * 1.6;
      var s2 = p.size * 1.4;
      var ox1 = Math.cos(p.j1x) * p.size * 0.45, oy1 = Math.sin(p.j1y) * p.size * 0.45;
      var ox2 = Math.cos(p.j2x) * p.size * 0.55, oy2 = Math.sin(p.j2y) * p.size * 0.55;
      var a = p.alpha;

      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = a;
      ctx.drawImage(spr, p.x - s0 / 2, p.y - s0 / 2, s0, s0);
      ctx.globalAlpha = a * 0.75;
      ctx.drawImage(spr, p.x + ox1 - s1 / 2, p.y + oy1 - s1 / 2, s1, s1);
      ctx.globalAlpha = a * 0.6;
      ctx.drawImage(spr, p.x + ox2 - s2 / 2, p.y + oy2 - s2 / 2, s2, s2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // -------- ember (bright spark with short trail) --------
    function drawEmber(p) {
      if (!p.active) return;
      var a = p.alpha < 0 ? 0 : (p.alpha > 1 ? 1 : p.alpha);
      ctx.globalCompositeOperation = 'lighter';
      // outer glow
      ctx.globalAlpha = a;
      ctx.drawImage(sprEmberHalo, p.x - 14, p.y - 14, 28, 28);
      // hot bright core
      ctx.drawImage(sprEmberCore, p.x - 4, p.y - 4, 8, 8);

      // motion-line trail (cheap stroke)
      ctx.globalAlpha = a * 0.35;
      ctx.strokeStyle = '#ffa05a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // -------- charging ball: animated, intensifies as it grows --------
    function ChargingBall(x, y) {
      this.x = x; this.y = y;
      this.size = 15;
      this.maxSize = 110;
      this.alpha = 0.85;
      this.growth = 0.9;
      this.born = now();
    }
    ChargingBall.prototype.charge = function () {
      // 0..1 charge level, eases in
      var c = (this.size - 15) / (this.maxSize - 15);
      return Math.max(0, Math.min(1, c));
    };
    ChargingBall.prototype.update = function (cx, cy) {
      this.x = cx; this.y = cy;
      if (this.size < this.maxSize) {
        this.size += this.growth;
        this.growth *= 0.99;
      }
      // spawn orbiting wisps + occasional embers when nearly charged
      if (Math.random() < 0.4 && particles.length < MAX_PARTICLES) {
        var ang = Math.random() * Math.PI * 2;
        var d = this.size * (0.6 + Math.random() * 0.3);
        var p = take(
          this.x + Math.cos(ang) * d,
          this.y + Math.sin(ang) * d,
          Math.cos(ang) * 0.4 + (Math.random() - 0.5) * 0.3,
          Math.sin(ang) * 0.4 - 0.3,
          Math.random() * 8 + 5,
          'wisp'
        );
        particles.push(p);
      }
      var c = this.charge();
      if (c > 0.6 && Math.random() < 0.18 && embers.length < MAX_EMBERS) {
        var ea = Math.random() * Math.PI * 2;
        var ed = this.size * (0.4 + Math.random() * 0.4);
        var em = take(
          this.x + Math.cos(ea) * ed,
          this.y + Math.sin(ea) * ed,
          Math.cos(ea) * 0.6 + (Math.random() - 0.5) * 0.4,
          -Math.random() * 1.2 - 0.4,
          1,
          'ember'
        );
        embers.push(em);
        particles.push(em);
      }
    };
    ChargingBall.prototype.draw = function () {
      var t = now();
      var pulse = Math.sin(t * 6) * 0.08 + 0.92;
      var s = this.size * pulse;
      var c = this.charge();

      // far halo — crimson aura sprite
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = this.alpha * (0.18 + c * 0.32);
      var hs = s * 4;
      ctx.drawImage(sprAura, this.x - hs / 2, this.y - hs / 2, hs, hs);

      // body — sprite blit (warmth slot picked by charge)
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = this.alpha;
      var spr = c > 0.4 ? sprPuffWarm : sprPuffCool;
      var bs = s * 2;
      ctx.drawImage(spr, this.x - bs / 2, this.y - bs / 2, bs, bs);

      // rotating inner ring (pre-charge tells) — 3 small additive blits
      ctx.globalCompositeOperation = 'lighter';
      var ringAlpha = 0.35 * c + 0.1;
      var ringS = s * 0.7;
      for (var i = 0; i < 3; i++) {
        var a = t * 1.4 + (i / 3) * Math.PI * 2;
        var rx = this.x + Math.cos(a) * s * 0.55;
        var ry = this.y + Math.sin(a) * s * 0.55;
        ctx.globalAlpha = ringAlpha;
        ctx.drawImage(sprEmberHalo, rx - ringS / 2, ry - ringS / 2, ringS, ringS);
      }

      // hot pinpoint — emerges only when charged
      if (c > 0.5) {
        ctx.globalAlpha = (c - 0.5) * 1.6;
        var ps = s * 0.6;
        ctx.drawImage(sprEmberCore, this.x - ps / 2, this.y - ps / 2, ps, ps);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    // -------- thrown smoke ball --------
    function SmokeBall(x, y, vx, vy, size, charge) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.size = size || 35;
      this.alpha = 0.95;
      this.active = true;
      this.gravity = 0.16;
      this.drag = 0.985;
      this.smoke = Math.floor((size || 35) / 4);
      this.charge = Math.max(0, Math.min(1, charge || 0));
      this.spin = (Math.random() - 0.5) * 0.1;
      this.rot = 0;
    }
    SmokeBall.prototype.update = function () {
      this.vy += this.gravity;
      this.vx *= this.drag; this.vy *= this.drag;
      this.x += this.vx; this.y += this.vy;
      this.alpha *= 0.985;
      this.rot += this.spin;

      var bounce = 0.7, hit = false;
      if (this.x - this.size < 0)      { this.x = this.size;             this.vx =  Math.abs(this.vx) * bounce; hit = true; }
      if (this.x + this.size > W())    { this.x = W() - this.size;       this.vx = -Math.abs(this.vx) * bounce; hit = true; }
      if (this.y - this.size < 0)      { this.y = this.size;             this.vy =  Math.abs(this.vy) * bounce; hit = true; }
      if (this.y + this.size > H())    { this.y = H() - this.size;       this.vy = -Math.abs(this.vy) * bounce; hit = true; }

      // explode on text contact — check only nearby grid cells
      var bgx = Math.floor(this.x / GRID_CELL), bgy = Math.floor(this.y / GRID_CELL);
      for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
          var bk = textGrid[gridKey(bgx + dx, bgy + dy)];
          if (!bk) continue;
          for (var ti = 0; ti < bk.length; ti++) {
            var t = bk[ti];
            if (this.x + this.size > t.x && this.x - this.size < t.x + t.width &&
                this.y + this.size > t.y && this.y - this.size < t.y + t.height) {
              this.explode();
              return false;
            }
          }
        }
      }

      // wisp trail — modest rate, throttled by perfScale
      var trailRate = 0.55 * perfScale;
      var burst = Math.random() < trailRate ? 1 : 0;
      for (var b = 0; b < burst; b++) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push(take(
          this.x + (Math.random() - 0.5) * this.size * 0.6,
          this.y + (Math.random() - 0.5) * this.size * 0.6,
          this.vx * 0.25 + (Math.random() - 0.5) * 0.6,
          this.vy * 0.25 + (Math.random() - 0.5) * 0.6,
          Math.random() * 12 + 6,
          'wisp'
        ));
      }

      // occasional ember in flight (more if heavily charged)
      if (Math.random() < 0.05 + this.charge * 0.08 && embers.length < MAX_EMBERS) {
        var em = take(
          this.x + (Math.random() - 0.5) * this.size * 0.4,
          this.y + (Math.random() - 0.5) * this.size * 0.4,
          this.vx * 0.2 + (Math.random() - 0.5) * 0.6,
          this.vy * 0.2 + (Math.random() - 0.5) * 0.6,
          1, 'ember'
        );
        embers.push(em); particles.push(em);
      }

      var sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (sp < 0.5 && hit) { this.explode(); return false; }
      if (this.alpha < 0.08) { this.explode(); return false; }
      return this.active;
    };
    SmokeBall.prototype.draw = function () {
      var c = this.charge;
      var spr = c > 0.4 ? sprPuffWarm : sprPuffCool;

      // 3 offset lumps — sprite blits
      var s0 = this.size * 2;
      var s1 = this.size * 1.7;
      var s2 = this.size * 1.4;
      var ox1 = Math.cos(this.rot) * this.size * 0.25;
      var oy1 = Math.sin(this.rot * 0.9) * this.size * 0.2;
      var ox2 = Math.cos(this.rot + 2.1) * this.size * 0.2;
      var oy2 = Math.sin(this.rot + 1.3) * this.size * 0.28;
      var a = this.alpha;

      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = a;
      ctx.drawImage(spr, this.x - s0 / 2, this.y - s0 / 2, s0, s0);
      ctx.globalAlpha = a * 0.75;
      ctx.drawImage(spr, this.x + ox1 - s1 / 2, this.y + oy1 - s1 / 2, s1, s1);
      ctx.globalAlpha = a * 0.6;
      ctx.drawImage(spr, this.x + ox2 - s2 / 2, this.y + oy2 - s2 / 2, s2, s2);

      // crimson aura — additive blit
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * (0.25 + c * 0.3);
      var aurS = this.size * 3.6;
      ctx.drawImage(sprAura, this.x - aurS / 2, this.y - aurS / 2, aurS, aurS);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };
    SmokeBall.prototype.explode = function () {
      var n = Math.min(36 + this.smoke * 2, 60);
      n = Math.max(12, Math.floor(n * perfScale));
      var c = this.charge;
      // shockwave puff cluster
      for (var i = 0; i < n; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        if (puffs.length >= HARD_LIMIT_PUFFS) {
          var oldest = puffs.shift(); if (oldest) oldest.active = false;
        }
        var ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        var sp = Math.random() * 2.5 + 1.2;
        var p = take(
          this.x, this.y,
          Math.cos(ang) * sp + this.vx * 0.3,
          Math.sin(ang) * sp + this.vy * 0.3 - 0.4,
          Math.random() * 28 + 16,
          'puff'
        );
        p.warmth = 0.3 + c * 0.7 + Math.random() * 0.2;
        particles.push(p);
        puffs.push(p);
      }
      // ember burst — scales with charge
      var eN = Math.floor(8 + c * 18);
      for (var ei = 0; ei < eN; ei++) {
        if (embers.length >= MAX_EMBERS) break;
        var ea = Math.random() * Math.PI * 2;
        var es = Math.random() * 4 + 1.5;
        var em = take(
          this.x + (Math.random() - 0.5) * 8,
          this.y + (Math.random() - 0.5) * 8,
          Math.cos(ea) * es + this.vx * 0.4,
          Math.sin(ea) * es + this.vy * 0.4 - Math.random() * 1.2,
          1, 'ember'
        );
        embers.push(em); particles.push(em);
      }
      this.active = false;
    };

    // -------- input wiring --------
    function setMouse(x, y) {
      lmx = mx; lmy = my;
      mx = x; my = y;
      var t = Date.now(), dt = t - lastMove;
      if (dt > 0) {
        mvx = (mx - lmx) / dt * 16;
        mvy = (my - lmy) / dt * 16;
      }
      lastMove = t;
      moving = true;
    }

    function quickPuff(cx, cy) {
      var n = Math.min(24, MAX_PARTICLES - particles.length);
      n = Math.max(8, Math.floor(n * perfScale));
      for (var i = 0; i < n; i++) {
        if (puffs.length >= HARD_LIMIT_PUFFS) {
          var oldest = puffs.shift(); if (oldest) oldest.active = false;
        }
        var ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        var sp = Math.random() * 2.5 + 1;
        var p = take(
          cx + (Math.random() - 0.5) * 12,
          cy + (Math.random() - 0.5) * 12,
          Math.cos(ang) * sp,
          Math.sin(ang) * sp - 0.8,
          Math.random() * 18 + 10,
          'puff'
        );
        p.warmth = Math.random() * 0.4;
        particles.push(p); puffs.push(p);
      }
      // a few embers on click — tiny but readable
      var eN = 4 + Math.floor(Math.random() * 4);
      for (var ei = 0; ei < eN; ei++) {
        if (embers.length >= MAX_EMBERS) break;
        var ea = Math.random() * Math.PI * 2;
        var es = Math.random() * 2 + 0.6;
        var em = take(
          cx, cy,
          Math.cos(ea) * es,
          Math.sin(ea) * es - Math.random() * 1.0,
          1, 'ember'
        );
        embers.push(em); particles.push(em);
      }
    }

    function release(x, y) {
      if (!charging) return;
      var holdT = Date.now() - downT;
      var dist = Math.hypot(x - downX, y - downY);
      var sp = Math.hypot(mvx, mvy);
      var c = charging.charge();
      if (holdT < 200 && dist < 10) {
        quickPuff(x, y);
      } else if (dist > 30 && sp > 2) {
        if (balls.length >= HARD_LIMIT_BALLS) balls.shift();
        balls.push(new SmokeBall(charging.x, charging.y, mvx * 0.85, mvy * 0.85, charging.size, c));
      } else {
        var b = new SmokeBall(charging.x, charging.y, 0, 0, charging.size, c);
        b.explode();
      }
      charging = null;
    }

    document.addEventListener('mousemove', function (e) { setMouse(e.clientX, e.clientY); });
    document.addEventListener('mousedown', function (e) {
      down = true; downT = Date.now(); downX = e.clientX; downY = e.clientY;
      charging = new ChargingBall(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', function (e) {
      if (!down) return;
      down = false;
      release(e.clientX, e.clientY);
    });

    document.addEventListener('touchstart', function (e) {
      if (!e.touches.length) return;
      var t = e.touches[0];
      down = true; downT = Date.now(); downX = t.clientX; downY = t.clientY;
      setMouse(t.clientX, t.clientY);
      charging = new ChargingBall(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!e.touches.length) return;
      var t = e.touches[0];
      setMouse(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', function () {
      if (down) release(mx, my);
      down = false; moving = false;
    }, { passive: true });

    // -------- main loop --------
    var lastFrameT = performance.now();
    var paused = false;
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (!paused) {
        lastFrameT = performance.now();
        requestAnimationFrame(tick);
      }
    });

    function tick() {
      if (paused) return;

      // adaptive throttle: track avg frame time, scale spawn down if slow.
      var nowT = performance.now();
      var dt = nowT - lastFrameT;
      lastFrameT = nowT;
      if (dt > 0 && dt < 200) {
        avgFrame = avgFrame * 0.9 + dt * 0.1;
        // target 16.7ms; ease perfScale down when frames run long
        if (avgFrame > 22)      perfScale = Math.max(0.45, perfScale - 0.02);
        else if (avgFrame < 18) perfScale = Math.min(1.0,  perfScale + 0.01);
      }

      // trail-fade: leave a faint motion afterimage instead of hard clear
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 0, W(), H());
      ctx.globalCompositeOperation = 'source-over';

      if (charging && down) {
        charging.update(mx, my);
        charging.draw();
      }

      // 1) draw smoke first (under embers)
      var keep = [], keepPuffs = [], keepEmbers = [];
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (step(p)) {
          if (p.type !== 'ember') drawSmoke(p);
          keep.push(p);
          if (p.type === 'puff' && p.active) keepPuffs.push(p);
          if (p.type === 'ember' && p.active) keepEmbers.push(p);
        } else {
          p.active = false;
        }
      }

      // 2) draw embers on top — additive sparks read against the smoke
      for (var e = 0; e < keepEmbers.length; e++) drawEmber(keepEmbers[e]);

      particles = keep;
      puffs = keepPuffs;
      embers = keepEmbers;

      // 3) thrown balls
      var keepBalls = [];
      for (var k = 0; k < balls.length; k++) {
        if (balls[k].update()) {
          balls[k].draw();
          keepBalls.push(balls[k]);
        }
      }
      balls = keepBalls;

      requestAnimationFrame(tick);
    }
    tick();
  }

  function boot() {
    requestAnimationFrame(function () { requestAnimationFrame(initGothicSmoke); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
