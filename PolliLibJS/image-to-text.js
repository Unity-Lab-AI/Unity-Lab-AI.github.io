/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Image-to-Text (Vision) - Analyze images and generate descriptions
 */

const { PollinationsAPI } = require('./pollylib');
const fs = require('fs');

class ImageToText extends PollinationsAPI {
    static VISION_MODELS = ['openai', 'openai-large', 'claude-hybridspace'];

    async analyzeImageUrl(options = {}) {
        const {
            imageUrl,
            prompt = "What's in this image?",
            model = 'openai',
            maxTokens = 500
        } = options;

        if (!ImageToText.VISION_MODELS.includes(model)) {
            return {
                success: false,
                error: `Model must be one of: ${ImageToText.VISION_MODELS.join(', ')}`
            };
        }

        const payload = {
            model,
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    {
                        type: 'image_url',
                        image_url: { url: imageUrl }
                    }
                ]
            }],
            max_tokens: maxTokens
        };

        try {
            const response = await this.retryRequest(
                `${PollinationsAPI.TEXT_API}/openai`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                4,
                120000
            );

            const result = await response.json();
            const analysis = result.choices[0].message.content;

            return {
                success: true,
                imageUrl,
                prompt,
                analysis,
                model,
                fullResponse: result
            };

        } catch (error) {
            return {
                success: false,
                imageUrl,
                error: error.message
            };
        }
    }

    async analyzeImageFile(options = {}) {
        const {
            imagePath,
            prompt = 'Describe this image in detail',
            model = 'openai',
            maxTokens = 500
        } = options;

        if (!ImageToText.VISION_MODELS.includes(model)) {
            return {
                success: false,
                error: `Model must be one of: ${ImageToText.VISION_MODELS.join(', ')}`
            };
        }

        try {
            const imageData = fs.readFileSync(imagePath).toString('base64');
            const imageFormat = imagePath.split('.').pop().toLowerCase() === 'jpg' ? 'jpeg' : imagePath.split('.').pop().toLowerCase();
            const dataUrl = `data:image/${imageFormat};base64,${imageData}`;

            const payload = {
                model,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: { url: dataUrl }
                        }
                    ]
                }],
                max_tokens: maxTokens
            };

            const response = await this.retryRequest(
                `${PollinationsAPI.TEXT_API}/openai`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                4,
                120000
            );

            const result = await response.json();
            const analysis = result.choices[0].message.content;

            return {
                success: true,
                imagePath,
                prompt,
                analysis,
                model,
                fullResponse: result
            };

        } catch (error) {
            return {
                success: false,
                imagePath,
                error: error.message
            };
        }
    }

    async generateCaption(imageSource, isUrl = true, model = 'openai') {
        const prompt = 'Generate a concise, descriptive caption for this image in one sentence.';

        const result = isUrl
            ? await this.analyzeImageUrl({ imageUrl: imageSource, prompt, model, maxTokens: 100 })
            : await this.analyzeImageFile({ imagePath: imageSource, prompt, model, maxTokens: 100 });

        if (result.success) {
            result.caption = result.analysis;
        }

        return result;
    }

    async extractObjects(imageSource, isUrl = true, model = 'openai') {
        const prompt = 'List all the objects you can see in this image. Provide a bullet-point list.';

        const result = isUrl
            ? await this.analyzeImageUrl({ imageUrl: imageSource, prompt, model, maxTokens: 300 })
            : await this.analyzeImageFile({ imagePath: imageSource, prompt, model, maxTokens: 300 });

        if (result.success) {
            result.objects = result.analysis;
        }

        return result;
    }

    async extractTextOcr(imageSource, isUrl = true, model = 'openai') {
        const prompt = 'Extract all visible text from this image. Provide the exact text you see, maintaining the original formatting as much as possible.';

        const result = isUrl
            ? await this.analyzeImageUrl({ imageUrl: imageSource, prompt, model, maxTokens: 500 })
            : await this.analyzeImageFile({ imagePath: imageSource, prompt, model, maxTokens: 500 });

        if (result.success) {
            result.extractedText = result.analysis;
        }

        return result;
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Image-to-Text (Vision) Examples");
    console.log("=".repeat(60));

    const vision = new ImageToText();
    const exampleImageUrl = "https://gen.pollinations.ai/image/a%20cat%20sitting%20on%20a%20windowsill?width=512&height=512&seed=42";

    console.log("\n1. Analyze Image from URL:");
    console.log("-".repeat(60));
    const result = await vision.analyzeImageUrl({
        imageUrl: exampleImageUrl,
        prompt: "What's in this image? Describe it in detail."
    });

    if (result.success) {
        console.log(`\n✓ Analysis:`);
        console.log(result.analysis);
    } else {
        console.log(`✗ Error: ${result.error}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Vision examples completed!");
    console.log("=".repeat(60));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageToText };
}

if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
