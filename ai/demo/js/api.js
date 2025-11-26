/**
 * API Integration Module
 * Unity AI Lab Demo Page
 *
 * Handles API calls, model fetching, and fallback models
 */

import { OPENAI_ENDPOINT, TOOLS_ARRAY, TOOLS_SINGLE, UNITY_SYSTEM_PROMPT, TOOL_CALLING_ADDON } from './config.js';

// Available models (populated from API)
let availableTextModels = [];
let availableImageModels = [];
let availableVoices = [];

// Unity system prompt (loaded dynamically)
let unitySystemPrompt = '';

/**
 * Initialize PolliLibJS
 * @returns {Object} API instances
 */
export function initializePolliLib() {
    try {
        // Check if PollinationsAPI is available (loaded from pollylib.js)
        if (typeof PollinationsAPI === 'undefined') {
            console.warn('PollinationsAPI not available - demo features will be disabled');
            return { textAPI: null, imageAPI: null, voiceAPI: null };
        }

        // Initialize Pollinations API (using default referrer)
        const textAPI = new PollinationsAPI();
        const imageAPI = new PollinationsAPI();
        const voiceAPI = new PollinationsAPI();
        console.log('PolliLibJS initialized successfully');
        return { textAPI, imageAPI, voiceAPI };
    } catch (error) {
        console.error('Failed to initialize PolliLibJS:', error);
        return { textAPI: null, imageAPI: null, voiceAPI: null };
    }
}

/**
 * Load Unity system prompt from external file
 */
export async function loadUnitySystemPrompt() {
    try {
        const response = await fetch('unity-system-prompt-v2.txt');
        if (!response.ok) {
            throw new Error(`Failed to load Unity prompt: ${response.status}`);
        }
        unitySystemPrompt = await response.text();
        console.log('Unity system prompt loaded successfully');
    } catch (error) {
        console.error('Failed to load Unity system prompt:', error);
        // Fallback to built-in prompt if external file fails
        unitySystemPrompt = UNITY_SYSTEM_PROMPT;
        console.warn('Using fallback built-in Unity prompt');
    }
}

/**
 * Get the loaded Unity system prompt
 * @returns {string} Unity system prompt
 */
export function getUnitySystemPrompt() {
    return unitySystemPrompt;
}

/**
 * Fetch all models from Pollinations API
 */
export async function fetchModels() {
    try {
        await Promise.all([
            fetchTextModels(),
            fetchImageModels()
        ]);
    } catch (error) {
        console.error('Error fetching models:', error);
        // Continue with default models if fetching fails
    }
}

/**
 * Fetch text models from Pollinations API
 */
async function fetchTextModels() {
    try {
        // Remove forbidden headers (User-Agent, Referer) - browsers don't allow setting these
        const response = await fetch('https://text.pollinations.ai/models?referrer=UA-73J7ItT-ws', {
            method: 'GET',
            mode: 'cors',
            cache: 'default',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Response is not JSON, using fallback models');
            throw new Error('Invalid response type');
        }

        const models = await response.json();

        // Validate that we got an array
        if (!Array.isArray(models) || models.length === 0) {
            throw new Error('Invalid models data received');
        }

        availableTextModels = models;
        console.log('Text models loaded:', models.length);
    } catch (error) {
        console.error('Failed to fetch text models:', error);
        // Provide helpful error context
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.warn('Network error - possibly CORS, network connectivity, or ad blocker. Using fallback models.');
        }
        // Use fallback default models
        useFallbackTextModels();
    }
}

/**
 * Fetch image models from Pollinations API
 */
async function fetchImageModels() {
    try {
        // Remove forbidden headers (User-Agent, Referer) - browsers don't allow setting these
        // Note: No custom headers to avoid CORS preflight (image endpoint only allows Content-Type)
        const response = await fetch('https://image.pollinations.ai/models?referrer=UA-73J7ItT-ws', {
            method: 'GET',
            mode: 'cors',
            cache: 'default'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Response is not JSON, using fallback models');
            throw new Error('Invalid response type');
        }

        const models = await response.json();

        // Validate that we got an array
        if (!Array.isArray(models) || models.length === 0) {
            throw new Error('Invalid models data received');
        }

        availableImageModels = models;
        console.log('Image models loaded:', models.length);
    } catch (error) {
        console.error('Failed to fetch image models:', error);
        // Provide helpful error context
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.warn('Network error - possibly CORS, network connectivity, or ad blocker. Using fallback models.');
        }
        // Use fallback default models
        useFallbackImageModels();
    }
}

/**
 * Fallback text models when API fails (Firefox/browser compatibility)
 */
function useFallbackTextModels() {
    console.log('Using fallback text models');
    const fallbackModels = [{"name":"deepseek","description":"DeepSeek V3.1","maxInputChars":10000,"reasoning":true,"tier":"seed","community":false,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":["deepseek-v3","deepseek-v3.1","deepseek-reasoning","deepseek-r1-0528"],"vision":false,"audio":false},{"name":"gemini","description":"Gemini 2.5 Flash Lite","tier":"seed","community":false,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"aliases":["gemini-2.5-flash-lite"],"vision":true,"audio":false},{"name":"gemini-search","description":"Gemini 2.5 Flash Lite with Google Search","tier":"seed","community":false,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"aliases":["searchgpt","geminisearch"],"vision":true,"audio":false},{"name":"mistral","description":"Mistral Small 3.2 24B","tier":"seed","community":false,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":["mistral-small-3.1-24b-instruct","mistral-small-3.1-24b-instruct-2503","mistral-small-3.2-24b-instruct-2506"],"vision":false,"audio":false},{"name":"openai","description":"OpenAI GPT-5 Nano","tier":"anonymous","community":false,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"maxInputChars":7000,"aliases":["gpt-5-mini"],"vision":true,"audio":false},{"name":"openai-audio","description":"OpenAI GPT-4o Mini Audio Preview","maxInputChars":5000,"voices":["alloy","echo","fable","onyx","nova","shimmer","coral","verse","ballad","ash","sage","amuch","dan"],"tier":"seed","community":false,"input_modalities":["text","image","audio"],"output_modalities":["audio","text"],"tools":true,"aliases":["gpt-4o-mini-audio-preview"],"vision":true,"audio":true},{"name":"openai-fast","description":"OpenAI GPT-4.1 Nano","tier":"anonymous","community":false,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"maxInputChars":5000,"aliases":["gpt-5-nano"],"vision":true,"audio":false},{"name":"openai-reasoning","description":"OpenAI o4 Mini","tier":"seed","community":false,"reasoning":true,"supportsSystemMessages":false,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"aliases":["o4-mini"],"vision":true,"audio":false},{"name":"qwen-coder","description":"Qwen 2.5 Coder 32B","tier":"flower","community":false,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":["qwen2.5-coder-32b-instruct"],"vision":false,"audio":false},{"name":"roblox-rp","description":"Llama 3.1 8B Instruct","tier":"seed","community":false,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":["llama-roblox","llama-fast-roblox"],"vision":false,"audio":false},{"name":"bidara","description":"BIDARA (Biomimetic Designer and Research Assistant by NASA)","tier":"anonymous","community":true,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"aliases":[],"vision":true,"audio":false},{"name":"chickytutor","description":"ChickyTutor AI Language Tutor - (chickytutor.com)","tier":"anonymous","community":true,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":[],"vision":false,"audio":false},{"name":"evil","description":"Evil","uncensored":true,"tier":"seed","community":true,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"aliases":[],"vision":true,"audio":false},{"name":"midijourney","description":"MIDIjourney","tier":"anonymous","community":true,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":[],"vision":false,"audio":false},{"name":"rtist","description":"Rtist","tier":"seed","community":true,"input_modalities":["text"],"output_modalities":["text"],"tools":true,"aliases":[],"vision":false,"audio":false},{"name":"unity","description":"Unity Unrestricted Agent","uncensored":true,"tier":"seed","community":true,"input_modalities":["text","image"],"output_modalities":["text"],"tools":true,"aliases":[],"vision":true,"audio":false}];

    availableTextModels = fallbackModels;

    // Also populate fallback voices (extracted from openai-audio model)
    const fallbackVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'verse', 'ballad', 'ash', 'sage', 'amuch', 'dan'];
    availableVoices = fallbackVoices;
}

/**
 * Fallback image models when API fails (Firefox/browser compatibility)
 */
function useFallbackImageModels() {
    console.log('Using fallback image models');
    const fallbackModels = ['flux', 'turbo', 'gptimage'];
    availableImageModels = fallbackModels;
}

/**
 * Get available text models
 * @returns {Array} Available text models
 */
export function getAvailableTextModels() {
    return availableTextModels;
}

/**
 * Get available image models
 * @returns {Array} Available image models
 */
export function getAvailableImageModels() {
    return availableImageModels;
}

/**
 * Get available voices
 * @returns {Array} Available voices
 */
export function getAvailableVoices() {
    return availableVoices;
}

/**
 * Extract voices from text models that support TTS
 * @param {Array} models - Text models array
 */
export function extractVoices(models) {
    if (!models) return;

    // Find models that support text-to-speech
    const ttsModels = models.filter(model => {
        // Check if model has voices or supports TTS
        return model.voices ||
               (model.capabilities && model.capabilities.includes('tts')) ||
               (model.features && model.features.includes('text-to-speech'));
    });

    // Extract voices from TTS models
    let voices = [];
    ttsModels.forEach(model => {
        if (model.voices && Array.isArray(model.voices)) {
            voices = voices.concat(model.voices);
        }
    });

    // If we found voices, update the list
    if (voices.length > 0) {
        // Remove duplicates
        voices = [...new Set(voices)];
        availableVoices = voices;
        console.log('Voices loaded:', voices.length);
        return voices;
    } else {
        // Keep default hardcoded voices if none found
        console.log('No voices found in models, keeping defaults');
        return null;
    }
}

/**
 * Get current model metadata
 * @param {string} modelName - Model name
 * @returns {Object|null} Model metadata or null
 */
export function getCurrentModelMetadata(modelName) {
    if (!modelName || availableTextModels.length === 0) {
        return null;
    }

    // Find the model in available models
    const model = availableTextModels.find(m =>
        (m.name === modelName || m.id === modelName || m === modelName)
    );

    return typeof model === 'object' ? model : null;
}

/**
 * Get AI response using OpenAI endpoint with tool calling
 * @param {string} message - User message
 * @param {Array} chatHistory - Chat history
 * @param {Object} settings - Settings object
 * @param {Function} generateRandomSeed - Random seed generator
 * @param {Function} handleToolCall - Tool call handler
 * @param {Function} getFinalResponseWithTools - Final response getter
 * @returns {Object} Response object with text and images
 */
export async function getAIResponse(message, chatHistory, settings, generateRandomSeed, handleToolCall, getFinalResponseWithTools) {
    // Get current model metadata
    const currentModel = getCurrentModelMetadata(settings.model);
    const isCommunityModel = currentModel && currentModel.community === true;
    const supportsTools = currentModel && currentModel.tools === true;

    // CUSTOM: If Unity model is selected, use Mistral with Unity system prompt and tool calling
    let actualModel = settings.model;
    let effectiveSystemPrompt = '';
    let useToolCalling = supportsTools;

    if (settings.model === 'unity') {
        // Use Mistral model with Unity persona and enable tool calling
        actualModel = 'mistral';
        // Append user's system prompt to Unity prompt if provided
        if (settings.systemPrompt && settings.systemPrompt.trim()) {
            effectiveSystemPrompt = unitySystemPrompt + '\n\n' + settings.systemPrompt + '\n\n' + TOOL_CALLING_ADDON;
            console.log('Unity model: appending user system prompt to Unity persona');
        } else {
            effectiveSystemPrompt = unitySystemPrompt + TOOL_CALLING_ADDON;
        }
        useToolCalling = true;
        console.log('Unity model selected: using Mistral with Unity persona and tool calling');
    } else if (isCommunityModel) {
        // Community models: ignore user system prompts, only add tool calling addon if supported
        if (supportsTools) {
            effectiveSystemPrompt = TOOL_CALLING_ADDON.trim();
        } else {
            effectiveSystemPrompt = '';
        }
        console.log('Community model: user system prompts are disabled');
    } else if (supportsTools) {
        // Non-community models with tool support: use user system prompt + tool calling addon
        if (settings.systemPrompt && settings.systemPrompt.trim()) {
            effectiveSystemPrompt = settings.systemPrompt + '\n\n' + TOOL_CALLING_ADDON;
        } else {
            effectiveSystemPrompt = TOOL_CALLING_ADDON.trim();
        }
    } else {
        // Non-community models without tool support: use user system prompt as-is
        effectiveSystemPrompt = settings.systemPrompt || '';
    }

    // If model supports tool calling, use OpenAI endpoint
    if (useToolCalling) {
        return await getAIResponseWithTools(message, actualModel, effectiveSystemPrompt, chatHistory, settings, generateRandomSeed, handleToolCall, getFinalResponseWithTools);
    } else {
        // Fallback to regular endpoint for non-tool-calling models
        return await getAIResponseLegacy(message, actualModel, effectiveSystemPrompt, chatHistory, settings, generateRandomSeed);
    }
}

/**
 * Get AI response using OpenAI endpoint with tool calling support
 */
async function getAIResponseWithTools(message, model, systemPrompt, chatHistory, settings, generateRandomSeed, handleToolCall, getFinalResponseWithTools) {
    // Build messages array with history (last 10 messages for context)
    const recentHistory = chatHistory.slice(-10);

    // Determine which tool schema to use
    // Unity model works better with single prompt schema
    const isUnityModel = settings.model === 'unity';
    const toolsToUse = isUnityModel ? TOOLS_SINGLE : TOOLS_ARRAY;

    // Build request payload
    const payload = {
        model: model,
        messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...recentHistory
        ],
        max_tokens: 4000,
        tools: toolsToUse,
        tool_choice: 'auto'
    };

    // Conditional temperature parameter
    // OpenAI models don't support custom temperature values (only default 1)
    const isOpenAI = model.startsWith('openai') || settings.model.startsWith('openai');
    if (!isOpenAI) {
        // Non-OpenAI models support custom temperature
        payload.temperature = settings.textTemperature;
    }
    // OpenAI models will use their default temperature (1)

    // Add reasoning effort if specified and model supports it
    const currentModel = getCurrentModelMetadata(settings.model);
    const supportsReasoning = currentModel && currentModel.reasoning === true;
    if (settings.reasoningEffort && supportsReasoning) {
        payload.reasoning_effort = settings.reasoningEffort;
    }

    // Add seed - use settings seed or generate random 6-8 digit seed
    const seed = (settings.seed !== -1) ? settings.seed : generateRandomSeed();
    payload.seed = seed;

    console.log('=== API Request (Tool Calling) ===');
    console.log('Model:', model);
    console.log('Original model:', settings.model);
    console.log('Tool schema:', isUnityModel ? 'SINGLE' : 'ARRAY');
    console.log('Tools available:', toolsToUse.length);
    console.log('Temperature included:', !isOpenAI ? settings.textTemperature : 'default (1)');
    console.log('Seed:', seed);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        // Make API call to OpenAI endpoint
        const response = await fetch(`${OPENAI_ENDPOINT}?referrer=UA-73J7ItT-ws`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('=== API Response ===');
        console.log('Response received');

        const assistantMessage = data.choices[0].message;

        // Check if the AI wants to call a function
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            console.log('✅ Function calls detected:', assistantMessage.tool_calls.length);

            // Add assistant message to history (with tool calls)
            chatHistory.push(assistantMessage);

            // Process each tool call and collect images
            const images = [];
            for (const toolCall of assistantMessage.tool_calls) {
                const result = await handleToolCall(toolCall);
                if (result.images) {
                    images.push(...result.images);
                }
            }

            // Get the final response after tool execution
            const finalText = await getFinalResponseWithTools(model, systemPrompt, chatHistory, settings, generateRandomSeed);

            // Return response with images
            return {
                text: finalText,
                images: images
            };
        } else {
            // Regular text response
            console.log('ℹ️ No function calls - text only');
            const content = assistantMessage.content || 'No response received';

            return {
                text: content,
                images: []
            };
        }
    } catch (error) {
        console.error('Failed to get AI response with tools:', error);
        throw error;
    }
}

/**
 * Get final response after tool execution
 */
export async function getFinalResponseAfterTools(model, systemPrompt, chatHistory, settings, generateRandomSeed) {
    const payload = {
        model: model,
        messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...chatHistory
        ],
        max_tokens: 4000
    };

    // Conditional temperature parameter (same logic as initial request)
    const isOpenAI = model.startsWith('openai') || settings.model.startsWith('openai');
    if (!isOpenAI) {
        payload.temperature = settings.textTemperature;
    }

    // Add seed - use settings seed or generate random 6-8 digit seed
    const seed = (settings.seed !== -1) ? settings.seed : generateRandomSeed();
    payload.seed = seed;

    console.log('=== Getting Final Response ===');
    console.log('Temperature included:', !isOpenAI ? settings.textTemperature : 'default (1)');
    console.log('Seed:', seed);

    const response = await fetch(`${OPENAI_ENDPOINT}?referrer=UA-73J7ItT-ws`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const finalMessage = data.choices[0].message;

    console.log('✅ Final response received');

    return finalMessage.content;
}

/**
 * Legacy API call for models without tool calling support
 */
async function getAIResponseLegacy(message, model, systemPrompt, chatHistory, settings, generateRandomSeed) {
    const baseUrl = 'https://text.pollinations.ai';

    // Build messages array with history (last 10 messages for context)
    const recentHistory = chatHistory.slice(-10);
    const messagesParam = encodeURIComponent(JSON.stringify([
        ...recentHistory,
        { role: 'user', content: message }
    ]));

    // Build URL with parameters
    let url = `${baseUrl}/${messagesParam}`;

    // Add model parameter if specified
    if (model) {
        url += `?model=${encodeURIComponent(model)}`;
    }

    // Add seed - use settings seed or generate random 6-8 digit seed
    const seed = (settings.seed !== -1) ? settings.seed : generateRandomSeed();
    url += url.includes('?') ? '&' : '?';
    url += `seed=${seed}`;

    // Add temperature
    url += url.includes('?') ? '&' : '?';
    url += `temperature=${settings.textTemperature}`;

    // Add private mode (always true - hide from public feeds)
    // Note: safe mode not specified = unrestricted content by default
    url += url.includes('?') ? '&' : '?';
    url += 'private=true';

    // Add system prompt if specified (but not for community models, except Unity which is handled separately)
    const currentModel = getCurrentModelMetadata(settings.model);
    const isCommunityModel = currentModel && currentModel.community === true;
    const isUnityModel = settings.model === 'unity';

    if (systemPrompt) {
        // Use the provided system prompt (this should already be processed correctly)
        url += url.includes('?') ? '&' : '?';
        url += `system=${encodeURIComponent(systemPrompt)}`;
    } else if (settings.systemPrompt && !isCommunityModel) {
        // For non-community models, use user's system prompt
        url += url.includes('?') ? '&' : '?';
        url += `system=${encodeURIComponent(settings.systemPrompt)}`;
    }
    // For community models (excluding Unity), system prompts are ignored

    // Add reasoning effort if specified and model supports it
    const supportsReasoning = currentModel && currentModel.reasoning === true;
    if (settings.reasoningEffort && supportsReasoning) {
        url += url.includes('?') ? '&' : '?';
        url += `reasoning_effort=${settings.reasoningEffort}`;
    }

    // Add referrer parameter for authentication
    url += url.includes('?') ? '&' : '?';
    url += 'referrer=UA-73J7ItT-ws';

    console.log('=== API Request (Legacy) ===');
    console.log('Model:', model);

    try {
        const response = await fetch(url, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return {
            text: text || 'No response received',
            images: []
        };
    } catch (error) {
        console.error('Failed to get AI response (legacy):', error);
        throw error;
    }
}
