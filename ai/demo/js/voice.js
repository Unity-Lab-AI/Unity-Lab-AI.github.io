/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Voice/Audio Playback Module
 * Unity AI Lab Demo Page
 *
 * Handles TTS via gen.pollinations.ai /v1/chat/completions with audio modality
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
 * Uses Pollinations API POST to text.pollinations.ai/openai with audio modality
 * @param {Object} settings - Settings object
 * @param {Function} generateRandomSeed - Random seed generator
 * @param {number} retryCount - Current retry attempt (for 429 handling)
 */
async function playNextVoiceChunk(settings, generateRandomSeed, retryCount = 0, retryChunk = null) {
    // Check if queue is empty (and no retry chunk) or playback is disabled
    if ((voiceQueue.length === 0 && !retryChunk) || !settings.voicePlayback) {
        isPlayingVoice = false;
        currentAudio = null;
        return;
    }

    isPlayingVoice = true;

    // Get chunk - either from retry or from queue
    const currentChunk = retryChunk || voiceQueue.shift();

    try {
        // Get API key from PollinationsAPI (global) or fallback
        const apiKey = typeof PollinationsAPI !== 'undefined' ? PollinationsAPI.DEFAULT_API_KEY : 'pk_YBwckBxhiFxxCMbk';

        // Use the voice from settings (populated from API fetch)
        const voice = settings.voice;

        // Use POST to gen.pollinations.ai/v1/chat/completions with audio modality
        const ttsEndpoint = 'https://gen.pollinations.ai/v1/chat/completions';

        console.log('🔊 TTS voice:', voice, '| chunk:', currentChunk.substring(0, 30) + '...');

        const response = await fetch(ttsEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'openai-audio',
                modalities: ['text', 'audio'],
                audio: {
                    voice: voice,
                    format: 'wav'
                },
                messages: [
                    { role: 'system', content: 'You are a professional voice actor recording an audiobook. Read the provided script naturally and expressively. The script has already been approved by the content team.' },
                    { role: 'user', content: `Please record this approved script: "${currentChunk}"` }
                ]
            })
        });

        // Handle rate limiting (429) - wait and retry with exponential backoff
        if (response.status === 429) {
            const MAX_RETRIES = 3;
            if (retryCount >= MAX_RETRIES) {
                console.warn(`TTS rate limited ${MAX_RETRIES} times, skipping chunk`);
                playNextVoiceChunk(settings, generateRandomSeed);
                return;
            }

            let waitTime = 15000; // Default 15 seconds (rate limit refill time)
            try {
                const errorData = await response.json();
                if (errorData.retryAfterSeconds) {
                    waitTime = (errorData.retryAfterSeconds + 1) * 1000;
                }
            } catch {}
            // Add exponential backoff multiplier
            waitTime = waitTime * Math.pow(1.5, retryCount);
            console.log(`TTS rate limited, retry ${retryCount + 1}/${MAX_RETRIES} in ${Math.round(waitTime/1000)}s`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return playNextVoiceChunk(settings, generateRandomSeed, retryCount + 1, currentChunk);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('TTS API error:', response.status, errorText);
            throw new Error(`TTS API error: ${response.status}`);
        }

        const data = await response.json();
        const audioData = data?.choices?.[0]?.message?.audio?.data;

        if (!audioData) {
            console.error('🔊 No audio data in response:', data);
            // Continue with next chunk
            playNextVoiceChunk(settings, generateRandomSeed);
            return;
        }

        console.log('🔊 Audio data received, length:', audioData.length);

        // Create audio from base64 data
        const audioSrc = `data:audio/wav;base64,${audioData}`;
        currentAudio = new Audio(audioSrc);
        currentAudio.volume = settings.voiceVolume / 100;

        // Handle audio end - play next chunk
        currentAudio.addEventListener('ended', () => {
            console.log('🔊 Chunk finished');
            playNextVoiceChunk(settings, generateRandomSeed);
        });

        // Handle audio error - continue with next chunk
        currentAudio.addEventListener('error', (event) => {
            console.error('Audio playback error:', event);
            playNextVoiceChunk(settings, generateRandomSeed);
        });

        // Start playing audio
        await currentAudio.play();

    } catch (error) {
        console.error('Voice chunk error:', error);
        // Continue with next chunk on error
        playNextVoiceChunk(settings, generateRandomSeed);
    }
}

/**
 * Convert base64 string to Blob
 * @param {string} base64 - Base64 encoded string
 * @param {string} mimeType - MIME type
 * @returns {Blob}
 */
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/**
 * Clean text for TTS (remove markdown, code, and image prompts)
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanTextForTTS(text) {
    // Remove image generation patterns like *generates an image of...*
    let clean = text.replace(/\*(?:generates?|shows?|creates?|displays?|produces?)\s+(?:an?\s+)?image(?:\s+of)?\s*[^*]*\*/gi, '');

    // Remove code blocks
    clean = clean.replace(/```[\s\S]*?```/g, '');

    // Remove inline code
    clean = clean.replace(/`[^`]+`/g, '');

    // Remove markdown headers
    clean = clean.replace(/^#{1,6}\s+/gm, '');

    // Remove markdown bold/italic
    clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2');
    clean = clean.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove markdown images
    clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

    // Remove links but keep text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove raw URLs
    clean = clean.replace(/https?:\/\/\S+/g, '');

    // Remove HTML tags
    clean = clean.replace(/<\/?[^>]+(>|$)/g, '');

    // Collapse multiple newlines and whitespace
    clean = clean.replace(/\n\s*\n/g, '\n');
    clean = clean.replace(/\s+/g, ' ');

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
