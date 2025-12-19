# PolliLibPy - Python Library for Pollinations.AI

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## Overview

This is my SECOND baby, and I love it just as much as the JavaScript version. Actually, building this one was even MORE intense because I had to translate all the async JavaScript patterns into Python while maintaining the same beautiful API design.

*[sounds of furious typing in Python at 4am]*

PolliLibPy is the Pythonic twin of PolliLibJS - a rock-solid, production-ready Python library for interacting with the Pollinations.AI API. It provides clean, intuitive interfaces for text generation, image generation, speech synthesis, vision, and every other magical thing the Pollinations API offers.

I spent WEEKS making sure the Python version felt NATURAL to Python developers. Class-based architecture? Check. Snake_case everywhere? Check. Dictionary returns because that's the Python way? FUCK YES. Type hints? Eventually. (I got lazy, sue me.)

The error handling in this library makes me SO PROUD I could cry. The retry logic? *Magnifique*. The streaming implementation? PERFECTION. I literally tested this shit on my potato laptop AND my beefy desktop to make sure it worked everywhere.

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

PolliLibPy uses API key authentication. Two types of keys are available:

- **Publishable Keys (`pk_`)**: Client-side safe, IP rate-limited (3 req/burst, 1/15sec refill)
- **Secret Keys (`sk_`)**: Server-side only, no rate limits, can spend Pollen

Get your API key at [enter.pollinations.ai](https://enter.pollinations.ai)

```python
from PolliLibPy.pollylib import PollinationsAPI

# Uses default publishable key
api = PollinationsAPI()

# Or provide your own API key
api = PollinationsAPI(api_key="pk_your_key_here")
```

Authentication is sent via:
- Header: `Authorization: Bearer YOUR_API_KEY`
- Or query param: `?key=YOUR_API_KEY`

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

| Key Type     | Rate Limit                    | Notes                          |
|--------------|-------------------------------|--------------------------------|
| Publishable (`pk_`) | 3 req/burst, 1/15sec refill | Client-side safe, IP rate-limited |
| Secret (`sk_`)      | No limits                   | Server-side only, can spend Pollen |

**Current Configuration**: This library uses a default publishable API key (`pk_`).

## Best Practices

Real talk from someone who's made EVERY mistake so you don't have to:

1. **Use Seeds for Determinism**: Set a seed value to get reproducible results. I cannot STRESS this enough. You WILL generate the perfect image at 2am and then lose it forever because you didn't set a seed. Don't be like past-me. Learn from my pain.

2. **Enable Streaming**: For long text generation, use streaming mode. The streaming implementation in this library is fucking GORGEOUS. I spent days getting the SSE parsing right, handling connection drops, and making sure it yields cleanly. Use it. Love it. Appreciate it.

3. **Respect Rate Limits**: The library includes automatic retry logic with exponential backoff. This is basically the same beautiful implementation as the JS version, but Pythonified. It's smart, it's elegant, and it won't spam the API like an asshole.

4. **Error Handling**: Always check the `success` field in results. Every method returns `{'success': True/False, ...data}` because proper error handling is SEXY and I care about your sanity. No exceptions being thrown willy-nilly.

5. **Save Outputs**: Specify output paths to save generated content. The library handles path creation, directory management, all that boring shit you don't want to think about. I thought of it all so you don't have to.

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

Before you close this tab and start building amazing shit:

- **Image watermarks**: May apply on free tier starting March 31, 2025. But hey, FREE AI IMAGE GENERATION. The price is right.
- **Optional dependencies**: Some features (like advanced STT) may require additional libraries. I kept the base install LEAN because not everyone needs audio processing. Just `pip install requests` and you're good to go for 90% of use cases.
- **Stub functions**: Provided for testing/CI environments. Because I'm a professional and I think about YOUR deployment pipeline. You're welcome.
- **Retry logic**: Uses exponential backoff with jitter. This is the SAME beautiful algorithm from the JS version, just written in Python. I'm consistent like that. It's smart, it respects rate limits, and it won't cause thundering herd problems.

This library is my PRIDE. I poured my heart and SOUL into making it feel natural for Python developers. If you find issues, PLEASE tell me so I can fix them immediately because I cannot handle the thought of my baby being imperfect. Feature requests? I'm ALL EARS.

Also, fun fact: The Python version has MORE lines of code than the JS version (~5,700 vs ~3,700) because Python is more verbose and I added extra documentation. Worth it.

---
*Unity AI Lab - https://www.unityailab.com*

*Crafted with obsessive attention to detail, Pythonic principles, and an alarming amount of late-night coding sessions. But mostly love.*
