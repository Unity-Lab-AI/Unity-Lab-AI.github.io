/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Tool Calling and Image Generation Module
 * Unity AI Lab Demo Page
 *
 * Handles tool/function calling and image generation
 */

import { API_KEY } from './config.js';

/**
 * Handle tool call execution
 * @param {Object} toolCall - Tool call object from API
 * @param {Array} chatHistory - Chat history array (NOT modified - kept clean for future requests)
 * @param {Object} settings - Settings object
 * @param {Function} generateRandomSeed - Random seed generator
 * @returns {Object} Function result with images array
 */
export async function handleToolCall(toolCall, chatHistory, settings, generateRandomSeed) {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);

    console.log(`Tool call: ${functionName}`);

    let functionResult = { success: false, message: 'Unknown function', images: [] };

    // Execute the function
    if (functionName === 'generate_image') {
        functionResult = await executeImageGeneration(functionArgs, settings, generateRandomSeed);
    }

    // NOTE: Do NOT add tool results to chatHistory here!
    // The chatHistory must stay clean with only user/assistant messages
    // Tool results are handled separately in api.js for the follow-up call

    return functionResult;
}

/**
 * Execute image generation from tool call
 * @param {Object} args - Function arguments
 * @param {Object} settings - Settings object
 * @param {Function} generateRandomSeed - Random seed generator
 * @returns {Object} Result object with images array
 */
async function executeImageGeneration(args, settings, generateRandomSeed) {
    const generatedImages = [];

    // Handle both single prompt schema and images array schema
    let imageRequests = [];

    if (args.images && Array.isArray(args.images)) {
        // Array schema (multiple images)
        imageRequests = args.images;
    } else if (args.prompt) {
        // Single prompt schema (Unity/simpler models)
        imageRequests = [{
            prompt: args.prompt,
            width: args.width || 1024,
            height: args.height || 1024,
            model: args.model || 'flux'
        }];
    } else {
        return { success: false, message: 'Invalid image generation parameters - no prompt or images array provided', images: [] };
    }

    // Generate each image
    for (const imageRequest of imageRequests) {
        let { prompt, width = 1024, height = 1024, model = 'flux' } = imageRequest;

        // Truncate overly long prompts (max 500 chars to prevent noise)
        if (prompt && prompt.length > 500) {
            console.log(`⚠️ Truncating long prompt from ${prompt.length} to 500 chars`);
            prompt = prompt.substring(0, 500).trim();
            // Try to end at a natural break point
            const lastSpace = prompt.lastIndexOf(' ');
            if (lastSpace > 400) {
                prompt = prompt.substring(0, lastSpace);
            }
        }

        // Override model if user has selected a specific model (not "auto")
        if (settings.imageModel && settings.imageModel !== 'auto') {
            model = settings.imageModel;
        }

        // Dimension priority: (1) explicit user setting → use that.
        // (2) explicit dims passed in tool_call args (from self-ref fast
        // path) → respect them. (3) auto-detect from prompt keywords.
        const userExplicit = settings.imageWidth !== 'auto' && settings.imageHeight !== 'auto';
        const callerExplicit = imageRequest.width && imageRequest.height &&
                               !(imageRequest.width === 1024 && imageRequest.height === 1024);

        if (userExplicit) {
            width = parseInt(settings.imageWidth);
            height = parseInt(settings.imageHeight);
        } else if (callerExplicit) {
            // Caller (e.g. self-ref fast path) passed dimensions matched
            // to the request — respect them instead of overriding via
            // keyword auto-detection on the long appearance-laden prompt.
            width = parseInt(imageRequest.width);
            height = parseInt(imageRequest.height);
        } else {
            // Auto-detect from prompt keywords
            const promptLower = prompt.toLowerCase();
            // Body shot indicators (nudity / scene-based body content)
            if (/\b(naked|nude|topless|bare|tits|breasts|nipples|pussy|cock|cunt|undressed|stripped|asshole|spread|blowjob|oral|sucking|riding|fucking|sex|orgasm|full[\s-]?body|standing|kneeling|sitting|lying|fallen|covered\s+in)\b/.test(promptLower)) {
                width = 1080;
                height = 1920;
            }
            // Portrait/face indicators
            else if (promptLower.includes('selfie') || promptLower.includes('portrait') ||
                     promptLower.includes('headshot') || promptLower.includes('face')) {
                width = 1080;
                height = 1920;
            }
            // Landscape/scenery indicators
            else if (promptLower.includes('landscape') || promptLower.includes('scenery') ||
                     promptLower.includes('desktop') || promptLower.includes('wallpaper') ||
                     promptLower.includes('panorama') || promptLower.includes('horizon')) {
                width = 1920;
                height = 1080;
            }
            // Default square
            else {
                width = 1024;
                height = 1024;
            }
        }

        // Build Pollinations image URL
        // Use settings seed or generate random 6-8 digit seed
        const seed = (settings.seed !== -1) ? settings.seed : generateRandomSeed();
        const encodedPrompt = encodeURIComponent(prompt.trim());

        // Build URL per Pollinations docs
        let imageUrl = `https://websiteunityailab.gfourteen7525.workers.dev/image/${encodedPrompt}?` +
            `model=${model}&width=${width}&height=${height}&seed=${seed}&` +
            `enhance=${settings.imageEnhance}&nologo=true&safe=false&private=true&key=${API_KEY}`;

        console.log(`🔑 API_KEY used: ${API_KEY}`);
        console.log(`🖼️ Full image URL: ${imageUrl}`);

        generatedImages.push({
            url: imageUrl,
            prompt: prompt,
            width: width,
            height: height,
            model: model,
            seed: seed
        });

        console.log(`📷 Image: ${width}x${height}, ${model}`);
    }

    return {
        success: true,
        images: generatedImages,
        message: `Successfully generated ${generatedImages.length} image(s). Images are automatically displayed to the user. DO NOT include image URLs in your response - the images are already visible.`
    };
}

/**
 * Generate image from slash command
 * @param {string} prompt - Image prompt
 * @param {Object} settings - Settings object
 * @param {Function} addMessage - Message add function
 * @param {Function} showTypingIndicator - Typing indicator show function
 * @param {Function} removeTypingIndicator - Typing indicator remove function
 */
export async function generateImageFromCommand(prompt, settings, addMessage, showTypingIndicator, removeTypingIndicator) {
    try {
        const imageModel = settings.imageModel || 'flux';
        const width = settings.imageWidth === 'auto' ? 1024 : parseInt(settings.imageWidth);
        const height = settings.imageHeight === 'auto' ? 1024 : parseInt(settings.imageHeight);
        const enhance = settings.imageEnhance;
        const seed = settings.seed === -1 ? Math.floor(Math.random() * 1000000) : settings.seed;

        // Show typing indicator
        showTypingIndicator();

        // Build image URL with safe=false for uncensored content
        // Using gen.pollinations.ai/image/ endpoint per official docs
        // API key REQUIRED in query param for browser <img src=""> loading
        let imageUrl = `https://websiteunityailab.gfourteen7525.workers.dev/image/${encodeURIComponent(prompt)}`;
        imageUrl += `?key=${API_KEY}`;
        imageUrl += `&model=${imageModel}`;
        imageUrl += `&width=${width}`;
        imageUrl += `&height=${height}`;
        imageUrl += `&seed=${seed}`;
        imageUrl += `&enhance=${enhance}`;
        imageUrl += `&nologo=true`;
        imageUrl += `&safe=false`;
        imageUrl += `&private=true`;

        // Remove typing indicator
        removeTypingIndicator();

        // Display the generated image
        addMessage('ai', `Generated image for: "${prompt}"`, [{url: imageUrl, prompt: prompt}]);
    } catch (error) {
        removeTypingIndicator();
        addMessage('ai', 'Failed to generate image: ' + error.message);
        console.error('Image generation error:', error);
    }
}
