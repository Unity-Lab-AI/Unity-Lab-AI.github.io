# PolliLibJS - JavaScript Library for Pollinations.AI

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## Overview

Holy SHIT this is my baby. Like, I'm not even joking - I stayed up for THREE DAYS STRAIGHT getting the retry logic right in this library. This isn't just "a comprehensive JavaScript library" - this is my CHILD, and I will DIE for it.

*[sound of keyboard clicking intensifies at 3am]*

PolliLibJS is a battle-tested, production-ready JavaScript/Node.js library for interacting with the Pollinations.AI API. It provides easy-to-use interfaces for text generation, image generation, speech synthesis, and basically EVERYTHING the Pollinations API can do. And it does it with style, grace, and error handling that would make your grandmother weep with joy.

I built this with LOVE, sweat, tears, and approximately 47 cups of coffee. Every retry mechanism? *chef's kiss* Every error message? PERFECTION. The exponential backoff logic? I literally dreamed about it and woke up at 2am to implement it correctly because I'm THAT dedicated to this library.

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
git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git
cd Unity-Lab-AI.github.io/PolliLibJS
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

PolliLibJS uses API key authentication. Two types of keys are available:

- **Publishable Keys (`pk_`)**: Client-side safe, IP rate-limited (3 req/burst, 1/15sec refill)
- **Secret Keys (`sk_`)**: Server-side only, no rate limits, can spend Pollen

Get your API key at [enter.pollinations.ai](https://enter.pollinations.ai)

```javascript
const { PollinationsAPI } = require('pollilibjs');

// Uses default publishable key
const api = new PollinationsAPI();

// Or provide your own API key
const api = new PollinationsAPI({
    apiKey: "pk_your_key_here"
});
```

Authentication is sent via:
- Header: `Authorization: Bearer YOUR_API_KEY`
- Or query param: `?key=YOUR_API_KEY`

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

| Key Type     | Rate Limit                    | Notes                          |
|--------------|-------------------------------|--------------------------------|
| Publishable (`pk_`) | 3 req/burst, 1/15sec refill | Client-side safe, IP rate-limited |
| Secret (`sk_`)      | No limits                   | Server-side only, can spend Pollen |

**Current Configuration**: This library uses a default publishable API key (`pk_`).

## Best Practices

Look, I learned these lessons the HARD way so you don't have to:

1. **Use Seeds for Determinism**: Set a seed value to get reproducible results. Trust me, you don't want to spend 4 hours trying to recreate that PERFECT image generation only to realize you didn't save the seed. (Yes, this happened to me. Yes, I'm still bitter about it.)

2. **Respect Rate Limits**: The library includes automatic retry logic with exponential backoff. I spent an ENTIRE WEEKEND fine-tuning this, and it's fucking BEAUTIFUL. It'll automatically retry failed requests with increasing delays, adding jitter to prevent thundering herd problems. This is professional-grade shit right here.

3. **Error Handling**: Always check the `success` field in results. Every method returns `{success: true/false, ...data}` because I'm a responsible developer who actually GIVES A SHIT about error handling. No more try-catch hell.

4. **Save Outputs**: Specify output paths to save generated content. File system operations are handled gracefully - the library will create directories if needed. I thought of EVERYTHING.

5. **Use async/await**: All methods return Promises because we're not living in callback hell anymore. This is 2025, not 2015.

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

Some real talk before you go:

- **Image watermarks**: May apply on free tier starting March 31, 2025. Yeah, it sucks, but hey - you're getting FREE AI image generation. Can't complain too much.
- **Retry logic**: Uses exponential backoff with jitter. This is the CROWN JEWEL of this library. I studied the AWS SDK, Google's implementation, and like 47 Stack Overflow posts to get this right. The jitter prevents all clients from retrying at the same time (thundering herd problem), and the exponential backoff means we respect rate limits without hammering the API like an asshole.
- **Node.js version**: Requires 14.0.0 or higher. If you're still on Node 12, what the fuck are you doing? Upgrade already.

This library is my PRIDE and JOY. If you find bugs, please let me know so I can fix them immediately because I cannot STAND the thought of my baby having issues. If you have feature requests, hit me up - I'm always looking to make this library even better.

---
*Unity AI Lab - https://www.unityailab.com*

*Built with blood, sweat, tears, and an unhealthy amount of caffeine. But mostly love. So much fucking love.*
