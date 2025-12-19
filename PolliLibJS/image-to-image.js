/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Image-to-Image - Transform existing images based on prompts
 */

const { PollinationsAPI } = require('./pollylib');
const fs = require('fs').promises;

class ImageToImage extends PollinationsAPI {
    async transformImage(options = {}) {
        const {
            inputImageUrl,
            prompt,
            width = 1024,
            height = 1024,
            seed = null,
            outputPath = null
        } = options;

        const encodedPrompt = this.encodePrompt(prompt);
        const url = `${PollinationsAPI.IMAGE_API}/prompt/${encodedPrompt}`;

        const params = new URLSearchParams({
            model: 'kontext',
            image: inputImageUrl,
            width: width.toString(),
            height: height.toString()
        });

        if (seed !== null) {
            params.append('seed', seed.toString());
        }

        try {
            const response = await this.retryRequest(
                `${url}?${params.toString()}`,
                { method: 'GET' },
                4,
                180000
            );

            const imageData = await response.arrayBuffer();
            const imageBuffer = Buffer.from(imageData);

            let finalOutputPath = outputPath;
            if (outputPath) {
                if (!outputPath.endsWith('.jpg') && !outputPath.endsWith('.jpeg') && !outputPath.endsWith('.png')) {
                    finalOutputPath = `${outputPath}.jpg`;
                }

                await fs.writeFile(finalOutputPath, imageBuffer);
            }

            return {
                success: true,
                inputImage: inputImageUrl,
                prompt,
                width,
                height,
                seed,
                outputPath: finalOutputPath,
                sizeBytes: imageBuffer.length,
                imageData: imageBuffer
            };

        } catch (error) {
            return {
                success: false,
                inputImage: inputImageUrl,
                prompt,
                error: error.message
            };
        }
    }

    async styleTransfer(inputImageUrl, style, options = {}) {
        const prompt = `transform this image into a ${style} style`;
        return this.transformImage({
            inputImageUrl,
            prompt,
            ...options
        });
    }

    async guidedGeneration(inputImageUrl, guidancePrompt, strength = 'moderate', options = {}) {
        const strengthMap = {
            subtle: 'slightly modify this image to',
            moderate: 'transform this image to',
            strong: 'completely reimagine this image as'
        };

        const prefix = strengthMap[strength] || strengthMap.moderate;
        const prompt = `${prefix} ${guidancePrompt}`;

        return this.transformImage({
            inputImageUrl,
            prompt,
            ...options
        });
    }

    async inpainting(inputImageUrl, maskDescription, fillPrompt, options = {}) {
        const prompt = `in this image, replace the ${maskDescription} with ${fillPrompt}, keeping everything else exactly the same`;

        const result = await this.transformImage({
            inputImageUrl,
            prompt,
            ...options
        });

        if (result.success) {
            result.inpaintingNote = 'This is a prompt-based approximation. True mask-based inpainting requires specific API support.';
        }

        return result;
    }

    async createMeme(inputImageUrl, topText = null, bottomText = null, options = {}) {
        const textParts = [];
        if (topText) textParts.push(`'${topText}' at the top`);
        if (bottomText) textParts.push(`'${bottomText}' at the bottom`);

        if (textParts.length === 0) {
            return {
                success: false,
                error: 'Must provide topText and/or bottomText'
            };
        }

        const textDesc = textParts.join(' and ');
        const prompt = `create a meme from this image with ${textDesc} in bold white text with black outline`;

        const result = await this.transformImage({
            inputImageUrl,
            prompt,
            ...options
        });

        if (result.success) {
            result.memeNote = 'AI-generated meme. For classic meme format, use dedicated meme generators.';
        }

        return result;
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Image-to-Image Transformation Examples");
    console.log("=".repeat(60));

    const img2img = new ImageToImage();
    await fs.mkdir("transformed_images", { recursive: true });

    const inputImage = "https://avatars.githubusercontent.com/u/86964862";

    console.log("\n1. Basic Image Transformation:");
    console.log("-".repeat(60));

    const result = await img2img.transformImage({
        inputImageUrl: inputImage,
        prompt: "turn this into a watercolor painting",
        width: 1024,
        height: 1024,
        seed: 42,
        outputPath: "transformed_images/watercolor"
    });

    if (result.success) {
        console.log(`✓ Transformation successful!`);
        console.log(`  Prompt: ${result.prompt}`);
        console.log(`  Output: ${result.outputPath}`);
        console.log(`  Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Image-to-image examples completed!");
    console.log("=".repeat(60));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageToImage };
}

if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
