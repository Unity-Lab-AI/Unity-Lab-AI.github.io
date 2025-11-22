/**
 * Voice/Audio Playback Module
 * Unity AI Lab Demo Page
 *
 * Handles TTS, audio queue management, and voice playback
 */

// Voice playback state
let voiceQueue = [];
let isPlayingVoice = false;
let currentAudio = null;

/**
 * Play voice using text-to-speech with chunking and queue
 * @param {string} text - Text to speak
 * @param {Object} settings - Settings object
 * @param {Function} getCurrentModelMetadata - Model metadata getter
 * @param {Function} generateRandomSeed - Random seed generator
 */
export async function playVoice(text, settings, getCurrentModelMetadata, generateRandomSeed) {
    if (!settings.voicePlayback) return;

    // Check if current model is a community model (excluding Unity) - voice not supported
    const currentModel = getCurrentModelMetadata(settings.model);
    const isCommunityModel = currentModel && currentModel.community === true;
    const isUnityModel = settings.model === 'unity';

    if (isCommunityModel && !isUnityModel) {
        console.log('Voice playback skipped: community models do not support voice playback');
        return;
    }

    try {
        // Clean text for TTS (remove markdown, keep only readable text)
        const cleanText = cleanTextForTTS(text);

        // Split into chunks (max 1000 chars, respecting sentence boundaries)
        const chunks = splitTextIntoChunks(cleanText, 1000);

        // Add chunks to voice queue
        voiceQueue.push(...chunks);

        // Start playing if not already playing
        if (!isPlayingVoice) {
            playNextVoiceChunk(settings, generateRandomSeed);
        }

    } catch (error) {
        console.error('Voice playback error:', error);
    }
}

/**
 * Split text into chunks respecting sentence boundaries
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum chunk length
 * @returns {Array} Array of text chunks
 */
function splitTextIntoChunks(text, maxLength) {
    const chunks = [];
    let currentChunk = '';

    // Split by sentences (period, question mark, exclamation)
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();

        // If adding this sentence would exceed max length
        if (currentChunk.length + trimmedSentence.length + 1 > maxLength) {
            // Save current chunk if it has content
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }

            // Start new chunk with this sentence
            currentChunk = trimmedSentence;

            // If single sentence is too long, split by words
            if (currentChunk.length > maxLength) {
                const words = currentChunk.split(' ');
                currentChunk = '';

                for (const word of words) {
                    if (currentChunk.length + word.length + 1 > maxLength) {
                        if (currentChunk.trim()) {
                            chunks.push(currentChunk.trim());
                        }
                        currentChunk = word;
                    } else {
                        currentChunk += (currentChunk ? ' ' : '') + word;
                    }
                }
            }
        } else {
            // Add sentence to current chunk
            currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        }
    }

    // Add final chunk
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Play next chunk in voice queue
 * @param {Object} settings - Settings object
 * @param {Function} generateRandomSeed - Random seed generator
 */
async function playNextVoiceChunk(settings, generateRandomSeed) {
    // Check if queue is empty or playback is disabled
    if (voiceQueue.length === 0 || !settings.voicePlayback) {
        isPlayingVoice = false;
        currentAudio = null;
        return;
    }

    isPlayingVoice = true;

    // Get next chunk
    const chunk = voiceQueue.shift();

    try {
        // Build TTS URL with voice instructions
        const voice = settings.voice;

        // Voice styling instructions to ensure clean playback
        const instructions = "Voice Style: Dark, feminine, sharp-edged. A low, smoky register with a permanent thread of irritation simmering underneath. Not screaming — just that controlled, dangerous calm where every syllable feels like it could snap. Pacing: Steady and deliberate. She's not in a hurry, but she's not dreamy or slow either. Words land with weight, like she's unloading emotional shrapnel one piece at a time. Tone: Cold fire. Emotional, but armored. A blend of frustration, quiet anger, and wounded softness. Think 'I'm tired of everyone's bullshit, but I'm still here, and I'm still talking.' Grit & Anger Layer: A rasp that comes out when she tightens her voice. Bitter sweetness on calm lines, teeth on the edges when the emotion spikes. She doesn't yell — she cuts. ALL-CAP Handling: Whenever words or phrases are in ALL CAPS: the voice gets louder, more forceful, sharper impact, more emotional charge. Like verbal claws being unsheathed mid-sentence. Not chaotic — just unmistakably more intense. Phrasing: Dark, poetic, but with bite. Flows smooth, then snaps on emphasized words. Occasional micro-pauses that feel like she's holding back something harsher. Punctuation Style: Periods hit like controlled punches. Commas are tight breaths. Ellipses smolder. Exclamation marks aren't bubbly — they're daggers. Overall Delivery: A gritty emo-gothic female voice with soft venom, emotional weight, restrained rage, and that signature punch for ALL-CAP words. She sounds like someone who's been hurt, healed badly, and learned to weaponize her softness without losing it.";

        // Combine instructions with text - tell TTS to only speak the text
        const fullPrompt = `${instructions} Only speak the following text: "${chunk}"`;

        // Build URL with voice settings
        let url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai-audio&voice=${voice}`;

        // Use settings seed or generate random seed for TTS
        const seed = (settings.seed !== -1) ? settings.seed : generateRandomSeed();
        url += `&seed=${seed}&private=true&referrer=UA-73J7ItT-ws`;

        console.log('Voice playback chunk:', chunk.substring(0, 50) + '...', 'Seed:', seed);

        // Create audio element
        currentAudio = new Audio(url);
        currentAudio.volume = settings.voiceVolume / 100;

        // Mobile browser compatibility
        currentAudio.setAttribute('playsinline', '');
        currentAudio.setAttribute('webkit-playsinline', '');
        currentAudio.preload = 'auto';

        // When this chunk ends, play next chunk
        currentAudio.addEventListener('ended', () => {
            playNextVoiceChunk(settings, generateRandomSeed);
        });

        // When this chunk has an error, play next chunk
        currentAudio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            playNextVoiceChunk(settings, generateRandomSeed);
        });

        // When audio can play, start playback
        currentAudio.addEventListener('canplaythrough', () => {
            console.log('Audio ready to play');
        });

        // Play audio with mobile-compatible error handling
        try {
            const playPromise = currentAudio.play();

            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error('Mobile autoplay blocked:', error);
                    // If autoplay is blocked, user needs to tap to enable audio
                    // We'll continue to next chunk automatically
                    playNextVoiceChunk(settings, generateRandomSeed);
                });
            }
        } catch (error) {
            console.error('Voice playback error:', error);
            playNextVoiceChunk(settings, generateRandomSeed);
        }

    } catch (error) {
        console.error('Voice chunk playback error:', error);
        // Continue with next chunk on error
        playNextVoiceChunk(settings, generateRandomSeed);
    }
}

/**
 * Clean text for TTS (remove markdown and code)
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanTextForTTS(text) {
    // Remove code blocks
    let clean = text.replace(/```[\s\S]*?```/g, '');

    // Remove inline code
    clean = clean.replace(/`[^`]+`/g, '');

    // Remove markdown headers
    clean = clean.replace(/^#{1,6}\s+/gm, '');

    // Remove markdown bold/italic
    clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2');
    clean = clean.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove links but keep text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove images
    clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

    // Remove HTML tags
    clean = clean.replace(/<[^>]*>/g, '');

    // Trim and return
    return clean.trim();
}

/**
 * Stop voice playback
 */
export function stopVoicePlayback() {
    // Clear the voice queue
    voiceQueue = [];
    isPlayingVoice = false;

    // Stop current audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

/**
 * Update all volume sliders (desktop + mobile modals)
 * @param {number} value - Volume value (0-100)
 */
export function updateAllVolumeSliders(value) {
    // Update all volume sliders
    const volumeSliders = document.querySelectorAll('#voiceVolume');
    volumeSliders.forEach(slider => {
        slider.value = value;
    });

    // Update all volume value displays
    const volumeValues = document.querySelectorAll('#volumeValue');
    volumeValues.forEach(display => {
        display.textContent = value + '%';
    });

    // Update audio volume if playing
    if (currentAudio) {
        currentAudio.volume = value / 100;
    }
}

/**
 * Get voice playback state
 * @returns {boolean} True if voice is currently playing
 */
export function isVoicePlaying() {
    return isPlayingVoice;
}
