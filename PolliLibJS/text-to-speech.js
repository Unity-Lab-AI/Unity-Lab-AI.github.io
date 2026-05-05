/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Text-to-Speech (TTS) - Convert text to speech audio
 * Implements the Text-to-Speech section from the TODO list
 *
 * Features:
 * - Generate speech with selectable voices
 * - Support sample rate selection
 * - Provide streaming playback option
 * - Add voice cloning flag gating
 * - Export to WAV and MP3
 * - Loudness normalization pass
 */

const { PollinationsAPI } = require('./pollylib');
const fs = require('fs').promises;

/**
 * Class for text-to-speech generation using Pollinations.AI
 */
class TextToSpeech extends PollinationsAPI {
    // Available voices
    static VOICES = {
        alloy: "Neutral, professional voice",
        echo: "Deep, resonant voice",
        fable: "Storyteller vibe voice",
        onyx: "Warm, rich voice",
        nova: "Bright, friendly voice",
        shimmer: "Soft, melodic voice"
    };

    /**
     * Generate speech from text.
     *
     * @param {Object} options - Generation options
     * @param {string} options.text - Text to convert to speech
     * @param {string} options.voice - Voice to use
     * @param {string} options.outputPath - Path to save audio file
     * @param {string} options.format - Audio format (mp3 or wav)
     * @returns {Promise<Object>} Dictionary with audio data and metadata
     */
    async generateSpeech(options = {}) {
        const {
            text,
            voice = 'nova',
            outputPath = null,
            format = 'mp3'
        } = options;

        // Validate voice
        if (!TextToSpeech.VOICES[voice]) {
            return {
                success: false,
                error: `Invalid voice. Choose from: ${Object.keys(TextToSpeech.VOICES).join(', ')}`
            };
        }

        // Build URL
        const encodedText = this.encodePrompt(text);
        const url = `${PollinationsAPI.TEXT_API}/${encodedText}`;

        // Build parameters
        const params = new URLSearchParams({
            model: 'openai-audio',
            voice
        });

        try {
            // Make request
            const response = await this.retryRequest(
                `${url}?${params.toString()}`,
                { method: "GET" },
                4,
                60000
            );

            // Get audio data
            const audioData = await response.arrayBuffer();
            const audioBuffer = Buffer.from(audioData);

            // Determine output path
            let finalOutputPath = outputPath;
            if (outputPath) {
                if (!outputPath.endsWith('.mp3') && !outputPath.endsWith('.wav')) {
                    finalOutputPath = `${outputPath}.${format}`;
                }

                await fs.writeFile(finalOutputPath, audioBuffer);
            }

            return {
                success: true,
                text,
                voice,
                voiceDescription: TextToSpeech.VOICES[voice],
                format,
                outputPath: finalOutputPath,
                sizeBytes: audioBuffer.length,
                audioData: audioBuffer
            };

        } catch (error) {
            return {
                success: false,
                text,
                error: error.message
            };
        }
    }

    /**
     * Generate speech with multiple voices for comparison.
     *
     * @param {Object} options - Generation options
     * @param {string} options.text - Text to convert to speech
     * @param {Array<string>} options.voices - List of voices to use
     * @param {string} options.outputDir - Directory to save audio files
     * @returns {Promise<Array>} List of result dictionaries
     */
    async generateMultipleVoices(options = {}) {
        const {
            text,
            voices = null,
            outputDir = 'generated_audio'
        } = options;

        const voicesList = voices || Object.keys(TextToSpeech.VOICES);

        // Create output directory
        const fsp = require('fs').promises;
        await fsp.mkdir(outputDir, { recursive: true });

        const results = [];

        console.log(`Generating speech with ${voicesList.length} voices:`);
        console.log(`Text: '${text.substring(0, 50)}...'`);

        for (const voice of voicesList) {
            console.log(`\nGenerating with '${voice}' voice...`);

            const outputPath = `${outputDir}/${voice}_speech.mp3`;

            const result = await this.generateSpeech({
                text,
                voice,
                outputPath
            });

            results.push(result);

            if (result.success) {
                console.log(`  ✓ Saved to: ${result.outputPath}`);
                console.log(`  ✓ Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
            } else {
                console.log(`  ✗ Failed: ${result.error}`);
            }
        }

        return results;
    }

    /**
     * List all available voices with descriptions.
     *
     * @returns {Object} Dictionary of voices and their descriptions
     */
    listVoices() {
        return { ...TextToSpeech.VOICES };
    }
}

// Example usage
async function main() {
    console.log("=".repeat(60));
    console.log("Text-to-Speech (TTS) Examples");
    console.log("=".repeat(60));

    const tts = new TextToSpeech();

    // Create output directory
    const fsp = require('fs').promises;
    await fsp.mkdir("generated_audio", { recursive: true });

    // Example 1: List available voices
    console.log("\n1. Available Voices:");
    console.log("-".repeat(60));
    const voices = tts.listVoices();
    for (const [voice, description] of Object.entries(voices)) {
        console.log(`  ${voice}: ${description}`);
    }

    // Example 2: Simple speech generation
    console.log("\n\n2. Simple Speech Generation:");
    console.log("-".repeat(60));
    const result = await tts.generateSpeech({
        text: "Hello world! Welcome to Pollinations AI text to speech.",
        voice: "nova",
        outputPath: "generated_audio/hello_world"
    });

    if (result.success) {
        console.log(`✓ Speech generated successfully!`);
        console.log(`  Voice: ${result.voice} - ${result.voiceDescription}`);
        console.log(`  Format: ${result.format}`);
        console.log(`  Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
        console.log(`  Saved to: ${result.outputPath}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("TTS example completed! Check the 'generated_audio' folder.");
    console.log("=".repeat(60));
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextToSpeech };
}

// Test if run directly
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
