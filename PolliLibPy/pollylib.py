"""
PolliLibPy - Python Library for Pollinations.AI API
Base library with common utilities and authentication handling.
"""

import requests
import time
import random
from typing import Dict, Optional, Any
from urllib.parse import quote


class PollinationsAPI:
    """Base class for Pollinations.AI API interactions"""

    # API endpoints
    IMAGE_API = "https://image.pollinations.ai"
    TEXT_API = "https://text.pollinations.ai"

    # Default referrer for this application (seed tier)
    DEFAULT_REFERRER = "s-test-sk37AGI"

    def __init__(self, referrer: Optional[str] = None, bearer_token: Optional[str] = None):
        """
        Initialize the Pollinations API client.

        Args:
            referrer: Referrer string for web-based authentication (default: s-test-sk37AGI)
            bearer_token: Bearer token for backend authentication (optional)
        """
        self.referrer = referrer or self.DEFAULT_REFERRER
        self.bearer_token = bearer_token

    def _get_headers(self, additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Build request headers with authentication.

        Args:
            additional_headers: Additional headers to include

        Returns:
            Dictionary of headers
        """
        headers = {
            "User-Agent": "PolliLibPy/1.0 Python Client",
            "Referer": self.referrer
        }

        if self.bearer_token:
            headers["Authorization"] = f"Bearer {self.bearer_token}"

        if additional_headers:
            headers.update(additional_headers)

        return headers

    def exponential_backoff(self, attempt: int, max_delay: int = 32) -> float:
        """
        Calculate exponential backoff delay with jitter.

        Args:
            attempt: Current attempt number (0-indexed)
            max_delay: Maximum delay in seconds

        Returns:
            Delay in seconds
        """
        delay = min(2 ** attempt, max_delay)
        # Add jitter (random variation)
        jitter = random.uniform(0, delay * 0.1)
        return delay + jitter

    def retry_request(
        self,
        method: str,
        url: str,
        max_retries: int = 4,
        timeout: int = 60,
        **kwargs
    ) -> requests.Response:
        """
        Make a request with exponential backoff retry logic.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            max_retries: Maximum number of retry attempts
            timeout: Request timeout in seconds
            **kwargs: Additional arguments to pass to requests

        Returns:
            Response object

        Raises:
            requests.exceptions.RequestException: If all retries fail
        """
        # Ensure headers are included
        if 'headers' not in kwargs:
            kwargs['headers'] = self._get_headers()
        else:
            kwargs['headers'] = self._get_headers(kwargs['headers'])

        last_exception = None

        for attempt in range(max_retries + 1):
            try:
                response = requests.request(
                    method,
                    url,
                    timeout=timeout,
                    **kwargs
                )

                # Check for rate limiting
                if response.status_code == 429:
                    retry_after = response.headers.get('Retry-After')
                    if retry_after:
                        wait_time = int(retry_after)
                    else:
                        wait_time = self.exponential_backoff(attempt)

                    if attempt < max_retries:
                        print(f"Rate limited. Retrying after {wait_time:.2f}s...")
                        time.sleep(wait_time)
                        continue

                # Raise for other HTTP errors
                response.raise_for_status()
                return response

            except requests.exceptions.RequestException as e:
                last_exception = e

                if attempt < max_retries:
                    wait_time = self.exponential_backoff(attempt)
                    print(f"Request failed (attempt {attempt + 1}/{max_retries + 1}). "
                          f"Retrying after {wait_time:.2f}s...")
                    time.sleep(wait_time)
                else:
                    break

        # All retries failed
        raise last_exception

    def encode_prompt(self, prompt: str) -> str:
        """
        URL-encode a prompt string.

        Args:
            prompt: Text prompt to encode

        Returns:
            URL-encoded string
        """
        return quote(prompt)


def test_connection():
    """Test basic connection to Pollinations.AI"""
    api = PollinationsAPI()
    print("PolliLibPy initialized successfully!")
    print(f"Using referrer: {api.referrer}")
    print(f"Image API endpoint: {api.IMAGE_API}")
    print(f"Text API endpoint: {api.TEXT_API}")
    return api


if __name__ == "__main__":
    # Test the library
    print("=" * 50)
    print("PolliLibPy - Pollinations.AI Python Library")
    print("=" * 50)
    test_connection()
    print("\nLibrary ready to use!")
