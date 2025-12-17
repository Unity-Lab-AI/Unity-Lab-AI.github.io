"""
PolliLibPy - Python Library for Pollinations.AI
==============================================

A comprehensive Python library for interacting with the Pollinations.AI API.

Basic Usage:
    from PolliLibPy.text_to_text import TextToText

    generator = TextToText()
    result = generator.generate_text("Hello, AI!")
    print(result['response'])

Modules:
    - pollylib: Base library with common utilities
    - model_retrieval: List and query available models
    - text_to_image: Generate images from text
    - text_to_text: Generate text and chat
    - text_to_speech: Convert text to speech
    - speech_to_text: Transcribe audio to text
    - image_to_text: Analyze images (vision)
    - image_to_image: Transform images
    - function_calling: Enable AI tool use
    - streaming_mode: Real-time streaming responses
    - retry_backoff: Exponential backoff retry logic
"""

__version__ = "1.0.0"
__author__ = "Unity AI Lab"
__license__ = "MIT"

# Import main classes for easy access
from .pollylib import PollinationsAPI
from .model_retrieval import ModelRetrieval
from .text_to_image import TextToImage
from .text_to_text import TextToText
from .text_to_speech import TextToSpeech
from .speech_to_text import SpeechToText
from .image_to_text import ImageToText
from .image_to_image import ImageToImage
from .function_calling import FunctionCalling
from .streaming_mode import StreamingMode
from .retry_backoff import RetryBackoff

__all__ = [
    'PollinationsAPI',
    'ModelRetrieval',
    'TextToImage',
    'TextToText',
    'TextToSpeech',
    'SpeechToText',
    'ImageToText',
    'ImageToImage',
    'FunctionCalling',
    'StreamingMode',
    'RetryBackoff'
]
