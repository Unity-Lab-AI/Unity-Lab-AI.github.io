# PolliLibJS - JavaScript Library for Pollinations.AI

A comprehensive JavaScript/Node.js library for interacting with the Pollinations.AI API, providing easy-to-use interfaces for text generation, image generation, and more.

## Features

- **Text-to-Image Generation**: Create stunning images from text prompts
- **Text-to-Text Generation**: Chat with AI models, generate content
- **Text-to-Speech (TTS)**: Convert text to natural-sounding speech
- **Speech-to-Text (STT)**: Transcribe audio to text
- **Image-to-Text (Vision)**: Analyze images and extract information
- **Image-to-Image**: Transform and style existing images
- **Function Calling**: Enable AI to use external tools
- **Streaming Mode**: Real-time token-by-token responses
- **Model Retrieval**: List and query available models
- **Exponential Backoff**: Robust retry logic built-in
- **Promise-based API**: Modern async/await support
- **TypeScript Ready**: Works with TypeScript projects

## Installation

### Using npm

```bash
npm install pollilibjs
```

### Using the library directly

You can also clone this repository and use it directly:

```bash
git clone https://github.com/Unity-Lab-AI/sitetest0.git
cd sitetest0/PolliLibJS
npm install
```

## Quick Start

```javascript
const { TextToText } = require('pollilibjs');

// Initialize the client
const generator = new TextToText();

// Generate text
async function example() {
    const result = await generator.generateText({
        prompt: "Explain quantum computing simply",
        model: "openai",
        temperature: 0.7
    });

    if (result.success) {
        console.log(result.response);
    }
}

example();
```

## Authentication

PolliLibJS uses referrer-based authentication by default with the referrer `s-test-sk37AGI` (seed tier).

You can customize the referrer:

```javascript
const { PollinationsAPI } = require('pollilibjs');

const api = new PollinationsAPI({
    referrer: "your-referrer-here"
});
```

Or use a bearer token for backend applications:

```javascript
const api = new PollinationsAPI({
    bearerToken: "your-token-here"
});
```

## Examples

### Text-to-Image

```javascript
const { TextToImage } = require('pollilibjs');

const generator = new TextToImage();

async function generateImage() {
    const result = await generator.generateImage({
        prompt: "a serene mountain landscape at sunrise",
        model: "flux",
        width: 1280,
        height: 720,
        seed: 42,
        outputPath: "mountain.jpg"
    });

    if (result.success) {
        console.log(`Image saved to: ${result.outputPath}`);
    }
}

generateImage();
```

### Text-to-Text Chat

```javascript
const { TextToText } = require('pollilibjs');

const generator = new TextToText();

async function chat() {
    const result = await generator.chat({
        messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: "What's the weather like on Mars?" }
        ],
        model: "openai",
        temperature: 0.7,
        conversationId: "conv_001"
    });

    if (result.success) {
        console.log(`AI: ${result.response}`);
    }
}

chat();
```

### Multi-turn Conversation

```javascript
const { TextToText } = require('pollilibjs');

const generator = new TextToText();

async function conversation() {
    // First message
    let result = await generator.chat({
        messages: [
            { role: "user", content: "What's the capital of France?" }
        ],
        model: "openai",
        conversationId: "conv_001"
    });

    console.log(`AI: ${result.response}`);

    // Continue the conversation
    result = await generator.continueConversation(
        "conv_001",
        "What's the population?",
        { model: "openai" }
    );

    console.log(`AI: ${result.response}`);
}

conversation();
```

### Generate Image Variants

```javascript
const { TextToImage } = require('pollilibjs');

const generator = new TextToImage();

async function variants() {
    const results = await generator.generateVariants({
        prompt: "a cute robot holding a flower",
        n: 3,
        model: "flux",
        width: 1024,
        height: 1024,
        baseSeed: 100
    });

    const successful = results.filter(r => r.success).length;
    console.log(`Generated ${successful}/${results.length} variants successfully`);
}

variants();
```

## Module Reference

### Core Modules

- **pollylib.js**: Base library with common utilities
- **model-retrieval.js**: List and query available models
- **index.js**: Main entry point with all exports

### Generation Modules

- **text-to-image.js**: Image generation from text
- **text-to-text.js**: Text generation and chat
- **text-to-speech.js**: Speech synthesis
- **speech-to-text.js**: Audio transcription
- **image-to-text.js**: Vision and image analysis
- **image-to-image.js**: Image transformation

### Advanced Modules

- **function-calling.js**: Tool use and function calling
- **streaming-mode.js**: Real-time streaming responses

## Running Examples

Each module can be run as a standalone script to see examples:

```bash
# Text-to-image examples
node PolliLibJS/text-to-image.js

# Text-to-text examples
node PolliLibJS/text-to-text.js

# Test connection
node PolliLibJS/pollylib.js
```

## Access Tiers

| Tier      | Rate Limit           | Notes                          |
|-----------|----------------------|--------------------------------|
| Anonymous | 1 request / 15s      | No signup required             |
| Seed      | 1 request / 5s       | Free registration (default)    |
| Flower    | 1 request / 3s       | Paid tier                      |
| Nectar    | No limits            | Enterprise                     |

**Current Configuration**: This library uses the `s-test-sk37AGI` seed tier referrer.

## Best Practices

1. **Use Seeds for Determinism**: Set a seed value to get reproducible results
2. **Respect Rate Limits**: The library includes automatic retry logic
3. **Error Handling**: Always check the `success` field in results
4. **Save Outputs**: Specify output paths to save generated content
5. **Use async/await**: All methods return Promises

## Error Handling

All methods return an object with a `success` field:

```javascript
const result = await generator.generateText({ prompt: "Hello" });

if (result.success) {
    console.log(result.response);
} else {
    console.error(`Error: ${result.error}`);
}
```

## Browser Support

This library is designed for Node.js environments. For browser usage, you'll need to:

1. Use a bundler like webpack or rollup
2. Polyfill Node.js modules (fs, etc.)
3. Handle CORS restrictions

A browser-specific version may be provided in the future.

## Contributing

This library is part of the Unity AI Lab project. Contributions are welcome!

## License

This project follows the licensing of the parent repository.

## Resources

- [Pollinations.AI Documentation](https://github.com/pollinations/pollinations)
- [Pollinations.AI Authentication](https://auth.pollinations.ai)
- [API Documentation](../Docs/Pollinations_API_Documentation.md)

## Comparison with Python Version

This JavaScript library mirrors the functionality of PolliLibPy (the Python version):

- **PolliLibPy**: Python library located in `../PolliLibPy/`
- **PolliLibJS**: JavaScript library (this package)

Both libraries provide the same core functionality with language-specific idioms:
- Python uses class methods and dictionaries
- JavaScript uses async/await and objects

## Notes

- Image watermarks may apply on free tier (starting March 31, 2025)
- All retry logic uses exponential backoff with jitter
- Requires Node.js 14.0.0 or higher

---

Made with ❤️ for Unity AI Lab using Pollinations.AI
