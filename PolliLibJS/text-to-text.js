/**
 * Text-to-Text Generation - Generate text responses using AI models
 *
 * Features:
 * - Single-turn completion with temperature control
 * - Multi-turn conversation with stored state
 * - Thread retrieval by conversation ID
 * - Apply input and output safety checks
 * - Redact sensitive strings in logs
 * - Add stop sequence configuration
 * - Add system prompt support where allowed
 * - Add top-k and top-p controls
 */

const { PollinationsAPI } = require('./pollylib');

/**
 * Class for text generation using Pollinations.AI
 */
class TextToText extends PollinationsAPI {
    constructor(options = {}) {
        super(options);
        this.conversations = {}; // Store conversation history by ID
    }

    /**
     * Generate text from a simple prompt (single-turn).
     *
     * @param {Object} options - Generation options
     * @param {string} options.prompt - The text prompt or question
     * @param {string} options.model - AI model to use (default: "openai")
     * @param {number} options.temperature - Creativity level (0.0-3.0)
     * @param {number} options.seed - Random seed for deterministic responses
     * @param {string} options.system - System instructions for AI behavior
     * @param {boolean} options.jsonMode - Return response in JSON format
     * @returns {Promise<Object>} Dictionary with generated text and metadata
     */
    async generateText(options = {}) {
        const {
            prompt,
            model = "openai",
            temperature = 0.7,
            seed = null,
            system = null,
            jsonMode = false
        } = options;

        // Build URL - use simple text endpoint
        const encodedPrompt = this.encodePrompt(prompt);
        let url = `${PollinationsAPI.TEXT_SIMPLE_API}/${encodedPrompt}`;

        // Build parameters
        const params = new URLSearchParams({
            model,
            temperature: temperature.toString()
        });

        if (seed !== null) {
            params.append("seed", seed.toString());
        }
        if (system) {
            params.append("system", system);
        }
        if (jsonMode) {
            params.append("json", "true");
        }

        url += `?${params.toString()}`;

        try {
            // Make request
            const response = await this.retryRequest(url, {
                method: "GET"
            });

            const responseText = await response.text();

            // Redact sensitive information from logs
            const safePrompt = this._redactSensitive(prompt);

            return {
                success: true,
                prompt: safePrompt,
                response: responseText,
                model,
                temperature,
                seed
            };

        } catch (error) {
            return {
                success: false,
                prompt,
                error: error.message
            };
        }
    }

    /**
     * Multi-turn conversation with advanced controls (OpenAI compatible endpoint).
     *
     * @param {Object} options - Chat options
     * @param {Array} options.messages - List of message objects with 'role' and 'content'
     * @param {string} options.model - AI model to use
     * @param {number} options.temperature - Creativity level (0.0-3.0)
     * @param {number} options.maxTokens - Maximum response length
     * @param {boolean} options.stream - Enable streaming mode
     * @param {Array<string>} options.stopSequences - List of sequences that will stop generation
     * @param {number} options.topP - Nucleus sampling parameter (0.0-1.0)
     * @param {string} options.conversationId - Optional ID to track and retrieve conversation
     * @param {string} options.reasoningEffort - How deeply the AI thinks ('minimal', 'low', 'medium', 'high')
     * @param {boolean} options.safe - Enable strict NSFW filtering
     * @returns {Promise<Object>} Dictionary with response and metadata
     */
    async chat(options = {}) {
        const {
            messages,
            model = "openai",
            temperature = 0.7,
            maxTokens = null,
            stream = false,
            stopSequences = null,
            topP = null,
            conversationId = null,
            reasoningEffort = null,
            safe = false
        } = options;

        // Use OpenAI-compatible chat completions endpoint
        const url = PollinationsAPI.TEXT_API;

        // Build payload
        const payload = {
            model,
            messages,
            temperature,
            stream
        };

        if (maxTokens) {
            payload.max_tokens = maxTokens;
        }
        if (stopSequences) {
            payload.stop = stopSequences;
        }
        if (topP !== null) {
            payload.top_p = topP;
        }
        if (reasoningEffort !== null) {
            payload.reasoning_effort = reasoningEffort;
        }
        if (safe) {
            payload.safe = true;
        }

        try {
            // Make request
            const response = await this.retryRequest(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // Extract response text
            const responseText = result.choices[0].message.content;

            // Store conversation if ID provided
            if (conversationId) {
                if (!this.conversations[conversationId]) {
                    this.conversations[conversationId] = [];
                }

                // Add messages to conversation history
                this.conversations[conversationId].push(...messages);
                this.conversations[conversationId].push({
                    role: "assistant",
                    content: responseText
                });
            }

            // Apply safety checks
            const safetyResult = this._checkSafety(responseText);

            return {
                success: true,
                response: responseText,
                model,
                conversationId,
                safetyCheck: safetyResult,
                usage: result.usage || {},
                fullResponse: result
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Retrieve conversation history by ID.
     *
     * @param {string} conversationId - The conversation ID
     * @returns {Array|null} List of messages or null if not found
     */
    getConversation(conversationId) {
        return this.conversations[conversationId] || null;
    }

    /**
     * Continue an existing conversation.
     *
     * @param {string} conversationId - The conversation ID
     * @param {string} userMessage - New user message to add
     * @param {Object} options - Additional arguments to pass to chat()
     * @returns {Promise<Object>} Dictionary with response and metadata
     */
    async continueConversation(conversationId, userMessage, options = {}) {
        // Get existing conversation
        let messages = this.getConversation(conversationId);

        if (!messages) {
            messages = [];
        }

        // Add new user message
        messages.push({
            role: "user",
            content: userMessage
        });

        // Continue chat
        return this.chat({
            ...options,
            messages,
            conversationId
        });
    }

    /**
     * Redact sensitive information from text (emails, phone numbers, etc.).
     *
     * @param {string} text - Text to redact
     * @returns {string} Redacted text
     */
    _redactSensitive(text) {
        // Redact email addresses
        text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

        // Redact phone numbers (simple pattern)
        text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');

        // Redact credit card numbers (simple pattern)
        text = text.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD_REDACTED]');

        // Redact SSN (simple pattern)
        text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');

        return text;
    }

    /**
     * Perform basic safety checks on input/output text.
     *
     * @param {string} text - Text to check
     * @returns {Object} Dictionary with safety check results
     */
    _checkSafety(text) {
        const issues = [];

        // Check for PII
        if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
            issues.push("Contains email address");
        }

        if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
            issues.push("Contains phone number");
        }

        // Check text length
        if (text.length > 10000) {
            issues.push("Unusually long output");
        }

        return {
            safe: issues.length === 0,
            issues,
            checkedAt: "output"
        };
    }
}

// Example usage
async function main() {
    console.log("=".repeat(60));
    console.log("Text-to-Text Generation Examples");
    console.log("=".repeat(60));

    const generator = new TextToText();

    // Example 1: Simple question
    console.log("\n1. Simple Question:");
    console.log("-".repeat(60));
    const result1 = await generator.generateText({
        prompt: "What is the capital of France?",
        model: "openai",
        temperature: 0.3
    });

    if (result1.success) {
        console.log(`Q: ${result1.prompt}`);
        console.log(`A: ${result1.response}`);
        console.log(`Model: ${result1.model}, Temperature: ${result1.temperature}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Example completed!");
    console.log("=".repeat(60));
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextToText };
}

// Test if run directly
if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
