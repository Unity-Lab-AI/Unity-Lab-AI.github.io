/**
 * Demonstration of PolliLibJS Testing Utilities
 * Shows how to use the testing framework in practice.
 */

const {
    SampleCorpus,
    PromptFuzzer,
    ChaosTestRunner,
    MemoryProfiler,
    BinaryDataHandler,
    ColdStartSimulator,
    runRegressionTests,
    runFuzzTests
} = require('./test-utils.js');


/**
 * Demonstrate sample corpus functionality.
 */
function demoSampleCorpus() {
    console.log("\n" + "=".repeat(60));
    console.log("DEMO 1: Sample Corpus for Regression Testing");
    console.log("=".repeat(60));

    const corpus = new SampleCorpus();
    console.log(`\nLoaded ${corpus.samples.length} default samples`);

    // Get samples by type
    const textSamples = corpus.getSamplesByType("text");
    console.log(`\nText samples: ${textSamples.length}`);
    textSamples.forEach(sample => {
        console.log(`  - ${sample.id}: ${sample.description}`);
    });

    const imageSamples = corpus.getSamplesByType("image");
    console.log(`\nImage samples: ${imageSamples.length}`);
    imageSamples.forEach(sample => {
        console.log(`  - ${sample.id}: ${sample.description}`);
    });

    // Add a custom sample
    const customSample = {
        id: "custom_test_1",
        type: "text",
        prompt: "Explain quantum computing in simple terms",
        expected_keywords: ["quantum", "bit", "superposition"],
        description: "Custom technical explanation test"
    };
    console.log(`\nAdding custom sample: ${customSample.id}`);

    // Run regression test suite
    console.log("\nRunning regression test suite...");
    const results = runRegressionTests(corpus);
    console.log(`Total samples: ${results.total}`);
    Object.entries(results.by_type).forEach(([sampleType, data]) => {
        console.log(`  ${sampleType}: ${data.count} samples`);
    });
}


/**
 * Demonstrate prompt fuzzing.
 */
function demoFuzzing() {
    console.log("\n" + "=".repeat(60));
    console.log("DEMO 2: Prompt Fuzzing");
    console.log("=".repeat(60));

    const basePrompt = "Generate an image of a cat";

    // Generate fuzzing suite
    console.log(`\nGenerating fuzz tests for: '${basePrompt}'`);
    const results = runFuzzTests(basePrompt);

    console.log(`\nTotal fuzz tests generated: ${results.total_tests}`);
    Object.entries(results.categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} tests`);
    });

    // Show some examples
    console.log("\nExample fuzzing tests:");
    const suite = results.suite;

    console.log("\n  Special Characters (first 3):");
    suite.special_chars.slice(0, 3).forEach(test => {
        console.log(`    ${JSON.stringify(test)}`);
    });

    console.log("\n  Unicode Tests (first 3):");
    suite.unicode.slice(0, 3).forEach(test => {
        console.log(`    ${JSON.stringify(test)}`);
    });

    console.log("\n  Injection Attempts (first 3):");
    suite.injection_attempts.slice(0, 3).forEach(test => {
        console.log(`    ${JSON.stringify(test)}`);
    });
}


/**
 * Demonstrate chaos testing.
 */
async function demoChaosTestingAsync() {
    console.log("\n" + "=".repeat(60));
    console.log("DEMO 3: Chaos Testing for Network Failures");
    console.log("=".repeat(60));

    // Create a simple test function
    async function mockApiCall() {
        // Mock API call that would normally succeed
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate small delay
        return { status: "success" };
    }

    // Run chaos test
    const chaos = new ChaosTestRunner(0.3, 0.2);
    console.log(`\nRunning chaos test with:`);
    console.log(`  Failure rate: ${chaos.failureRate * 100}%`);
    console.log(`  Timeout rate: ${chaos.timeoutRate * 100}%`);
    console.log(`  Iterations: 50`);

    console.log("\nRunning tests...");
    const results = await chaos.runChaosTest(mockApiCall, 50);

    console.log(`\nResults:`);
    console.log(`  Total tests: ${results.total}`);
    console.log(`  Successful: ${results.success} (${(results.success/results.total*100).toFixed(1)}%)`);
    console.log(`  Failed: ${results.failures} (${(results.failures/results.total*100).toFixed(1)}%)`);
    console.log(`  Timeouts: ${results.timeouts} (${(results.timeouts/results.total*100).toFixed(1)}%)`);

    if (results.errors.length > 0) {
        console.log(`\n  Sample errors (first 3):`);
        results.errors.slice(0, 3).forEach(error => {
            console.log(`    - ${error}`);
        });
    }
}


/**
 * Demonstrate memory profiling.
 */
function demoMemoryProfiling() {
    console.log("\n" + "=".repeat(60));
    console.log("DEMO 4: Memory Footprint Validation");
    console.log("=".repeat(60));

    const profiler = new MemoryProfiler();

    // Set baseline
    profiler.setBaseline("startup");
    console.log(`\nBaseline memory: ${profiler.baseline.heap_used_mb.toFixed(2)} MB`);

    // Allocate some memory
    console.log("\nAllocating test data...");
    const testData = [];
    for (let i = 0; i < 5; i++) {
        // Allocate ~10MB of data
        testData.push(Buffer.alloc(10 * 1024 * 1024));
        profiler.takeSnapshot(`allocation_${i+1}`);
        console.log(`  Snapshot ${i+1}: ${profiler.snapshots[profiler.snapshots.length-1].heap_used_mb.toFixed(2)} MB`);
    }

    // Get memory diff
    const diff = profiler.getMemoryDiff(0, -1);
    console.log(`\nMemory growth:`);
    console.log(`  From: ${diff.baseline_mb.toFixed(2)} MB`);
    console.log(`  To: ${diff.current_mb.toFixed(2)} MB`);
    console.log(`  Difference: ${diff.diff_heap_used_mb.toFixed(2)} MB`);

    // Validate memory limit
    const limit = 1000; // MB
    const withinLimit = profiler.validateMemoryLimit(limit);
    console.log(`\nMemory limit validation (${limit} MB): ${withinLimit ? '✓ PASS' : '✗ FAIL'}`);

    // Generate report
    const report = profiler.getReport();
    console.log(`\nMemory Report:`);
    console.log(`  Total snapshots: ${report.total_snapshots}`);
    console.log(`  Peak memory: ${report.peak_mb.toFixed(2)} MB`);
    console.log(`  Min memory: ${report.min_mb.toFixed(2)} MB`);
    console.log(`  Total growth: ${report.memory_growth_mb.toFixed(2)} MB`);
}


/**
 * Demonstrate binary data handling.
 */
function demoBinaryHandling() {
    console.log("\n" + "=".repeat(60));
    console.log("DEMO 5: Binary Data Handling");
    console.log("=".repeat(60));

    // Create some binary data
    const binaryData = Buffer.from("PNG\x89\x50\x4e\x47".repeat(1000));
    console.log(`\nTest binary data: ${binaryData.length} bytes`);

    // Generate reference
    const ref = BinaryDataHandler.generateReference(binaryData);
    console.log(`Reference: ${ref}`);

    // Extract metadata
    const metadata = BinaryDataHandler.extractBinaryMetadata(binaryData);
    console.log(`\nMetadata:`);
    console.log(`  Size: ${metadata.size_kb.toFixed(2)} KB`);
    console.log(`  Hash: ${metadata.hash.substring(0, 32)}...`);

    // Sanitize for logging
    const logSafe = BinaryDataHandler.sanitizeForLogging(binaryData);
    console.log(`\nLog-safe output:`);
    console.log(`  ${logSafe.substring(0, 100)}...`);

    // Replace binary with reference in complex object
    const complexObj = {
        name: "test_image",
        data: binaryData,
        metadata: {
            format: "png",
            nested_binary: Buffer.from("more binary data")
        }
    };

    const binaryStore = {};
    const cleanedObj = BinaryDataHandler.replaceBinaryWithReference(complexObj, binaryStore);

    console.log(`\nOriginal object has binary data`);
    console.log(`Cleaned object (binary replaced with refs):`);
    console.log(`  ${JSON.stringify(cleanedObj, null, 2)}`);
    console.log(`\nBinary store contains ${Object.keys(binaryStore).length} items`);
}


/**
 * Demonstrate cold start simulation.
 */
async function demoColdStartAsync() {
    console.log("\n" + "=".repeat(60));
    console.log("DEMO 6: Cold Start Simulation");
    console.log("=".repeat(60));

    async function testFunction() {
        // Simple test function
        const value = Math.floor(Math.random() * 100);
        return JSON.stringify({ value });
    }

    console.log("\nSimulating cold start vs warm start...");
    const results = await ColdStartSimulator.simulateColdStart(testFunction);

    console.log(`\nResults:`);
    console.log(`  Cold start: ${results.cold_start_ms.toFixed(2)} ms`);
    console.log(`  Warm start: ${results.warm_start_ms.toFixed(2)} ms`);
    console.log(`  Difference: ${results.difference_ms.toFixed(2)} ms`);
    console.log(`  Overhead: ${results.overhead_percent.toFixed(1)}%`);
}


/**
 * Run all demos.
 */
async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("PolliLibJS Testing Utilities - Complete Demonstration");
    console.log("=".repeat(60));

    try {
        demoSampleCorpus();
        demoFuzzing();
        await demoChaosTestingAsync();
        demoMemoryProfiling();
        demoBinaryHandling();
        await demoColdStartAsync();

        console.log("\n" + "=".repeat(60));
        console.log("All demonstrations completed successfully!");
        console.log("=".repeat(60));

    } catch (error) {
        console.error(`\nError during demonstration: ${error.message}`);
        console.error(error.stack);
    }
}


// Run if called directly
if (require.main === module) {
    main();
}


module.exports = { main };
