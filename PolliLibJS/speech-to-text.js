/**
 * Speech-to-Text (STT) - Transcribe audio to text
 */

const { PollinationsAPI } = require('./pollylib');
const fs = require('fs');

class SpeechToText extends PollinationsAPI {
    async transcribe(options = {}) {
        const {
            audioPath,
            audioFormat = 'wav',
            includeTimestamps = false,
            punctuation = true,
            diarization = false
        } = options;

        try {
            // Read and encode audio file
            const audioData = fs.readFileSync(audioPath).toString('base64');

            // Prepare request payload
            const payload = {
                model: 'openai-audio',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Transcribe this audio:' },
                        {
                            type: 'input_audio',
                            input_audio: {
                                data: audioData,
                                format: audioFormat
                            }
                        }
                    ]
                }]
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
            const transcription = result.choices[0].message.content;

            return {
                success: true,
                transcription,
                audioPath,
                format: audioFormat,
                punctuationRestored: punctuation,
                timestampsIncluded: includeTimestamps,
                diarizationEnabled: diarization,
                fullResponse: result
            };

        } catch (error) {
            return {
                success: false,
                audioPath,
                error: error.message
            };
        }
    }

    async exportToJson(transcriptionResult, outputPath) {
        try {
            if (!outputPath.endsWith('.json')) {
                outputPath = `${outputPath}.json`;
            }

            const exportData = {
                transcription: transcriptionResult.transcription || '',
                audioFile: transcriptionResult.audioPath || '',
                format: transcriptionResult.format || '',
                settings: {
                    punctuationRestored: transcriptionResult.punctuationRestored || false,
                    timestampsIncluded: transcriptionResult.timestampsIncluded || false,
                    diarizationEnabled: transcriptionResult.diarizationEnabled || false
                }
            };

            await require('fs').promises.writeFile(outputPath, JSON.stringify(exportData, null, 2));

            return {
                success: true,
                outputPath,
                format: 'json'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Speech-to-Text (STT) Examples");
    console.log("=".repeat(60));
    console.log("\n📝 Note: STT examples require actual audio files to work.");
    console.log("   See the Python examples for full implementation details.\n");
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpeechToText };
}

if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
