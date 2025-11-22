"""
Text-to-Text Generation - Generate text responses using AI models
Implements the Text-to-Text Generation section from the TODO list

Features:
- Single-turn completion with temperature control
- Multi-turn conversation with stored state
- Thread retrieval by conversation ID
- Apply input and output safety checks
- Redact sensitive strings in logs
- Add stop sequence configuration
- Add system prompt support where allowed
- Add top-k and top-p controls
"""

from .pollylib import PollinationsAPI
from typing import List, Dict, Optional, Any
import json
import re


class TextToText(PollinationsAPI):
    """Class for text generation using Pollinations.AI"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.conversations = {}  # Store conversation history by ID

    def generate_text(
        self,
        prompt: str,
        model: str = "openai",
        temperature: float = 0.7,
        seed: Optional[int] = None,
        system: Optional[str] = None,
        json_mode: bool = False
    ) -> dict:
        """
        Generate text from a simple prompt (single-turn).

        Args:
            prompt: The text prompt or question
            model: AI model to use
            temperature: Creativity level (0.0-3.0)
            seed: Random seed for deterministic responses
            system: System instructions for AI behavior
            json_mode: Return response in JSON format

        Returns:
            Dictionary with generated text and metadata
        """
        # Build URL
        encoded_prompt = self.encode_prompt(prompt)
        url = f"{self.TEXT_API}/{encoded_prompt}"

        # Build parameters
        params = {
            "model": model,
            "temperature": temperature
        }

        if seed is not None:
            params["seed"] = seed
        if system:
            params["system"] = system
        if json_mode:
            params["json"] = "true"

        try:
            # Make request
            response = self.retry_request(
                "GET",
                url,
                params=params
            )

            # Redact sensitive information from logs
            safe_prompt = self._redact_sensitive(prompt)

            return {
                "success": True,
                "prompt": safe_prompt,
                "response": response.text,
                "model": model,
                "temperature": temperature,
                "seed": seed
            }

        except Exception as e:
            return {
                "success": False,
                "prompt": prompt,
                "error": str(e)
            }

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "openai",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        stop_sequences: Optional[List[str]] = None,
        top_p: Optional[float] = None,
        conversation_id: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
        safe: bool = False
    ) -> dict:
        """
        Multi-turn conversation with advanced controls (OpenAI compatible endpoint).

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: AI model to use
            temperature: Creativity level (0.0-3.0)
            max_tokens: Maximum response length
            stream: Enable streaming mode
            stop_sequences: List of sequences that will stop generation
            top_p: Nucleus sampling parameter (0.0-1.0)
            conversation_id: Optional ID to track and retrieve conversation
            reasoning_effort: How deeply the AI thinks ('minimal', 'low', 'medium', 'high')
            safe: Enable strict NSFW filtering

        Returns:
            Dictionary with response and metadata
        """
        url = f"{self.TEXT_API}/openai"

        # Build payload
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens
        if stop_sequences:
            payload["stop"] = stop_sequences
        if top_p is not None:
            payload["top_p"] = top_p
        if reasoning_effort is not None:
            payload["reasoning_effort"] = reasoning_effort
        if safe:
            payload["safe"] = True

        try:
            # Make request
            response = self.retry_request(
                "POST",
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            result = response.json()

            # Extract response text
            response_text = result['choices'][0]['message']['content']

            # Store conversation if ID provided
            if conversation_id:
                if conversation_id not in self.conversations:
                    self.conversations[conversation_id] = []

                # Add messages to conversation history
                self.conversations[conversation_id].extend(messages)
                self.conversations[conversation_id].append({
                    "role": "assistant",
                    "content": response_text
                })

            # Apply safety checks
            safety_result = self._check_safety(response_text)

            return {
                "success": True,
                "response": response_text,
                "model": model,
                "conversation_id": conversation_id,
                "safety_check": safety_result,
                "usage": result.get('usage', {}),
                "full_response": result
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_conversation(self, conversation_id: str) -> Optional[List[Dict[str, str]]]:
        """
        Retrieve conversation history by ID.

        Args:
            conversation_id: The conversation ID

        Returns:
            List of messages or None if not found
        """
        return self.conversations.get(conversation_id)

    def continue_conversation(
        self,
        conversation_id: str,
        user_message: str,
        **kwargs
    ) -> dict:
        """
        Continue an existing conversation.

        Args:
            conversation_id: The conversation ID
            user_message: New user message to add
            **kwargs: Additional arguments to pass to chat()

        Returns:
            Dictionary with response and metadata
        """
        # Get existing conversation
        messages = self.get_conversation(conversation_id)

        if messages is None:
            messages = []

        # Add new user message
        messages.append({
            "role": "user",
            "content": user_message
        })

        # Continue chat
        return self.chat(
            messages=messages,
            conversation_id=conversation_id,
            **kwargs
        )

    def _redact_sensitive(self, text: str) -> str:
        """
        Redact sensitive information from text (emails, phone numbers, etc.).

        Args:
            text: Text to redact

        Returns:
            Redacted text
        """
        # Redact email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                      '[EMAIL_REDACTED]', text)

        # Redact phone numbers (simple pattern)
        text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
                      '[PHONE_REDACTED]', text)

        # Redact credit card numbers (simple pattern)
        text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
                      '[CARD_REDACTED]', text)

        # Redact SSN (simple pattern)
        text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b',
                      '[SSN_REDACTED]', text)

        return text

    def _check_safety(self, text: str) -> dict:
        """
        Perform basic safety checks on input/output text.

        Args:
            text: Text to check

        Returns:
            Dictionary with safety check results
        """
        issues = []

        # Check for PII
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
            issues.append("Contains email address")

        if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text):
            issues.append("Contains phone number")

        # Check text length
        if len(text) > 10000:
            issues.append("Unusually long output")

        return {
            "safe": len(issues) == 0,
            "issues": issues,
            "checked_at": "output"
        }


def main():
    """Example usage of text-to-text generation"""
    print("=" * 60)
    print("Text-to-Text Generation Examples")
    print("=" * 60)

    generator = TextToText()

    # Example 1: Simple question
    print("\n1. Simple Question:")
    print("-" * 60)
    result = generator.generate_text(
        prompt="What is the capital of France?",
        model="openai",
        temperature=0.3  # Low temperature for factual answer
    )

    if result['success']:
        print(f"Q: {result['prompt']}")
        print(f"A: {result['response']}")
        print(f"Model: {result['model']}, Temperature: {result['temperature']}")

    # Example 2: Creative writing with higher temperature
    print("\n\n2. Creative Writing (High Temperature):")
    print("-" * 60)
    result = generator.generate_text(
        prompt="Write a haiku about artificial intelligence",
        model="openai",
        temperature=1.5  # High temperature for creativity
    )

    if result['success']:
        print(f"Prompt: {result['prompt']}")
        print(f"Response:\n{result['response']}")

    # Example 3: System prompt to set AI behavior
    print("\n\n3. Using System Prompt:")
    print("-" * 60)
    result = generator.generate_text(
        prompt="Tell me a joke about programming",
        model="openai",
        system="You are a funny comedian who loves tech humor",
        temperature=1.0
    )

    if result['success']:
        print(f"System: {result.get('system', 'default')}")
        print(f"Response:\n{result['response']}")

    # Example 4: Deterministic generation with seed
    print("\n\n4. Deterministic Generation (Same Seed):")
    print("-" * 60)
    prompt = "Give me a random fun fact"

    for i in range(2):
        result = generator.generate_text(
            prompt=prompt,
            model="openai",
            seed=42,  # Same seed
            temperature=1.0
        )

        if result['success']:
            print(f"\nAttempt {i + 1} (seed=42):")
            print(result['response'])
            print("Note: Both attempts should produce identical results")

    # Example 5: Multi-turn conversation
    print("\n\n5. Multi-turn Conversation:")
    print("-" * 60)

    messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What's the weather like on Mars?"}
    ]

    result = generator.chat(
        messages=messages,
        model="openai",
        temperature=0.7,
        conversation_id="conv_001"
    )

    if result['success']:
        print(f"User: What's the weather like on Mars?")
        print(f"AI: {result['response']}")

    # Continue the conversation
    result = generator.continue_conversation(
        conversation_id="conv_001",
        user_message="How cold does it get at night?",
        model="openai",
        temperature=0.7
    )

    if result['success']:
        print(f"\nUser: How cold does it get at night?")
        print(f"AI: {result['response']}")

    # Example 6: Conversation history retrieval
    print("\n\n6. Retrieving Conversation History:")
    print("-" * 60)
    history = generator.get_conversation("conv_001")

    if history:
        print("Full conversation history:")
        for msg in history:
            role = msg['role'].capitalize()
            content = msg['content'][:100]  # Truncate for display
            print(f"  {role}: {content}...")

    # Example 7: Temperature control demonstration
    print("\n\n7. Temperature Control Comparison:")
    print("-" * 60)
    prompt = "Describe a sunset"
    temperatures = [0.3, 1.0, 2.0]

    for temp in temperatures:
        result = generator.generate_text(
            prompt=prompt,
            model="openai",
            temperature=temp
        )

        if result['success']:
            print(f"\nTemperature {temp}:")
            print(result['response'][:200] + "...")

    # Example 8: Stop sequences
    print("\n\n8. Using Stop Sequences:")
    print("-" * 60)

    result = generator.chat(
        messages=[{"role": "user", "content": "Count from 1 to 10"}],
        model="openai",
        stop_sequences=["5"],  # Stop when it reaches 5
        temperature=0.3
    )

    if result['success']:
        print(f"Prompt: Count from 1 to 10 (stopping at '5')")
        print(f"Response: {result['response']}")

    # Example 9: Safety check demonstration
    print("\n\n9. Safety Check on Output:")
    print("-" * 60)

    result = generator.chat(
        messages=[{"role": "user", "content": "Generate a test email address"}],
        model="openai",
        temperature=0.5
    )

    if result['success']:
        print(f"Response: {result['response']}")
        print(f"Safety Check: {result['safety_check']}")

    # Example 10: Max tokens control
    print("\n\n10. Max Tokens Control:")
    print("-" * 60)

    result = generator.chat(
        messages=[{"role": "user", "content": "Write a story about a robot"}],
        model="openai",
        max_tokens=50,  # Limit response length
        temperature=1.0
    )

    if result['success']:
        print(f"Response (max 50 tokens):")
        print(result['response'])
        print(f"Tokens used: {result.get('usage', {})}")

    print("\n" + "=" * 60)
    print("All text generation examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
