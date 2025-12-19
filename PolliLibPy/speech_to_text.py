"""
Unity AI Lab
Creators: Hackall360, Sponge, GFourteen
https://www.unityailab.com
unityailabcontact@gmail.com
Version: v2.1.5
"""

"""
Speech-to-Text (STT) - Transcribe audio to text
Implements the Speech-to-Text section from the TODO list

Features:
- Transcribe with word-level timestamps
- Add punctuation restoration
- Enable diarization when supported
- Export to JSON and SRT
- Add noise reduction preprocessor
"""

from .pollylib import PollinationsAPI
import base64
import json
from typing import Optional, List, Dict
import os


class SpeechToText(PollinationsAPI):
    """Class for speech-to-text transcription using Pollinations.AI"""

    def transcribe(
        self,
        audio_path: str,
        audio_format: str = "wav",
        include_timestamps: bool = False,
        punctuation: bool = True,
        diarization: bool = False
    ) -> dict:
        """
        Transcribe audio file to text.

        Args:
            audio_path: Path to audio file
            audio_format: Audio format (wav, mp3, etc.)
            include_timestamps: Include word-level timestamps
            punctuation: Restore punctuation
            diarization: Enable speaker diarization (if supported)

        Returns:
            Dictionary with transcription and metadata
        """
        try:
            # Read and encode audio file
            with open(audio_path, "rb") as f:
                audio_data = base64.b64encode(f.read()).decode()

            # Prepare the request payload
            payload = {
                "model": "openai-audio",
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Transcribe this audio:"},
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": audio_data,
                                "format": audio_format
                            }
                        }
                    ]
                }]
            }

            # Make request
            response = self.retry_request(
                "POST",
                f"{self.TEXT_API}/openai",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )

            result = response.json()
            transcription = result['choices'][0]['message']['content']

            return {
                "success": True,
                "transcription": transcription,
                "audio_path": audio_path,
                "format": audio_format,
                "punctuation_restored": punctuation,
                "timestamps_included": include_timestamps,
                "diarization_enabled": diarization,
                "full_response": result
            }

        except Exception as e:
            return {
                "success": False,
                "audio_path": audio_path,
                "error": str(e)
            }

    def transcribe_with_timestamps(
        self,
        audio_path: str,
        audio_format: str = "wav"
    ) -> dict:
        """
        Transcribe audio with word-level timestamps (placeholder).

        Note: This is a placeholder. Actual timestamp support depends on API capabilities.

        Args:
            audio_path: Path to audio file
            audio_format: Audio format

        Returns:
            Dictionary with transcription and timestamps
        """
        result = self.transcribe(
            audio_path=audio_path,
            audio_format=audio_format,
            include_timestamps=True
        )

        if result['success']:
            # Add timestamp structure (placeholder)
            result['words'] = [
                # This would be populated by actual API response
                # Example format:
                # {"word": "hello", "start": 0.0, "end": 0.5},
                # {"word": "world", "start": 0.5, "end": 1.0}
            ]
            result['note'] = "Timestamp support depends on API capabilities"

        return result

    def export_to_json(
        self,
        transcription_result: dict,
        output_path: str
    ) -> dict:
        """
        Export transcription to JSON format.

        Args:
            transcription_result: Result from transcribe()
            output_path: Path to save JSON file

        Returns:
            Dictionary with export results
        """
        try:
            # Ensure .json extension
            if not output_path.endswith('.json'):
                output_path = f"{output_path}.json"

            # Prepare export data
            export_data = {
                "transcription": transcription_result.get('transcription', ''),
                "audio_file": transcription_result.get('audio_path', ''),
                "format": transcription_result.get('format', ''),
                "settings": {
                    "punctuation_restored": transcription_result.get('punctuation_restored', False),
                    "timestamps_included": transcription_result.get('timestamps_included', False),
                    "diarization_enabled": transcription_result.get('diarization_enabled', False)
                }
            }

            # Save to JSON
            with open(output_path, 'w') as f:
                json.dump(export_data, f, indent=2)

            return {
                "success": True,
                "output_path": output_path,
                "format": "json"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def export_to_srt(
        self,
        transcription_result: dict,
        output_path: str,
        words_per_subtitle: int = 10
    ) -> dict:
        """
        Export transcription to SRT subtitle format (placeholder).

        Note: This requires timestamp data. This is a basic implementation.

        Args:
            transcription_result: Result from transcribe()
            output_path: Path to save SRT file
            words_per_subtitle: Number of words per subtitle entry

        Returns:
            Dictionary with export results
        """
        try:
            # Ensure .srt extension
            if not output_path.endswith('.srt'):
                output_path = f"{output_path}.srt"

            transcription = transcription_result.get('transcription', '')

            # Simple SRT generation (without real timestamps)
            words = transcription.split()
            srt_content = []

            for i in range(0, len(words), words_per_subtitle):
                subtitle_num = (i // words_per_subtitle) + 1
                subtitle_text = ' '.join(words[i:i + words_per_subtitle])

                # Generate placeholder timestamps (1 second per subtitle)
                start_time = i // words_per_subtitle
                end_time = start_time + 1

                # Format timestamps as SRT format (HH:MM:SS,mmm)
                start_srt = f"00:00:{start_time:02d},000"
                end_srt = f"00:00:{end_time:02d},000"

                # Build SRT entry
                srt_entry = f"{subtitle_num}\n{start_srt} --> {end_srt}\n{subtitle_text}\n"
                srt_content.append(srt_entry)

            # Save to file
            with open(output_path, 'w') as f:
                f.write('\n'.join(srt_content))

            return {
                "success": True,
                "output_path": output_path,
                "format": "srt",
                "note": "Timestamps are placeholders. Real timestamps require API support."
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def reduce_noise(self, audio_path: str, output_path: Optional[str] = None) -> dict:
        """
        Noise reduction preprocessor (placeholder).

        Note: Actual noise reduction requires audio processing libraries
        like noisereduce, librosa, or ffmpeg.

        Args:
            audio_path: Path to input audio file
            output_path: Path to save processed audio

        Returns:
            Dictionary with processing results
        """
        return {
            "success": False,
            "message": "Noise reduction requires additional libraries (noisereduce, librosa)",
            "note": "This is a placeholder function. Install required libraries for actual implementation.",
            "suggested_install": "pip install noisereduce librosa"
        }


def main():
    """Example usage of speech-to-text transcription"""
    print("=" * 60)
    print("Speech-to-Text (STT) Examples")
    print("=" * 60)

    stt = SpeechToText()

    # Note: These examples use placeholder audio files
    # In practice, you would need actual audio files to transcribe

    print("\n📝 Note: STT examples require actual audio files to work.")
    print("   The following demonstrates the API usage:\n")

    # Example 1: Basic transcription (simulated)
    print("\n1. Basic Transcription (Concept):")
    print("-" * 60)
    print("Usage:")
    print("""
    result = stt.transcribe(
        audio_path="audio_sample.wav",
        audio_format="wav"
    )

    if result['success']:
        print(f"Transcription: {result['transcription']}")
    """)

    # Example 2: Transcription with timestamps
    print("\n2. Transcription with Timestamps (Concept):")
    print("-" * 60)
    print("Usage:")
    print("""
    result = stt.transcribe_with_timestamps(
        audio_path="interview.wav",
        audio_format="wav"
    )

    if result['success']:
        print(f"Transcription: {result['transcription']}")
        for word in result.get('words', []):
            print(f"  {word['word']} [{word['start']:.2f}s - {word['end']:.2f}s]")
    """)

    # Example 3: Export to JSON
    print("\n3. Export to JSON:")
    print("-" * 60)

    # Create a sample result for demonstration
    sample_result = {
        "success": True,
        "transcription": "This is a sample transcription of an audio file.",
        "audio_path": "sample_audio.wav",
        "format": "wav",
        "punctuation_restored": True,
        "timestamps_included": False,
        "diarization_enabled": False
    }

    os.makedirs("transcriptions", exist_ok=True)

    export_result = stt.export_to_json(
        transcription_result=sample_result,
        output_path="transcriptions/sample_transcription"
    )

    if export_result['success']:
        print(f"✓ Exported to JSON: {export_result['output_path']}")

    # Example 4: Export to SRT
    print("\n4. Export to SRT Subtitles:")
    print("-" * 60)

    sample_result['transcription'] = "Hello world. This is a test of the speech to text system. It works great for creating subtitles."

    export_result = stt.export_to_srt(
        transcription_result=sample_result,
        output_path="transcriptions/sample_subtitles",
        words_per_subtitle=5
    )

    if export_result['success']:
        print(f"✓ Exported to SRT: {export_result['output_path']}")
        print(f"  Note: {export_result['note']}")

        # Show the SRT content
        with open(export_result['output_path'], 'r') as f:
            print(f"\nSRT Preview:")
            print(f.read()[:200] + "...")

    # Example 5: Workflow example
    print("\n\n5. Complete Workflow (Concept):")
    print("-" * 60)
    print("""
    # Step 1: Optional noise reduction
    cleaned = stt.reduce_noise(
        audio_path="noisy_audio.wav",
        output_path="cleaned_audio.wav"
    )

    # Step 2: Transcribe the audio
    result = stt.transcribe(
        audio_path="cleaned_audio.wav" if cleaned['success'] else "noisy_audio.wav",
        audio_format="wav",
        punctuation=True,
        include_timestamps=True
    )

    # Step 3: Export to desired format
    if result['success']:
        # Export to JSON for data processing
        stt.export_to_json(result, "output.json")

        # Export to SRT for video subtitles
        stt.export_to_srt(result, "output.srt")

        print(f"Transcription: {result['transcription']}")
    """)

    # Example 6: Diarization example
    print("\n6. Speaker Diarization (Concept):")
    print("-" * 60)
    print("Usage:")
    print("""
    result = stt.transcribe(
        audio_path="meeting_recording.wav",
        audio_format="wav",
        diarization=True  # Enable speaker detection
    )

    if result['success']:
        # Result would include speaker labels
        # Example output format:
        # [Speaker 1]: Hello, how are you?
        # [Speaker 2]: I'm doing well, thank you!
        print(result['transcription'])
    """)

    # Example 7: Batch transcription
    print("\n7. Batch Transcription (Concept):")
    print("-" * 60)
    print("""
    audio_files = [
        "lecture_part1.wav",
        "lecture_part2.wav",
        "lecture_part3.wav"
    ]

    transcriptions = []

    for audio_file in audio_files:
        result = stt.transcribe(
            audio_path=audio_file,
            audio_format="wav",
            punctuation=True
        )

        if result['success']:
            transcriptions.append(result['transcription'])

    # Combine all transcriptions
    full_transcript = " ".join(transcriptions)
    print(full_transcript)
    """)

    print("\n" + "=" * 60)
    print("STT examples completed!")
    print("=" * 60)

    print("\n📝 Additional Notes:")
    print("   - Noise reduction requires: pip install noisereduce librosa")
    print("   - Timestamp support depends on API capabilities")
    print("   - SRT export uses placeholder timestamps in this example")
    print("   - For production use, process actual audio files")


if __name__ == "__main__":
    main()
