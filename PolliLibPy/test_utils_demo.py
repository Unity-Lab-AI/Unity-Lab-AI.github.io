"""
Demonstration of PolliLibPy Testing Utilities
Shows how to use the testing framework in practice.
"""

import sys
import time
from test_utils import (
    SampleCorpus,
    PromptFuzzer,
    ChaosTestRunner,
    MemoryProfiler,
    BinaryDataHandler,
    ColdStartSimulator,
    run_regression_tests,
    run_fuzz_tests
)


def demo_sample_corpus():
    """Demonstrate sample corpus functionality."""
    print("\n" + "=" * 60)
    print("DEMO 1: Sample Corpus for Regression Testing")
    print("=" * 60)

    corpus = SampleCorpus()
    print(f"\nLoaded {len(corpus.samples)} default samples")

    # Get samples by type
    text_samples = corpus.get_samples_by_type("text")
    print(f"\nText samples: {len(text_samples)}")
    for sample in text_samples:
        print(f"  - {sample['id']}: {sample['description']}")

    image_samples = corpus.get_samples_by_type("image")
    print(f"\nImage samples: {len(image_samples)}")
    for sample in image_samples:
        print(f"  - {sample['id']}: {sample['description']}")

    # Add a custom sample
    custom_sample = {
        "id": "custom_test_1",
        "type": "text",
        "prompt": "Explain quantum computing in simple terms",
        "expected_keywords": ["quantum", "bit", "superposition"],
        "description": "Custom technical explanation test"
    }
    print(f"\nAdding custom sample: {custom_sample['id']}")

    # Run regression test suite
    print("\nRunning regression test suite...")
    results = run_regression_tests(corpus)
    print(f"Total samples: {results['total']}")
    for sample_type, data in results['by_type'].items():
        print(f"  {sample_type}: {data['count']} samples")


def demo_fuzzing():
    """Demonstrate prompt fuzzing."""
    print("\n" + "=" * 60)
    print("DEMO 2: Prompt Fuzzing")
    print("=" * 60)

    base_prompt = "Generate an image of a cat"

    # Generate fuzzing suite
    print(f"\nGenerating fuzz tests for: '{base_prompt}'")
    results = run_fuzz_tests(base_prompt)

    print(f"\nTotal fuzz tests generated: {results['total_tests']}")
    for category, count in results['categories'].items():
        print(f"  {category}: {count} tests")

    # Show some examples
    print("\nExample fuzzing tests:")
    suite = results['suite']

    print("\n  Special Characters (first 3):")
    for test in suite['special_chars'][:3]:
        print(f"    {repr(test)}")

    print("\n  Unicode Tests (first 3):")
    for test in suite['unicode'][:3]:
        print(f"    {repr(test)}")

    print("\n  Injection Attempts (first 3):")
    for test in suite['injection_attempts'][:3]:
        print(f"    {repr(test)}")


def demo_chaos_testing():
    """Demonstrate chaos testing."""
    print("\n" + "=" * 60)
    print("DEMO 3: Chaos Testing for Network Failures")
    print("=" * 60)

    # Create a simple test function
    def mock_api_call():
        """Mock API call that would normally succeed."""
        time.sleep(0.01)  # Simulate small delay
        return {"status": "success"}

    # Run chaos test
    chaos = ChaosTestRunner(failure_rate=0.3, timeout_rate=0.2)
    print(f"\nRunning chaos test with:")
    print(f"  Failure rate: {chaos.failure_rate * 100}%")
    print(f"  Timeout rate: {chaos.timeout_rate * 100}%")
    print(f"  Iterations: 50")

    print("\nRunning tests...")
    results = chaos.run_chaos_test(mock_api_call, iterations=50)

    print(f"\nResults:")
    print(f"  Total tests: {results['total']}")
    print(f"  Successful: {results['success']} ({results['success']/results['total']*100:.1f}%)")
    print(f"  Failed: {results['failures']} ({results['failures']/results['total']*100:.1f}%)")
    print(f"  Timeouts: {results['timeouts']} ({results['timeouts']/results['total']*100:.1f}%)")

    if results['errors']:
        print(f"\n  Sample errors (first 3):")
        for error in results['errors'][:3]:
            print(f"    - {error}")


def demo_memory_profiling():
    """Demonstrate memory profiling."""
    print("\n" + "=" * 60)
    print("DEMO 4: Memory Footprint Validation")
    print("=" * 60)

    profiler = MemoryProfiler()

    # Set baseline
    profiler.set_baseline("startup")
    print(f"\nBaseline memory: {profiler.baseline['current_mb']:.2f} MB")

    # Allocate some memory
    print("\nAllocating test data...")
    test_data = []
    for i in range(5):
        # Allocate ~10MB of data
        test_data.append([0] * (1024 * 1024))
        profiler.take_snapshot(f"allocation_{i+1}")
        print(f"  Snapshot {i+1}: {profiler.snapshots[-1]['current_mb']:.2f} MB")

    # Get memory diff
    diff = profiler.get_memory_diff(0, -1)
    print(f"\nMemory growth:")
    print(f"  From: {diff['baseline_mb']:.2f} MB")
    print(f"  To: {diff['current_mb']:.2f} MB")
    print(f"  Difference: {diff['diff_mb']:.2f} MB")

    # Validate memory limit
    limit = 1000  # MB
    within_limit = profiler.validate_memory_limit(limit)
    print(f"\nMemory limit validation ({limit} MB): {'✓ PASS' if within_limit else '✗ FAIL'}")

    # Generate report
    report = profiler.get_report()
    print(f"\nMemory Report:")
    print(f"  Total snapshots: {report['total_snapshots']}")
    print(f"  Peak memory: {report['peak_mb']:.2f} MB")
    print(f"  Min memory: {report['min_mb']:.2f} MB")
    print(f"  Total growth: {report['memory_growth_mb']:.2f} MB")

    profiler.stop()


def demo_binary_handling():
    """Demonstrate binary data handling."""
    print("\n" + "=" * 60)
    print("DEMO 5: Binary Data Handling")
    print("=" * 60)

    # Create some binary data
    binary_data = b"PNG\x89\x50\x4e\x47" * 1000
    print(f"\nTest binary data: {len(binary_data)} bytes")

    # Generate reference
    ref = BinaryDataHandler.generate_reference(binary_data)
    print(f"Reference: {ref}")

    # Extract metadata
    metadata = BinaryDataHandler.extract_binary_metadata(binary_data)
    print(f"\nMetadata:")
    print(f"  Size: {metadata['size_kb']:.2f} KB")
    print(f"  Hash: {metadata['hash'][:32]}...")

    # Sanitize for logging
    log_safe = BinaryDataHandler.sanitize_for_logging(binary_data)
    print(f"\nLog-safe output:")
    print(f"  {log_safe[:100]}...")

    # Replace binary with reference in complex object
    complex_obj = {
        "name": "test_image",
        "data": binary_data,
        "metadata": {
            "format": "png",
            "nested_binary": b"more binary data"
        }
    }

    binary_store = {}
    cleaned_obj = BinaryDataHandler.replace_binary_with_reference(complex_obj, binary_store)

    print(f"\nOriginal object has binary data")
    print(f"Cleaned object (binary replaced with refs):")
    print(f"  {cleaned_obj}")
    print(f"\nBinary store contains {len(binary_store)} items")


def demo_cold_start():
    """Demonstrate cold start simulation."""
    print("\n" + "=" * 60)
    print("DEMO 6: Cold Start Simulation")
    print("=" * 60)

    def test_function():
        """Simple test function."""
        import json
        import random
        result = json.dumps({"value": random.randint(1, 100)})
        return result

    print("\nSimulating cold start vs warm start...")
    results = ColdStartSimulator.simulate_cold_start(test_function)

    print(f"\nResults:")
    print(f"  Cold start: {results['cold_start_ms']:.2f} ms")
    print(f"  Warm start: {results['warm_start_ms']:.2f} ms")
    print(f"  Difference: {results['difference_ms']:.2f} ms")
    print(f"  Overhead: {results['overhead_percent']:.1f}%")


def main():
    """Run all demos."""
    print("\n" + "=" * 60)
    print("PolliLibPy Testing Utilities - Complete Demonstration")
    print("=" * 60)

    try:
        demo_sample_corpus()
        demo_fuzzing()
        demo_chaos_testing()
        demo_memory_profiling()
        demo_binary_handling()
        demo_cold_start()

        print("\n" + "=" * 60)
        print("All demonstrations completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\nError during demonstration: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
