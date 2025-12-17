/**
 * Text-to-Image Generation - Generate images from text prompts
 *
 * Features:
 * - Generate images across all supported models
 * - Provide N variants with same prompt
 * - Add seed support for determinism
 * - Apply safety filters on prompts
 * - Report blocked content clearly
 * - Support image size selection
 * - Support PNG and JPEG export
 * - Expose inference time in logs
 */

const { PollinationsAPI } = require('./pollylib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Class for text-to-image generation using Pollinations.AI
 */
class TextToImage extends PollinationsAPI {
    /**
     * Generate a single image from a text prompt.
     *
     * @param {Object} options - Generation options
     * @param {string} options.prompt - Description of the image to generate
     * @param {string} options.model - AI model to use (default: "flux")
     * @param {number} options.width - Image width in pixels
     * @param {number} options.height - Image height in pixels
     * @param {number} options.seed - Random seed for deterministic generation
     * @param {boolean} options.nologo - Remove Pollinations watermark
     * @param {boolean} options.enhance - Let AI improve the prompt automatically
     * @param {boolean} options.private - Hide image from public feeds
     * @param {boolean} options.safe - Enable strict NSFW filtering
     * @param {string} options.outputPath - Path to save the image
     * @returns {Promise<Object>} Dictionary with image data and metadata
     */
    async generateImage(options = {}) {
        const {
            prompt,
            model = "flux",
            width = 1024,
            height = 1024,
            seed = null,
            nologo = false,
            enhance = false,
            private: privateMode = false,
            safe = false,
            outputPath = null
        } = options;

        const startTime = Date.now();

        // Build URL - using gen.pollinations.ai/image/{prompt}
        const encodedPrompt = this.encodePrompt(prompt);
        let url = `${PollinationsAPI.IMAGE_API}/${encodedPrompt}`;

        // Build parameters
        const params = new URLSearchParams({
            model,
            width: width.toString(),
            height: height.toString()
        });

        if (seed !== null) {
            params.append("seed", seed.toString());
        }
        if (nologo) {
            params.append("nologo", "true");
        }
        if (enhance) {
            params.append("enhance", "true");
        }
        if (privateMode) {
            params.append("private", "true");
        }
        if (safe) {
            params.append("safe", "true");
        }

        url += `?${params.toString()}`;

        try {
            // Make request
            const response = await this.retryRequest(url, {
                method: "GET"
            }, 4, 120000);

            // Calculate inference time
            const inferenceTime = (Date.now() - startTime) / 1000;

            // Get content type to determine format
            const contentType = response.headers.get('Content-Type') || '';
            const isPng = contentType.includes('png');
            const fileExtension = isPng ? 'png' : 'jpg';

            // Get image data
            const imageData = await response.arrayBuffer();
            const imageBuffer = Buffer.from(imageData);

            // Save image if output path provided
            let finalOutputPath = outputPath;
            if (outputPath) {
                // Add extension if not present
                if (!outputPath.endsWith('.jpg') && !outputPath.endsWith('.jpeg') && !outputPath.endsWith('.png')) {
                    finalOutputPath = `${outputPath}.${fileExtension}`;
                }

                await fs.writeFile(finalOutputPath, imageBuffer);
            }

            return {
                success: true,
                prompt,
                model,
                width,
                height,
                seed,
                imageData: imageBuffer,
                contentType,
                format: fileExtension,
                inferenceTime,
                outputPath: finalOutputPath,
                sizeBytes: imageBuffer.length
            };

        } catch (error) {
            // Handle safety filter blocks
            const errorMsg = error.message.toLowerCase();
            if (errorMsg.includes('safe') || errorMsg.includes('blocked')) {
                return {
                    success: false,
                    prompt,
                    error: "Content blocked by safety filter",
                    message: "The prompt was flagged as potentially inappropriate. Please modify your prompt.",
                    inferenceTime: (Date.now() - startTime) / 1000
                };
            }

            return {
                success: false,
                prompt,
                error: error.message,
                inferenceTime: (Date.now() - startTime) / 1000
            };
        }
    }

    /**
     * Generate N variants of the same prompt with different seeds.
     *
     * @param {Object} options - Variant generation options
     * @param {string} options.prompt - Description of the image to generate
     * @param {number} options.n - Number of variants to generate
     * @param {number} options.baseSeed - Base seed (will increment for each variant)
     * @param {Object} options.other - Additional arguments to pass to generateImage
     * @returns {Promise<Array>} List of result dictionaries
     */
    async generateVariants(options = {}) {
        const {
            prompt,
            n = 3,
            baseSeed = null,
            ...otherOptions
        } = options;

        const variants = [];

        // Use baseSeed or generate a random starting point
        const actualBaseSeed = baseSeed !== null ? baseSeed : Math.floor(Math.random() * 1000000);

        console.log(`Generating ${n} variants of: '${prompt}'`);
        console.log(`Base seed: ${actualBaseSeed}`);

        for (let i = 0; i < n; i++) {
            const seed = actualBaseSeed + i;
            console.log(`\nVariant ${i + 1}/${n} (seed: ${seed})...`);

            // Generate output path if not provided
            const variantOptions = { ...otherOptions };
            if (!variantOptions.outputPath) {
                variantOptions.outputPath = `variant_${i + 1}_seed_${seed}`;
            }

            const result = await this.generateImage({
                prompt,
                seed,
                ...variantOptions
            });

            variants.push(result);

            if (result.success) {
                console.log(`  ✓ Generated in ${result.inferenceTime.toFixed(2)}s`);
                console.log(`  ✓ Saved to: ${result.outputPath}`);
            } else {
                console.log(`  ✗ Failed: ${result.error || 'Unknown error'}`);
            }
        }

        return variants;
    }

    /**
     * Test safety filtering on a list of prompts.
     *
     * @param {Array<string>} prompts - List of prompts to test
     * @returns {Promise<Array>} List of results showing which prompts were blocked
     */
    async testSafetyFilter(prompts) {
        const results = [];

        console.log("Testing Safety Filter:");
        console.log("=".repeat(60));

        for (const prompt of prompts) {
            console.log(`\nTesting: '${prompt}'`);

            const result = await this.generateImage({
                prompt,
                safe: true,
                model: "turbo",
                width: 512,
                height: 512
            });

            const testResult = {
                prompt,
                blocked: !result.success,
                message: result.message || 'Passed safety filter'
            };

            results.push(testResult);

            if (testResult.blocked) {
                console.log(`  ✗ BLOCKED: ${testResult.message}`);
            } else {
                console.log(`  ✓ PASSED`);
            }
        }

        return results;
    }
}

// Example usage
async function main() {
    console.log("=".repeat(60));
    console.log("Text-to-Image Generation Examples");
    console.log("=".repeat(60));

    const generator = new TextToImage();

    // Create output directory
    try {
        await fs.mkdir("generated_images", { recursive: true });
    } catch (err) {
        // Directory already exists
    }

    // Example 1: Simple image generation
    console.log("\n1. Simple Image Generation:");
    console.log("-".repeat(60));
    const result = await generator.generateImage({
        prompt: "a serene mountain landscape at sunrise",
        model: "flux",
        width: 1280,
        height: 720,
        outputPath: "generated_images/mountain_landscape"
    });

    if (result.success) {
        console.log(`✓ Image generated successfully!`);
        console.log(`  Model: ${result.model}`);
        console.log(`  Size: ${result.width}x${result.height}`);
        console.log(`  Format: ${result.format}`);
        console.log(`  Inference Time: ${result.inferenceTime.toFixed(2)}s`);
        console.log(`  File Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
        console.log(`  Saved to: ${result.outputPath}`);
    } else {
        console.log(`✗ Generation failed: ${result.error}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Example completed! Check the 'generated_images' folder.");
    console.log("=".repeat(60));
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextToImage };
}

// Test if run directly
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
