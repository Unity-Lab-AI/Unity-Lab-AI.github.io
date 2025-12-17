/**
 * Main Application Module
 * Unity AI Lab Demo Page
 *
 * Coordinates all modules and initializes the demo application
 */

// Import all modules
import {  DEFAULT_SETTINGS } from './config.js';
import { loadSettings, saveSettings, applySettingsToUI, setupControlsSync } from './settings.js';
import {
    initializePolliLib,
    loadUnitySystemPrompt,
    loadEvilSystemPrompt,
    fetchModels,
    getAIResponse,
    getFinalResponseAfterTools,
    getCurrentModelMetadata,
    getAvailableTextModels,
    getAvailableImageModels,
    getAvailableVoices,
    extractVoices
} from './api.js';
import { addMessage, showTypingIndicator, removeTypingIndicator, clearSession } from './chat.js';
import { playVoice, stopVoicePlayback, updateAllVolumeSliders } from './voice.js';
import { handleToolCall } from './tools.js';
import {
    setupEventListeners,
    setupDesktopPanelCollapse,
    autoResizeTextarea,
    updateModelInfo,
    updateVoiceAvailability,
    updateSystemPromptAvailability,
    expandImage,
    setupMobileModalListeners,
    deleteAllData,
    populateTextModels,
    populateImageModels,
    populateVoices,
    detectAndQueueEffects
} from './ui.js';
import { configureMarked, renderMarkdown } from './markdown.js';
import { getSlashCommands, handleSlashCommandInput, handleAutocompleteNavigation } from './slash-commands.js';

/**
 * Main Demo Application Object
 */
const DemoApp = {
    // Chat history
    chatHistory: [],

    // PolliLibJS instances
    textAPI: null,
    imageAPI: null,
    voiceAPI: null,

    // Settings (loaded from localStorage)
    settings: { ...DEFAULT_SETTINGS },

    // Slash commands
    slashCommands: [],

    /**
     * Generate a random seed between 6 and 8 digits
     * @returns {number} Random seed between 100000 and 99999999
     */
    generateRandomSeed() {
        // Generate random number between 6 and 8 digits
        const minDigits = 6;
        const maxDigits = 8;
        const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;

        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;

        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Initialize the application
     */
    async init() {
        // Initialize PolliLibJS
        const apiInstances = initializePolliLib();
        this.textAPI = apiInstances.textAPI;
        this.imageAPI = apiInstances.imageAPI;
        this.voiceAPI = apiInstances.voiceAPI;

        // Load cached settings from localStorage BEFORE setting up listeners
        this.settings = loadSettings();

        // Setup slash commands with context
        this.slashCommands = getSlashCommands(this);

        // Setup event listeners
        this.setupAllEventListeners();

        // Configure markdown
        configureMarked();

        // Load custom model system prompts
        await Promise.all([
            loadUnitySystemPrompt(),
            loadEvilSystemPrompt()
        ]);

        // Fetch and populate models
        await this.fetchAndPopulateModels();

        // Update voice availability based on initial model
        updateVoiceAvailability(this.settings);

        // Update system prompt availability based on initial model
        updateSystemPromptAvailability(this.settings);

        console.log('Unity AI Lab Demo initialized');
    },

    /**
     * Setup all event listeners
     */
    setupAllEventListeners() {
        // Main event listeners
        setupEventListeners(
            () => this.sendMessage(),
            () => clearSession(this.chatHistory, () => stopVoicePlayback()),
            () => stopVoicePlayback(),
            () => deleteAllData(),
            (modelValue) => {
                this.settings.model = modelValue;
                updateModelInfo(modelValue, getAvailableTextModels());
                updateVoiceAvailability(this.settings);
                updateSystemPromptAvailability(this.settings);
                this.saveSettings();
            },
            () => this.saveSettings(),
            (e) => handleAutocompleteNavigation(e),
            (textarea) => autoResizeTextarea(textarea),
            () => handleSlashCommandInput(this.slashCommands)
        );

        // Desktop panel collapse
        setupDesktopPanelCollapse();

        // Controls synchronization
        setupControlsSync(
            this.settings,
            () => this.saveSettings(),
            (value) => updateAllVolumeSliders(value),
            () => stopVoicePlayback()
        );

        // Mobile modal listeners
        setupMobileModalListeners(
            this.settings,
            () => this.saveSettings(),
            (value) => updateAllVolumeSliders(value),
            () => clearSession(this.chatHistory, () => stopVoicePlayback()),
            () => stopVoicePlayback(),
            () => deleteAllData()
        );
    },

    /**
     * Fetch and populate all models
     */
    async fetchAndPopulateModels() {
        await fetchModels();

        // Populate dropdowns
        const textModels = getAvailableTextModels();
        const imageModels = getAvailableImageModels();
        let voices = getAvailableVoices();

        // ALWAYS populate text models - custom Unity/Evil models are added regardless of API fetch
        populateTextModels(textModels, this.settings);

        // Extract voices if available
        if (textModels.length > 0) {
            if (!voices || voices.length === 0) {
                voices = extractVoices(textModels);
            }
        }

        if (voices && voices.length > 0) {
            populateVoices(voices, this.settings);
        }

        if (imageModels.length > 0) {
            populateImageModels(imageModels, this.settings);
        }

        // Apply cached settings to UI
        applySettingsToUI(this.settings, (value) => updateAllVolumeSliders(value));

        // Update model info display
        updateModelInfo(this.settings.model, textModels);
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        saveSettings(this.settings);
    },

    /**
     * Send a message
     */
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) return;

        // Clear input and reset height
        input.value = '';
        input.style.height = 'auto';

        // Hide empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        // Add user message to chat
        addMessage('user', message, [], null, null, null);

        // Add to history
        this.chatHistory.push({
            role: 'user',
            content: message
        });

        // Show typing indicator
        showTypingIndicator();

        // Get AI response
        try {
            const response = await getAIResponse(
                message,
                this.chatHistory,
                this.settings,
                () => this.generateRandomSeed(),
                (toolCall) => this.handleToolCallWrapper(toolCall),
                (model, systemPrompt) => this.getFinalResponseWrapper(model, systemPrompt)
            );

            removeTypingIndicator();

            // Handle response (can be string or object with text + images)
            let responseText = '';
            let responseImages = [];

            console.log('📨 Response received:', typeof response, response);

            if (typeof response === 'object' && response !== null && 'text' in response) {
                responseText = response.text;
                responseImages = response.images || [];
                console.log('📷 Images to display:', responseImages.length, responseImages);
            } else {
                responseText = response;
            }

            // Add AI response to chat (with images if present)
            addMessage(
                'ai',
                responseText,
                responseImages,
                (text) => renderMarkdown(text),
                (url, prompt) => expandImage(url, prompt),
                (text) => detectAndQueueEffects(text, this.settings)
            );

            // Add to history (text only, images are handled separately)
            // IMPORTANT: Only add clean user/assistant messages, never tool_calls
            this.chatHistory.push({
                role: 'assistant',
                content: responseText
            });

            // Assistant message added to history

            // Voice playback if enabled
            if (this.settings.voicePlayback) {
                await playVoice(
                    responseText,
                    this.settings,
                    (modelName) => getCurrentModelMetadata(modelName),
                    () => this.generateRandomSeed()
                );
            }
        } catch (error) {
            removeTypingIndicator();
            addMessage(
                'ai',
                'Sorry, I encountered an error: ' + error.message,
                [],
                (text) => renderMarkdown(text),
                null,
                null
            );
            console.error('AI Response Error:', error);
        }
    },

    /**
     * Wrapper for handleToolCall to pass chatHistory
     */
    async handleToolCallWrapper(toolCall) {
        return await handleToolCall(
            toolCall,
            this.chatHistory,
            this.settings,
            () => this.generateRandomSeed()
        );
    },

    /**
     * Wrapper for getFinalResponseAfterTools
     */
    async getFinalResponseWrapper(model, systemPrompt) {
        return await getFinalResponseAfterTools(
            model,
            systemPrompt,
            this.chatHistory,
            this.settings,
            () => this.generateRandomSeed()
        );
    },

    /**
     * Wrapper methods to expose to slash commands
     */
    addMessage(sender, content, images = []) {
        addMessage(
            sender,
            content,
            images,
            (text) => renderMarkdown(text),
            (url, prompt) => expandImage(url, prompt),
            (text) => detectAndQueueEffects(text, this.settings)
        );
    },

    showTypingIndicator() {
        showTypingIndicator();
    },

    removeTypingIndicator() {
        removeTypingIndicator();
    },

    clearSession() {
        clearSession(this.chatHistory, () => stopVoicePlayback());
    },

    playVoice(text) {
        playVoice(
            text,
            this.settings,
            (modelName) => getCurrentModelMetadata(modelName),
            () => this.generateRandomSeed()
        );
    },

    stopVoicePlayback() {
        stopVoicePlayback();
    },

    updateModelInfo(modelValue) {
        updateModelInfo(modelValue, getAvailableTextModels());
    },

    deleteAllData() {
        deleteAllData();
    }
};

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    DemoApp.init();

    // Note: Visitor tracking happens automatically during age verification
    // Registration is handled by age-verification.js after successful verification
});

/**
 * Highlight.js initialization
 */
if (typeof hljs !== 'undefined') {
    // Configure highlight.js
    hljs.configure({
        languages: [
            'javascript', 'python', 'java', 'c', 'cpp', 'csharp', 'php',
            'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript', 'html',
            'css', 'scss', 'sql', 'bash', 'shell', 'powershell', 'json',
            'xml', 'yaml', 'markdown', 'dockerfile', 'nginx', 'apache'
        ]
    });
}

/**
 * Service Worker Registration (optional)
 */
if ('serviceWorker' in navigator) {
    // Optionally register a service worker for offline support
    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js');
    // });
}

// Export DemoApp for debugging/external access
window.DemoApp = DemoApp;
