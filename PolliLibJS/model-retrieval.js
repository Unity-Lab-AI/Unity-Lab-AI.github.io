/**
 * Model Retrieval - List available text and image models
 * Implements the Model Retrieval section from the TODO list
 */

const { PollinationsAPI } = require('./pollylib');

/**
 * Class for retrieving available models from Pollinations.AI
 */
class ModelRetrieval extends PollinationsAPI {
    /**
     * List all available text generation models.
     *
     * @param {Object} options - Options
     * @param {boolean} options.normalized - Return normalized model schema with full details
     * @returns {Promise<Array>} List of model information dictionaries
     */
    async listTextModels(options = {}) {
        const { normalized = true } = options;

        try {
            // Use dedicated text models endpoint
            const response = await this.retryRequest(
                PollinationsAPI.TEXT_MODELS_API,
                { method: "GET" }
            );

            const models = await response.json();

            if (normalized) {
                return this._normalizeTextModels(models);
            }

            return models;

        } catch (error) {
            console.error(`Error retrieving text models: ${error.message}`);
            return [];
        }
    }

    /**
     * Normalize text model data into standard schema.
     *
     * @param {*} models - Raw model data
     * @returns {Array} Normalized model list
     */
    _normalizeTextModels(models) {
        const normalized = [];

        // Handle different response formats
        let modelList;
        if (Array.isArray(models)) {
            modelList = models;
        } else if (typeof models === 'object' && models.models) {
            modelList = models.models;
        } else {
            return [];
        }

        for (const model of modelList) {
            let normalizedModel;

            if (typeof model === 'string') {
                // Basic model name only
                normalizedModel = {
                    name: model,
                    description: `${model} text generation model`,
                    max_input_tokens: 128000,
                    reasoning_capable: model.toLowerCase().includes('reasoning'),
                    tier: 'standard',
                    community_supported: false,
                    input_types: ['text'],
                    output_types: ['text'],
                    tool_use: model.toLowerCase().includes('openai'),
                    aliases: [],
                    vision: model.toLowerCase().includes('vision') || ['openai', 'openai-large', 'claude-hybridspace'].includes(model),
                    audio: model.toLowerCase().includes('audio'),
                    voices: model.toLowerCase().includes('audio') ? ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] : [],
                    system_messages_supported: true,
                    uncensored: false
                };
            } else {
                // Structured model data
                normalizedModel = {
                    name: model.name || 'unknown',
                    description: model.description || '',
                    max_input_tokens: model.max_input_tokens || 128000,
                    reasoning_capable: model.reasoning_capable || false,
                    tier: model.tier || 'standard',
                    community_supported: model.community_supported || false,
                    input_types: model.input_types || ['text'],
                    output_types: model.output_types || ['text'],
                    tool_use: model.tool_use || false,
                    aliases: model.aliases || [],
                    vision: model.vision || false,
                    audio: model.audio || false,
                    voices: model.voices || [],
                    system_messages_supported: model.system_messages_supported !== undefined ? model.system_messages_supported : true,
                    uncensored: model.uncensored || false
                };
            }

            normalized.push(normalizedModel);
        }

        return normalized;
    }

    /**
     * List all available image generation models.
     *
     * @param {Object} options - Options
     * @param {boolean} options.normalized - Return normalized model schema with full details
     * @returns {Promise<Array>} List of model information dictionaries
     */
    async listImageModels(options = {}) {
        const { normalized = true } = options;

        try {
            // Use dedicated image models endpoint
            const response = await this.retryRequest(
                PollinationsAPI.IMAGE_MODELS_API,
                { method: "GET" }
            );

            const models = await response.json();

            if (normalized) {
                return this._normalizeImageModels(models);
            }

            return models;

        } catch (error) {
            console.error(`Error retrieving image models: ${error.message}`);
            return [];
        }
    }

    /**
     * Normalize image model data into standard schema.
     *
     * @param {*} models - Raw model data
     * @returns {Array} Normalized model list
     */
    _normalizeImageModels(models) {
        const normalized = [];

        // Handle different response formats
        let modelList;
        if (Array.isArray(models)) {
            modelList = models;
        } else if (typeof models === 'object' && models.models) {
            modelList = models.models;
        } else {
            return [];
        }

        // Known model characteristics
        const modelInfo = {
            flux: {
                description: 'High-quality image generation model',
                style_tags: ['photorealistic', 'artistic', 'detailed'],
                max_width: 2048,
                max_height: 2048,
                supports_img2img: false
            },
            turbo: {
                description: 'Fast image generation model',
                style_tags: ['quick', 'artistic'],
                max_width: 1024,
                max_height: 1024,
                supports_img2img: false
            },
            kontext: {
                description: 'Image-to-image transformation model',
                style_tags: ['transformation', 'editing'],
                max_width: 2048,
                max_height: 2048,
                supports_img2img: true
            }
        };

        for (const model of modelList) {
            let normalizedModel;

            if (typeof model === 'string') {
                const modelName = model;
                const info = modelInfo[modelName] || {};

                normalizedModel = {
                    name: modelName,
                    description: info.description || `${modelName} image model`,
                    style_tags: info.style_tags || ['general'],
                    max_width: info.max_width || 2048,
                    max_height: info.max_height || 2048,
                    min_width: 256,
                    min_height: 256,
                    supported_formats: ['jpg', 'jpeg', 'png'],
                    supports_img2img: info.supports_img2img || false,
                    supports_seed: true,
                    supports_enhancement: true
                };
            } else {
                // Structured model data
                normalizedModel = {
                    name: model.name || 'unknown',
                    description: model.description || '',
                    style_tags: model.style_tags || [],
                    max_width: model.max_width || 2048,
                    max_height: model.max_height || 2048,
                    min_width: model.min_width || 256,
                    min_height: model.min_height || 256,
                    supported_formats: model.supported_formats || ['jpg', 'png'],
                    supports_img2img: model.supports_img2img || false,
                    supports_seed: model.supports_seed !== undefined ? model.supports_seed : true,
                    supports_enhancement: model.supports_enhancement !== undefined ? model.supports_enhancement : true
                };
            }

            normalized.push(normalizedModel);
        }

        return normalized;
    }
}

// Example usage
async function main() {
    console.log("=".repeat(60));
    console.log("Model Retrieval Examples");
    console.log("=".repeat(60));

    const retriever = new ModelRetrieval();

    // List text models
    console.log("\n1. Listing Text Models:");
    console.log("-".repeat(60));
    const textModels = await retriever.listTextModels();
    for (const model of textModels) {
        console.log(`\nModel: ${model.name}`);
        console.log(`  Description: ${model.description}`);
        console.log(`  Max Tokens: ${model.max_input_tokens}`);
        console.log(`  Reasoning: ${model.reasoning_capable}`);
        console.log(`  Vision: ${model.vision}`);
        console.log(`  Audio: ${model.audio}`);
        console.log(`  Tool Use: ${model.tool_use}`);
        if (model.voices.length > 0) {
            console.log(`  Voices: ${model.voices.join(', ')}`);
        }
    }

    // List image models
    console.log("\n\n2. Listing Image Models:");
    console.log("-".repeat(60));
    const imageModels = await retriever.listImageModels();
    for (const model of imageModels) {
        console.log(`\nModel: ${model.name}`);
        console.log(`  Description: ${model.description}`);
        console.log(`  Style Tags: ${model.style_tags.join(', ')}`);
        console.log(`  Max Size: ${model.max_width}x${model.max_height}`);
        console.log(`  Formats: ${model.supported_formats.join(', ')}`);
        console.log(`  Image-to-Image: ${model.supports_img2img}`);
    }

    // Export to JSON
    console.log("\n\n3. Exporting model data to JSON:");
    console.log("-".repeat(60));
    const fs = require('fs').promises;
    await fs.writeFile('text_models.json', JSON.stringify(textModels, null, 2));
    console.log("Text models saved to text_models.json");

    await fs.writeFile('image_models.json', JSON.stringify(imageModels, null, 2));
    console.log("Image models saved to image_models.json");
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModelRetrieval };
}

// Test if run directly
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
