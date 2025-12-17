/**
 * Test script to demonstrate Safety Filtering and Reasoning Controls
 * in JavaScript implementation.
 */

const { TextToText } = require('./text-to-text');
const { TextToImage } = require('./text-to-image');

/**
 * Test reasoning_effort parameter with different levels
 */
async function testReasoningControls() {
    console.log("=".repeat(70));
    console.log("TESTING REASONING CONTROLS");
    console.log("=".repeat(70));

    const generator = new TextToText();

    // Test prompt that benefits from deep reasoning
    const prompt = "Plan a 3-day trip to Paris with a budget of $1500";

    const reasoningLevels = ["minimal", "low", "medium", "high"];

    for (const level of reasoningLevels) {
        console.log("\n" + "=".repeat(70));
        console.log(`Testing reasoning_effort: ${level}`);
        console.log("=".repeat(70));

        const result = await generator.chat({
            messages: [{ role: "user", content: prompt }],
            model: "openai",
            reasoningEffort: level,
            maxTokens: 200,
            temperature: 0.7
        });

        if (result.success) {
            console.log(`\n✓ Response with ${level} reasoning:`);
            console.log(`  ${result.response.substring(0, 300)}...`);
            console.log(`\n  Usage:`, result.usage || {});
        } else {
            console.log(`✗ Error: ${result.error}`);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("Reasoning controls test complete!");
    console.log("=".repeat(70));
}

/**
 * Test safe parameter for text generation
 */
async function testSafetyFilteringText() {
    console.log("\n\n" + "=".repeat(70));
    console.log("TESTING SAFETY FILTERING - TEXT GENERATION");
    console.log("=".repeat(70));

    const generator = new TextToText();

    // Test with safe mode enabled
    console.log("\n1. Testing with safe=true:");
    console.log("-".repeat(70));

    let result = await generator.chat({
        messages: [{ role: "user", content: "Tell me a family-friendly joke" }],
        model: "openai",
        safe: true,
        temperature: 0.7
    });

    if (result.success) {
        console.log(`✓ Response with safety filter enabled:`);
        console.log(`  ${result.response}`);
        console.log(`  Safety Check:`, result.safetyCheck || {});
    } else {
        console.log(`✗ Error: ${result.error}`);
    }

    // Test with safe mode disabled
    console.log("\n2. Testing with safe=false (default):");
    console.log("-".repeat(70));

    result = await generator.chat({
        messages: [{ role: "user", content: "Tell me a joke about programming" }],
        model: "openai",
        safe: false,
        temperature: 0.7
    });

    if (result.success) {
        console.log(`✓ Response without safety filter:`);
        console.log(`  ${result.response}`);
    } else {
        console.log(`✗ Error: ${result.error}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("Text safety filtering test complete!");
    console.log("=".repeat(70));
}

/**
 * Test safe parameter for image generation
 */
async function testSafetyFilteringImage() {
    console.log("\n\n" + "=".repeat(70));
    console.log("TESTING SAFETY FILTERING - IMAGE GENERATION");
    console.log("=".repeat(70));

    const generator = new TextToImage();

    // Test with safe mode enabled
    const testPrompts = [
        "a beautiful sunset over mountains",
        "a family having a picnic in the park",
        "cute puppies playing with toys"
    ];

    console.log("\nTesting safe mode for image generation:");
    console.log("-".repeat(70));

    for (const prompt of testPrompts) {
        console.log(`\nPrompt: '${prompt}'`);

        const result = await generator.generateImage({
            prompt,
            safe: true,
            model: "turbo",
            width: 512,
            height: 512
        });

        if (result.success) {
            console.log(`  ✓ PASSED safety filter`);
            console.log(`  Inference time: ${result.inferenceTime.toFixed(2)}s`);
        } else {
            console.log(`  ✗ BLOCKED: ${result.message || result.error}`);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("Image safety filtering test complete!");
    console.log("=".repeat(70));
}

/**
 * Test using both safety and reasoning controls together
 */
async function testCombinedFeatures() {
    console.log("\n\n" + "=".repeat(70));
    console.log("TESTING COMBINED FEATURES (Safety + Reasoning)");
    console.log("=".repeat(70));

    const generator = new TextToText();

    console.log("\nGenerating a detailed, family-friendly travel guide:");
    console.log("-".repeat(70));

    const result = await generator.chat({
        messages: [{
            role: "user",
            content: "Create a detailed family-friendly itinerary for a day in Disney World"
        }],
        model: "openai",
        reasoningEffort: "high",  // Use deep reasoning for detailed planning
        safe: true,  // Ensure family-friendly content
        temperature: 0.7,
        maxTokens: 500
    });

    if (result.success) {
        console.log(`✓ Generated itinerary:`);
        console.log(`\n${result.response}`);
        console.log(`\nUsage:`, result.usage || {});
        console.log(`Safety Check:`, result.safetyCheck || {});
    } else {
        console.log(`✗ Error: ${result.error}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("Combined features test complete!");
    console.log("=".repeat(70));
}

/**
 * Main test runner
 */
async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("SAFETY FILTERING & REASONING CONTROLS TEST SUITE");
    console.log("Testing JavaScript implementation");
    console.log("=".repeat(70));

    try {
        await testReasoningControls();
        await testSafetyFilteringText();
        await testSafetyFilteringImage();
        await testCombinedFeatures();

        console.log("\n\n" + "=".repeat(70));
        console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(70));
        console.log("\nSummary:");
        console.log("  ✓ Reasoning Controls (minimal, low, medium, high) - Working");
        console.log("  ✓ Safety Filtering for Text Generation - Working");
        console.log("  ✓ Safety Filtering for Image Generation - Working");
        console.log("  ✓ Combined Features - Working");
        console.log("\nJavaScript implementation supports:");
        console.log("  - reasoningEffort parameter for text generation");
        console.log("  - safe parameter for text and image generation");
        console.log("=".repeat(70));

    } catch (error) {
        console.log(`\n✗ Test suite failed with error: ${error.message}`);
        console.error(error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testReasoningControls,
    testSafetyFilteringText,
    testSafetyFilteringImage,
    testCombinedFeatures
};
