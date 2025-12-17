// ===================================
// Enhanced Smoke Effect System (Desktop & Mobile)
// Optimized with particle pooling, accumulation, and mouse interaction
// Now with growing smoke balls, throwing, and collision detection
// ===================================

export function initSmokeEffect() {
    // Create canvas for smoke
    var smokeCanvas = document.createElement('canvas');
    smokeCanvas.id = 'smoke-canvas';
    smokeCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(smokeCanvas);

    var ctx = smokeCanvas.getContext('2d');

    // Performance settings
    var MAX_PARTICLES = 500;
    var PARTICLE_POOL_SIZE = 1000;
    var MAX_SMOKE_PUFFS = 6;  // Preferred max smoke puffs on screen
    var HARD_LIMIT_PUFFS = 10;  // Hard limit - delete oldest if exceeded
    var MAX_SMOKE_BALLS = 6;  // Preferred max smoke balls
    var HARD_LIMIT_BALLS = 10;  // Hard limit for smoke balls
    var particles = [];
    var particlePool = [];
    var smokePuffs = [];  // Track puff particles separately

    // Mouse tracking
    var mouseX = 0;
    var mouseY = 0;
    var lastMouseX = 0;
    var lastMouseY = 0;
    var mouseVelocityX = 0;
    var mouseVelocityY = 0;
    var lastMoveTime = Date.now();
    var isMoving = false;

    // Mouse button state for charging
    var isMouseDown = false;
    var mouseDownTime = 0;
    var mouseDownX = 0;
    var mouseDownY = 0;
    var chargingBall = null;

    // Text elements cache for collision detection
    var textElements = [];

    // Set canvas size
    function resizeCanvas() {
        smokeCanvas.width = window.innerWidth;
        smokeCanvas.height = window.innerHeight;
        cacheTextElements(); // Recache on resize
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Temporary canvas for text measurement
    var measureCanvas = document.createElement('canvas');
    var measureCtx = measureCanvas.getContext('2d');

    // Check if canvas context is available
    if (!measureCtx) {
        console.warn('Smoke Effect: Canvas 2D context not available for text measurement');
    }

    // Cache text element positions for collision detection
    function cacheTextElements() {
        textElements = [];

        // Skip if no measurement context available
        if (!measureCtx) return;

        var elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, span, li, button, .nav-link, .section-title, .gothic-title');

        elements.forEach(function(el) {
            var rect = el.getBoundingClientRect();
            // Only cache visible elements within viewport + buffer
            var buffer = 200;
            if (rect.width > 0 && rect.height > 0 &&
                rect.bottom > -buffer && rect.top < window.innerHeight + buffer &&
                rect.right > -buffer && rect.left < window.innerWidth + buffer) {

                // Get computed styles for accurate text measurement
                var style = window.getComputedStyle(el);
                var text = el.textContent.trim();

                // Skip empty elements
                if (!text) return;

                // Set font for measurement
                measureCtx.font = style.fontSize + ' ' + style.fontFamily;
                var metrics = measureCtx.measureText(text);

                // Calculate actual text bounds (tighter than element bounds)
                var fontSize = parseFloat(style.fontSize);
                var textWidth = metrics.width;
                var textHeight = fontSize * 1.2; // Approximation including descent

                // Calculate padding to center text within element
                var paddingLeft = parseFloat(style.paddingLeft) || 0;
                var paddingTop = parseFloat(style.paddingTop) || 0;

                // Actual text position (trimmed to text geometry)
                var textX = rect.left + paddingLeft;
                var textY = rect.top + paddingTop;

                // Use tighter bounds based on actual text
                var actualWidth = Math.min(textWidth, rect.width - paddingLeft);
                var actualHeight = Math.min(textHeight, rect.height - paddingTop);

                textElements.push({
                    x: textX,
                    y: textY,
                    width: actualWidth,
                    height: actualHeight,
                    centerX: textX + actualWidth / 2,
                    centerY: textY + actualHeight / 2,
                    influenceRange: Math.max(actualWidth, actualHeight) / 2 + 30  // Reduced buffer
                });
            }
        });
    }

    // Initial cache
    cacheTextElements();

    // Re-cache on scroll (throttled) and periodically for dynamic content
    var lastScrollCache = 0;
    window.addEventListener('scroll', function() {
        var now = Date.now();
        if (now - lastScrollCache > 500) {
            cacheTextElements();
            lastScrollCache = now;
        }
    }, { passive: true });

    // Re-cache periodically to account for dynamic content
    setInterval(cacheTextElements, 3000);

    // Initialize particle pool
    for (var i = 0; i < PARTICLE_POOL_SIZE; i++) {
        particlePool.push(createParticleObject());
    }

    // Create particle object (for pooling)
    function createParticleObject() {
        return {
            x: 0,
            y: 0,
            velocityX: 0,
            velocityY: 0,
            size: 0,
            maxSize: 0,
            alpha: 0,
            life: 0,
            decayRate: 0,
            growRate: 0,
            type: 'normal',
            rotation: 0,
            rotationSpeed: 0,
            active: false,
            accumulated: false,
            targetX: 0,
            targetY: 0
        };
    }

    // Get particle from pool
    function getParticle(x, y, velocityX, velocityY, size, type) {
        var particle;

        // Try to get from pool
        for (var i = 0; i < particlePool.length; i++) {
            if (!particlePool[i].active) {
                particle = particlePool[i];
                break;
            }
        }

        // If pool exhausted, reuse oldest active particle
        if (!particle) {
            particle = particles.shift() || createParticleObject();
        }

        // Initialize particle
        particle.active = true;
        particle.x = x;
        particle.y = y;
        particle.velocityX = velocityX !== undefined ? velocityX : (Math.random() - 0.5) * 0.5;
        particle.velocityY = velocityY !== undefined ? velocityY : -Math.random() * 1.5 - 0.5;
        particle.size = size || Math.random() * 15 + 8;
        particle.maxSize = particle.size * 3.5;
        particle.alpha = 0.7;
        particle.life = 1.0;
        particle.type = type || 'normal';
        // Speed up dissipation if we're over the preferred max
        var puffCount = smokePuffs.length;
        var dissipationMultiplier = puffCount > MAX_SMOKE_PUFFS ? Math.min(3.0, 1 + (puffCount - MAX_SMOKE_PUFFS) * 0.5) : 1.0;
        // Reduced base decay rates for slower normal dissipation, but multiplier still applies when over threshold
        particle.decayRate = type === 'puff' ? (0.003 * dissipationMultiplier) : (type === 'wisp' ? 0.008 : 0.005);
        particle.growRate = type === 'puff' ? 0.9 : (type === 'wisp' ? 0.2 : 0.35);
        particle.rotation = Math.random() * Math.PI * 2;
        particle.rotationSpeed = (Math.random() - 0.5) * 0.03;
        particle.accumulated = false;
        particle.targetX = mouseX;
        particle.targetY = mouseY;

        return particle;
    }

    // Update particle
    function updateParticle(particle) {
        if (!particle.active) return false;

        // If accumulated, move toward cursor
        if (particle.accumulated) {
            var dx = particle.targetX - particle.x;
            var dy = particle.targetY - particle.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                particle.velocityX = dx * 0.08;
                particle.velocityY = dy * 0.08;
            } else {
                particle.velocityX *= 0.95;
                particle.velocityY *= 0.95;
            }
        } else {
            // Apply mouse influence to nearby particles
            var dx = mouseX - particle.x;
            var dy = mouseY - particle.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150 && isMoving && !isMouseDown) {
                var force = (150 - distance) / 150 * 0.3;
                particle.velocityX += (dx / distance) * force * mouseVelocityX * 0.01;
                particle.velocityY += (dy / distance) * force * mouseVelocityY * 0.01;
            }

            // Text collision and curling behavior (optimized)
            for (var i = 0; i < textElements.length; i++) {
                var text = textElements[i];

                // Quick bounds check before expensive calculations
                var maxDist = text.influenceRange + particle.size;
                if (Math.abs(particle.x - text.centerX) > maxDist ||
                    Math.abs(particle.y - text.centerY) > maxDist) {
                    continue;
                }

                var textDx = particle.x - text.centerX;
                var textDy = particle.y - text.centerY;
                var textDistSq = textDx * textDx + textDy * textDy;
                var influenceRangeSq = text.influenceRange * text.influenceRange;

                if (textDistSq < influenceRangeSq) {
                    var textDist = Math.sqrt(textDistSq);

                    // Check if inside text bounds
                    if (particle.x >= text.x && particle.x <= text.x + text.width &&
                        particle.y >= text.y && particle.y <= text.y + text.height) {
                        // Push away from center
                        var pushForce = 0.8;
                        particle.velocityX += (textDx / textDist) * pushForce;
                        particle.velocityY += (textDy / textDist) * pushForce;
                    } else {
                        // Create curling effect around text
                        var angle = Math.atan2(textDy, textDx);
                        var curlStrength = (text.influenceRange - textDist) / text.influenceRange * 0.15;

                        // Perpendicular curl
                        particle.velocityX += Math.cos(angle + Math.PI / 2) * curlStrength;
                        particle.velocityY += Math.sin(angle + Math.PI / 2) * curlStrength;

                        // Slight push away
                        particle.velocityX += (textDx / textDist) * curlStrength * 0.5;
                        particle.velocityY += (textDy / textDist) * curlStrength * 0.5;
                    }
                }
            }

            // Slow down horizontal movement
            particle.velocityX *= 0.98;

            // Enhanced upward drift with slight turbulence
            particle.velocityY -= 0.02;
            particle.velocityX += (Math.random() - 0.5) * 0.02; // Turbulence
        }

        // Update position
        particle.y += particle.velocityY;
        particle.x += particle.velocityX;

        // Boundary collision detection with bounce and energy loss
        var damping = 0.6; // Energy loss on bounce
        var margin = particle.size;

        // Left boundary
        if (particle.x - margin < 0) {
            particle.x = margin;
            particle.velocityX = Math.abs(particle.velocityX) * damping;
            particle.life -= 0.05; // Slight life reduction on bounce
        }

        // Right boundary
        if (particle.x + margin > smokeCanvas.width) {
            particle.x = smokeCanvas.width - margin;
            particle.velocityX = -Math.abs(particle.velocityX) * damping;
            particle.life -= 0.05;
        }

        // Top boundary
        if (particle.y - margin < 0) {
            particle.y = margin;
            particle.velocityY = Math.abs(particle.velocityY) * damping;
            particle.life -= 0.05;
        }

        // Bottom boundary
        if (particle.y + margin > smokeCanvas.height) {
            particle.y = smokeCanvas.height - margin;
            particle.velocityY = -Math.abs(particle.velocityY) * damping;
            particle.life -= 0.05;
        }

        // Grow and fade
        if (particle.size < particle.maxSize) {
            particle.size += particle.growRate;
        }

        particle.life -= particle.decayRate;
        particle.alpha = particle.life * 0.7;
        particle.rotation += particle.rotationSpeed;

        return particle.life > 0;
    }

    // Draw particle with enhanced visuals
    function drawParticle(particle) {
        if (!particle.active) return;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        // Multi-layer gradient for wispy smoke
        var gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);

        if (particle.type === 'wisp') {
            gradient.addColorStop(0, 'rgba(130, 130, 130, ' + particle.alpha + ')');
            gradient.addColorStop(0.3, 'rgba(100, 100, 100, ' + (particle.alpha * 0.7) + ')');
            gradient.addColorStop(0.6, 'rgba(70, 70, 70, ' + (particle.alpha * 0.4) + ')');
            gradient.addColorStop(1, 'rgba(40, 40, 40, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(110, 110, 110, ' + particle.alpha + ')');
            gradient.addColorStop(0.4, 'rgba(85, 85, 85, ' + (particle.alpha * 0.6) + ')');
            gradient.addColorStop(0.7, 'rgba(60, 60, 60, ' + (particle.alpha * 0.3) + ')');
            gradient.addColorStop(1, 'rgba(35, 35, 35, 0)');
        }

        ctx.fillStyle = gradient;

        // Use globalCompositeOperation for better blending
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        ctx.globalCompositeOperation = 'source-over';

        ctx.restore();
    }

    // Charging ball that grows while holding mouse
    function ChargingBall(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.maxSize = 100;
        this.alpha = 0.8;
        this.growthRate = 0.8;
        this.particles = []; // Particles attracted to the ball
    }

    ChargingBall.prototype.update = function(currentX, currentY) {
        this.x = currentX;
        this.y = currentY;

        // Grow the ball
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
            this.growthRate *= 0.99; // Slow down growth over time
        }

        // Spawn particles around the charging ball
        if (Math.random() < 0.3 && particles.length < MAX_PARTICLES) {
            var angle = Math.random() * Math.PI * 2;
            var distance = this.size * 0.7;
            var p = getParticle(
                this.x + Math.cos(angle) * distance,
                this.y + Math.sin(angle) * distance,
                (Math.random() - 0.5) * 0.5,
                -Math.random() * 0.5,
                Math.random() * 8 + 5,
                'wisp'
            );
            this.particles.push(p);
            particles.push(p);
        }
    };

    ChargingBall.prototype.draw = function() {
        ctx.save();

        // Pulsing effect
        var pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
        var drawSize = this.size * pulse;

        // Outer glow
        var outerGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, drawSize * 1.5);
        outerGlow.addColorStop(0, 'rgba(150, 150, 150, ' + (this.alpha * 0.3) + ')');
        outerGlow.addColorStop(0.5, 'rgba(120, 120, 120, ' + (this.alpha * 0.2) + ')');
        outerGlow.addColorStop(1, 'rgba(80, 80, 80, 0)');

        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, drawSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Main ball
        var gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, drawSize);
        gradient.addColorStop(0, 'rgba(160, 160, 160, ' + this.alpha + ')');
        gradient.addColorStop(0.5, 'rgba(120, 120, 120, ' + (this.alpha * 0.7) + ')');
        gradient.addColorStop(1, 'rgba(80, 80, 80, ' + (this.alpha * 0.3) + ')');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    // Smoke ball for release effect with collision detection
    function SmokeBall(x, y, velocityX, velocityY, size) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size || 35;
        this.alpha = 0.9;
        this.active = true;
        this.gravity = 0.15;
        this.drag = 0.98;
        this.smokeAmount = Math.floor(size / 5);
    }

    SmokeBall.prototype.update = function() {
        this.velocityY += this.gravity;
        this.velocityX *= this.drag;
        this.velocityY *= this.drag;

        this.x += this.velocityX;
        this.y += this.velocityY;

        this.alpha *= 0.98;

        var bounceDamping = 0.7; // Energy retention on bounce
        var hasCollision = false;

        // Check collision with screen edges - bounce instead of explode
        // Left boundary
        if (this.x - this.size < 0) {
            this.x = this.size;
            this.velocityX = Math.abs(this.velocityX) * bounceDamping;
            hasCollision = true;
        }

        // Right boundary
        if (this.x + this.size > smokeCanvas.width) {
            this.x = smokeCanvas.width - this.size;
            this.velocityX = -Math.abs(this.velocityX) * bounceDamping;
            hasCollision = true;
        }

        // Top boundary
        if (this.y - this.size < 0) {
            this.y = this.size;
            this.velocityY = Math.abs(this.velocityY) * bounceDamping;
            hasCollision = true;
        }

        // Bottom boundary
        if (this.y + this.size > smokeCanvas.height) {
            this.y = smokeCanvas.height - this.size;
            this.velocityY = -Math.abs(this.velocityY) * bounceDamping;
            hasCollision = true;
        }

        // Check collision with text elements - explode on hit
        for (var i = 0; i < textElements.length; i++) {
            var text = textElements[i];

            // Check if ball intersects with text bounding box
            if (this.x + this.size > text.x && this.x - this.size < text.x + text.width &&
                this.y + this.size > text.y && this.y - this.size < text.y + text.height) {
                this.explode();
                return false;
            }
        }

        // Spawn trailing smoke particles
        if (Math.random() < 0.4 && particles.length < MAX_PARTICLES) {
            var p = getParticle(
                this.x + (Math.random() - 0.5) * this.size * 0.5,
                this.y + (Math.random() - 0.5) * this.size * 0.5,
                this.velocityX * 0.3 + (Math.random() - 0.5) * 0.5,
                this.velocityY * 0.3 + (Math.random() - 0.5) * 0.5,
                Math.random() * 10 + 5,
                'wisp'
            );
            particles.push(p);
        }

        // Check if energy too low after bouncing - explode
        var speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed < 0.5 && hasCollision) {
            this.explode();
            return false;
        }

        // Check if faded
        if (this.alpha < 0.1) {
            this.explode();
            return false;
        }

        return this.active;
    };

    SmokeBall.prototype.draw = function() {
        ctx.save();

        // Multi-layer glow effect
        for (var i = 0; i < 2; i++) {
            var layerSize = this.size * (1 + i * 0.3);
            var layerAlpha = this.alpha * (1 - i * 0.5);

            var gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, layerSize);
            gradient.addColorStop(0, 'rgba(140, 140, 140, ' + layerAlpha + ')');
            gradient.addColorStop(0.5, 'rgba(100, 100, 100, ' + (layerAlpha * 0.6) + ')');
            gradient.addColorStop(1, 'rgba(60, 60, 60, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, layerSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    SmokeBall.prototype.explode = function() {
        var explosionParticles = Math.min(30 + this.smokeAmount * 2, 50);

        for (var i = 0; i < explosionParticles; i++) {
            if (particles.length >= MAX_PARTICLES) break;

            // Enforce hard limit on puffs
            if (smokePuffs.length >= HARD_LIMIT_PUFFS) {
                var oldest = smokePuffs.shift();
                if (oldest) oldest.active = false;
            }

            var angle = (Math.PI * 2 * i) / explosionParticles;
            var speed = Math.random() * 2 + 1;  // Reduced from (5 + 3) to (2 + 1)
            var p = getParticle(
                this.x,
                this.y,
                Math.cos(angle) * speed + this.velocityX * 0.3,
                Math.sin(angle) * speed + this.velocityY * 0.3,
                Math.random() * 25 + 15,
                'puff'
            );
            particles.push(p);
            smokePuffs.push(p);  // Track puff separately
        }
        this.active = false;
    };

    var smokeBalls = [];

    // Mouse movement tracking
    function updateMousePosition(x, y) {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        mouseX = x;
        mouseY = y;

        var currentTime = Date.now();
        var deltaTime = currentTime - lastMoveTime;

        if (deltaTime > 0) {
            mouseVelocityX = (mouseX - lastMouseX) / deltaTime * 16;
            mouseVelocityY = (mouseY - lastMouseY) / deltaTime * 16;
        }

        lastMoveTime = currentTime;
        isMoving = true;
    }

    // Desktop mouse events
    document.addEventListener('mousemove', function(e) {
        updateMousePosition(e.clientX, e.clientY);
    });

    document.addEventListener('mousedown', function(e) {
        isMouseDown = true;
        mouseDownTime = Date.now();
        mouseDownX = e.clientX;
        mouseDownY = e.clientY;

        // Create charging ball
        chargingBall = new ChargingBall(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', function(e) {
        if (!isMouseDown) return;

        isMouseDown = false;
        var holdTime = Date.now() - mouseDownTime;
        var moveDist = Math.sqrt(
            Math.pow(e.clientX - mouseDownX, 2) +
            Math.pow(e.clientY - mouseDownY, 2)
        );

        if (chargingBall) {
            // Calculate velocity based on mouse movement
            var speed = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);

            if (holdTime < 200 && moveDist < 10) {
                // Quick click - create puff
                var puffCount = Math.min(20, MAX_PARTICLES - particles.length);
                for (var i = 0; i < puffCount; i++) {
                    // Enforce hard limit on puffs
                    if (smokePuffs.length >= HARD_LIMIT_PUFFS) {
                        var oldest = smokePuffs.shift();
                        if (oldest) oldest.active = false;
                    }

                    var angle = (Math.PI * 2 * i) / puffCount;
                    var puffSpeed = Math.random() * 2.5 + 1;
                    var p = getParticle(
                        e.clientX + (Math.random() - 0.5) * 10,
                        e.clientY + (Math.random() - 0.5) * 10,
                        Math.cos(angle) * puffSpeed,
                        Math.sin(angle) * puffSpeed - 0.8,
                        Math.random() * 18 + 10,
                        'puff'
                    );
                    particles.push(p);
                    smokePuffs.push(p);  // Track puff separately
                }
            } else if (moveDist > 30 && speed > 2) {
                // Enforce hard limit - delete oldest if at limit
                if (smokeBalls.length >= HARD_LIMIT_BALLS) {
                    smokeBalls.shift();  // Remove oldest
                }
                // Throw the smoke ball
                smokeBalls.push(new SmokeBall(
                    chargingBall.x,
                    chargingBall.y,
                    mouseVelocityX * 0.8,
                    mouseVelocityY * 0.8,
                    chargingBall.size
                ));
            } else {
                // Release without throwing - explode in place
                var tempBall = new SmokeBall(
                    chargingBall.x,
                    chargingBall.y,
                    0,
                    0,
                    chargingBall.size
                );
                tempBall.explode();
            }

            chargingBall = null;
        }
    });

    // Mobile touch events
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 0) {
            var touch = e.touches[0];
            isMouseDown = true;
            mouseDownTime = Date.now();
            mouseDownX = touch.clientX;
            mouseDownY = touch.clientY;
            updateMousePosition(touch.clientX, touch.clientY);

            // Create charging ball
            chargingBall = new ChargingBall(touch.clientX, touch.clientY);
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            var touch = e.touches[0];
            updateMousePosition(touch.clientX, touch.clientY);
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (isMouseDown && chargingBall) {
            var holdTime = Date.now() - mouseDownTime;
            var moveDist = Math.sqrt(
                Math.pow(mouseX - mouseDownX, 2) +
                Math.pow(mouseY - mouseDownY, 2)
            );

            var speed = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);

            if (holdTime < 200 && moveDist < 10) {
                // Quick tap - create puff
                var puffCount = Math.min(20, MAX_PARTICLES - particles.length);
                for (var i = 0; i < puffCount; i++) {
                    // Enforce hard limit on puffs
                    if (smokePuffs.length >= HARD_LIMIT_PUFFS) {
                        var oldest = smokePuffs.shift();
                        if (oldest) oldest.active = false;
                    }

                    var angle = (Math.PI * 2 * i) / puffCount;
                    var puffSpeed = Math.random() * 2.5 + 1;
                    var p = getParticle(
                        mouseX + (Math.random() - 0.5) * 10,
                        mouseY + (Math.random() - 0.5) * 10,
                        Math.cos(angle) * puffSpeed,
                        Math.sin(angle) * puffSpeed - 0.8,
                        Math.random() * 18 + 10,
                        'puff'
                    );
                    particles.push(p);
                    smokePuffs.push(p);  // Track puff separately
                }
            } else if (moveDist > 30 && speed > 2) {
                // Enforce hard limit - delete oldest if at limit
                if (smokeBalls.length >= HARD_LIMIT_BALLS) {
                    smokeBalls.shift();  // Remove oldest
                }
                // Throw the smoke ball
                smokeBalls.push(new SmokeBall(
                    chargingBall.x,
                    chargingBall.y,
                    mouseVelocityX * 0.8,
                    mouseVelocityY * 0.8,
                    chargingBall.size
                ));
            } else {
                // Release without throwing - explode in place
                var tempBall = new SmokeBall(
                    chargingBall.x,
                    chargingBall.y,
                    0,
                    0,
                    chargingBall.size
                );
                tempBall.explode();
            }

            chargingBall = null;
        }

        isMouseDown = false;
        isMoving = false;
    }, { passive: true });

    // Optimized animation loop
    function animate() {
        ctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);

        // Update and draw charging ball
        if (chargingBall && isMouseDown) {
            chargingBall.update(mouseX, mouseY);
            chargingBall.draw();
        }

        // Update and draw particles (optimized)
        var activeParticles = [];
        var activePuffs = [];
        for (var i = 0; i < particles.length; i++) {
            if (updateParticle(particles[i])) {
                drawParticle(particles[i]);
                activeParticles.push(particles[i]);
                // Track active puffs separately
                if (particles[i].type === 'puff' && particles[i].active) {
                    activePuffs.push(particles[i]);
                }
            } else {
                particles[i].active = false;
            }
        }
        particles = activeParticles;
        smokePuffs = activePuffs;

        // Update and draw smoke balls
        var activeBalls = [];
        for (var i = 0; i < smokeBalls.length; i++) {
            if (smokeBalls[i].update()) {
                smokeBalls[i].draw();
                activeBalls.push(smokeBalls[i]);
            }
        }
        smokeBalls = activeBalls;

        requestAnimationFrame(animate);
    }

    animate();
}
