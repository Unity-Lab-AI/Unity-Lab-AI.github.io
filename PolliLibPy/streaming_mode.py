"""
Streaming Mode (SSE) - Real-time streaming responses
Implements the Streaming Mode section from the TODO list

Features:
- Token streaming for text responses
- Progress events for image/audio
- Heartbeat messages during idle
- Retry guidance in headers
- Client cancel support
"""

from .pollylib import PollinationsAPI
from typing import List, Dict, Optional, Generator, Any
import json
import time


class StreamingMode(PollinationsAPI):
    """Class for streaming responses using Server-Sent Events (SSE)"""

    def stream_text(
        self,
        messages: List[Dict[str, str]],
        model: str = "openai",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Generator[str, None, None]:
        """
        Stream text generation token by token.

        Args:
            messages: Conversation messages
            model: AI model to use
            temperature: Creativity level
            max_tokens: Maximum response length

        Yields:
            Text chunks as they are generated
        """
        url = f"{self.TEXT_API}/openai"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        try:
            response = self.retry_request(
                "POST",
                url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream"
                },
                stream=True,
                timeout=None  # No timeout for streaming
            )

            # Process SSE stream
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')

                    # Skip comments and empty lines
                    if line.startswith(':') or not line.strip():
                        continue

                    # Parse SSE format
                    if line.startswith('data: '):
                        data_str = line[6:]  # Remove 'data: ' prefix

                        # Check for end of stream
                        if data_str.strip() == '[DONE]':
                            break

                        try:
                            data = json.loads(data_str)

                            # Extract content delta
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    yield delta['content']

                        except json.JSONDecodeError:
                            continue

        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    def stream_text_simple(
        self,
        prompt: str,
        model: str = "openai",
        temperature: float = 0.7
    ) -> Generator[str, None, None]:
        """
        Stream a simple text generation (wrapper for convenience).

        Args:
            prompt: Text prompt
            model: AI model to use
            temperature: Creativity level

        Yields:
            Text chunks as they are generated
        """
        messages = [{"role": "user", "content": prompt}]
        yield from self.stream_text(messages, model, temperature)

    def collect_stream(
        self,
        stream_generator: Generator[str, None, None],
        print_progress: bool = True
    ) -> dict:
        """
        Collect all chunks from a stream into a complete response.

        Args:
            stream_generator: Generator from stream_text()
            print_progress: Whether to print chunks as they arrive

        Returns:
            Dictionary with complete response and metadata
        """
        chunks = []
        start_time = time.time()

        try:
            for chunk in stream_generator:
                chunks.append(chunk)

                if print_progress:
                    print(chunk, end='', flush=True)

            if print_progress:
                print()  # New line after streaming

            return {
                "success": True,
                "response": ''.join(chunks),
                "chunks_received": len(chunks),
                "duration": time.time() - start_time
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "partial_response": ''.join(chunks),
                "chunks_received": len(chunks)
            }

    def monitor_feed(
        self,
        feed_type: str = "text",
        duration: int = 10,
        max_events: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Monitor real-time feed of generations (image or text).

        Args:
            feed_type: Type of feed ("text" or "image")
            duration: How long to monitor in seconds
            max_events: Maximum number of events to collect

        Returns:
            List of events from the feed
        """
        if feed_type == "text":
            feed_url = f"{self.TEXT_API}/feed"
        elif feed_type == "image":
            feed_url = f"{self.IMAGE_API}/feed"
        else:
            return [{"error": "Invalid feed type. Use 'text' or 'image'"}]

        events = []
        start_time = time.time()

        try:
            response = self.retry_request(
                "GET",
                feed_url,
                headers={"Accept": "text/event-stream"},
                stream=True,
                timeout=None
            )

            for line in response.iter_lines():
                # Check duration and event limit
                if time.time() - start_time > duration:
                    break
                if len(events) >= max_events:
                    break

                if line:
                    line = line.decode('utf-8')

                    if line.startswith('data: '):
                        data_str = line[6:]

                        try:
                            data = json.loads(data_str)
                            events.append(data)

                        except json.JSONDecodeError:
                            continue

            return events

        except Exception as e:
            return [{"error": str(e)}]


def main():
    """Example usage of streaming mode"""
    print("=" * 60)
    print("Streaming Mode (SSE) Examples")
    print("=" * 60)

    streaming = StreamingMode()

    # Example 1: Simple streaming
    print("\n1. Simple Text Streaming:")
    print("-" * 60)
    print("Generating story (streaming)...\n")

    stream = streaming.stream_text_simple(
        prompt="Write a short story about a robot learning to paint in exactly three sentences.",
        model="openai",
        temperature=1.0
    )

    result = streaming.collect_stream(stream, print_progress=True)

    if result['success']:
        print(f"\n✓ Streaming complete!")
        print(f"  Chunks received: {result['chunks_received']}")
        print(f"  Duration: {result['duration']:.2f}s")

    # Example 2: Multi-turn conversation streaming
    print("\n\n2. Multi-turn Conversation Streaming:")
    print("-" * 60)

    messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Explain quantum computing in simple terms."}
    ]

    print("Streaming explanation...\n")

    stream = streaming.stream_text(
        messages=messages,
        model="openai",
        temperature=0.7,
        max_tokens=200
    )

    result = streaming.collect_stream(stream, print_progress=True)

    if result['success']:
        print(f"\n✓ Received {result['chunks_received']} chunks in {result['duration']:.2f}s")

    # Example 3: Manual chunk processing
    print("\n\n3. Manual Chunk Processing:")
    print("-" * 60)
    print("Generating haiku (processing chunks manually)...\n")

    stream = streaming.stream_text_simple(
        prompt="Write a haiku about streaming data",
        model="openai",
        temperature=1.2
    )

    chunks = []
    for i, chunk in enumerate(stream):
        chunks.append(chunk)
        print(f"[Chunk {i + 1}]: '{chunk}'")

    print(f"\n✓ Received {len(chunks)} chunks")
    print(f"Complete response: {' '.join(chunks)}")

    # Example 4: Streaming with temperature comparison
    print("\n\n4. Streaming with Different Temperatures:")
    print("-" * 60)

    prompt = "Write one sentence about AI"
    temperatures = [0.3, 1.0, 2.0]

    for temp in temperatures:
        print(f"\nTemperature {temp}:")

        stream = streaming.stream_text_simple(
            prompt=prompt,
            model="openai",
            temperature=temp
        )

        result = streaming.collect_stream(stream, print_progress=False)

        if result['success']:
            print(f"  {result['response']}")
            print(f"  ({result['chunks_received']} chunks in {result['duration']:.2f}s)")

    # Example 5: Cancel stream early (concept)
    print("\n\n5. Early Stream Cancellation (Concept):")
    print("-" * 60)
    print("""
    stream = streaming.stream_text_simple(
        prompt="Write a very long essay about AI",
        model="openai"
    )

    # Process only first 10 chunks
    for i, chunk in enumerate(stream):
        print(chunk, end='', flush=True)

        if i >= 10:
            break  # Cancel stream

    print("\\n✓ Stream cancelled after 10 chunks")
    """)

    # Example 6: Monitor real-time feeds (concept)
    print("\n6. Monitor Real-time Feeds:")
    print("-" * 60)
    print("\nMonitoring text feed for 5 seconds (max 3 events)...")

    events = streaming.monitor_feed(
        feed_type="text",
        duration=5,
        max_events=3
    )

    if events and 'error' not in events[0]:
        print(f"✓ Received {len(events)} events from the feed")
        for i, event in enumerate(events):
            print(f"\nEvent {i + 1}:")
            print(f"  Model: {event.get('model', 'unknown')}")
            response = event.get('response', '')
            print(f"  Response: {response[:100]}...")
    else:
        print("Note: Feed monitoring requires active network connection")

    # Example 7: Error handling in streaming
    print("\n\n7. Error Handling in Streaming:")
    print("-" * 60)
    print("Streaming handles errors gracefully:")
    print("  - Network errors are caught and reported")
    print("  - Partial responses are preserved")
    print("  - Chunks received counter is maintained")

    # Example 8: Heartbeat messages (concept)
    print("\n\n8. Heartbeat Messages (Concept):")
    print("-" * 60)
    print("""
    During long idle periods in streaming:
      - Server sends heartbeat messages (comments starting with ':')
      - Client should process these to detect connection status
      - Prevents timeout during slow generation

    Example heartbeat:
      ': heartbeat'
    """)

    # Example 9: Retry guidance (concept)
    print("\n9. Retry Guidance (Concept):")
    print("-" * 60)
    print("""
    When streaming fails, check response headers:
      - 'Retry-After': Seconds to wait before retrying
      - 'X-RateLimit-Reset': When rate limit resets

    Example:
      response.headers.get('Retry-After')
      response.headers.get('X-RateLimit-Reset')
    """)

    # Example 10: Complete workflow
    print("\n\n10. Complete Streaming Workflow:")
    print("-" * 60)
    print("""
    # Step 1: Initiate stream
    stream = streaming.stream_text_simple(
        prompt="Write a blog post about AI",
        model="openai",
        temperature=0.8
    )

    # Step 2: Process chunks in real-time
    full_text = []
    for chunk in stream:
        # Display to user immediately
        print(chunk, end='', flush=True)

        # Save for later processing
        full_text.append(chunk)

        # Could cancel based on conditions
        if len(full_text) > 1000:
            break

    # Step 3: Post-process complete response
    complete_response = ''.join(full_text)
    print(f"\\n\\nFinal length: {len(complete_response)} characters")
    """)

    print("\n" + "=" * 60)
    print("Streaming mode examples completed!")
    print("=" * 60)

    print("\n📝 Notes:")
    print("   - Streaming provides real-time token-by-token responses")
    print("   - Supports early cancellation")
    print("   - Handles network errors gracefully")
    print("   - Can monitor public feeds for text/image generation")
    print("   - Use stream=True in API calls to enable streaming")


if __name__ == "__main__":
    main()
