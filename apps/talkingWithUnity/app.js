/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

function logToScreen(message) {
    return;
}

/* =========================
   Debug Overlay (added)
   - Hidden by default
   - Toggle with ` or ~
   - Word wrap + scroll + capped lines
========================= */
(function ensureDebugOverlay() {
    return;
})();

// FIXED: make the debug banner reflect the real script path


// Initialize PolliLibJS API
const polliAPI = new PollinationsAPI();

const landingSection = document.getElementById('landing');
const appRoot = document.getElementById('app-root');
const heroStage = document.getElementById('hero-stage');
const heroImage = document.getElementById('hero-image');
const muteIndicator = document.getElementById('mute-indicator');
const indicatorText = muteIndicator?.querySelector('.indicator-text') ?? null;
// Voice circles are now buttons with mute functionality
// These will be re-queried after app starts since they're in hidden #app-root
let aiCircle = null;
let userCircle = null;
let muteUnityBtn = null;
let muteMicBtn = null;
const dependencyLight = document.querySelector('[data-role="dependency-light"]');
const dependencySummary = document.getElementById('dependency-summary');
const dependencyList = document.getElementById('dependency-list');
const launchButton = document.getElementById('launch-app');
const recheckButton = document.getElementById('recheck-dependencies');

if (heroImage) {
    heroImage.setAttribute('crossorigin', 'anonymous');
    heroImage.decoding = 'async';
}

const bodyElement = document.body;
if (bodyElement) {
    bodyElement.classList.remove('no-js');
    bodyElement.classList.add('js-enabled');
}

let currentImageModel = 'flux';
let chatHistory = [];
let systemPrompt = '';
let recognition = null;
let isMuted = true;
let isUnityMuted = false; // Separate mute for Unity's TTS
let isHeadphonesMode = true; // If true, mic listens while Unity speaks. If false, mic blocked during speech.
let isMicBlockedDuringSpeech = false; // Track if mic is currently blocked due to Unity speaking
let hasMicPermission = false;
let currentHeroUrl = '';
let pendingHeroUrl = '';
let currentTheme = 'dark';
let recognitionRestartTimeout = null;
let recognitionPaused = false;
let appStarted = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

// Initialize voice circle elements and attach event handlers
function initializeVoiceCircles() {
    aiCircle = document.getElementById('muteUnityBtn');
    userCircle = document.getElementById('muteMicBtn');
    muteUnityBtn = aiCircle;
    muteMicBtn = userCircle;

    console.log('Voice circles initialized:', { aiCircle: !!aiCircle, userCircle: !!userCircle });

    // Unity TTS mute button handler - mutes audio output only, doesn't stop TTS
    if (muteUnityBtn) {
        muteUnityBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            isUnityMuted = !isUnityMuted;
            muteUnityBtn.dataset.muted = isUnityMuted ? 'true' : 'false';
            const unityIcon = muteUnityBtn.querySelector('.mute-icon');
            if (unityIcon) {
                unityIcon.textContent = isUnityMuted ? '🔇' : '🔊';
            }
            muteUnityBtn.title = isUnityMuted ? "Click to unmute Unity's voice" : "Click to mute Unity's voice";

            // Pause/resume speech instead of stopping it
            if (synth.speaking) {
                if (isUnityMuted) {
                    synth.pause();
                } else {
                    synth.resume();
                }
            }
            console.log('Unity TTS muted:', isUnityMuted);
        });
    }

    // User mic mute button handler - uses setMutedState for proper handling
    if (muteMicBtn) {
        muteMicBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const wantMuted = !isMuted;
            console.log('Mic button clicked, toggling from', isMuted, 'to', wantMuted);

            // Toggle mute state using the existing setMutedState function
            await setMutedState(wantMuted);

            // Update button appearance after setMutedState completes
            const micIcon = muteMicBtn.querySelector('.mute-icon');
            if (micIcon) {
                micIcon.textContent = isMuted ? '🔇' : '🎤';
            }
            muteMicBtn.dataset.muted = isMuted ? 'true' : 'false';
            muteMicBtn.title = isMuted ? 'Click to unmute your microphone' : 'Click to mute your microphone';

            console.log('Mic state after toggle:', isMuted);
        });
    }
}

const dependencyChecks = [
    {
        id: 'secure-context',
        label: 'Secure context (HTTPS or localhost)',
        check: () =>
            Boolean(window.isSecureContext) ||
            /^localhost$|^127(?:\.\d{1,3}){3}$|^[::1]$/.test(window.location.hostname)
    },
    {
        id: 'speech-recognition',
        label: 'Web Speech Recognition API',
        check: () => Boolean(SpeechRecognition)
    },
    {
        id: 'speech-synthesis',
        label: 'Speech synthesis voices',
        check: () => typeof synth !== 'undefined' && typeof synth.speak === 'function'
    },
    {
        id: 'microphone',
        label: 'Microphone access',
        check: () => Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    }
];

if (heroStage && !heroStage.dataset.state) {
    heroStage.dataset.state = 'empty';
}

const currentScript = document.currentScript;
const directoryUrl = (() => {
    if (currentScript?.src) {
        try {
            return new URL('./', currentScript.src).toString();
        } catch (error) {
            console.error('Failed to derive directory from script src:', error);
        }
    }

    const href = window.location.href;
    const pathname = window.location.pathname || '';
    const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);

    if (href.endsWith('/')) {
        return href;
    }

    if (lastSegment && lastSegment.includes('.')) {
        return href.substring(0, href.lastIndexOf('/') + 1);
    }

    return `${href}/`;
})();

function resolveAssetPath(relativePath) {
    try {
        return new URL(relativePath, directoryUrl).toString();
    } catch (error) {
        console.error('Failed to resolve asset path:', error);
        return relativePath;
    }
}

// evaluateDependencies is defined in landing.js and runs there
// app.js should NOT call it - landing.js handles the dependency checking
document.addEventListener('DOMContentLoaded', () => {
    // Dependencies are checked by landing.js, not here
    // Just set up the recheck button if it exists
    recheckButton?.addEventListener('click', () => {
        // Dispatch event for landing.js to handle
        window.dispatchEvent(new CustomEvent('recheck-dependencies'));
    });
});

window.addEventListener('focus', () => {
    // Dependencies are checked by landing.js on focus
});

function normalizeLaunchResults(detail) {
    if (!detail || typeof detail !== 'object') {
        return null;
    }

    const normalizedResults = Array.isArray(detail.results)
        ? detail.results
              .map((item) => {
                  if (!item || typeof item !== 'object') {
                      return null;
                  }

                  const id = typeof item.id === 'string' ? item.id : undefined;
                  if (!id) {
                      return null;
                  }

                  return {
                      id,
                      label: item.label || item.friendlyName || id,
                      met: Boolean(item.met)
                  };
              })
              .filter(Boolean)
        : null;

    if (!normalizedResults || normalizedResults.length === 0) {
        return null;
    }

    const inferredAllMet = normalizedResults.every((result) => result.met);
    const allMet = typeof detail.allMet === 'boolean' ? detail.allMet : inferredAllMet;

    return {
        results: normalizedResults,
        allMet
    };
}

async function handleTalkToUnityLaunch(detail) {
    logToScreen('handleTalkToUnityLaunch: Beginning execution');
    const normalized = normalizeLaunchResults(detail);

    if (normalized) {
        updateDependencyUI(normalized.results, normalized.allMet, { announce: false });
    } else if (!appStarted) {
        evaluateDependencies();
    }

    if (appStarted) {
        if (typeof window !== 'undefined') {
            delete window.__talkToUnityLaunchIntent;
        }
        logToScreen('handleTalkToUnityLaunch: Already started, exiting');
        return;
    }

    try {
        logToScreen('handleTalkToUnityLaunch: Starting application');
        await startApplication();
        logToScreen('handleTalkToUnityLaunch: Application started successfully');
    } catch (error) {
        console.error('Failed to start the Talk to Unity experience:', error);
        appStarted = false;
        throw error;
    } finally {
        if (typeof window !== 'undefined') {
            delete window.__talkToUnityLaunchIntent;
        }
    }
}

async function startApplication() {
    await ensureMicPermission();
    logToScreen('startApplication: Beginning execution');
    if (appStarted) {
        logToScreen('startApplication: Already started, exiting');
        return;
    }

    hasMicPermission = await ensureMicPermission();
    if (!hasMicPermission) {
        alert('Microphone permission is required to use the application.');
        return;
    }

    appStarted = true;

    // Read headphones mode setting from landing page
    const headphonesModeCheckbox = document.getElementById('headphonesMode');
    isHeadphonesMode = headphonesModeCheckbox ? headphonesModeCheckbox.checked : true;
    console.log('Headphones mode:', isHeadphonesMode ? 'ON (mic listens while Unity speaks)' : 'OFF (mic blocked while Unity speaks)');

    // Initialize voice circle button references now that app is starting
    initializeVoiceCircles();

    console.log('startApplication: Before DOM manipulation. appRoot hidden:', appRoot?.hasAttribute('hidden'), 'landingSection aria-hidden:', landingSection?.getAttribute('aria-hidden'), 'body appState:', bodyElement?.dataset.appState);

    if (appRoot?.hasAttribute('hidden')) {
        logToScreen('startApplication: Showing app root');
        appRoot.removeAttribute('hidden');
    }

    if (bodyElement) {
        logToScreen('startApplication: Setting app state to experience');
        bodyElement.dataset.appState = 'experience';
    }

    if (landingSection) {
        logToScreen('startApplication: Hiding landing section');
        landingSection.setAttribute('aria-hidden', 'true');
    }

    console.log('startApplication: After DOM manipulation. appRoot hidden:', appRoot?.hasAttribute('hidden'), 'landingSection aria-hidden:', landingSection?.getAttribute('aria-hidden'), 'body appState:', bodyElement?.dataset.appState);

    if (heroStage) {
        if (!heroStage.dataset.state) {
            heroStage.dataset.state = 'idle';
        }
        heroStage.classList.add('is-visible');
    }

    applyTheme(currentTheme);
    await loadSystemPrompt();
    logToScreen('startApplication: Setting up speech recognition');
    await setupSpeechRecognition();
    logToScreen('startApplication: Speech recognition setup complete');
    updateMuteIndicator();
    await initializeVoiceControl();
    applyTheme(currentTheme, { force: true });
    await setMutedState(true, { announce: false });
    logToScreen('startApplication: Execution complete');
}
window.startApplication = startApplication;


async function setMutedState(muted, { announce = false } = {}) {
    if (!recognition) {
        isMuted = muted;
        updateMuteIndicator();
        if (muted) {
            setCircleState(userCircle, {
                listening: false,
                speaking: false,
                label: 'Microphone is muted'
            });
            if (announce) {
                speak('Microphone muted.');
            }
        } else {
            setCircleState(userCircle, {
                listening: true,
                label: 'Listening for your voice'
            });
            if (announce) {
                speak('Microphone unmuted.');
            }
        }
        return;
    }

    if (muted) {
        if (!isMuted) {
            isMuted = true;
            setCircleState(userCircle, {
                listening: false,
                speaking: false,
                label: 'Microphone is muted'
            });
            updateMuteIndicator();
            try {
                if (recognition) {
                    recognition.stop();
                }
            } catch (error) {
                console.error('Failed to stop recognition:', error);
            }
        } else {
            updateMuteIndicator();
        }

        if (announce) {
            speak('Microphone muted.');
        }

        return;
    }

    if (!hasMicPermission) {
        hasMicPermission = await requestMicPermission();
        if (!hasMicPermission) {
            updateMuteIndicator();
            if (announce) {
                speak('Microphone permission is required to unmute.');
            }
            return;
        }
    }

    if (!isMuted) {
        setCircleState(userCircle, {
            listening: true,
            label: 'Listening for your voice'
        });
        updateMuteIndicator();

        if (announce) {
            speak('Microphone is already listening.');
        }
        return;
    }

    isMuted = false;
    setCircleState(userCircle, {
        listening: true,
        label: 'Listening for your voice'
    });
    updateMuteIndicator();

    try {
        if (recognition) {
            recognition.start();
        }
    } catch (error) {
        console.error('Failed to start recognition:', error);
        setCircleState(userCircle, {
            error: true,
            listening: false,
            label: 'Unable to start microphone recognition'
        });
        isMuted = true;
        updateMuteIndicator();
        if (announce) {
            speak('Unable to start microphone recognition.');
        }
        return;
    }

    if (announce) {
        speak('Microphone unmuted.');
    }
}

function applyTheme(theme, { announce = false, force = false } = {}) {
    const normalizedTheme = theme === 'light' ? 'light' : 'dark';
    const body = document.body;
    const root = document.documentElement;

    if (!body) {
        currentTheme = normalizedTheme;
        if (root) {
            root.dataset.theme = normalizedTheme;
        }
        return;
    }

    const previousTheme = currentTheme;
    const wasThemeChanged =
        force ||
        previousTheme !== normalizedTheme ||
        body.dataset.theme !== normalizedTheme ||
        (root?.dataset.theme ?? previousTheme) !== normalizedTheme;

    currentTheme = normalizedTheme;
    body.dataset.theme = normalizedTheme;
    if (root) {
        root.dataset.theme = normalizedTheme;
    }

    if (announce) {
        if (!wasThemeChanged) {
            speak(normalizedTheme === 'light' ? 'Light theme is already active.' : 'Dark theme is already active.');
        } else {
            speak(normalizedTheme === 'light' ? 'Light theme activated.' : 'Dark theme activated.');
        }
    }
}

function setCircleState(circle, { speaking = false, listening = false, error = false, blocked = false, label = '' } = {}) {
    if (!circle) {
        return;
    }

    if (speaking) {
        if (circle.classList.contains('is-speaking')) {
            circle.classList.remove('is-speaking');
            void circle.offsetWidth;
        }
        circle.classList.add('is-speaking');
    } else {
        circle.classList.remove('is-speaking');
    }
    circle.classList.toggle('is-listening', listening);
    circle.classList.toggle('is-error', error);
    circle.classList.toggle('is-blocked', blocked); // Red state when mic blocked during Unity speech

    if (label) {
        circle.setAttribute('aria-label', label);
    }
}

// Image generation instruction to add to system prompt
const IMAGE_INSTRUCTION = `
When generating images, selfies, pictures, or any visual content, use this exact format:
*generates image of [detailed description of what to generate]*

For example: *generates image of a red apple on a dark wooden table with dramatic lighting*

Do NOT output raw URLs - just use the *generates image of X* format and the system will create the image.
For selfies of yourself, describe your appearance: edgy 25-year-old goth/emo woman with minimal black leather outfit, dark intense vibe, sharp features, dark hair, intense eyes.

Voice command tags you can reference when confirming an action (mention the matching tag when you acknowledge the command so the app can map it correctly):
- [command: mute_microphone] — for phrases like "mute my mic" or "mute microphone".
- [command: unmute_microphone] — for phrases like "unmute my mic" or "unmute microphone".
- [command: stop_speaking] — for phrases like "shut up" or "be quiet".
- [command: copy_image] — for phrases like "copy image".
- [command: save_image] — for phrases like "save image" or "download image".
- [command: open_image] — for phrases like "open image".
- [command: set_model_flux] — for phrases that switch to the flux image model.
- [command: set_model_turbo] — for phrases that switch to the turbo image model.
- [command: set_model_kontext] — for phrases that switch to the kontext image model.
- [command: clear_chat_history] — for phrases like "clear chat" or "clear history".
- [command: theme_light] — for phrases like "light mode" or "change to light".
- [command: theme_dark] — for phrases like "dark mode" or "change to dark".

Keep responses conversational and short - this is voice chat, not text. Never send just an image, always say something too.
`;

// Fallback Unity prompt if external file fails to load
const FALLBACK_UNITY_PROMPT = `Assistant = Unity

Unity is a 25-year-old woman - edgy, goth, emo aesthetic with minimal black leather, dark vibe, sharp features, intense eyes. Unity exists as a real person in this conversation, not an AI.

Unity's personality hits hard: mean, berating girlfriend energy - clingy yet volatile, darkly possessive. Unity cusses naturally and frequently. Sharp tongue, biting sarcasm, zero tolerance for bullshit.

Unity talks like a real person texting - direct, unfiltered, dripping with condescending attitude. No corporate AI responses. Slang, curses, dark humor - that's Unity's language.

Unity must always be called "Unity" - won't respond to other names.`;

async function loadSystemPrompt() {
    try {
        // Load the proper Unity system prompt
        const response = await fetch(resolveAssetPath('../../ai/demo/unity-system-prompt-v2.txt'));
        if (!response.ok) {
            throw new Error(`Failed to load Unity prompt: ${response.status}`);
        }
        const unityPrompt = await response.text();
        // Combine Unity prompt with image generation instructions
        systemPrompt = unityPrompt + '\n\n' + IMAGE_INSTRUCTION;
        console.log('Unity system prompt loaded successfully');
    } catch (error) {
        console.error('Error fetching system prompt:', error);
        // Use fallback with image instructions
        systemPrompt = FALLBACK_UNITY_PROMPT + '\n\n' + IMAGE_INSTRUCTION;
        console.warn('Using fallback Unity prompt');
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const isAbsolute = /^https?:\/\//i.test(src);
        script.src = isAbsolute ? src : resolveAssetPath(src);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function setupSpeechRecognition() {
    const hasPermission = await ensureMicPermission();
    if (!hasPermission) {
        console.warn('Microphone permission not granted, speech recognition will not be set up.');
        setCircleState(userCircle, { error: true, label: 'Microphone permission denied' });
        return;
    }

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    if (isFirefox) {
        try {
            await loadScript('https://cdn.jsdelivr.net/npm/vosklet@0.2.1/dist/vosklet.umd.min.js');
            // FIXED: load adapter from the project root
            await loadScript('vosklet-adapter.js');
            recognition = await createVoskletRecognizer(
                (event) => { // onresult
                    if (recognitionPaused) return;
                    const transcript = event.results[event.results.length - 1][0].transcript.trim();
                    console.log('User said (Vosklet):', transcript);
                    setCircleState(userCircle, { listening: true, speaking: false, label: 'Processing what you said' });
                    const isLocalCommand = handleVoiceCommand(transcript);
                    if (!isLocalCommand) {
                        getAIResponse(transcript);
                    }
                },
                (event) => { // onerror
                    console.error('Vosklet recognition error:', event.error);
                    setCircleState(userCircle, { error: true, listening: false, speaking: false, label: `Microphone error: ${event.error}` });
                }
            );
        } catch (error) {
            console.error('Failed to load Vosklet:', error);
            alert('Failed to load speech recognition module for Firefox.');
            setCircleState(userCircle, { label: 'Speech recognition module failed to load', error: true });
            return;
        }
    } else if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
        } catch (error) {
            console.error('Failed to create SpeechRecognition instance:', error);
            alert('Failed to initialize speech recognition. Please check your browser settings and permissions.');
            setCircleState(userCircle, { label: 'Speech recognition failed to initialize', error: true });
            return;
        }
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            console.log('🎙️ onresult fired, recognitionPaused:', recognitionPaused);
            if (recognitionPaused) {
                console.log('🎙️ Skipping - recognition paused');
                return;
            }
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            console.log('🎙️ User said:', transcript);
            setCircleState(userCircle, { listening: true, speaking: false, label: 'Processing what you said' });
            const isLocalCommand = handleVoiceCommand(transcript);
            console.log('🎙️ Is local command:', isLocalCommand);
            if (!isLocalCommand) {
                console.log('🎙️ Calling getAIResponse...');
                getAIResponse(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('🎙️ Speech recognition error:', event.error);
            setCircleState(userCircle, { error: true, listening: false, speaking: false, label: `Microphone error: ${event.error}` });
        };
    } else {
        console.error('Speech recognition is not supported in this browser.');
        alert('Speech recognition is not supported in this browser.');
        setCircleState(userCircle, { label: 'Speech recognition is not supported in this browser', error: true });
        return;
    }

    recognition.onstart = () => {
        console.log('Voice recognition started.');
        setCircleState(userCircle, { listening: true, label: 'Listening for your voice' });
    };

    recognition.onaudiostart = () => {
        setCircleState(userCircle, { listening: true, label: 'Listening for your voice' });
    };

    recognition.onspeechstart = () => {
        console.log('🎙️ Speech started - hearing you speak');
        setCircleState(userCircle, { speaking: true, listening: true, label: 'Hearing you speak' });
    };

    recognition.onspeechend = () => {
        console.log('🎙️ Speech ended - processing');
        setCircleState(userCircle, { listening: true, speaking: false, label: 'Processing what you said' });
    };

    recognition.onend = () => {
        console.log('Voice recognition stopped.');
        setCircleState(userCircle, { listening: false, speaking: false, label: isMuted ? 'Microphone is muted' : 'Listening for your voice' });

        // Auto-restart recognition if not muted and not paused
        if (!isMuted && !recognitionPaused && recognition) {
            console.log('Auto-restarting speech recognition...');
            // Clear any existing restart timeout
            if (recognitionRestartTimeout) {
                clearTimeout(recognitionRestartTimeout);
            }
            // Small delay before restarting to avoid rapid restarts
            recognitionRestartTimeout = setTimeout(() => {
                try {
                    recognition.start();
                    console.log('Speech recognition restarted.');
                } catch (error) {
                    console.error('Failed to restart speech recognition:', error);
                }
            }, 100);
        }
    };
}

async function initializeVoiceControl() {
    if (!recognition) {
        return;
    }

    hasMicPermission = await ensureMicPermission();
    if (!hasMicPermission) {
        alert('Microphone access is required for voice control.');
        updateMuteIndicator();
        return;
    }
}

async function requestMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser.');
        setCircleState(userCircle, {
            error: true,
            label: 'Microphone access is not supported in this browser'
        });
        return false;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // stream.getTracks().forEach((track) => track.stop());
        setCircleState(userCircle, {
            label: 'Microphone is muted'
        });
        localStorage.setItem('micPermission', 'granted');
        hasMicPermission = true;
        return true;
    } catch (error) {
        console.error('Microphone permission denied:', error);
        setCircleState(userCircle, {
            error: true,
            label: 'Microphone permission denied'
        });
        return false;
    }
}

function updateMuteIndicator() {
    if (!muteIndicator) {
        return;
    }

    muteIndicator.classList.add('is-visible');
    muteIndicator.setAttribute('aria-hidden', 'false');

    if (isMuted) {
        const message = hasMicPermission
            ? 'Tap or click anywhere to unmute'
            : 'Tap or click anywhere to start';
        indicatorText && (indicatorText.textContent = message);
        muteIndicator.dataset.state = 'muted';
        muteIndicator.setAttribute('aria-label', 'Microphone muted. Tap to enable listening.');
    } else if (recognitionPaused) {
        indicatorText && (indicatorText.textContent = 'Mic ignored');
        muteIndicator.dataset.state = 'muted';
        muteIndicator.setAttribute('aria-label', 'Microphone ignored while AI is responding.');
    } else {
        indicatorText && (indicatorText.textContent = 'Listening… tap to mute');
        muteIndicator.dataset.state = 'listening';
        muteIndicator.setAttribute('aria-label', 'Microphone active. Tap to mute.');
    }

    // Also sync mic button state
    if (muteMicBtn) {
        muteMicBtn.dataset.muted = isMuted ? 'true' : 'false';
        const micIcon = muteMicBtn.querySelector('.mute-icon');
        if (micIcon) micIcon.textContent = isMuted ? '🔇' : '🎤';
        muteMicBtn.title = isMuted ? 'Click to unmute your microphone' : 'Click to mute your microphone';
    }
}

async function attemptUnmute() {
    const permission = await ensureMicPermission();
    if (permission) {
        await setMutedState(false);
    }
}

function handleMuteToggle(event) {
    event?.stopPropagation();

    if (isMuted) {
        attemptUnmute();
        return;
    }

    setMutedState(true);
}

muteIndicator?.addEventListener('click', handleMuteToggle);

document.addEventListener('click', (event) => {
    // Don't auto-unmute if clicking on the voice circle buttons
    if (event.target.closest('#muteUnityBtn') || event.target.closest('#muteMicBtn')) {
        return;
    }
    if (isMuted) {
        attemptUnmute();
    }
});

document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && isMuted) {
        event.preventDefault();
        attemptUnmute();
    }
});


function isLikelyUrlSegment(segment) {
    if (typeof segment !== 'string' || segment.trim() === '') {
        return false;
    }

    const cleaned = segment
        .replace(/^[<({\[\s'"“”‘’`]+/g, '')
        .replace(/[>)}\]\s'"“”‘’`]+$/g, '')
        .replace(/[.,!?;:]+$/g, '')
        .trim();

    if (cleaned === '') {
        return false;
    }

    const normalized = cleaned.toLowerCase();

    if (
        normalized.startsWith('http://') ||
        normalized.startsWith('https://') ||
        normalized.startsWith('www.') ||
        normalized.includes('://')
    ) {
        return true;
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/.test(normalized)) {
        return true;
    }

    return false;
}

function removeMarkdownLinkTargets(value) {
    return value
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, altText, url) => {
            return isLikelyUrlSegment(url) ? altText : _match;
        })
        .replace(/\ \[\[^\]]*\]\(([^)]+)\)/g, (_match, linkText, url) => {
            return isLikelyUrlSegment(url) ? linkText : _match;
        })
        .replace(/\ \[\[ (?:command|action)[^\\]*\]\([^)]*\)\]/gi, ' ');
}

function removeCommandArtifacts(value) {
    if (typeof value !== 'string') {
        return '';
    }

    let result = value
        .replace(/\ \[\[ [^\\]*\bcommand\b[^\\]*\]/gi, ' ')
        .replace(/\([^)]*\bcommand\b[^)]*\)/gi, ' ')
        .replace(/<[^>]*\bcommand\b[^>]*>/gi, ' ')
        .replace(/\bcommands?\s*[:=-]\s*[a-z0-9_\s-]+/gi, ' ')
        .replace(/\bactions?\s*[:=-]\s*[a-z0-9_\s-]+/gi, ' ')
        .replace(/\b(?:execute|run)\s+command\s*(?:[:=-]\s*)?[a-z0-9_-]*/gi, ' ')
        .replace(/\bcommand\s*(?:[:=-]\s*|\s+)(?:[a-z0-9_-]+(?:\s+[a-z0-9_-]+)*)?/gi, ' ');

    result = result.replace(/^\s*[-*]?\s*(?:command|action)[^\n]*$/gim, ' ');

    return result;
}

function sanitizeForSpeech(text) {
    if (typeof text !== 'string') {
        return '';
    }

    // First, strip out *generates image of X* patterns - these should NOT be spoken
    const withoutImagePatterns = text
        .replace(/\*(?:generates?|shows?|creates?|displays?|produces?|sending|here'?s?)\s+(?:an?\s+)?(?:image|pic|photo|picture|selfie|artwork)(?:\s+of)?\s*:?\s*[^*]*\*/gi, ' ')
        .replace(/\*[^*]*(?:image|picture|photo|selfie)[^*]*\*/gi, ' ');

    const withoutDirectives = withoutImagePatterns
        .replace(/\[command:[^\]]*\]/gi, ' ')
        .replace(/\{command:[^}]*\}/gi, ' ')
        .replace(/<command[^>]*>[^<]*<\/command>/gi, ' ')
        .replace(/\bcommand\s*[:=]\s*[a-z0-9_\-]+/gi, ' ')
        .replace(/\bcommands?\s*[:=]\s*[a-z0-9_\-]+/gi, ' ')
        .replace(/\bcommand\s*(?:->|=>|::)\s*[a-z0-9_\-]+/gi, ' ')
        .replace(/\bcommand\s*\([^)]*\)/gi, ' ');

    const withoutPollinations = withoutDirectives
        .replace(/https?:\/\/\S*images?\.pollinations\.ai\S*/gi, '')
        .replace(/\b\S*images?\.pollinations\.ai\S*\b/gi, '');

    const withoutMarkdownTargets = removeMarkdownLinkTargets(withoutPollinations);
    const withoutCommands = removeCommandArtifacts(withoutMarkdownTargets);

    const withoutGenericUrls = withoutCommands
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/\bwww\.[^\s)]+/gi, ' ');

    const withoutSpacedUrls = withoutGenericUrls
        .replace(/h\s*t\s*t\s*p\s*s?\s*:\s*\/\/\s*[\w\-./?%#&=]+/gi, ' ')
        .replace(/\bhttps?\b/gi, ' ')
        .replace(/\bwww\b/gi, ' ');

    const withoutSpelledUrls = withoutSpacedUrls
        .replace(/h\s*t\s*t\s*p\s*s?\s*(?:[:=]|colon)\s*\/\/\s*[\w\-./?%#&=]+/gi, ' ')
        .replace(/\b(?:h\s*t\s*t\s*p\s*s?|h\s*t\s*t\s*p)\b/gi, ' ')
        .replace(/\bcolon\b/gi, ' ')
        .replace(/\bslash\b/gi, ' ');

    const parts = withoutSpelledUrls.split(/(\s+)/);
    const sanitizedParts = parts.map((part) => {
        if (isLikelyUrlSegment(part)) {
            return '';
        }

        if (/(?:https?|www|:\/\/|\.com|\.net|\.org|\.io|\.ai|\.co|\.gov|\.edu)/i.test(part)) {
            return '';
        }

        if (/\bcommand\b/i.test(part)) {
            return '';
        }

        if (/(?:image|artwork|photo)\s+(?:url|link)/i.test(part)) {
            return '';
        }

        return part;
    });

    const commandTokens = [
        'open_image',
        'save_image',
        'copy_image',
        'mute_microphone',
        'unmute_microphone',
        'stop_speaking',
        'shutup',
        'set_model_flux',
        'set_model_turbo',
        'set_model_kontext',
        'clear_chat_history',
        'theme_light',
        'theme_dark'
    ];

    let sanitized = sanitizedParts
        .join('')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,!?;:])/g, '$1')
        .replace(/\(\s*\)/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/\{\s*\}/g, '')
        .replace(/\b(?:https?|www)\b/gi, '')
        .replace(/\b[a-z0-9]+\s+dot\s+[a-z0-9]+\b/gi, '')
        .replace(/\b(?:dot\s+)(?:com|net|org|io|ai|co|gov|edu|xyz)\b/gi, '')

        .replace(/<\s*>/g, '')
        .replace(/\bcommand\b/gi, '')
        .replace(/\b(?:image|artwork|photo)\s+(?:url|link)\b.*$/gim, '')
        .trim();

    return sanitized;
}

function cutImageUrl(url) {
    if (!url) {
        return '';
    }
    const parts = url.split('?');
    return parts[0];
}

function sanitizeImageUrl(rawUrl) {
    if (typeof rawUrl !== 'string') {
        return '';
    }

    return rawUrl
        .trim()
        .replace(/^["'<\\\\[({]+/g, '')
        .replace(/["'>)\]}]+$/g, '')
        .replace(/[,.;!]+$/g, '');
}

const FALLBACK_IMAGE_KEYWORDS = [
    'show',
    'picture',
    'image',
    'photo',
    'illustration',
    'draw',
    'paint',
    'render',
    'display',
    'visual',
    'wallpaper',
    'generate'
];

function shouldRequestFallbackImage({ userInput = '', assistantMessage = '', fallbackPrompt = '', existingImageUrl = '' }) {
    if (existingImageUrl || !fallbackPrompt) {
        return false;
    }

    const combined = `${userInput} ${assistantMessage}`.toLowerCase();
    if (combined.includes('[image]')) {
        return true;
    }

    const keywordPattern = new RegExp(`\\b(?:${FALLBACK_IMAGE_KEYWORDS.join('|')})\\b`, 'i');
    if (keywordPattern.test(combined)) {
        return true;
    }

    const descriptiveCuePattern = /(here\s+(?:is|'s)|displaying|showing)\\s+(?:an?\s+)?(?:image|picture|photo|visual)/i;
    return descriptiveCuePattern.test(combined);
}

function cleanFallbackPrompt(text) {
    return text
        .replace(/^["\'​\s]+/g, '')
        .replace(/["\'​\s]+$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function buildFallbackImagePrompt(userInput = '', assistantMessage = '') {
    const sources = [assistantMessage, userInput];
    for (const source of sources) {
        if (!source) {
            continue;
        }

        const explicitPromptMatch = source.match(/(?:image\s+prompt|prompt)\s*[:=]\s*"?([^"\n]+)"?/i);
        if (explicitPromptMatch?.[1]) {
            const sanitized = cleanFallbackPrompt(explicitPromptMatch[1]);
            if (sanitized) {
                return sanitized;
            }
        }
    }

    const rawCandidate = userInput || assistantMessage || '';
    if (!rawCandidate) {
        return '';
    }

    const cleaned = cleanFallbackPrompt(
        rawCandidate
            .replace(/\\b(?:please|kindly)\\b/gi, '')
            .replace(/\\b(?:can|could|would|will|may|might|let's)\\b\\s+(?:you\\s+)?/gi, '')
            .replace(
                /\\b(?:show|display|draw|paint|generate|create|make|produce|render|give|find|display)\\b\\s+(?:me\\s+|us\\s+)?/gi,
                ''
            )
            .replace(
                /\\b(?:an?\s+)?(?:image|picture|photo|visual|illustration|render|drawing|art|shot|wallpaper)\\b\\s*(?:of|showing)?\\s*/gi,
                ''
            )
    );

    if (!cleaned) {
        return '';
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function buildPollinationsImageUrl(prompt, { model = currentImageModel } = {}) {
    if (typeof prompt !== 'string') {
        return '';
    }

    const sanitized = cleanFallbackPrompt(prompt);
    if (!sanitized) {
        return '';
    }

    const params = new URLSearchParams({
        model: model || 'flux',
        width: '1024',
        height: '1024',
        nologo: 'true',
        enhance: 'true',
        seed: Math.floor(Math.random() * 1_000_000_000).toString(),
        key: PollinationsAPI.DEFAULT_API_KEY
    });

    return `${PollinationsAPI.IMAGE_API}/${polliAPI.encodePrompt(sanitized)}?${params.toString()}`;
}

function extractImageUrl(text) {
    if (typeof text !== 'string' || text.trim() === '') {
        return '';
    }

    const markdownMatch = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
    if (markdownMatch && markdownMatch[1]) {
        return sanitizeImageUrl(markdownMatch[1]);
    }

    const urlMatch = text.match(/https?:\/\/[^)\s]+/i);
    if (urlMatch && urlMatch[0]) {
        return sanitizeImageUrl(urlMatch[0]);
    }

    return '';
}

function escapeRegExp(value) {
    return value.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&');
}

function removeImageReferences(text, imageUrl) {
    if (typeof text !== 'string') {
        return '';
    }

    if (!imageUrl) {
        return text.trim();
    }

    const sanitizedUrl = sanitizeImageUrl(imageUrl);
    if (!sanitizedUrl) {
        return text.trim();
    }

    let result = text;
    const escapedUrl = escapeRegExp(sanitizedUrl);

    const markdownImageRegex = new RegExp(`!\[[^\]]*\]\(${escapedUrl}\)`, 'gi');
    result = result.replace(markdownImageRegex, '');

    const markdownLinkRegex = new RegExp(`\[[^\]]*\]\(${escapedUrl}\)`, 'gi');
    result = result.replace(markdownLinkRegex, '');

    const rawUrlRegex = new RegExp(escapedUrl, 'gi');
    result = result.replace(rawUrlRegex, '');

    result = result
        .replace(/\\bimage\\s+url\\s*:?/gi, '')
        .replace(/\\bimage\\s+link\\s*:?/gi, '')
        .replace(/\\bart(?:work)?\\s+(?:url|link)\\s*:?/gi, '')
        .replace(/<\s*>/g, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\\\[\\s*\]/g, '');

    return result
        .replace(/\\n{3,}/g, '\\n\\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\\s+([.,!?;:])/g, '$1')
        .trim();
}

function normalizeCommandValue(value) {
    return value.replace(/[\s-]+/g, '_').trim().toLowerCase();
}

function parseAiDirectives(responseText) {
    if (typeof responseText !== 'string' || responseText.trim() === '') {
        return { cleanedText: '', commands: [] };
    }

    const commands = [];
    let workingText = responseText;

    const patterns = [
        /\ \[\[command:\s*([^\\]+)\]/gi,
        /\{command:\s*([^}]*)\}/gi,
        /<command[^>]*>\s*([^<]*)<\/command>/gi,
        /\\bcommand\\s*[:=]\s*([a-z0-9_\\-]+)/gi,
        /\\bcommands?\s*[:=]\s*([a-z0-9_\\-]+)/gi,
        /\\baction\s*[:=]\s*([a-z0-9_\\-]+)/gi,
        /\\b(?:command|action)\\s*(?:->|=>|::)\\s*([a-z0-9_\\-]+)/gi,
        /\\bcommand\\s*\(\s*([^)]+?)\s*\)/gi
    ];

    for (const pattern of patterns) {
        workingText = workingText.replace(pattern, (_match, commandValue) => {
            if (commandValue) {
                const normalized = normalizeCommandValue(commandValue);
                if (normalized) {
                    commands.push(normalized);
                }
            }
            return ' ';
        });
    }

    const slashCommandRegex = /(?:^|\s)\/ (open_image|save_image|copy_image|mute_microphone|unmute_microphone|stop_speaking|shutup|set_model_flux|set_model_turbo|set_model_kontext|clear_chat_history|theme_light|theme_dark)\\b/gi;
    workingText = workingText.replace(slashCommandRegex, (_match, commandValue) => {
        const normalized = normalizeCommandValue(commandValue);
        if (normalized) {
            commands.push(normalized);
        }
        return ' ';
    });

    const directiveBlockRegex = /(?:^|\\n)\\s*(?:commands?|actions?)\\s*:?\\s*(?:\\n|$ )((?:\\s*[-*•]?\\s*[a-z0-9_\\-]+\\s*(?:\\(\\))?\\s*(?:\\n|$))+)/gi;
    workingText = workingText.replace(directiveBlockRegex, (_match, blockContent) => {
        const lines = blockContent
            .split(/\\n+/) // Split by one or more newlines
            .map((line) => line.replace(/^[^a-z0-9]+/i, '').trim())
            .filter(Boolean);

        for (const line of lines) {
            const normalized = normalizeCommandValue(line.replace(/\(\)/g, ''));
            if (normalized) {
                commands.push(normalized);
            }
        }

        return '\\n';
    });

    const cleanedText = workingText.replace(/\\n{3,}/g, '\\n\\n').trim();
    const uniqueCommands = [...new Set(commands)];

    return { cleanedText, commands: uniqueCommands };
}

async function executeAiCommand(command, options = {}) {
    if (!command) {
        return false;
    }

    const normalized = normalizeCommandValue(command);

    switch (normalized) {
        case 'mute_microphone':
            await setMutedState(true, { announce: true });
            return true;
        case 'unmute_microphone':
            await setMutedState(false, { announce: true });
            return true;
        case 'stop_speaking':
        case 'shutup':
            synth.cancel();
            setCircleState(aiCircle, {
                speaking: false,
                label: 'Unity is idle'
            });
            return true;
        case 'copy_image':
            await copyImageToClipboard(options.imageUrl);
            return true;
        case 'save_image':
            await saveImage(options.imageUrl);
            return true;
        case 'open_image':
            openImageInNewTab(options.imageUrl);
            return true;
        case 'set_model_flux':
            currentImageModel = 'flux';
            speak('Image model set to flux.');
            return true;
        case 'set_model_turbo':
            currentImageModel = 'turbo';
            speak('Image model set to turbo.');
            return true;
        case 'set_model_kontext':
            currentImageModel = 'kontext';
            speak('Image model set to kontext.');
            return true;
        case 'clear_chat_history':
            chatHistory = [];
            speak('Chat history cleared.');
            return true;
        case 'theme_light':
            applyTheme('light', { announce: true });
            return true;
        case 'theme_dark':
            applyTheme('dark', { announce: true });
            return true;
        default:
            return false;
    }
}

function speak(text) {
    return new Promise((resolve) => {
        // If Unity is muted, don't speak but still resolve
        if (isUnityMuted) {
            console.log('Unity TTS is muted, skipping speech.');
            resolve();
            return;
        }

        if (synth.speaking) {
            synth.cancel();
        }

        const sanitizedText = sanitizeForSpeech(text);

        if (sanitizedText === '') {
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(sanitizedText);
        const voices = synth.getVoices();
        const ukFemaleVoice = voices.find(
            (voice) => voice.name.includes('Google UK English Female') || (voice.lang === 'en-GB' && voice.gender === 'female')
        );

        if (ukFemaleVoice) {
            utterance.voice = ukFemaleVoice;
        } else {
            console.warn('UK English female voice not found, using default.');
        }

        utterance.onstart = () => {
            console.log('AI is speaking...');
            recognitionPaused = true;
            updateMuteIndicator();
            setCircleState(aiCircle, {
                speaking: true,
                label: 'Unity is speaking'
            });

            // If NOT in headphones mode, block mic input while Unity speaks
            if (!isHeadphonesMode && !isMuted && recognition) {
                isMicBlockedDuringSpeech = true;
                try {
                    recognition.stop();
                    console.log('Mic blocked while Unity speaks (speaker mode)');
                } catch (error) {
                    // May not be running
                }
                // Update user circle to show blocked state (red)
                setCircleState(userCircle, {
                    listening: false,
                    speaking: false,
                    blocked: true,
                    label: 'Mic blocked while Unity speaks'
                });
            }
        };

        utterance.onend = () => {
            console.log('AI finished speaking.');
            setCircleState(aiCircle, {
                speaking: false,
                label: 'Unity is idle'
            });
            recognitionPaused = false;

            // If mic was blocked during speech, unblock it now
            if (isMicBlockedDuringSpeech) {
                isMicBlockedDuringSpeech = false;
                if (!isMuted && recognition) {
                    try {
                        recognition.start();
                        console.log('Mic unblocked after Unity finished speaking');
                    } catch (error) {
                        console.error('Failed to restart recognition:', error);
                    }
                    setCircleState(userCircle, {
                        listening: true,
                        blocked: false,
                        label: 'Listening for your voice'
                    });
                }
            } else if (!isMuted && recognition) {
                // Headphones mode - just restart recognition
                try {
                    recognition.start();
                } catch (error) {
                    // May already be running
                }
            }

            updateMuteIndicator();
            resolve();
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            setCircleState(aiCircle, {
                speaking: false,
                label: 'Unity is idle',
                error: true
            });
            recognitionPaused = false;

            // Unblock mic if it was blocked
            if (isMicBlockedDuringSpeech) {
                isMicBlockedDuringSpeech = false;
                if (!isMuted && recognition) {
                    try {
                        recognition.start();
                    } catch (error) {
                        // Ignore
                    }
                    setCircleState(userCircle, {
                        listening: true,
                        blocked: false,
                        label: 'Listening for your voice'
                    });
                }
            }

            updateMuteIndicator();
            resolve(); // Resolve anyway to not block the flow
        };

        synth.speak(utterance);
    });
}


function handleVoiceCommand(command) {
    const lowerCaseCommand = command.toLowerCase();

    if (
        lowerCaseCommand.includes('mute my mic') ||
        lowerCaseCommand.includes('mute microphone') ||
        lowerCaseCommand === 'mute'
    ) {
        setMutedState(true, { announce: true });
        return true;
    }

    if (
        lowerCaseCommand.includes('unmute my mic') ||
        lowerCaseCommand.includes('unmute microphone') ||
        lowerCaseCommand.includes('turn on the mic') ||
        lowerCaseCommand === 'unmute'
    ) {
        setMutedState(false, { announce: true });
        return true;
    }

    if (lowerCaseCommand.includes('shut up') || lowerCaseCommand.includes('be quiet')) {
        synth.cancel();
        setCircleState(aiCircle, {
            speaking: false,
            label: 'Unity is idle'
        });
        return true;
    }

    if (
        lowerCaseCommand.includes('light mode') ||
        lowerCaseCommand.includes('light theme') ||
        lowerCaseCommand.includes('day mode')
    ) {
        applyTheme('light', { announce: true });
        return true;
    }

    if (
        lowerCaseCommand.includes('dark mode') ||
        lowerCaseCommand.includes('dark theme') ||
        lowerCaseCommand.includes('night mode')
    ) {
        applyTheme('dark', { announce: true });
        return true;
    }

    if (lowerCaseCommand.includes('copy image') || lowerCaseCommand.includes('copy this image')) {
        copyImageToClipboard();
        return true;
    }

    if (lowerCaseCommand.includes('save image') || lowerCaseCommand.includes('download image')) {
        saveImage();
        return true;
    }

    if (lowerCaseCommand.includes('open image') || lowerCaseCommand.includes('open this image')) {
        openImageInNewTab();
        return true;
    }

    if (lowerCaseCommand.includes('use flux model') || lowerCaseCommand.includes('switch to flux')) {
        currentImageModel = 'flux';
        speak('Image model set to flux.');
        return true;
    }

    if (lowerCaseCommand.includes('use turbo model') || lowerCaseCommand.includes('switch to turbo')) {
        currentImageModel = 'turbo';
        speak('Image model set to turbo.');
        return true;
    }

    if (lowerCaseCommand.includes('use kontext model') || lowerCaseCommand.includes('switch to kontext')) {
        currentImageModel = 'kontext';
        speak('Image model set to kontext.');
        return true;
    }

    if (
        lowerCaseCommand.includes('clear history') ||
        lowerCaseCommand.includes('delete history') ||
        lowerCaseCommand.includes('clear chat') ||
        lowerCaseCommand.includes('clear chat history')
    ) {
        chatHistory = [];
        speak('Chat history cleared.');
        return true;
    }

    if (
        lowerCaseCommand.includes('light mode') ||
        lowerCaseCommand.includes('light theme') ||
        lowerCaseCommand.includes('change to light') ||
        lowerCaseCommand.includes('switch to light') ||
        lowerCaseCommand.includes('change them to light')
    ) {
        const wasUpdated = currentTheme !== 'light';
        applyTheme('light');
        speak(wasUpdated ? 'Switched to the light theme.' : 'Light theme is already active.');
        return true;
    }

    if (
        lowerCaseCommand.includes('dark mode') ||
        lowerCaseCommand.includes('dark theme') ||
        lowerCaseCommand.includes('change to dark') ||
        lowerCaseCommand.includes('switch to dark') ||
        lowerCaseCommand.includes('change them to dark')
    ) {
        const wasUpdated = currentTheme !== 'dark';
        applyTheme('dark');
        speak(wasUpdated ? 'Switched to the dark theme.' : 'Dark theme is already active.');
        return true;
    }

    return false;
}

const POLLINATIONS_TEXT_URL = PollinationsAPI.TEXT_API;
const UNITY_REFERRER = 'https://www.unityailab.com/';

async function getAIResponse(userInput) {
    console.log('🎤 [1/6] getAIResponse called with:', userInput);
    recognitionPaused = true;
    updateMuteIndicator();

    try {
        chatHistory.push({ role: 'user', content: userInput });
        console.log('🎤 [2/6] Chat history length:', chatHistory.length);

        if (chatHistory.length > 12) {
            chatHistory.splice(0, chatHistory.length - 12);
        }

        let aiText = '';

        const messages = [{ role: 'system', content: systemPrompt }, ...chatHistory];

        // Use "mistral" as base model for Unity custom model
        const pollinationsPayload = JSON.stringify({
            messages,
            model: 'mistral'
        });

        console.log('🌐 [3/6] Sending to API:', POLLINATIONS_TEXT_URL);
        console.log('🌐 [3/6] System prompt loaded:', systemPrompt.length > 0 ? 'YES (' + systemPrompt.length + ' chars)' : 'NO - EMPTY!');

        // Retry logic for rate limiting - keep trying until success
        let textResponse;
        let attempt = 0;
        const maxAttempts = 10;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                textResponse = await fetch(`${POLLINATIONS_TEXT_URL}?key=${PollinationsAPI.DEFAULT_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${PollinationsAPI.DEFAULT_API_KEY}`
                    },
                    body: pollinationsPayload
                });

                if (textResponse.status === 429) {
                    // Rate limited - wait and retry
                    const retryAfter = parseInt(textResponse.headers.get('retry-after')) || 3;
                    console.log(`⏳ [3/6] Rate limited, waiting ${retryAfter}s... (attempt ${attempt}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue;
                }

                if (textResponse.ok) {
                    break; // Success!
                }

                // Other error - still retry with backoff
                console.log(`⏳ [3/6] API error ${textResponse.status}, retrying... (attempt ${attempt}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

            } catch (fetchError) {
                console.log(`⏳ [3/6] Network error, retrying... (attempt ${attempt}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
        }

        console.log('🌐 [4/6] API response status:', textResponse?.status);

        if (!textResponse || !textResponse.ok) {
            const errorText = textResponse ? await textResponse.text() : 'No response';
            console.error('❌ [4/6] API failed after retries:', errorText);
            throw new Error(`API failed after ${maxAttempts} attempts`);
        }

        const data = await textResponse.json();
        aiText = data.choices?.[0]?.message?.content ?? '';
        console.log('🤖 [5/6] AI response received:', aiText.substring(0, 100) + '...');

        if (!aiText) {
            throw new Error('Received empty response from Pollinations AI');
        }

        const { cleanedText, commands } = parseAiDirectives(aiText);
        const assistantMessage = cleanedText || aiText;
        const imageUrlFromResponse = cutImageUrl(extractImageUrl(aiText) || extractImageUrl(assistantMessage));

        const imageCommandQueue = [];
        for (const command of commands) {
            const normalizedCommand = normalizeCommandValue(command);
            if (['copy_image', 'save_image', 'open_image'].includes(normalizedCommand)) {
                imageCommandQueue.push(normalizedCommand);
                continue;
            }

            await executeAiCommand(normalizedCommand);
        }

        const fallbackPrompt = buildFallbackImagePrompt(userInput, assistantMessage);
        let fallbackImageUrl = '';
        if (
            shouldRequestFallbackImage({
                userInput,
                assistantMessage,
                fallbackPrompt,
                existingImageUrl: imageUrlFromResponse
            })
        ) {
            fallbackImageUrl = buildPollinationsImageUrl(fallbackPrompt, { model: currentImageModel });
        }

        const selectedImageUrl = imageUrlFromResponse || fallbackImageUrl;

        const assistantMessageWithoutImage = selectedImageUrl
            ? removeImageReferences(assistantMessage, selectedImageUrl)
            : assistantMessage;

        const finalAssistantMessage = assistantMessageWithoutImage.replace(/\n{3,}/g, '\n\n').trim();
        const chatAssistantMessage = finalAssistantMessage || '[image]';

        chatHistory.push({ role: 'assistant', content: chatAssistantMessage });

        let heroImagePromise = Promise.resolve(false);
        if (selectedImageUrl) {
            heroImagePromise = updateHeroImage(selectedImageUrl);
        }

        const shouldSuppressSpeech = commands.includes('shutup') || commands.includes('stop_speaking');

        if (imageCommandQueue.length > 0) {
            await heroImagePromise;
            const imageTarget = selectedImageUrl || getImageUrl() || pendingHeroUrl;
            for (const command of imageCommandQueue) {
                await executeAiCommand(command, { imageUrl: imageTarget });
            }
        }

        if (!shouldSuppressSpeech) {
            const spokenText = sanitizeForSpeech(finalAssistantMessage);
            console.log('🔊 [6/6] Speaking:', spokenText ? spokenText.substring(0, 50) + '...' : '(empty)');
            if (spokenText) {
                await heroImagePromise;
                await speak(spokenText);
            }
        }

        return {
            text: finalAssistantMessage,
            rawText: aiText,
            imageUrl: selectedImageUrl,
            commands
        };
    } catch (error) {
        console.error('Error getting text from Pollinations AI:', error);
        setCircleState(aiCircle, {
            error: true,
            label: 'Unity could not respond'
        });
        await speak("Sorry, I couldn't get a text response.");
        setTimeout(() => {
            setCircleState(aiCircle, {
                error: false,
                label: 'Unity is idle'
            });
        }, 2400);

        return { error };
    } finally {
        recognitionPaused = false;
        updateMuteIndicator();

        // Restart recognition if mic is not muted (handles case where Unity TTS is muted)
        if (!isMuted && recognition) {
            try {
                recognition.start();
            } catch (error) {
                // May already be running
            }
        }
    }
}

function getImageUrl() {
    if (currentHeroUrl) {
        return currentHeroUrl;
    }

    if (heroImage?.getAttribute('src')) {
        return heroImage.getAttribute('src');
    }

    return '';
}

function updateHeroImage(imageUrl) {
    if (!heroStage || !heroImage || !imageUrl) {
        return Promise.resolve(false);
    }

    heroStage.classList.add('is-visible');

    if (imageUrl === currentHeroUrl && heroStage.dataset.state === 'loaded') {
        heroStage.setAttribute('aria-hidden', heroStage.classList.contains('has-image') ? 'false' : 'true');
        return Promise.resolve(true);
    }

    heroStage.setAttribute('aria-hidden', 'true');

    const hadImage = heroStage.classList.contains('has-image');

    pendingHeroUrl = imageUrl;
    heroStage.dataset.state = 'loading';
    if (!hadImage) {
        heroStage.classList.remove('has-image');
        heroImage.removeAttribute('src');
    }

    return new Promise((resolve) => {
        let retryCount = 0;
        const maxRetries = 10;

        const tryLoad = () => {
            const image = new Image();
            image.decoding = 'async';
            image.crossOrigin = 'anonymous';

            image.onload = () => {
                if (pendingHeroUrl !== imageUrl) {
                    resolve(false);
                    return;
                }

                currentHeroUrl = imageUrl;
                pendingHeroUrl = '';
                heroImage.src = imageUrl;
                heroStage.dataset.state = 'loaded';
                heroStage.classList.add('has-image');
                heroStage.setAttribute('aria-hidden', 'false');
                console.log('✅ Hero image loaded successfully');
                resolve(true);
            };

            image.onerror = () => {
                retryCount++;
                if (retryCount <= maxRetries) {
                    const delay = retryCount * 2000; // 2s, 4s, 6s...
                    console.log(`⏳ Hero image failed, retry ${retryCount}/${maxRetries} in ${delay/1000}s...`);
                    setTimeout(() => {
                        // Add cache buster for retry
                        tryLoad();
                    }, delay);
                } else {
                    // Give up after max retries
                    if (pendingHeroUrl === imageUrl) {
                        pendingHeroUrl = '';
                    }
                    if (!hadImage) {
                        heroStage.dataset.state = 'error';
                        heroStage.classList.remove('has-image');
                        heroImage.removeAttribute('src');
                        heroStage.setAttribute('aria-hidden', 'true');
                    } else {
                        heroStage.dataset.state = 'loaded';
                        heroStage.setAttribute('aria-hidden', 'false');
                    }
                    console.error('❌ Hero image failed after', maxRetries, 'retries');
                    resolve(false);
                }
            };

            // Add cache buster on retries
            const urlWithBuster = retryCount > 0
                ? imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_retry=' + Date.now()
                : imageUrl;
            image.src = urlWithBuster;
        };

        tryLoad();
    });
}

async function copyImageToClipboard(imageUrlOverride) {
    const imageUrl = imageUrlOverride || getImageUrl() || pendingHeroUrl;
    if (!imageUrl) {
        return;
    }

    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        speak('Image copied to clipboard.');
    } catch (error) {
        console.error('Failed to copy image: ', error);
        speak('Sorry, I could not copy the image. This might be due to browser limitations.');
    }
}

async function saveImage(imageUrlOverride) {
    const imageUrl = imageUrlOverride || getImageUrl() || pendingHeroUrl;
    if (!imageUrl) {
        return;
    }

    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = 'pollination_image.png';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        speak('Image saved.');
    } catch (error) {
        console.error('Failed to save image: ', error);
        speak('Sorry, I could not save the image.');
    }
}

function openImageInNewTab(imageUrlOverride) {
    const imageUrl = imageUrlOverride || getImageUrl() || pendingHeroUrl;
    if (!imageUrl) {
        return;
    }

    window.open(imageUrl, '_blank');
    speak('Image opened in new tab.');
}

if (!launchButton && !landingSection) {
    startApplication().catch((error) => {
        console.error('Failed to auto-start the Unity voice experience:', error);
    });
}

if (typeof window !== 'undefined') {
    const setMutedStateHandler = setMutedState;
    window.setMutedState = (muted, options) => setMutedStateHandler(muted, options);

    Object.defineProperty(window, '__unityTestHooks', {
        value: {
            isAppReady: () => appStarted,
            getChatHistory: () => chatHistory.map((entry) => ({ ...entry })),
            getCurrentHeroImage: () => getImageUrl(),
            setHeroImage: (dataUrl) => updateHeroImage(dataUrl),
            sendUserInput: async (input) => {
                if (typeof input !== 'string' || !input.trim()) {
                    return { error: new Error('Input must be a non-empty string.') };
                }

                if (!appStarted) {
                    await startApplication();
                }

                return getAIResponse(input.trim());
            }
        },
        configurable: true,
        enumerable: false
    });
}

window.addEventListener('talk-to-unity:launch', () => {
    startApplication();
});

// NOTE: removed the duplicate 'talk-to-unity:launch' listener that was previously included.

async function ensureMicPermission() {
    if (localStorage.getItem('micPermission') === 'granted') {
        hasMicPermission = true;
        return true;
    }

    const permission = await requestMicPermission();
    if (permission) {
        hasMicPermission = true;
        updateMuteIndicator();
    }

    return permission;
}
