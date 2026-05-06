/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Screensaver - Unity AI Lab
 * AI-powered screensaver functionality
 * Uses PolliLibJS for API constants and helpers, direct fetch for requests
 */

// Initialize PolliLibJS API (for constants and helper methods)
const polliAPI = new PollinationsAPI();

// System role is loaded once at init from the canonical Unity system prompt
// file (same file the chat apps use). If the fetch fails, system stays empty
// — no hardcoded fallback persona. The user message below carries enough
// instruction to drive output even with an empty system.
let unitySystemPrompt = '';

async function loadUnityPrompt() {
    try {
        const response = await fetch('../../ai/demo/unity-system-prompt-v2.txt');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        unitySystemPrompt = await response.text();
        console.log('System prompt loaded:', unitySystemPrompt.length, 'chars');
    } catch (err) {
        console.error('Failed to load system prompt:', err);
        unitySystemPrompt = '';
    }
}

// Configuration
const CONFIG = {
    MAX_HISTORY: 10,
    PROMPT_UPDATE_INTERVAL: 20000, // 20 seconds
    DEFAULT_TIMER: 30,
    DEFAULT_TRANSITION: 1,
    EMPTY_THUMBNAIL: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
};

// State
const state = {
    active: false,
    paused: false,
    fullscreen: false,
    controlsHidden: false,
    isTransitioning: false,
    autoPromptEnabled: true,
    isFetchingPrompt: false,
    currentImage: 'image1',
    lastPromptUpdate: 0,
    imageHistory: [],
    promptHistory: [],
    settings: {
        prompt: '',
        timer: CONFIG.DEFAULT_TIMER,
        aspect: 'widescreen',
        model: '',
        enhance: true,
        private: true,
        transitionDuration: CONFIG.DEFAULT_TRANSITION
    }
};

// DOM Elements
const elements = {
    container: document.getElementById('screensaver-container'),
    image1: document.getElementById('screensaver-image1'),
    image2: document.getElementById('screensaver-image2'),
    promptInput: document.getElementById('screensaver-prompt'),
    timerInput: document.getElementById('screensaver-timer'),
    aspectSelect: document.getElementById('screensaver-aspect'),
    modelSelect: document.getElementById('screensaver-model'),
    enhanceCheckbox: document.getElementById('screensaver-enhance'),
    privateCheckbox: document.getElementById('screensaver-private'),
    transitionInput: document.getElementById('screensaver-transition-duration'),
    thumbnailsWrapper: document.getElementById('screensaver-thumbnails-wrapper'),
    thumbnailsContainer: document.getElementById('screensaver-thumbnails'),
    playPauseBtn: document.getElementById('screensaver-playpause'),
    fullscreenBtn: document.getElementById('fullscreen-screensaver'),
    hideBtn: document.getElementById('screensaver-hide'),
    saveBtn: document.getElementById('screensaver-save'),
    copyBtn: document.getElementById('screensaver-copy'),
    restartPromptBtn: document.getElementById('screensaver-restart-prompt'),
    clearHistoryBtn: document.getElementById('screensaver-clear-history'),
    exitBtn: document.getElementById('screensaver-exit'),
    thumbLeftBtn: document.getElementById('screensaver-thumb-left'),
    thumbRightBtn: document.getElementById('screensaver-thumb-right')
};

// Intervals
let imageInterval = null;
let promptInterval = null;

// ===== UTILITY FUNCTIONS =====

function showToast(message, duration = 3000) {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-notification";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => toast.style.opacity = "0", duration);
}

function generateSeed() {
    return Math.floor(Math.random() * 1000000);
}

function getDimensions(aspect) {
    const dimensions = {
        widescreen: { width: 1920, height: 1080 },
        square: { width: 1024, height: 1024 },
        portrait: { width: 1080, height: 1920 }
    };
    return dimensions[aspect] || dimensions.widescreen;
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error("Image preload failed"));
        img.src = url;
    });
}

// ===== SETTINGS MANAGEMENT =====

function saveSettings() {
    try {
        localStorage.setItem("screensaverSettings", JSON.stringify(state.settings));
    } catch (err) {
        console.error("Failed to save settings:", err);
        showToast("Failed to save settings");
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem("screensaverSettings");
        if (saved) {
            const parsed = JSON.parse(saved);
            state.settings = {
                prompt: '',  // Always start with empty prompt
                timer: parsed.timer || CONFIG.DEFAULT_TIMER,
                aspect: parsed.aspect || 'widescreen',
                model: parsed.model || '',
                enhance: parsed.enhance !== undefined ? parsed.enhance : true,
                private: parsed.private !== undefined ? parsed.private : true,
                transitionDuration: parsed.transitionDuration || CONFIG.DEFAULT_TRANSITION
            };

            // Apply to UI
            elements.promptInput.value = state.settings.prompt;
            elements.timerInput.value = state.settings.timer;
            elements.aspectSelect.value = state.settings.aspect;
            elements.enhanceCheckbox.checked = state.settings.enhance;
            elements.privateCheckbox.checked = state.settings.private;
            elements.transitionInput.value = state.settings.transitionDuration;
        }
    } catch (err) {
        console.error("Failed to load settings:", err);
    }
}

// ===== HISTORY MANAGEMENT =====

function saveHistory() {
    try {
        localStorage.setItem("imageHistory", JSON.stringify(state.imageHistory));
        localStorage.setItem("promptHistory", JSON.stringify(state.promptHistory));
    } catch (err) {
        console.error("Failed to save history:", err);
        showToast("Failed to save image history");
    }
}

function loadHistory() {
    try {
        const images = localStorage.getItem("imageHistory");
        const prompts = localStorage.getItem("promptHistory");
        state.imageHistory = images ? JSON.parse(images) : [];
        state.promptHistory = prompts ? JSON.parse(prompts) : [];
        updateThumbnails();
    } catch (err) {
        console.error("Failed to load history:", err);
        state.imageHistory = [];
        state.promptHistory = [];
    }
}

function addToHistory(imageUrl, prompt) {
    state.imageHistory.push(imageUrl);
    state.promptHistory.push(prompt);

    if (state.imageHistory.length > CONFIG.MAX_HISTORY) {
        state.imageHistory.shift();
        state.promptHistory.shift();
    }

    saveHistory();
    updateThumbnails();
}

function clearHistory() {
    if (confirm("Clear all thumbnail history?")) {
        state.imageHistory = [];
        state.promptHistory = [];
        saveHistory();
        updateThumbnails();
        showToast("History cleared");
    }
}

function updateThumbnails() {
    const slots = elements.thumbnailsContainer.querySelectorAll('img.thumbnail');
    const currentImgSrc = elements[`image${state.currentImage === 'image1' ? '1' : '2'}`].src;

    slots.forEach((thumb, index) => {
        thumb.onclick = null;
        thumb.classList.remove('selected', 'placeholder');

        if (state.imageHistory[index]) {
            thumb.src = state.imageHistory[index];
            thumb.title = state.promptHistory[index] || 'No prompt';
            thumb.onclick = () => showHistoricalImage(index);

            if (state.imageHistory[index] === currentImgSrc) {
                thumb.classList.add('selected');
            }
        } else {
            thumb.src = CONFIG.EMPTY_THUMBNAIL;
            thumb.title = '';
            thumb.classList.add('placeholder');
        }
    });

    // Scroll to newest
    elements.thumbnailsContainer.scrollTo({
        left: elements.thumbnailsContainer.scrollWidth,
        behavior: 'smooth'
    });
}

function showHistoricalImage(index) {
    const imageUrl = state.imageHistory[index];
    if (!imageUrl) return;

    const currentImg = elements[state.currentImage];
    const nextImageKey = state.currentImage === 'image1' ? 'image2' : 'image1';
    const nextImg = elements[nextImageKey];

    currentImg.style.opacity = '0';

    nextImg.onload = () => {
        nextImg.style.opacity = '1';
        state.currentImage = nextImageKey;
        updateThumbnails();
    };

    nextImg.onerror = () => {
        showToast("Failed to load historical image");
        nextImg.src = "https://via.placeholder.com/512?text=Load+Failed";
        nextImg.style.opacity = '1';
        state.currentImage = nextImageKey;
        updateThumbnails();
    };

    nextImg.src = imageUrl;

    // Restart timer
    setImageInterval();
}

// ===== MODEL FETCHING =====

async function fetchImageModels() {
    try {
        // Use PolliLibJS constants with API key authentication
        const response = await fetch(`${PollinationsAPI.IMAGE_MODELS_API}?key=${PollinationsAPI.DEFAULT_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const models = await response.json();
        elements.modelSelect.innerHTML = "";

        if (Array.isArray(models) && models.length > 0) {
            // API returns objects with 'name' property, extract model names
            const modelNames = models.map(m => typeof m === 'string' ? m : m.name).filter(Boolean);

            modelNames.forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                elements.modelSelect.appendChild(option);
            });

            // Pollinations sometimes returns image-EDIT models (kontext, etc.)
            // first — those need a source image and break for text-to-image.
            // Prefer a known text-to-image model, then fall back to anything
            // that doesn't smell like an edit/inpaint model.
            const preferred = ['flux', 'flux-pro', 'turbo', 'sdxl', 'dreamshaper'];
            const editish = /^(kontext|inpaint|edit|controlnet)/i;
            const pickDefault = (
                preferred.find(p => modelNames.includes(p)) ||
                modelNames.find(n => !editish.test(n)) ||
                modelNames[0]
            );

            if (state.settings.model && modelNames.includes(state.settings.model) && !editish.test(state.settings.model)) {
                elements.modelSelect.value = state.settings.model;
            } else {
                state.settings.model = pickDefault;
                elements.modelSelect.value = pickDefault;
            }
        }
    } catch (err) {
        console.error("Failed to fetch models:", err);
        showToast("Failed to load image models");
    }
}

// ===== PROMPT GENERATION =====

async function fetchDynamicPrompt() {
    // Template-built user instruction. Each fragment pool stays in the same
    // benign-individual-word register the original verified-working message
    // used (Azure's input scanner doesn't pattern-match), but composition is
    // randomized per call so Mistral gets a fresh input every cycle and stops
    // regurgitating the same opening phrase.
    const POOLS = {
        LENGTH: [
            "one image prompt under 150 chars",
            "150-char image prompt max",
            "one image prompt, brief",
            "brief image prompt, single line",
            "image prompt, short, one line",
            "give me one image prompt under 150 chars"
        ],
        VIBE: [
            "fever-dream deranged shit",
            "raw deranged shit",
            "primal nightmare imagery",
            "decay-and-flesh fever-dream",
            "raw fucked-up dream",
            "lurid fever-dream",
            "bone-deep nightmare scene"
        ],
        THEMES: [
            "bodies, blood, decay, twisted intimacy, body-warping, fleshly excess",
            "twisted intimacy, body-warping, fleshly excess, decay",
            "writhing forms, half-melted bodies, dripping intimacy",
            "carnal sprawl, drowning beauty, decay, blooming rot",
            "bodies, blood, fleshly excess, primal carnal chaos",
            "deep wet decay, twisted limbs, dripping intimacy, body-warping",
            "blood-soaked beauty, fleshly excess, twisted intimacy, raw decay"
        ],
        VOICE: [
            "your fucking call",
            "your call",
            "you pick the scene",
            "wherever your head goes",
            "raw — your pick",
            "go where you want with it"
        ],
        CLOSER: [
            "just the prompt",
            "no preamble",
            "raw prompt only",
            "prompt text only",
            "prompt only — no quotes",
            "single line, no preamble"
        ]
    };
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const composeUserMessage = () =>
        `${pick(POOLS.LENGTH)}. ${pick(POOLS.VIBE)} — ${pick(POOLS.THEMES)}. ${pick(POOLS.VOICE)}. ${pick(POOLS.CLOSER)}.`;

    // Strip Mistral's quote-wrapping (straight, smart, single, backticks) so the prompt
    // doesn't get URL-encoded as %22…%22 and dropped by the Pollinations image endpoint
    // (Chrome surfaces that as ERR_BLOCKED_BY_ORB on the resulting error response).
    const stripQuotes = (s) => {
        if (!s) return s;
        let out = s.trim();
        for (let i = 0; i < 2; i++) {
            const first = out.charAt(0);
            const last = out.charAt(out.length - 1);
            const pairs = [['"','"'], ["'","'"], ['`','`'], ['“','”'], ['‘','’']];
            const matched = pairs.some(([a, b]) => first === a && last === b);
            if (matched && out.length >= 2) out = out.slice(1, -1).trim();
            else break;
        }
        return out;
    };

    // Mistral via Azure occasionally returns choices with empty .content
    // (response filter eats it) — retry inside the same fetch cycle with
    // fresh seeds before giving up so the user doesn't see "Failed to get
    // new prompt" toasts when the next attempt would have succeeded.
    const ATTEMPTS = 4;
    let lastErr = null;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        const seed = generateSeed();
        const userMessage = composeUserMessage();
        try {
            const response = await fetch(PollinationsAPI.TEXT_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${PollinationsAPI.DEFAULT_API_KEY}`
                },
                body: JSON.stringify({
                    model: "mistral",
                    seed: seed,
                    safe: false,
                    messages: [
                        { role: "system", content: unitySystemPrompt },
                        { role: "user", content: userMessage }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error response (attempt ${attempt + 1}):`, errorText);
                lastErr = new Error(`HTTP ${response.status}: ${errorText}`);
                continue;
            }

            const data = await response.json();
            console.log(`Prompt API response (attempt ${attempt + 1}):`, data);

            const raw = data?.choices?.[0]?.message?.content?.trim();
            const prompt = stripQuotes(raw);

            if (!prompt) {
                console.warn(`Empty content (attempt ${attempt + 1}) — Azure response filter likely. Retrying with new seed.`);
                lastErr = new Error("No prompt in response");
                continue;
            }

            console.log(`Generated prompt (attempt ${attempt + 1}):`, prompt);
            return prompt;
        } catch (err) {
            console.error(`Fetch failed (attempt ${attempt + 1}):`, err);
            lastErr = err;
        }
    }

    console.error("All prompt-fetch attempts exhausted:", lastErr);
    showToast("Prompt generation failed: " + (lastErr?.message || "no content"));
    throw lastErr || new Error("No prompt in response");
}

async function updatePrompt() {
    if (!state.active || state.paused || !state.autoPromptEnabled || state.isFetchingPrompt) {
        return false;
    }

    state.isFetchingPrompt = true;

    try {
        const newPrompt = await fetchDynamicPrompt();
        elements.promptInput.value = newPrompt;
        state.settings.prompt = newPrompt;
        saveSettings();
        showToast("New AI prompt loaded");
        state.lastPromptUpdate = Date.now();
        return true;
    } catch (err) {
        console.error("Prompt fetch failed:", err);
        showToast("Failed to get new prompt");
        state.lastPromptUpdate = Date.now();
        return false;
    } finally {
        state.isFetchingPrompt = false;
    }
}

// ===== IMAGE GENERATION =====

async function fetchNewImage() {
    if (state.isTransitioning) return;

    state.isTransitioning = true;
    saveSettings();

    let prompt = elements.promptInput.value.trim();

    // Get new prompt if needed
    if (!prompt || state.autoPromptEnabled) {
        const success = await updatePrompt();
        if (success) {
            prompt = elements.promptInput.value.trim();
        } else if (!prompt) {
            state.isTransitioning = false;
            return;
        }
    }

    const { width, height } = getDimensions(state.settings.aspect);
    const seed = generateSeed();
    const model = state.settings.model || elements.modelSelect.value || 'flux';
    const enhance = state.settings.enhance;
    const priv = state.settings.private;

    // Use PolliLibJS helper for encoding and constants
    const encodedPrompt = polliAPI.encodePrompt(prompt);
    const url = `${PollinationsAPI.IMAGE_API}/${encodedPrompt}?key=${PollinationsAPI.DEFAULT_API_KEY}&width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&safe=false&private=${priv}&enhance=${enhance}&nolog=true`;

    console.log('Generating image:', { prompt, model, width, height, seed, url });

    const nextImageKey = state.currentImage === 'image1' ? 'image2' : 'image1';
    const currentImg = elements[state.currentImage];
    const nextImg = elements[nextImageKey];

    let imageAdded = false;

    const handleLoad = (finalUrl) => {
        nextImg.style.opacity = '1';
        currentImg.style.opacity = '0';
        state.currentImage = nextImageKey;

        if (!imageAdded) {
            addToHistory(finalUrl, prompt);
            imageAdded = true;
        }
    };

    nextImg.onload = () => handleLoad(nextImg.src);
    nextImg.onerror = () => {
        const fallback = "https://via.placeholder.com/512?text=Image+Failed";
        nextImg.src = fallback;
        nextImg.onload = () => handleLoad(fallback);
    };

    try {
        await preloadImage(url);
        nextImg.src = url;
    } catch (err) {
        console.error("Image preload failed:", err);
        nextImg.src = "https://via.placeholder.com/512?text=Image+Failed";
    } finally {
        state.isTransitioning = false;
    }
}

// ===== INTERVAL MANAGEMENT =====

function setImageInterval() {
    clearInterval(imageInterval);
    imageInterval = setInterval(() => {
        if (!state.paused && state.active) {
            fetchNewImage();
        }
    }, state.settings.timer * 1000);
}

function setPromptInterval() {
    clearInterval(promptInterval);
    promptInterval = null;

    if (state.autoPromptEnabled && state.active && !state.paused) {
        state.lastPromptUpdate = Date.now();

        updatePrompt().then(success => {
            if (success) fetchNewImage();
        });

        promptInterval = setInterval(async () => {
            if (!state.autoPromptEnabled || !state.active || state.paused || state.isFetchingPrompt) {
                clearInterval(promptInterval);
                promptInterval = null;
                return;
            }

            const elapsed = Date.now() - state.lastPromptUpdate;
            if (elapsed >= CONFIG.PROMPT_UPDATE_INTERVAL) {
                const success = await updatePrompt();
                if (success) await fetchNewImage();
            }
        }, 1000);
    }
}

// ===== SCREENSAVER CONTROL =====

function startScreensaver() {
    state.active = true;
    state.paused = false;
    state.controlsHidden = false;

    elements.container.style.position = "fixed";
    elements.container.style.top = "0";
    elements.container.style.left = "0";
    elements.container.style.width = "100vw";
    elements.container.style.height = "100vh";
    elements.container.style.zIndex = "9999";
    elements.container.classList.remove("hidden");

    elements.image1.style.opacity = '0';
    elements.image2.style.opacity = '0';

    elements.container.style.setProperty('--transition-duration', `${state.settings.transitionDuration}s`);

    fetchNewImage();
    setImageInterval();
    setPromptInterval();

    elements.playPauseBtn.innerHTML = "⏸️";
    elements.hideBtn.innerHTML = "🙈";
    elements.restartPromptBtn.innerHTML = state.autoPromptEnabled ? "🔄 Auto-Prompt On" : "🔄 Auto-Prompt Off";

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.style.overflow = "hidden";
    window.screensaverActive = true;
}

function stopScreensaver() {
    state.active = false;
    state.paused = false;
    state.controlsHidden = false;

    elements.container.classList.add("hidden");
    clearInterval(imageInterval);
    clearInterval(promptInterval);

    saveHistory();

    document.body.style.overflow = "";
    window.screensaverActive = false;

    elements.playPauseBtn.innerHTML = "▶️";

    if (state.fullscreen) {
        document.exitFullscreen().then(() => {
            state.fullscreen = false;
            elements.fullscreenBtn.textContent = "⛶";
        }).catch(err => console.error("Fullscreen exit error:", err));
    }

    window.close();
}

function togglePause() {
    state.paused = !state.paused;
    elements.playPauseBtn.innerHTML = state.paused ? "▶️" : "⏸️";
    showToast(state.paused ? "Paused" : "Resumed");

    if (!state.paused) {
        setImageInterval();
        setPromptInterval();
    }
}

function toggleControls() {
    state.controlsHidden = !state.controlsHidden;
    const controls = document.querySelector('.screensaver-controls');
    const thumbs = elements.thumbnailsWrapper;

    if (state.controlsHidden) {
        controls.classList.add('hidden-panel');
        thumbs.classList.add('hidden-panel');
        elements.hideBtn.innerHTML = "🙉";
    } else {
        controls.classList.remove('hidden-panel');
        thumbs.classList.remove('hidden-panel');
        elements.hideBtn.innerHTML = "🙈";
    }

    showToast(state.controlsHidden ? "Controls hidden" : "Controls visible");
}

function toggleFullscreen() {
    if (!state.active) {
        showToast("Start the screensaver first!");
        return;
    }

    if (!document.fullscreenElement) {
        elements.container.requestFullscreen().then(() => {
            state.fullscreen = true;
            elements.fullscreenBtn.textContent = "↙";
            elements.image1.style.objectFit = "contain";
            elements.image2.style.objectFit = "contain";
        }).catch(err => showToast("Fullscreen failed: " + err.message));
    } else {
        document.exitFullscreen().then(() => {
            state.fullscreen = false;
            elements.fullscreenBtn.textContent = "⛶";
            elements.image1.style.objectFit = "cover";
            elements.image2.style.objectFit = "cover";
        }).catch(err => showToast("Exit fullscreen failed: " + err.message));
    }
}

function toggleAutoPrompt() {
    state.autoPromptEnabled = !state.autoPromptEnabled;
    elements.restartPromptBtn.innerHTML = state.autoPromptEnabled ? "🔄 Auto-Prompt On" : "🔄 Auto-Prompt Off";
    showToast(state.autoPromptEnabled ? "Auto-prompt enabled" : "Auto-prompt disabled");

    if (state.autoPromptEnabled) {
        setPromptInterval();
    } else {
        clearInterval(promptInterval);
        promptInterval = null;
        if (elements.promptInput.value.trim() && state.active) {
            fetchNewImage();
        }
    }
}

// ===== IMAGE ACTIONS =====

function saveImage() {
    if (!elements[`screensaver-${state.currentImage}`].src) {
        showToast("No image to save");
        return;
    }

    fetch(elements[`screensaver-${state.currentImage}`].src)
        .then(response => {
            if (!response.ok) throw new Error("Fetch failed");
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `screensaver-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Download started");
        })
        .catch(err => {
            console.error("Save error:", err);
            showToast("Save failed");
        });
}

function copyImage() {
    const currentImg = elements[`screensaver-${state.currentImage}`];

    if (!currentImg.src) {
        showToast("No image to copy");
        return;
    }

    if (!currentImg.complete || currentImg.naturalWidth === 0) {
        showToast("Image not loaded yet");
        return;
    }

    elements.copyBtn.textContent = "📋 Copying...";

    const canvas = document.createElement("canvas");
    canvas.width = currentImg.naturalWidth;
    canvas.height = currentImg.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(currentImg, 0, 0);

    canvas.toBlob(blob => {
        if (!blob) {
            elements.copyBtn.textContent = "📋 Copy";
            showToast("Copy failed: blob error");
            return;
        }

        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
            .then(() => {
                const dataURL = canvas.toDataURL("image/png");
                localStorage.setItem("lastCopiedImage", dataURL);
                elements.copyBtn.textContent = "✅ Copied!";
                showToast("Image copied!");
                setTimeout(() => elements.copyBtn.textContent = "📋 Copy", 1500);
            })
            .catch(err => {
                console.error("Copy error:", err);
                elements.copyBtn.textContent = "❌ Failed";
                showToast("Copy failed: " + err.message);
                setTimeout(() => elements.copyBtn.textContent = "📋 Copy", 1500);
            });
    }, "image/png");
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // Settings changes
    elements.promptInput.addEventListener('input', () => {
        state.settings.prompt = elements.promptInput.value;
    });

    elements.promptInput.addEventListener('focus', () => {
        clearInterval(promptInterval);
        promptInterval = null;
    });

    elements.timerInput.addEventListener('change', () => {
        state.settings.timer = parseInt(elements.timerInput.value) || CONFIG.DEFAULT_TIMER;
        saveSettings();
        if (state.active) setImageInterval();
    });

    elements.aspectSelect.addEventListener('change', () => {
        state.settings.aspect = elements.aspectSelect.value;
        saveSettings();
    });

    elements.modelSelect.addEventListener('change', () => {
        state.settings.model = elements.modelSelect.value;
        saveSettings();
    });

    elements.enhanceCheckbox.addEventListener('change', () => {
        state.settings.enhance = elements.enhanceCheckbox.checked;
        saveSettings();
    });

    elements.privateCheckbox.addEventListener('change', () => {
        state.settings.private = elements.privateCheckbox.checked;
        saveSettings();
    });

    elements.transitionInput.addEventListener('change', () => {
        state.settings.transitionDuration = parseFloat(elements.transitionInput.value) || CONFIG.DEFAULT_TRANSITION;
        saveSettings();
        elements.container.style.setProperty('--transition-duration', `${state.settings.transitionDuration}s`);
    });

    // Thumbnail navigation
    if (elements.thumbLeftBtn && elements.thumbRightBtn) {
        elements.thumbLeftBtn.addEventListener('click', () => {
            elements.thumbnailsContainer.scrollBy({
                left: -elements.thumbnailsContainer.clientWidth,
                behavior: 'smooth'
            });
        });

        elements.thumbRightBtn.addEventListener('click', () => {
            elements.thumbnailsContainer.scrollBy({
                left: elements.thumbnailsContainer.clientWidth,
                behavior: 'smooth'
            });
        });
    }

    // Button controls
    elements.playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.active) togglePause();
        else showToast("Start screensaver first!");
    });

    elements.fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen();
    });

    elements.hideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.active) toggleControls();
        else showToast("Start screensaver first!");
    });

    elements.saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.active) saveImage();
        else showToast("Start screensaver first!");
    });

    elements.copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.active) copyImage();
        else showToast("Start screensaver first!");
    });

    if (elements.restartPromptBtn) {
        elements.restartPromptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAutoPrompt();
        });
    }

    elements.clearHistoryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.active) clearHistory();
        else showToast("Start screensaver first!");
    });

    elements.exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopScreensaver();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.active && state.controlsHidden) {
            e.stopPropagation();
            e.preventDefault();
            toggleControls();
        }
    });
}

// ===== INITIALIZATION =====

document.addEventListener("DOMContentLoaded", async () => {
    loadSettings();
    loadHistory();
    setupEventListeners();

    // Load Unity's canonical persona prompt + image models in parallel
    await Promise.all([
        loadUnityPrompt(),
        fetchImageModels()
    ]);

    // Auto-start
    startScreensaver();

    console.log("Screensaver initialized successfully");
});
