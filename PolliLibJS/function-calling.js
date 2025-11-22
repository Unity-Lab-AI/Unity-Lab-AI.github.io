/**
 * Function Calling / Tool Use - Enable AI to use external tools
 */

const { PollinationsAPI } = require('./pollylib');

class FunctionCalling extends PollinationsAPI {
    constructor(options = {}) {
        super(options);
        this.availableFunctions = this._registerBuiltinFunctions();
    }

    _registerBuiltinFunctions() {
        return {
            add: this.add.bind(this),
            subtract: this.subtract.bind(this),
            multiply: this.multiply.bind(this),
            divide: this.divide.bind(this),
            random_number: this.randomNumber.bind(this),
            evaluate_equation: this.evaluateEquation.bind(this),
            normalize_value: this.normalizeValue.bind(this),
            get_weather: this.getWeatherStub.bind(this)
        };
    }

    getFunctionSchemas() {
        return [
            {
                type: 'function',
                function: {
                    name: 'add',
                    description: 'Add two numbers together',
                    parameters: {
                        type: 'object',
                        properties: {
                            a: { type: 'number', description: 'First number' },
                            b: { type: 'number', description: 'Second number' }
                        },
                        required: ['a', 'b']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'subtract',
                    description: 'Subtract one number from another',
                    parameters: {
                        type: 'object',
                        properties: {
                            a: { type: 'number', description: 'Number to subtract from' },
                            b: { type: 'number', description: 'Number to subtract' }
                        },
                        required: ['a', 'b']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'multiply',
                    description: 'Multiply two numbers',
                    parameters: {
                        type: 'object',
                        properties: {
                            a: { type: 'number', description: 'First number' },
                            b: { type: 'number', description: 'Second number' }
                        },
                        required: ['a', 'b']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'divide',
                    description: 'Divide one number by another',
                    parameters: {
                        type: 'object',
                        properties: {
                            a: { type: 'number', description: 'Numerator' },
                            b: { type: 'number', description: 'Denominator' }
                        },
                        required: ['a', 'b']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'random_number',
                    description: 'Generate a deterministic random number with a seed',
                    parameters: {
                        type: 'object',
                        properties: {
                            seed: { type: 'integer', description: 'Random seed' },
                            min: { type: 'number', description: 'Minimum value' },
                            max: { type: 'number', description: 'Maximum value' }
                        },
                        required: ['seed', 'min', 'max']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'evaluate_equation',
                    description: 'Evaluate a mathematical equation',
                    parameters: {
                        type: 'object',
                        properties: {
                            equation: { type: 'string', description: 'Mathematical equation to evaluate' }
                        },
                        required: ['equation']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'normalize_value',
                    description: 'Normalize a value to a 0-1 range',
                    parameters: {
                        type: 'object',
                        properties: {
                            value: { type: 'number', description: 'Value to normalize' },
                            min_val: { type: 'number', description: 'Minimum of range' },
                            max_val: { type: 'number', description: 'Maximum of range' }
                        },
                        required: ['value', 'min_val', 'max_val']
                    }
                }
            }
        ];
    }

    add(a, b) { return a + b; }
    subtract(a, b) { return a - b; }
    multiply(a, b) { return a * b; }
    divide(a, b) {
        if (b === 0) throw new Error('Cannot divide by zero');
        return a / b;
    }

    randomNumber(seed, min, max) {
        const x = Math.sin(seed++) * 10000;
        const rnd = x - Math.floor(x);
        return min + rnd * (max - min);
    }

    evaluateEquation(equation) {
        const allowedChars = /^[0-9+\-*\/\.\(\)\s]+$/;
        if (!allowedChars.test(equation)) {
            throw new Error('Equation contains invalid characters');
        }
        try {
            return Function(`"use strict"; return (${equation})`)();
        } catch (error) {
            throw new Error(`Could not evaluate equation: ${error.message}`);
        }
    }

    normalizeValue(value, min_val, max_val) {
        if (max_val === min_val) return 0.0;
        return (value - min_val) / (max_val - min_val);
    }

    getWeatherStub(location, unit = 'celsius') {
        return {
            location,
            temperature: unit === 'celsius' ? 20 : 68,
            unit,
            condition: 'sunny',
            humidity: 60,
            note: 'This is stub data for testing'
        };
    }

    async callWithFunctions(options = {}) {
        const {
            messages,
            functions = null,
            model = 'openai',
            maxIterations = 5
        } = options;

        const functionSchemas = functions || this.getFunctionSchemas();
        const conversation = [...messages];
        let iteration = 0;

        while (iteration < maxIterations) {
            const payload = {
                model,
                messages: conversation,
                tools: functionSchemas,
                tool_choice: 'auto'
            };

            try {
                const response = await this.retryRequest(
                    `${PollinationsAPI.TEXT_API}/openai`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }
                );

                const result = await response.json();
                const message = result.choices[0].message;

                if (message.tool_calls) {
                    conversation.push(message);

                    for (const toolCall of message.tool_calls) {
                        const functionName = toolCall.function.name;
                        const functionArgs = JSON.parse(toolCall.function.arguments);

                        if (this.availableFunctions[functionName]) {
                            try {
                                // Call function with appropriate arguments based on function name
                                let functionResult;
                                switch (functionName) {
                                    case 'add':
                                    case 'subtract':
                                    case 'multiply':
                                    case 'divide':
                                        functionResult = this.availableFunctions[functionName](functionArgs.a, functionArgs.b);
                                        break;
                                    case 'random_number':
                                        functionResult = this.availableFunctions[functionName](functionArgs.seed, functionArgs.min, functionArgs.max);
                                        break;
                                    case 'evaluate_equation':
                                        functionResult = this.availableFunctions[functionName](functionArgs.equation);
                                        break;
                                    case 'normalize_value':
                                        functionResult = this.availableFunctions[functionName](functionArgs.value, functionArgs.min_val, functionArgs.max_val);
                                        break;
                                    case 'get_weather':
                                        functionResult = this.availableFunctions[functionName](functionArgs.location, functionArgs.unit);
                                        break;
                                    default:
                                        // For custom functions, try calling with all args as an object
                                        functionResult = this.availableFunctions[functionName](functionArgs);
                                }
                                const resultStr = JSON.stringify({ result: functionResult });

                                conversation.push({
                                    role: 'tool',
                                    tool_call_id: toolCall.id,
                                    content: resultStr
                                });
                            } catch (error) {
                                const resultStr = JSON.stringify({ error: error.message });
                                conversation.push({
                                    role: 'tool',
                                    tool_call_id: toolCall.id,
                                    content: resultStr
                                });
                            }
                        }
                    }

                    iteration++;
                } else {
                    return {
                        success: true,
                        response: message.content,
                        iterations: iteration,
                        conversation,
                        fullResponse: result
                    };
                }

            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    iterations: iteration
                };
            }
        }

        return {
            success: false,
            error: 'Max iterations reached',
            iterations: iteration
        };
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Function Calling / Tool Use Examples");
    console.log("=".repeat(60));

    const fc = new FunctionCalling();

    console.log("\n1. Direct Function Calls:");
    console.log("-".repeat(60));
    console.log(`add(5, 3) = ${fc.add(5, 3)}`);
    console.log(`subtract(10, 4) = ${fc.subtract(10, 4)}`);
    console.log(`multiply(6, 7) = ${fc.multiply(6, 7)}`);
    console.log(`divide(20, 4) = ${fc.divide(20, 4)}`);

    console.log("\n\n2. AI-Driven Function Calling:");
    console.log("-".repeat(60));

    const result = await fc.callWithFunctions({
        messages: [{
            role: 'user',
            content: 'What is 15 plus 27?'
        }]
    });

    if (result.success) {
        console.log(`User: What is 15 plus 27?`);
        console.log(`AI: ${result.response}`);
        console.log(`Function calls made: ${result.iterations}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Function calling examples completed!");
    console.log("=".repeat(60));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FunctionCalling };
}

if (typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
