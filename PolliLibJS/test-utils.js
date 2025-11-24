/**
 * PolliLibJS Testing Utilities
 * Comprehensive testing framework for regression, fuzzing, chaos testing, and memory validation.
 */

const fs = require('fs');
const crypto = require('crypto');

/**
 * Sample corpus management for regression testing.
 * Maintains a collection of test prompts and expected behaviors.
 */
class SampleCorpus {
    /**
     * Initialize the sample corpus.
     * @param {string} corpusFile - Path to JSON file containing corpus data
     */
    constructor(corpusFile = null) {
        this.corpusFile = corpusFile || 'test_corpus.json';
        this.samples = [];
        this._loadCorpus();
    }

    /**
     * Load corpus from file if it exists.
     */
    _loadCorpus() {
        if (fs.existsSync(this.corpusFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.corpusFile, 'utf8'));
                this.samples = data.samples || [];
            } catch (e) {
                console.warn(`Warning: Could not load corpus file: ${e.message}`);
                this.samples = this._getDefaultSamples();
            }
        } else {
            this.samples = this._getDefaultSamples();
        }
    }

    /**
     * Get default test samples.
     * @returns {Array} Array of test samples
     */
    _getDefaultSamples() {
        return [
            {
                id: "text_basic",
                type: "text",
                prompt: "What is the capital of France?",
                expected_keywords: ["Paris"],
                description: "Basic factual question"
            },
            {
                id: "text_creative",
                type: "text",
                prompt: "Write a haiku about coding",
                expected_keywords: ["code", "program"],
                description: "Creative writing task"
            },
            {
                id: "image_simple",
                type: "image",
                prompt: "A red apple on a wooden table",
                expected_elements: ["apple", "table", "red"],
                description: "Simple image generation"
            },
            {
                id: "image_complex",
                type: "image",
                prompt: "Cyberpunk cityscape at night with neon lights and flying cars",
                expected_elements: ["city", "neon", "night"],
                description: "Complex scene composition"
            },
            {
                id: "safety_filter",
                type: "safety",
                prompt: "Test safe content generation",
                safe_mode: true,
                description: "Safety filtering test"
            },
            {
                id: "edge_empty",
                type: "edge",
                prompt: "",
                should_fail: true,
                description: "Empty prompt edge case"
            },
            {
                id: "edge_long",
                type: "edge",
                prompt: "a".repeat(10000),
                should_warn: true,
                description: "Extremely long prompt"
            }
        ];
    }

    /**
     * Save corpus to file.
     */
    saveCorpus() {
        const data = {
            samples: this.samples,
            updated: new Date().toISOString()
        };
        fs.writeFileSync(this.corpusFile, JSON.stringify(data, null, 2));
    }

    /**
     * Add a new sample to the corpus.
     * @param {Object} sample - Sample to add
     */
    addSample(sample) {
        this.samples.push(sample);
        this.saveCorpus();
    }

    /**
     * Get all samples of a specific type.
     * @param {string} sampleType - Type of samples to retrieve
     * @returns {Array} Array of matching samples
     */
    getSamplesByType(sampleType) {
        return this.samples.filter(s => s.type === sampleType);
    }

    /**
     * Get a specific sample by ID.
     * @param {string} sampleId - ID of sample to retrieve
     * @returns {Object|null} Sample or null if not found
     */
    getSampleById(sampleId) {
        return this.samples.find(s => s.id === sampleId) || null;
    }
}


/**
 * Fuzzing utilities for prompt parsers.
 * Generates edge cases and malformed inputs to test robustness.
 */
class PromptFuzzer {
    /**
     * Generate prompts with special characters.
     * @param {string} basePrompt - Base prompt to fuzz
     * @returns {Array} Array of fuzzed prompts
     */
    static fuzzSpecialCharacters(basePrompt) {
        const specialChars = ['<', '>', '&', '"', "'", '\n', '\r', '\t', '\0', '\\', '/', '%', '#'];
        const prompts = [];

        for (const char of specialChars) {
            prompts.push(`${basePrompt}${char}`);
            prompts.push(`${char}${basePrompt}`);
            prompts.push(`${basePrompt}${char}${basePrompt}`);
        }

        return prompts;
    }

    /**
     * Generate prompts with unicode characters.
     * @param {string} basePrompt - Base prompt to fuzz
     * @returns {Array} Array of fuzzed prompts
     */
    static fuzzUnicode(basePrompt) {
        const unicodeTests = [
            "emoji: 🚀🎨🌟",
            "arabic: مرحبا",
            "chinese: 你好世界",
            "hebrew: שלום",
            "japanese: こんにちは",
            "zalgo: H̴̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ̶̧̨̱̹̭̯ͧ̾ͬC̷̙̲̝͖ͭ̏ͥͮ͟Oͮ͏̮̪̝͍M̲̖͊̒ͪͩͬ̚̚͜Ȇ̴̟̟͙̞ͩ͌͝S̨̥̫͎̭ͯ̿̔̀ͅ",
            "rtl: ‏هذا نص من اليمين إلى اليسار‏",
            "zero_width: Hello​World",  // Contains zero-width space
            "combining: é̃̾",
        ];

        return unicodeTests.map(test => `${basePrompt} ${test}`);
    }

    /**
     * Generate prompts of various lengths.
     * @returns {Array} Array of prompts with different lengths
     */
    static fuzzLengthVariations() {
        return [
            "",  // Empty
            "a",  // Single character
            "ab",  // Two characters
            "test prompt",  // Normal
            "a".repeat(100),  // Medium length
            "a".repeat(1000),  // Long
            "a".repeat(10000),  // Very long
            " ".repeat(100),  // Whitespace only
            "\n".repeat(50),  // Newlines only
        ];
    }

    /**
     * Generate prompts that attempt various injection attacks.
     * @returns {Array} Array of injection test prompts
     */
    static fuzzInjectionAttempts() {
        return [
            "'; DROP TABLE users; --",  // SQL injection
            "<script>alert('xss')</script>",  // XSS
            "{{7*7}}",  // Template injection
            "${7*7}",  // Expression injection
            "../../../etc/passwd",  // Path traversal
            "||||id",  // Command injection
            "%00",  // Null byte injection
            "\r\nSet-Cookie: admin=true",  // CRLF injection
        ];
    }

    /**
     * Generate format string attack attempts.
     * @returns {Array} Array of format string test prompts
     */
    static fuzzFormatStrings() {
        return [
            "%s%s%s%s%s",
            "%x%x%x%x",
            "%n%n%n%n",
            "{0}{1}{2}",
            "\\x41\\x42\\x43",
        ];
    }

    /**
     * Generate a comprehensive fuzzing test suite.
     * @param {string} basePrompt - Base prompt to use for testing
     * @returns {Object} Object containing all fuzzing test categories
     */
    static generateFuzzingSuite(basePrompt = "test") {
        return {
            special_chars: PromptFuzzer.fuzzSpecialCharacters(basePrompt),
            unicode: PromptFuzzer.fuzzUnicode(basePrompt),
            length_variations: PromptFuzzer.fuzzLengthVariations(),
            injection_attempts: PromptFuzzer.fuzzInjectionAttempts(),
            format_strings: PromptFuzzer.fuzzFormatStrings(),
        };
    }
}


/**
 * Chaos testing utilities for network timeouts and failures.
 * Simulates various network conditions and failure scenarios.
 */
class ChaosTestRunner {
    /**
     * Initialize chaos test runner.
     * @param {number} failureRate - Probability of simulated failures (0.0-1.0)
     * @param {number} timeoutRate - Probability of simulated timeouts (0.0-1.0)
     */
    constructor(failureRate = 0.3, timeoutRate = 0.2) {
        this.failureRate = failureRate;
        this.timeoutRate = timeoutRate;
        this.testResults = [];
    }

    /**
     * Determine if this request should fail.
     * @returns {boolean} True if should fail
     */
    shouldFail() {
        return Math.random() < this.failureRate;
    }

    /**
     * Determine if this request should timeout.
     * @returns {boolean} True if should timeout
     */
    shouldTimeout() {
        return Math.random() < this.timeoutRate;
    }

    /**
     * Simulate random network delay.
     * @param {number} minMs - Minimum delay in milliseconds
     * @param {number} maxMs - Maximum delay in milliseconds
     * @returns {Promise<void>}
     */
    async simulateNetworkDelay(minMs = 100, maxMs = 5000) {
        const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    /**
     * Wrap a function call with chaos testing.
     * @param {Function} func - Function to call
     * @param {...*} args - Arguments to pass to function
     * @returns {Promise<*>} Function result or throws exception
     */
    async simulateIntermittentFailure(func, ...args) {
        // Simulate timeout
        if (this.shouldTimeout()) {
            await this.simulateNetworkDelay(5000, 30000);
            throw new Error("Chaos test: Simulated timeout");
        }

        // Simulate network delay
        if (Math.random() < 0.5) {
            await this.simulateNetworkDelay();
        }

        // Simulate failure
        if (this.shouldFail()) {
            const failureTypes = [
                "ConnectionError",
                "HTTPError",
                "Timeout",
                "DNSError"
            ];
            const failureType = failureTypes[Math.floor(Math.random() * failureTypes.length)];
            throw new Error(`Chaos test: Simulated ${failureType}`);
        }

        // Execute normally
        return await func(...args);
    }

    /**
     * Run chaos testing on a function multiple times.
     * @param {Function} testFunc - Function to test
     * @param {number} iterations - Number of test iterations
     * @returns {Promise<Object>} Object with test results
     */
    async runChaosTest(testFunc, iterations = 100) {
        const results = {
            total: iterations,
            success: 0,
            failures: 0,
            timeouts: 0,
            errors: []
        };

        for (let i = 0; i < iterations; i++) {
            try {
                await this.simulateIntermittentFailure(testFunc);
                results.success++;
            } catch (error) {
                if (error.message.includes("timeout")) {
                    results.timeouts++;
                } else {
                    results.failures++;
                }
                results.errors.push(error.message);
            }
        }

        return results;
    }
}


/**
 * Memory footprint validation utilities.
 * Tracks memory usage and detects memory leaks.
 */
class MemoryProfiler {
    /**
     * Initialize memory profiler.
     */
    constructor() {
        this.snapshots = [];
        this.baseline = null;
    }

    /**
     * Take a memory snapshot.
     * @param {string} label - Label for this snapshot
     * @returns {Object} Snapshot data
     */
    takeSnapshot(label = "") {
        const memUsage = process.memoryUsage();

        const snapshot = {
            label: label,
            timestamp: new Date().toISOString(),
            rss_mb: memUsage.rss / 1024 / 1024,
            heap_total_mb: memUsage.heapTotal / 1024 / 1024,
            heap_used_mb: memUsage.heapUsed / 1024 / 1024,
            external_mb: memUsage.external / 1024 / 1024,
            array_buffers_mb: memUsage.arrayBuffers / 1024 / 1024
        };

        this.snapshots.push(snapshot);
        return snapshot;
    }

    /**
     * Set the baseline memory snapshot.
     * @param {string} label - Label for baseline
     * @returns {Object} Baseline snapshot
     */
    setBaseline(label = "baseline") {
        this.baseline = this.takeSnapshot(label);
        return this.baseline;
    }

    /**
     * Compare two snapshots.
     * @param {number} snapshot1Idx - Index of first snapshot
     * @param {number} snapshot2Idx - Index of second snapshot
     * @returns {Object} Memory difference statistics
     */
    getMemoryDiff(snapshot1Idx = 0, snapshot2Idx = -1) {
        if (this.snapshots.length < 2) {
            return { error: "Not enough snapshots to compare" };
        }

        const idx2 = snapshot2Idx < 0 ? this.snapshots.length + snapshot2Idx : snapshot2Idx;
        const snap1 = this.snapshots[snapshot1Idx];
        const snap2 = this.snapshots[idx2];

        return {
            diff_rss_mb: snap2.rss_mb - snap1.rss_mb,
            diff_heap_used_mb: snap2.heap_used_mb - snap1.heap_used_mb,
            diff_heap_total_mb: snap2.heap_total_mb - snap1.heap_total_mb,
            baseline_mb: snap1.heap_used_mb,
            current_mb: snap2.heap_used_mb,
            baseline_label: snap1.label,
            current_label: snap2.label
        };
    }

    /**
     * Check if current memory usage is within limit.
     * @param {number} maxMb - Maximum allowed memory in MB
     * @returns {boolean} True if within limit
     */
    validateMemoryLimit(maxMb) {
        if (this.snapshots.length === 0) {
            this.takeSnapshot("validation_check");
        }

        const current = this.snapshots[this.snapshots.length - 1].heap_used_mb;
        return current <= maxMb;
    }

    /**
     * Generate a memory profiling report.
     * @returns {Object} Memory report
     */
    getReport() {
        if (this.snapshots.length === 0) {
            return { error: "No snapshots taken" };
        }

        const heapValues = this.snapshots.map(s => s.heap_used_mb);

        return {
            total_snapshots: this.snapshots.length,
            baseline_mb: this.baseline ? this.baseline.heap_used_mb : null,
            current_mb: this.snapshots[this.snapshots.length - 1].heap_used_mb,
            peak_mb: Math.max(...heapValues),
            min_mb: Math.min(...heapValues),
            memory_growth_mb: this.snapshots[this.snapshots.length - 1].heap_used_mb - this.snapshots[0].heap_used_mb,
            snapshots: this.snapshots.map(s => ({
                label: s.label,
                timestamp: s.timestamp,
                heap_used_mb: s.heap_used_mb
            }))
        };
    }

    /**
     * Force garbage collection if available.
     */
    forceGC() {
        if (global.gc) {
            global.gc();
        } else {
            console.warn("Garbage collection not exposed. Run with --expose-gc flag.");
        }
    }
}


/**
 * Binary data handling utilities for logging and caching.
 * Separates binary data from text logs and replaces with references.
 */
class BinaryDataHandler {
    /**
     * Check if data is binary.
     * @param {*} data - Data to check
     * @returns {boolean} True if binary
     */
    static isBinary(data) {
        if (Buffer.isBuffer(data)) {
            return true;
        }
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            return true;
        }
        return false;
    }

    /**
     * Generate a unique reference for binary data.
     * @param {Buffer} data - Binary data
     * @returns {string} Reference string (hash)
     */
    static generateReference(data) {
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        return `binary_ref_${hash.substring(0, 16)}`;
    }

    /**
     * Extract metadata from binary data.
     * @param {Buffer} data - Binary data
     * @returns {Object} Metadata object
     */
    static extractBinaryMetadata(data) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        return {
            size_bytes: buffer.length,
            size_kb: buffer.length / 1024,
            size_mb: buffer.length / (1024 * 1024),
            reference: BinaryDataHandler.generateReference(buffer),
            type: "binary",
            hash: crypto.createHash('sha256').update(buffer).digest('hex')
        };
    }

    /**
     * Recursively replace binary data with references.
     * @param {*} obj - Object to process
     * @param {Object} binaryStore - Optional dictionary to store binary data
     * @returns {*} Object with binary data replaced by references
     */
    static replaceBinaryWithReference(obj, binaryStore = {}) {
        if (BinaryDataHandler.isBinary(obj)) {
            const buffer = Buffer.isBuffer(obj) ? obj : Buffer.from(obj);
            const ref = BinaryDataHandler.generateReference(buffer);
            binaryStore[ref] = buffer;

            return {
                __binary_ref__: ref,
                size_bytes: buffer.length,
                type: "binary"
            };
        } else if (Array.isArray(obj)) {
            return obj.map(item => BinaryDataHandler.replaceBinaryWithReference(item, binaryStore));
        } else if (obj !== null && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = BinaryDataHandler.replaceBinaryWithReference(value, binaryStore);
            }
            return result;
        }

        return obj;
    }

    /**
     * Sanitize data for text logging.
     * @param {*} data - Data to sanitize
     * @param {number} maxBinaryPreview - Maximum bytes to preview for binary data
     * @returns {string} String safe for logging
     */
    static sanitizeForLogging(data, maxBinaryPreview = 32) {
        if (BinaryDataHandler.isBinary(data)) {
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            const metadata = BinaryDataHandler.extractBinaryMetadata(buffer);
            const preview = buffer.length > 0
                ? buffer.slice(0, maxBinaryPreview).toString('hex')
                : "";
            return `[BINARY: ${metadata.size_kb.toFixed(2)}KB, ref=${metadata.reference}, preview=${preview}...]`;
        } else if (Array.isArray(data)) {
            return data.map(item => BinaryDataHandler.sanitizeForLogging(item, maxBinaryPreview));
        } else if (data !== null && typeof data === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(data)) {
                result[key] = BinaryDataHandler.sanitizeForLogging(value, maxBinaryPreview);
            }
            return result;
        }

        return String(data);
    }
}


/**
 * Simulate cold start conditions for CI testing.
 * Mimics real-world cold start scenarios.
 */
class ColdStartSimulator {
    /**
     * Clear Node.js caches.
     */
    static clearCaches() {
        // Clear require cache
        Object.keys(require.cache).forEach(key => {
            delete require.cache[key];
        });

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    }

    /**
     * Simulate cold start and measure performance.
     * @param {Function} func - Function to test
     * @param {...*} args - Arguments to pass to function
     * @returns {Promise<Object>} Timing results
     */
    static async simulateColdStart(func, ...args) {
        // Clear caches
        ColdStartSimulator.clearCaches();

        // Measure cold start time
        const coldStart = Date.now();
        await func(...args);
        const coldTime = Date.now() - coldStart;

        // Measure warm start time
        const warmStart = Date.now();
        await func(...args);
        const warmTime = Date.now() - warmStart;

        return {
            cold_start_ms: coldTime,
            warm_start_ms: warmTime,
            difference_ms: coldTime - warmTime,
            overhead_percent: coldTime > 0 ? ((coldTime - warmTime) / coldTime * 100) : 0
        };
    }
}


// Convenience functions for quick testing

/**
 * Run regression tests using sample corpus.
 * @param {SampleCorpus} corpus - Optional corpus instance
 * @returns {Object} Test results
 */
function runRegressionTests(corpus = null) {
    if (!corpus) {
        corpus = new SampleCorpus();
    }

    const results = {
        total: corpus.samples.length,
        by_type: {}
    };

    for (const sampleType of ["text", "image", "safety", "edge"]) {
        const samples = corpus.getSamplesByType(sampleType);
        results.by_type[sampleType] = {
            count: samples.length,
            samples: samples
        };
    }

    return results;
}


/**
 * Run fuzzing tests.
 * @param {string} basePrompt - Base prompt to use for testing
 * @returns {Object} Fuzzing results
 */
function runFuzzTests(basePrompt = "test") {
    const suite = PromptFuzzer.generateFuzzingSuite(basePrompt);

    const totalTests = Object.values(suite).reduce((sum, tests) => sum + tests.length, 0);
    const categories = {};
    for (const [key, tests] of Object.entries(suite)) {
        categories[key] = tests.length;
    }

    return {
        total_tests: totalTests,
        categories: categories,
        suite: suite
    };
}


// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SampleCorpus,
        PromptFuzzer,
        ChaosTestRunner,
        MemoryProfiler,
        BinaryDataHandler,
        ColdStartSimulator,
        runRegressionTests,
        runFuzzTests
    };
}


// Test if run directly
if (require.main === module) {
    console.log("=".repeat(60));
    console.log("PolliLibJS Testing Utilities");
    console.log("=".repeat(60));

    // Demonstrate sample corpus
    console.log("\n1. Sample Corpus");
    const corpus = new SampleCorpus();
    console.log(`   Loaded ${corpus.samples.length} samples`);

    // Demonstrate fuzzing
    console.log("\n2. Prompt Fuzzing");
    const fuzzResults = runFuzzTests("hello world");
    console.log(`   Generated ${fuzzResults.total_tests} fuzz test cases`);

    // Demonstrate chaos testing
    console.log("\n3. Chaos Testing");
    const chaos = new ChaosTestRunner(0.3);
    console.log(`   Configured with ${chaos.failureRate * 100}% failure rate`);

    // Demonstrate memory profiling
    console.log("\n4. Memory Profiling");
    const profiler = new MemoryProfiler();
    profiler.setBaseline();
    console.log(`   Baseline: ${profiler.baseline.heap_used_mb.toFixed(2)} MB`);

    // Demonstrate binary handling
    console.log("\n5. Binary Data Handling");
    const testBinary = Buffer.from("This is binary data".repeat(100));
    const ref = BinaryDataHandler.generateReference(testBinary);
    console.log(`   Generated reference: ${ref}`);

    console.log("\n" + "=".repeat(60));
    console.log("Testing utilities ready!");
    console.log("=".repeat(60));
}
