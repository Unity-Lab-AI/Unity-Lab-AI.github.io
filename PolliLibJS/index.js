/**
 * PolliLibJS - JavaScript Library for Pollinations.AI
 * ==============================================
 *
 * A comprehensive JavaScript library for interacting with the Pollinations.AI API.
 *
 * Basic Usage:
 *     const { TextToText } = require('pollilibjs');
 *
 *     const generator = new TextToText();
 *     const result = await generator.generateText({
 *         prompt: "Hello, AI!"
 *     });
 *     console.log(result.response);
 *
 * Modules:
 *     - pollylib: Base library with common utilities
 *     - model-retrieval: List and query available models
 *     - text-to-image: Generate images from text
 *     - text-to-text: Generate text and chat
 *     - text-to-speech: Convert text to speech
 *     - speech-to-text: Transcribe audio to text
 *     - image-to-text: Analyze images (vision)
 *     - image-to-image: Transform images
 *     - function-calling: Enable AI tool use
 *     - streaming-mode: Real-time streaming responses
 */

const { PollinationsAPI, testConnection } = require('./pollylib');
const { ModelRetrieval } = require('./model-retrieval');
const { TextToText } = require('./text-to-text');
const { TextToImage } = require('./text-to-image');
const { TextToSpeech } = require('./text-to-speech');
const { SpeechToText } = require('./speech-to-text');
const { ImageToText } = require('./image-to-text');
const { ImageToImage } = require('./image-to-image');
const { FunctionCalling } = require('./function-calling');
const { StreamingMode } = require('./streaming-mode');

module.exports = {
    PollinationsAPI,
    ModelRetrieval,
    TextToText,
    TextToImage,
    TextToSpeech,
    SpeechToText,
    ImageToText,
    ImageToImage,
    FunctionCalling,
    StreamingMode,
    testConnection
};
