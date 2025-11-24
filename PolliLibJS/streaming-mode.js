/**
 * Streaming Mode (SSE) - Real-time streaming responses
 */

const { PollinationsAPI } = require('./pollylib');

class StreamingMode extends PollinationsAPI {
    async* streamText(options = {}) {
        const {
            messages,
            model = 'openai',
            temperature = 0.7,
            maxTokens = null
        } = options;

        const url = `${PollinationsAPI.TEXT_API}/openai`;

        const payload = {
            model,
            messages,
            temperature,
            stream: true
        };

        if (maxTokens) {
            payload.max_tokens = maxTokens;
        }

        try {
            const response = await this.retryRequest(
                url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream'
                    },
                    body: JSON.stringify(payload)
                },
                4,
                null  // No timeout for streaming
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith(':') || !line.trim()) continue;

                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);

                        if (dataStr.trim() === '[DONE]') {
                            return;
                        }

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.choices && data.choices.length > 0) {
                                const delta = data.choices[0].delta || {};
                                if (delta.content) {
                                    yield delta.content;
                                }
                            }

                        } catch (error) {
                            continue;
                        }
                    }
                }
            }

        } catch (error) {
            yield `\n[Error: ${error.message}]`;
        }
    }

    async* streamTextSimple(prompt, model = 'openai', temperature = 0.7) {
        const messages = [{ role: 'user', content: prompt }];
        yield* this.streamText({ messages, model, temperature });
    }

    async collectStream(streamGenerator, printProgress = true) {
        const chunks = [];
        const startTime = Date.now();

        try {
            for await (const chunk of streamGenerator) {
                chunks.push(chunk);

                if (printProgress) {
                    process.stdout.write(chunk);
                }
            }

            if (printProgress) {
                console.log();
            }

            return {
                success: true,
                response: chunks.join(''),
                chunksReceived: chunks.length,
                duration: (Date.now() - startTime) / 1000
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                partialResponse: chunks.join(''),
                chunksReceived: chunks.length
            };
        }
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Streaming Mode (SSE) Examples");
    console.log("=".repeat(60));

    const streaming = new StreamingMode();

    console.log("\n1. Simple Text Streaming:");
    console.log("-".repeat(60));
    console.log("Generating story (streaming)...\n");

    const stream = streaming.streamTextSimple(
        "Write a short story about a robot learning to paint in exactly three sentences.",
        'openai',
        1.0
    );

    const result = await streaming.collectStream(stream, true);

    if (result.success) {
        console.log(`\n✓ Streaming complete!`);
        console.log(`  Chunks received: ${result.chunksReceived}`);
        console.log(`  Duration: ${result.duration.toFixed(2)}s`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Streaming mode examples completed!");
    console.log("=".repeat(60));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StreamingMode };
}

if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
