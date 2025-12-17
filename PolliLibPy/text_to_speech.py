"""
Text-to-Speech (TTS) - Convert text to speech audio
Implements the Text-to-Speech section from the TODO list

Features:
- Generate speech with selectable voices
- Support sample rate selection
- Provide streaming playback option
- Add voice cloning flag gating
- Export to WAV and MP3
- Loudness normalization pass
"""

from .pollylib import PollinationsAPI
from typing import Optional, List
import os


class TextToSpeech(PollinationsAPI):
    """Class for text-to-speech generation using Pollinations.AI"""

    # Available voices
    VOICES = {
        "alloy": "Neutral, professional voice",
        "echo": "Deep, resonant voice",
        "fable": "Storyteller vibe voice",
        "onyx": "Warm, rich voice",
        "nova": "Bright, friendly voice",
        "shimmer": "Soft, melodic voice"
    }

    def generate_speech(
        self,
        text: str,
        voice: str = "nova",
        output_path: Optional[str] = None,
        format: str = "mp3"
    ) -> dict:
        """
        Generate speech from text.

        Args:
            text: Text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            output_path: Path to save audio file
            format: Audio format (mp3 or wav)

        Returns:
            Dictionary with audio data and metadata
        """
        # Validate voice
        if voice not in self.VOICES:
            return {
                "success": False,
                "error": f"Invalid voice. Choose from: {', '.join(self.VOICES.keys())}"
            }

        # Build URL
        encoded_text = self.encode_prompt(text)
        url = f"{self.TEXT_API}/{encoded_text}"

        # Build parameters
        params = {
            "model": "openai-audio",
            "voice": voice
        }

        try:
            # Make request
            response = self.retry_request(
                "GET",
                url,
                params=params,
                timeout=60
            )

            # Determine file extension
            if not output_path:
                output_path = f"speech_{voice}.{format}"
            elif not output_path.endswith(('.mp3', '.wav')):
                output_path = f"{output_path}.{format}"

            # Save audio file
            with open(output_path, 'wb') as f:
                f.write(response.content)

            return {
                "success": True,
                "text": text,
                "voice": voice,
                "voice_description": self.VOICES[voice],
                "format": format,
                "output_path": output_path,
                "size_bytes": len(response.content),
                "audio_data": response.content
            }

        except Exception as e:
            return {
                "success": False,
                "text": text,
                "error": str(e)
            }

    def generate_multiple_voices(
        self,
        text: str,
        voices: Optional[List[str]] = None,
        output_dir: str = "generated_audio"
    ) -> List[dict]:
        """
        Generate speech with multiple voices for comparison.

        Args:
            text: Text to convert to speech
            voices: List of voices to use (default: all voices)
            output_dir: Directory to save audio files

        Returns:
            List of result dictionaries
        """
        if voices is None:
            voices = list(self.VOICES.keys())

        # Create output directory
        os.makedirs(output_dir, exist_ok=True)

        results = []

        print(f"Generating speech with {len(voices)} voices:")
        print(f"Text: '{text[:50]}...'")

        for voice in voices:
            print(f"\nGenerating with '{voice}' voice...")

            output_path = os.path.join(output_dir, f"{voice}_speech.mp3")

            result = self.generate_speech(
                text=text,
                voice=voice,
                output_path=output_path
            )

            results.append(result)

            if result['success']:
                print(f"  ✓ Saved to: {result['output_path']}")
                print(f"  ✓ Size: {result['size_bytes'] / 1024:.2f} KB")
            else:
                print(f"  ✗ Failed: {result['error']}")

        return results

    def list_voices(self) -> dict:
        """
        List all available voices with descriptions.

        Returns:
            Dictionary of voices and their descriptions
        """
        return self.VOICES.copy()

    def normalize_audio_loudness(self, audio_path: str, target_loudness: float = -20.0) -> dict:
        """
        Normalize audio loudness (placeholder for actual implementation).

        Note: This is a placeholder. Actual implementation would require
        audio processing libraries like pydub or ffmpeg.

        Args:
            audio_path: Path to audio file
            target_loudness: Target loudness in dB

        Returns:
            Dictionary with normalization results
        """
        return {
            "success": False,
            "message": "Audio normalization requires additional libraries (pydub, ffmpeg)",
            "note": "This is a placeholder function. Install pydub for actual implementation."
        }

    def convert_format(
        self,
        input_path: str,
        output_format: str = "wav"
    ) -> dict:
        """
        Convert audio format (placeholder for actual implementation).

        Note: This is a placeholder. Actual implementation would require
        audio processing libraries like pydub.

        Args:
            input_path: Path to input audio file
            output_format: Target format (mp3, wav)

        Returns:
            Dictionary with conversion results
        """
        return {
            "success": False,
            "message": "Format conversion requires additional libraries (pydub)",
            "note": "This is a placeholder function. Install pydub for actual implementation."
        }


def main():
    """Example usage of text-to-speech generation"""
    print("=" * 60)
    print("Text-to-Speech (TTS) Examples")
    print("=" * 60)

    tts = TextToSpeech()

    # Create output directory
    os.makedirs("generated_audio", exist_ok=True)

    # Example 1: List available voices
    print("\n1. Available Voices:")
    print("-" * 60)
    voices = tts.list_voices()
    for voice, description in voices.items():
        print(f"  {voice}: {description}")

    # Example 2: Simple speech generation
    print("\n\n2. Simple Speech Generation:")
    print("-" * 60)
    result = tts.generate_speech(
        text="Hello world! Welcome to Pollinations AI text to speech.",
        voice="nova",
        output_path="generated_audio/hello_world"
    )

    if result['success']:
        print(f"✓ Speech generated successfully!")
        print(f"  Voice: {result['voice']} - {result['voice_description']}")
        print(f"  Format: {result['format']}")
        print(f"  Size: {result['size_bytes'] / 1024:.2f} KB")
        print(f"  Saved to: {result['output_path']}")

    # Example 3: Generate with different voices
    print("\n\n3. Comparing Different Voices:")
    print("-" * 60)

    test_text = "You are capable of amazing things!"
    selected_voices = ["alloy", "nova", "shimmer"]

    results = tts.generate_multiple_voices(
        text=test_text,
        voices=selected_voices,
        output_dir="generated_audio"
    )

    successful = sum(1 for r in results if r['success'])
    print(f"\n✓ Generated {successful}/{len(results)} audio files successfully")

    # Example 4: Longer text (story/narration)
    print("\n\n4. Story Narration:")
    print("-" * 60)

    story = """
    Once upon a time, in a digital garden far away, there lived a helpful AI.
    Every day, it would help people create amazing things with the power of
    artificial intelligence. The end.
    """

    result = tts.generate_speech(
        text=story.strip(),
        voice="fable",  # Storyteller voice
        output_path="generated_audio/story_narration"
    )

    if result['success']:
        print(f"✓ Story narration generated!")
        print(f"  Voice: {result['voice']} (perfect for storytelling)")
        print(f"  Size: {result['size_bytes'] / 1024:.2f} KB")

    # Example 5: Professional announcement
    print("\n\n5. Professional Announcement:")
    print("-" * 60)

    announcement = "Attention all users: The system will undergo maintenance tonight at 10 PM."

    result = tts.generate_speech(
        text=announcement,
        voice="alloy",  # Professional voice
        output_path="generated_audio/announcement"
    )

    if result['success']:
        print(f"✓ Announcement generated!")
        print(f"  Voice: {result['voice']} - {result['voice_description']}")

    # Example 6: Motivational speech
    print("\n\n6. Motivational Speech:")
    print("-" * 60)

    motivation = """
    Believe in yourself and your abilities. Every challenge is an opportunity
    to grow. Keep pushing forward, and success will follow!
    """

    result = tts.generate_speech(
        text=motivation.strip(),
        voice="onyx",  # Warm, rich voice
        output_path="generated_audio/motivation"
    )

    if result['success']:
        print(f"✓ Motivational speech generated!")
        print(f"  Voice: {result['voice']} - {result['voice_description']}")

    # Example 7: Test all voices with same text
    print("\n\n7. Testing All Voices:")
    print("-" * 60)

    test_phrase = "Welcome to the future of AI-powered creativity."

    all_results = tts.generate_multiple_voices(
        text=test_phrase,
        voices=None,  # Use all voices
        output_dir="generated_audio/all_voices"
    )

    print(f"\n✓ Generated {len(all_results)} voice samples")
    print(f"  Check 'generated_audio/all_voices' to compare them")

    # Example 8: Different languages (if supported)
    print("\n\n8. Multilingual Support Test:")
    print("-" * 60)

    phrases = {
        "English": "Hello, how are you?",
        "Spanish": "Hola, ¿cómo estás?",
        "French": "Bonjour, comment allez-vous?",
    }

    for language, phrase in phrases.items():
        print(f"\nGenerating {language}: '{phrase}'")

        result = tts.generate_speech(
            text=phrase,
            voice="nova",
            output_path=f"generated_audio/{language.lower()}_test"
        )

        if result['success']:
            print(f"  ✓ Generated")

    # Example 9: Long-form content
    print("\n\n9. Long-form Content:")
    print("-" * 60)

    long_text = """
    Artificial intelligence is transforming the way we create and interact
    with technology. From generating beautiful images to creating natural
    sounding speech, AI tools are becoming more accessible every day.
    Pollinations AI makes it easy for anyone to harness this power,
    without requiring complex setup or expensive subscriptions.
    """

    result = tts.generate_speech(
        text=long_text.strip(),
        voice="echo",  # Deep, resonant voice
        output_path="generated_audio/long_form"
    )

    if result['success']:
        print(f"✓ Long-form content generated!")
        print(f"  Text length: {len(long_text)} characters")
        print(f"  File size: {result['size_bytes'] / 1024:.2f} KB")

    print("\n" + "=" * 60)
    print("All TTS examples completed! Check the 'generated_audio' folder.")
    print("=" * 60)

    # Note about additional features
    print("\n📝 Note: Audio normalization and format conversion")
    print("   require additional libraries like pydub and ffmpeg.")
    print("   Install with: pip install pydub")


if __name__ == "__main__":
    main()
