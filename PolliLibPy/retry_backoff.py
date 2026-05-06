"""
Unity AI Lab
Creators: Hackall360, Sponge, GFourteen
https://www.unityailab.com
unityailabcontact@gmail.com
Version: v2.1.5
"""

"""
Exponential Backoff for Retries - Robust retry logic with exponential backoff
Implements the Exponential Backoff section from the TODO list

Features:
- Add jittered backoff strategy
- Respect Retry-After headers
- Configure max attempts
- Support idempotency keys
- Tag retried requests in logs
"""

from .pollylib import PollinationsAPI
import time
import random
from typing import Optional, Dict, Any, Callable
import hashlib
import json


class RetryBackoff(PollinationsAPI):
    """Class demonstrating exponential backoff retry strategies"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.retry_log = []  # Log of retry attempts

    def exponential_backoff_jittered(
        self,
        attempt: int,
        base_delay: float = 1.0,
        max_delay: float = 32.0,
        jitter_factor: float = 0.1
    ) -> float:
        """
        Calculate exponential backoff delay with jitter.

        Args:
            attempt: Current attempt number (0-indexed)
            base_delay: Base delay in seconds
            max_delay: Maximum delay cap
            jitter_factor: Amount of random jitter (0.0-1.0)

        Returns:
            Delay in seconds
        """
        # Calculate exponential delay
        delay = min(base_delay * (2 ** attempt), max_delay)

        # Add jitter to prevent thundering herd
        jitter = random.uniform(0, delay * jitter_factor)

        return delay + jitter

    def retry_with_backoff(
        self,
        operation: Callable,
        max_attempts: int = 4,
        base_delay: float = 2.0,
        max_delay: float = 32.0,
        idempotency_key: Optional[str] = None,
        retry_on: tuple = (Exception,),
        **operation_kwargs
    ) -> dict:
        """
        Execute an operation with exponential backoff retry logic.

        Args:
            operation: Function to execute
            max_attempts: Maximum number of attempts
            base_delay: Base delay between retries
            max_delay: Maximum delay cap
            idempotency_key: Optional key for idempotent operations
            retry_on: Tuple of exceptions to retry on
            **operation_kwargs: Arguments to pass to operation

        Returns:
            Dictionary with operation result and retry metadata
        """
        last_exception = None

        # Generate idempotency key if not provided
        if idempotency_key is None:
            idempotency_key = self._generate_idempotency_key(
                operation.__name__,
                operation_kwargs
            )

        for attempt in range(max_attempts):
            try:
                # Log the attempt
                self._log_retry(
                    operation_name=operation.__name__,
                    attempt=attempt,
                    idempotency_key=idempotency_key,
                    status="attempting"
                )

                # Execute the operation
                result = operation(**operation_kwargs)

                # Success!
                self._log_retry(
                    operation_name=operation.__name__,
                    attempt=attempt,
                    idempotency_key=idempotency_key,
                    status="success"
                )

                return {
                    "success": True,
                    "result": result,
                    "attempts": attempt + 1,
                    "idempotency_key": idempotency_key
                }

            except retry_on as e:
                last_exception = e

                # Log the failure
                self._log_retry(
                    operation_name=operation.__name__,
                    attempt=attempt,
                    idempotency_key=idempotency_key,
                    status="failed",
                    error=str(e)
                )

                # Don't wait after the last attempt
                if attempt < max_attempts - 1:
                    # Check for Retry-After header if exception has response
                    retry_after = self._get_retry_after(e)

                    if retry_after:
                        wait_time = retry_after
                        print(f"Server requested retry after {wait_time}s")
                    else:
                        wait_time = self.exponential_backoff_jittered(
                            attempt,
                            base_delay,
                            max_delay
                        )

                    print(f"Retry {attempt + 1}/{max_attempts} failed. "
                          f"Waiting {wait_time:.2f}s before retry...")

                    time.sleep(wait_time)

        # All attempts failed
        return {
            "success": False,
            "error": str(last_exception),
            "attempts": max_attempts,
            "idempotency_key": idempotency_key
        }

    def _generate_idempotency_key(
        self,
        operation_name: str,
        params: Dict[str, Any]
    ) -> str:
        """
        Generate an idempotency key from operation name and parameters.

        Args:
            operation_name: Name of the operation
            params: Operation parameters

        Returns:
            Idempotency key string
        """
        # Create a stable string representation of params
        params_str = json.dumps(params, sort_keys=True)

        # Hash the combination
        content = f"{operation_name}:{params_str}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _get_retry_after(self, exception: Exception) -> Optional[float]:
        """
        Extract Retry-After header from exception if available.

        Args:
            exception: The exception that was raised

        Returns:
            Retry-after delay in seconds, or None
        """
        # Check if exception has a response attribute (from requests)
        if hasattr(exception, 'response') and exception.response is not None:
            retry_after = exception.response.headers.get('Retry-After')

            if retry_after:
                try:
                    return float(retry_after)
                except ValueError:
                    # Retry-After might be a date, not a number
                    pass

        return None

    def _log_retry(
        self,
        operation_name: str,
        attempt: int,
        idempotency_key: str,
        status: str,
        error: Optional[str] = None
    ):
        """
        Log a retry attempt.

        Args:
            operation_name: Name of the operation
            attempt: Attempt number
            idempotency_key: Idempotency key
            status: Status of the attempt
            error: Error message if failed
        """
        log_entry = {
            "timestamp": time.time(),
            "operation": operation_name,
            "attempt": attempt,
            "idempotency_key": idempotency_key,
            "status": status
        }

        if error:
            log_entry["error"] = error

        self.retry_log.append(log_entry)

    def get_retry_log(self) -> list:
        """
        Get the retry log.

        Returns:
            List of retry log entries
        """
        return self.retry_log.copy()

    def clear_retry_log(self):
        """Clear the retry log"""
        self.retry_log = []


def main():
    """Example usage of exponential backoff retry logic"""
    print("=" * 60)
    print("Exponential Backoff for Retries Examples")
    print("=" * 60)

    retry = RetryBackoff()

    # Example 1: Basic backoff calculation
    print("\n1. Exponential Backoff Calculation:")
    print("-" * 60)

    for attempt in range(5):
        delay = retry.exponential_backoff_jittered(
            attempt,
            base_delay=1.0,
            max_delay=32.0,
            jitter_factor=0.1
        )
        print(f"Attempt {attempt}: Wait {delay:.2f}s before retry")

    # Example 2: Simulated successful operation after retries
    print("\n\n2. Successful Operation After Retries:")
    print("-" * 60)

    # Simulated operation that fails twice then succeeds
    attempt_counter = [0]

    def flaky_operation():
        attempt_counter[0] += 1
        if attempt_counter[0] < 3:
            raise Exception(f"Temporary failure (attempt {attempt_counter[0]})")
        return {"status": "success", "data": "Hello World"}

    result = retry.retry_with_backoff(
        operation=flaky_operation,
        max_attempts=5,
        base_delay=1.0
    )

    if result['success']:
        print(f"✓ Operation succeeded after {result['attempts']} attempts")
        print(f"  Result: {result['result']}")
        print(f"  Idempotency Key: {result['idempotency_key']}")

    # Example 3: Operation that exhausts all retries
    print("\n\n3. Operation Exhausting All Retries:")
    print("-" * 60)

    def always_fails():
        raise Exception("This operation always fails")

    result = retry.retry_with_backoff(
        operation=always_fails,
        max_attempts=3,
        base_delay=0.5,
        max_delay=2.0
    )

    if not result['success']:
        print(f"✗ Operation failed after {result['attempts']} attempts")
        print(f"  Error: {result['error']}")

    # Example 4: Idempotency key generation
    print("\n\n4. Idempotency Key Generation:")
    print("-" * 60)

    key1 = retry._generate_idempotency_key(
        "generate_image",
        {"prompt": "a cat", "seed": 42}
    )

    key2 = retry._generate_idempotency_key(
        "generate_image",
        {"prompt": "a cat", "seed": 42}
    )

    key3 = retry._generate_idempotency_key(
        "generate_image",
        {"prompt": "a dog", "seed": 42}
    )

    print(f"Same params: {key1}")
    print(f"Same params: {key2}")
    print(f"Different params: {key3}")
    print(f"Keys match: {key1 == key2}")
    print(f"Different: {key1 != key3}")

    # Example 5: Retry log inspection
    print("\n\n5. Retry Log Inspection:")
    print("-" * 60)

    # Clear previous log
    retry.clear_retry_log()

    # Run an operation
    def test_operation():
        if random.random() < 0.7:  # 70% failure rate
            raise Exception("Random failure")
        return "Success"

    result = retry.retry_with_backoff(
        operation=test_operation,
        max_attempts=5,
        base_delay=0.5
    )

    # Inspect the log
    log = retry.get_retry_log()
    print(f"\nRetry log ({len(log)} entries):")
    for entry in log:
        status_symbol = "✓" if entry['status'] == "success" else "✗" if entry['status'] == "failed" else "→"
        print(f"  {status_symbol} Attempt {entry['attempt']}: {entry['status']}")
        if 'error' in entry:
            print(f"     Error: {entry['error']}")

    # Example 6: Respecting Retry-After header (concept)
    print("\n\n6. Respecting Retry-After Header (Concept):")
    print("-" * 60)
    print("""
    When the API returns a 429 (Rate Limited) response:

    HTTP/1.1 429 Too Many Requests
    Retry-After: 60

    The retry logic will:
    1. Check for 'Retry-After' header
    2. Wait the specified time instead of exponential backoff
    3. Log the server-requested delay
    4. Retry the operation after waiting

    Example:
      Retry 1/4 failed. Server requested retry after 60s
      Waiting 60s before retry...
    """)

    # Example 7: Configurable retry strategies
    print("\n7. Configurable Retry Strategies:")
    print("-" * 60)

    strategies = [
        {"name": "Aggressive", "max_attempts": 5, "base_delay": 0.5, "max_delay": 8},
        {"name": "Moderate", "max_attempts": 4, "base_delay": 2.0, "max_delay": 32},
        {"name": "Conservative", "max_attempts": 3, "base_delay": 5.0, "max_delay": 60}
    ]

    for strategy in strategies:
        print(f"\n{strategy['name']} Strategy:")
        print(f"  Max attempts: {strategy['max_attempts']}")
        print(f"  Base delay: {strategy['base_delay']}s")
        print(f"  Max delay: {strategy['max_delay']}s")

        print("  Retry delays:")
        for attempt in range(strategy['max_attempts']):
            delay = retry.exponential_backoff_jittered(
                attempt,
                base_delay=strategy['base_delay'],
                max_delay=strategy['max_delay'],
                jitter_factor=0.1
            )
            print(f"    Attempt {attempt}: {delay:.2f}s")

    # Example 8: Jitter comparison
    print("\n\n8. Jitter Comparison:")
    print("-" * 60)
    print("Running same backoff calculation 5 times (shows jitter variation):\n")

    for i in range(5):
        delays = []
        for attempt in range(3):
            delay = retry.exponential_backoff_jittered(
                attempt,
                base_delay=2.0,
                jitter_factor=0.2
            )
            delays.append(f"{delay:.2f}s")

        print(f"  Run {i + 1}: {' → '.join(delays)}")

    print("\nNote: Each run has slightly different delays due to jitter")

    # Example 9: Best practices
    print("\n\n9. Best Practices:")
    print("-" * 60)
    print("""
    ✓ Always use exponential backoff for retries
    ✓ Add jitter to prevent thundering herd problem
    ✓ Respect server-provided Retry-After headers
    ✓ Use idempotency keys for critical operations
    ✓ Log all retry attempts for debugging
    ✓ Set reasonable max_attempts limit
    ✓ Cap maximum delay to prevent excessive waits
    ✓ Choose retry strategy based on operation criticality
    """)

    # Example 10: Integration with PolliLibPy
    print("\n10. Integration with PolliLibPy:")
    print("-" * 60)
    print("""
    PolliLibPy's retry_request() already implements exponential backoff:

    response = api.retry_request(
        "GET",
        url,
        max_retries=4,  # Default: 4
        timeout=60
    )

    Features:
    - Automatic exponential backoff
    - Jittered delays
    - Retry-After header support
    - Rate limit handling (429 responses)
    - Network error recovery

    The retry logic is built into all PolliLibPy methods!
    """)

    print("\n" + "=" * 60)
    print("Exponential backoff examples completed!")
    print("=" * 60)

    print("\n📝 Key Takeaways:")
    print("   - Exponential backoff prevents overwhelming servers")
    print("   - Jitter prevents synchronized retry storms")
    print("   - Respect Retry-After headers from server")
    print("   - Idempotency keys ensure safe retries")
    print("   - Logging helps debug retry patterns")
    print("   - Built into PolliLibPy's retry_request() method")


if __name__ == "__main__":
    main()
