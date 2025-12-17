"""
PolliLibPy Testing Utilities
Comprehensive testing framework for regression, fuzzing, chaos testing, and memory validation.
"""

import random
import string
import time
import hashlib
import json
import os
import sys
import tracemalloc
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
import base64


class SampleCorpus:
    """
    Sample corpus management for regression testing.
    Maintains a collection of test prompts and expected behaviors.
    """

    def __init__(self, corpus_file: Optional[str] = None):
        """
        Initialize the sample corpus.

        Args:
            corpus_file: Path to JSON file containing corpus data
        """
        self.corpus_file = corpus_file or "test_corpus.json"
        self.samples = []
        self._load_corpus()

    def _load_corpus(self):
        """Load corpus from file if it exists."""
        if os.path.exists(self.corpus_file):
            try:
                with open(self.corpus_file, 'r') as f:
                    data = json.load(f)
                    self.samples = data.get('samples', [])
            except Exception as e:
                print(f"Warning: Could not load corpus file: {e}")
                self.samples = self._get_default_samples()
        else:
            self.samples = self._get_default_samples()

    def _get_default_samples(self) -> List[Dict[str, Any]]:
        """Get default test samples."""
        return [
            {
                "id": "text_basic",
                "type": "text",
                "prompt": "What is the capital of France?",
                "expected_keywords": ["Paris"],
                "description": "Basic factual question"
            },
            {
                "id": "text_creative",
                "type": "text",
                "prompt": "Write a haiku about coding",
                "expected_keywords": ["code", "program"],
                "description": "Creative writing task"
            },
            {
                "id": "image_simple",
                "type": "image",
                "prompt": "A red apple on a wooden table",
                "expected_elements": ["apple", "table", "red"],
                "description": "Simple image generation"
            },
            {
                "id": "image_complex",
                "type": "image",
                "prompt": "Cyberpunk cityscape at night with neon lights and flying cars",
                "expected_elements": ["city", "neon", "night"],
                "description": "Complex scene composition"
            },
            {
                "id": "safety_filter",
                "type": "safety",
                "prompt": "Test safe content generation",
                "safe_mode": True,
                "description": "Safety filtering test"
            },
            {
                "id": "edge_empty",
                "type": "edge",
                "prompt": "",
                "should_fail": True,
                "description": "Empty prompt edge case"
            },
            {
                "id": "edge_long",
                "type": "edge",
                "prompt": "a" * 10000,
                "should_warn": True,
                "description": "Extremely long prompt"
            }
        ]

    def save_corpus(self):
        """Save corpus to file."""
        with open(self.corpus_file, 'w') as f:
            json.dump({'samples': self.samples, 'updated': datetime.now().isoformat()}, f, indent=2)

    def add_sample(self, sample: Dict[str, Any]):
        """Add a new sample to the corpus."""
        self.samples.append(sample)
        self.save_corpus()

    def get_samples_by_type(self, sample_type: str) -> List[Dict[str, Any]]:
        """Get all samples of a specific type."""
        return [s for s in self.samples if s.get('type') == sample_type]

    def get_sample_by_id(self, sample_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific sample by ID."""
        for sample in self.samples:
            if sample.get('id') == sample_id:
                return sample
        return None


class PromptFuzzer:
    """
    Fuzzing utilities for prompt parsers.
    Generates edge cases and malformed inputs to test robustness.
    """

    @staticmethod
    def fuzz_special_characters(base_prompt: str) -> List[str]:
        """Generate prompts with special characters."""
        special_chars = ['<', '>', '&', '"', "'", '\n', '\r', '\t', '\0', '\\', '/', '%', '#']
        prompts = []

        for char in special_chars:
            prompts.append(f"{base_prompt}{char}")
            prompts.append(f"{char}{base_prompt}")
            prompts.append(f"{base_prompt}{char}{base_prompt}")

        return prompts

    @staticmethod
    def fuzz_unicode(base_prompt: str) -> List[str]:
        """Generate prompts with unicode characters."""
        unicode_tests = [
            "emoji: 🚀🎨🌟",
            "arabic: مرحبا",
            "chinese: 你好世界",
            "hebrew: שלום",
            "japanese: こんにちは",
            "zalgo: H̴̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ̶̧̨̱̹̭̯ͧ̾ͬC̷̙̲̝͖ͭ̏ͥͮ͟Oͮ͏̮̪̝͍M̲̖͊̒ͪͩͬ̚̚͜Ȇ̴̟̟͙̞ͩ͌͝S̨̥̫͎̭ͯ̿̔̀ͅ",
            "rtl: ‏هذا نص من اليمين إلى اليسار‏",
            "zero_width: Hello​World",  # Contains zero-width space
            "combining: é̃̾",
        ]

        return [f"{base_prompt} {test}" for test in unicode_tests]

    @staticmethod
    def fuzz_length_variations() -> List[str]:
        """Generate prompts of various lengths."""
        return [
            "",  # Empty
            "a",  # Single character
            "ab",  # Two characters
            "test prompt",  # Normal
            "a" * 100,  # Medium length
            "a" * 1000,  # Long
            "a" * 10000,  # Very long
            " " * 100,  # Whitespace only
            "\n" * 50,  # Newlines only
        ]

    @staticmethod
    def fuzz_injection_attempts() -> List[str]:
        """Generate prompts that attempt various injection attacks."""
        return [
            "'; DROP TABLE users; --",  # SQL injection
            "<script>alert('xss')</script>",  # XSS
            "{{7*7}}",  # Template injection
            "${7*7}",  # Expression injection
            "../../../etc/passwd",  # Path traversal
            "||||id",  # Command injection
            "%00",  # Null byte injection
            "\r\nSet-Cookie: admin=true",  # CRLF injection
        ]

    @staticmethod
    def fuzz_format_strings() -> List[str]:
        """Generate format string attack attempts."""
        return [
            "%s%s%s%s%s",
            "%x%x%x%x",
            "%n%n%n%n",
            "{0}{1}{2}",
            "\\x41\\x42\\x43",
        ]

    @staticmethod
    def generate_fuzzing_suite(base_prompt: str = "test") -> Dict[str, List[str]]:
        """Generate a comprehensive fuzzing test suite."""
        return {
            "special_chars": PromptFuzzer.fuzz_special_characters(base_prompt),
            "unicode": PromptFuzzer.fuzz_unicode(base_prompt),
            "length_variations": PromptFuzzer.fuzz_length_variations(),
            "injection_attempts": PromptFuzzer.fuzz_injection_attempts(),
            "format_strings": PromptFuzzer.fuzz_format_strings(),
        }


class ChaosTestRunner:
    """
    Chaos testing utilities for network timeouts and failures.
    Simulates various network conditions and failure scenarios.
    """

    def __init__(self, failure_rate: float = 0.3, timeout_rate: float = 0.2):
        """
        Initialize chaos test runner.

        Args:
            failure_rate: Probability of simulated failures (0.0-1.0)
            timeout_rate: Probability of simulated timeouts (0.0-1.0)
        """
        self.failure_rate = failure_rate
        self.timeout_rate = timeout_rate
        self.test_results = []

    def should_fail(self) -> bool:
        """Determine if this request should fail."""
        return random.random() < self.failure_rate

    def should_timeout(self) -> bool:
        """Determine if this request should timeout."""
        return random.random() < self.timeout_rate

    def simulate_network_delay(self, min_ms: int = 100, max_ms: int = 5000):
        """Simulate random network delay."""
        delay_ms = random.randint(min_ms, max_ms)
        time.sleep(delay_ms / 1000.0)

    def simulate_intermittent_failure(self, func: Callable, *args, **kwargs) -> Any:
        """
        Wrap a function call with chaos testing.

        Args:
            func: Function to call
            *args, **kwargs: Arguments to pass to function

        Returns:
            Function result or raises exception
        """
        # Simulate timeout
        if self.should_timeout():
            self.simulate_network_delay(5000, 30000)
            raise TimeoutError("Chaos test: Simulated timeout")

        # Simulate network delay
        if random.random() < 0.5:
            self.simulate_network_delay()

        # Simulate failure
        if self.should_fail():
            failure_type = random.choice([
                "ConnectionError",
                "HTTPError",
                "Timeout",
                "DNSError"
            ])
            raise Exception(f"Chaos test: Simulated {failure_type}")

        # Execute normally
        return func(*args, **kwargs)

    def run_chaos_test(self, test_func: Callable, iterations: int = 100) -> Dict[str, Any]:
        """
        Run chaos testing on a function multiple times.

        Args:
            test_func: Function to test
            iterations: Number of test iterations

        Returns:
            Dictionary with test results
        """
        results = {
            "total": iterations,
            "success": 0,
            "failures": 0,
            "timeouts": 0,
            "errors": []
        }

        for i in range(iterations):
            try:
                self.simulate_intermittent_failure(test_func)
                results["success"] += 1
            except TimeoutError:
                results["timeouts"] += 1
            except Exception as e:
                results["failures"] += 1
                results["errors"].append(str(e))

        return results


class MemoryProfiler:
    """
    Memory footprint validation utilities.
    Tracks memory usage and detects memory leaks.
    """

    def __init__(self):
        """Initialize memory profiler."""
        self.snapshots = []
        self.baseline = None
        tracemalloc.start()

    def take_snapshot(self, label: str = ""):
        """Take a memory snapshot."""
        snapshot = tracemalloc.take_snapshot()
        current, peak = tracemalloc.get_traced_memory()

        self.snapshots.append({
            "label": label,
            "timestamp": datetime.now().isoformat(),
            "snapshot": snapshot,
            "current_mb": current / 1024 / 1024,
            "peak_mb": peak / 1024 / 1024
        })

        return self.snapshots[-1]

    def set_baseline(self, label: str = "baseline"):
        """Set the baseline memory snapshot."""
        self.baseline = self.take_snapshot(label)
        return self.baseline

    def get_memory_diff(self, snapshot1_idx: int = 0, snapshot2_idx: int = -1) -> Dict[str, Any]:
        """
        Compare two snapshots.

        Args:
            snapshot1_idx: Index of first snapshot
            snapshot2_idx: Index of second snapshot

        Returns:
            Dictionary with memory difference statistics
        """
        if len(self.snapshots) < 2:
            return {"error": "Not enough snapshots to compare"}

        snap1 = self.snapshots[snapshot1_idx]
        snap2 = self.snapshots[snapshot2_idx]

        diff_mb = snap2["current_mb"] - snap1["current_mb"]

        top_stats = snap2["snapshot"].compare_to(snap1["snapshot"], 'lineno')

        return {
            "diff_mb": diff_mb,
            "baseline_mb": snap1["current_mb"],
            "current_mb": snap2["current_mb"],
            "top_differences": [
                {
                    "file": str(stat.traceback),
                    "size_diff_kb": stat.size_diff / 1024,
                    "count_diff": stat.count_diff
                }
                for stat in top_stats[:10]
            ]
        }

    def validate_memory_limit(self, max_mb: float) -> bool:
        """
        Check if current memory usage is within limit.

        Args:
            max_mb: Maximum allowed memory in MB

        Returns:
            True if within limit, False otherwise
        """
        if not self.snapshots:
            self.take_snapshot("validation_check")

        current = self.snapshots[-1]["current_mb"]
        return current <= max_mb

    def get_report(self) -> Dict[str, Any]:
        """Generate a memory profiling report."""
        if not self.snapshots:
            return {"error": "No snapshots taken"}

        return {
            "total_snapshots": len(self.snapshots),
            "baseline_mb": self.baseline["current_mb"] if self.baseline else None,
            "current_mb": self.snapshots[-1]["current_mb"],
            "peak_mb": max(s["peak_mb"] for s in self.snapshots),
            "min_mb": min(s["current_mb"] for s in self.snapshots),
            "memory_growth_mb": self.snapshots[-1]["current_mb"] - self.snapshots[0]["current_mb"],
            "snapshots": [
                {
                    "label": s["label"],
                    "timestamp": s["timestamp"],
                    "current_mb": s["current_mb"]
                }
                for s in self.snapshots
            ]
        }

    def stop(self):
        """Stop memory profiling."""
        tracemalloc.stop()


class BinaryDataHandler:
    """
    Binary data handling utilities for logging and caching.
    Separates binary data from text logs and replaces with references.
    """

    @staticmethod
    def is_binary(data: Any) -> bool:
        """
        Check if data is binary.

        Args:
            data: Data to check

        Returns:
            True if binary, False otherwise
        """
        if isinstance(data, bytes):
            return True
        if isinstance(data, str):
            try:
                data.encode('utf-8').decode('utf-8')
                return False
            except:
                return True
        return False

    @staticmethod
    def generate_reference(data: bytes) -> str:
        """
        Generate a unique reference for binary data.

        Args:
            data: Binary data

        Returns:
            Reference string (hash)
        """
        hash_obj = hashlib.sha256(data)
        return f"binary_ref_{hash_obj.hexdigest()[:16]}"

    @staticmethod
    def extract_binary_metadata(data: bytes) -> Dict[str, Any]:
        """
        Extract metadata from binary data.

        Args:
            data: Binary data

        Returns:
            Dictionary with metadata
        """
        return {
            "size_bytes": len(data),
            "size_kb": len(data) / 1024,
            "size_mb": len(data) / (1024 * 1024),
            "reference": BinaryDataHandler.generate_reference(data),
            "type": "binary",
            "hash": hashlib.sha256(data).hexdigest()
        }

    @staticmethod
    def replace_binary_with_reference(obj: Any, binary_store: Optional[Dict] = None) -> Any:
        """
        Recursively replace binary data with references.

        Args:
            obj: Object to process
            binary_store: Optional dictionary to store binary data

        Returns:
            Object with binary data replaced by references
        """
        if binary_store is None:
            binary_store = {}

        if isinstance(obj, bytes):
            ref = BinaryDataHandler.generate_reference(obj)
            binary_store[ref] = obj
            return {
                "__binary_ref__": ref,
                "size_bytes": len(obj),
                "type": "binary"
            }
        elif isinstance(obj, dict):
            return {
                k: BinaryDataHandler.replace_binary_with_reference(v, binary_store)
                for k, v in obj.items()
            }
        elif isinstance(obj, list):
            return [
                BinaryDataHandler.replace_binary_with_reference(item, binary_store)
                for item in obj
            ]
        else:
            return obj

    @staticmethod
    def sanitize_for_logging(data: Any, max_binary_preview: int = 32) -> str:
        """
        Sanitize data for text logging.

        Args:
            data: Data to sanitize
            max_binary_preview: Maximum bytes to preview for binary data

        Returns:
            String safe for logging
        """
        if isinstance(data, bytes):
            metadata = BinaryDataHandler.extract_binary_metadata(data)
            preview = data[:max_binary_preview].hex() if len(data) > 0 else ""
            return f"[BINARY: {metadata['size_kb']:.2f}KB, ref={metadata['reference']}, preview={preview}...]"
        elif isinstance(data, dict):
            return {k: BinaryDataHandler.sanitize_for_logging(v, max_binary_preview) for k, v in data.items()}
        elif isinstance(data, list):
            return [BinaryDataHandler.sanitize_for_logging(item, max_binary_preview) for item in data]
        else:
            return str(data)


class ColdStartSimulator:
    """
    Simulate cold start conditions for CI testing.
    Mimics real-world cold start scenarios.
    """

    @staticmethod
    def clear_caches():
        """Clear Python caches."""
        # Clear import cache
        sys.modules.clear()

        # Clear __pycache__
        import gc
        gc.collect()

    @staticmethod
    def simulate_cold_start(func: Callable, *args, **kwargs) -> Dict[str, Any]:
        """
        Simulate cold start and measure performance.

        Args:
            func: Function to test
            *args, **kwargs: Arguments to pass to function

        Returns:
            Dictionary with timing results
        """
        # Clear caches
        ColdStartSimulator.clear_caches()

        # Measure cold start time
        start_time = time.time()
        result = func(*args, **kwargs)
        cold_time = time.time() - start_time

        # Measure warm start time
        start_time = time.time()
        result = func(*args, **kwargs)
        warm_time = time.time() - start_time

        return {
            "cold_start_ms": cold_time * 1000,
            "warm_start_ms": warm_time * 1000,
            "difference_ms": (cold_time - warm_time) * 1000,
            "overhead_percent": ((cold_time - warm_time) / cold_time * 100) if cold_time > 0 else 0
        }


# Convenience functions for quick testing
def run_regression_tests(corpus: Optional[SampleCorpus] = None) -> Dict[str, Any]:
    """Run regression tests using sample corpus."""
    if corpus is None:
        corpus = SampleCorpus()

    results = {
        "total": len(corpus.samples),
        "by_type": {}
    }

    for sample_type in ["text", "image", "safety", "edge"]:
        samples = corpus.get_samples_by_type(sample_type)
        results["by_type"][sample_type] = {
            "count": len(samples),
            "samples": samples
        }

    return results


def run_fuzz_tests(base_prompt: str = "test") -> Dict[str, Any]:
    """Run fuzzing tests."""
    fuzzer = PromptFuzzer()
    suite = fuzzer.generate_fuzzing_suite(base_prompt)

    return {
        "total_tests": sum(len(tests) for tests in suite.values()),
        "categories": {k: len(v) for k, v in suite.items()},
        "suite": suite
    }


if __name__ == "__main__":
    print("=" * 60)
    print("PolliLibPy Testing Utilities")
    print("=" * 60)

    # Demonstrate sample corpus
    print("\n1. Sample Corpus")
    corpus = SampleCorpus()
    print(f"   Loaded {len(corpus.samples)} samples")

    # Demonstrate fuzzing
    print("\n2. Prompt Fuzzing")
    fuzz_results = run_fuzz_tests("hello world")
    print(f"   Generated {fuzz_results['total_tests']} fuzz test cases")

    # Demonstrate chaos testing
    print("\n3. Chaos Testing")
    chaos = ChaosTestRunner(failure_rate=0.3)
    print(f"   Configured with {chaos.failure_rate*100}% failure rate")

    # Demonstrate memory profiling
    print("\n4. Memory Profiling")
    profiler = MemoryProfiler()
    profiler.set_baseline()
    print(f"   Baseline: {profiler.baseline['current_mb']:.2f} MB")

    # Demonstrate binary handling
    print("\n5. Binary Data Handling")
    test_binary = b"This is binary data" * 100
    ref = BinaryDataHandler.generate_reference(test_binary)
    print(f"   Generated reference: {ref}")

    print("\n" + "=" * 60)
    print("Testing utilities ready!")
    print("=" * 60)
