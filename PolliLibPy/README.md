# PolliLibPy - Python Library for Pollinations.AI

A comprehensive Python library for interacting with the Pollinations.AI API, providing easy-to-use interfaces for text generation, image generation, speech synthesis, vision, and more.

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

## Installation

### Requirements

```bash
pip install requests
```

### Optional Dependencies

For advanced features:

```bash
# For audio processing (STT/TTS enhancements)
pip install pydub librosa noisereduce

# For SSE streaming (real-time feeds)
pip install sseclient-py
```

## Quick Start

```python
from PolliLibPy.text_to_text import TextToText

# Initialize the client
generator = TextToText()

# Generate text
result = generator.generate_text(
    prompt="Explain quantum computing simply",
    model="openai",
    temperature=0.7
)

if result['success']:
    print(result['response'])
```

## Authentication

PolliLibPy uses referrer-based authentication by default with the referrer `s-test-sk37AGI` (seed tier).

You can customize the referrer:

```python
from PolliLibPy.pollylib import PollinationsAPI

api = PollinationsAPI(referrer="your-referrer-here")
```

Or use a bearer token for backend applications:

```python
api = PollinationsAPI(bearer_token="your-token-here")
```

## Examples

### Text-to-Image

```python
from PolliLibPy.text_to_image import TextToImage

generator = TextToImage()

result = generator.generate_image(
    prompt="a serene mountain landscape at sunrise",
    model="flux",
    width=1280,
    height=720,
    seed=42,
    output_path="mountain.jpg"
)

if result['success']:
    print(f"Image saved to: {result['output_path']}")
```

### Text-to-Speech

```python
from PolliLibPy.text_to_speech import TextToSpeech

tts = TextToSpeech()

result = tts.generate_speech(
    text="Hello! Welcome to Pollinations AI.",
    voice="nova",
    output_path="greeting.mp3"
)

if result['success']:
    print(f"Audio saved to: {result['output_path']}")
```

### Vision (Image Analysis)

```python
from PolliLibPy.image_to_text import ImageToText

vision = ImageToText()

result = vision.analyze_image_url(
    image_url="https://example.com/photo.jpg",
    prompt="What's in this image?",
    model="openai"
)

if result['success']:
    print(result['analysis'])
```

### Function Calling

```python
from PolliLibPy.function_calling import FunctionCalling

fc = FunctionCalling()

result = fc.call_with_functions(
    messages=[{"role": "user", "content": "What is 15 plus 27?"}],
    model="openai"
)

if result['success']:
    print(result['response'])
```

### Streaming Mode

```python
from PolliLibPy.streaming_mode import StreamingMode

streaming = StreamingMode()

stream = streaming.stream_text_simple(
    prompt="Write a short story about AI",
    model="openai"
)

for chunk in stream:
    print(chunk, end='', flush=True)
```

## Module Reference

### Core Modules

- **pollylib.py**: Base library with common utilities
- **model_retrieval.py**: List and query available models
- **retry_backoff.py**: Exponential backoff retry logic

### Generation Modules

- **text_to_image.py**: Image generation from text
- **text_to_text.py**: Text generation and chat
- **text_to_speech.py**: Speech synthesis
- **speech_to_text.py**: Audio transcription
- **image_to_text.py**: Vision and image analysis
- **image_to_image.py**: Image transformation

### Advanced Modules

- **function_calling.py**: Tool use and function calling
- **streaming_mode.py**: Real-time streaming responses

## Running Examples

Each module can be run as a standalone script to see examples:

```bash
# Model retrieval examples
python PolliLibPy/model_retrieval.py

# Text-to-image examples
python PolliLibPy/text_to_image.py

# Text-to-text examples
python PolliLibPy/text_to_text.py

# And so on...
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
2. **Enable Streaming**: For long text generation, use streaming mode
3. **Respect Rate Limits**: The library includes automatic retry logic
4. **Error Handling**: Always check the `success` field in results
5. **Save Outputs**: Specify output paths to save generated content

## Error Handling

All methods return a dictionary with a `success` field:

```python
result = generator.generate_text(prompt="Hello")

if result['success']:
    print(result['response'])
else:
    print(f"Error: {result['error']}")
```

## Contributing

This library is part of the Unity AI Lab project. Contributions are welcome!

## License

This project follows the licensing of the parent repository.

## Resources

- [Pollinations.AI Documentation](https://github.com/pollinations/pollinations)
- [Pollinations.AI Authentication](https://auth.pollinations.ai)
- [API Documentation](../Docs/Pollinations_API_Documentation.md)

## Notes

- Image watermarks may apply on free tier (starting March 31, 2025)
- Some features (like advanced STT) may require additional libraries
- Stub functions are provided for testing/CI environments
- All retry logic uses exponential backoff with jitter

---

Made with ❤️ for Unity AI Lab using Pollinations.AI
