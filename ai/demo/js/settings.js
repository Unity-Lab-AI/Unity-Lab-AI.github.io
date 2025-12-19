/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Settings Management Module
 * Unity AI Lab Demo Page
 *
 * Handles loading, saving, and syncing settings with localStorage
 */

import { DEFAULT_SETTINGS } from './config.js';

/**
 * Load settings from localStorage
 * @returns {Object} Settings object merged with defaults
 */
export function loadSettings() {
    try {
        const cached = localStorage.getItem('unityDemoSettings');
        if (cached) {
            const parsed = JSON.parse(cached);
            const settings = { ...DEFAULT_SETTINGS };

            // Merge cached settings with defaults (excluding systemPrompt which is never cached)
            Object.keys(parsed).forEach(key => {
                if (key !== 'systemPrompt' && settings.hasOwnProperty(key)) {
                    settings[key] = parsed[key];
                }
            });

            console.log('Settings loaded from cache');
            return settings;
        }
    } catch (error) {
        console.error('Failed to load settings from cache:', error);
    }

    return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage (excluding systemPrompt)
 * @param {Object} settings - Settings object to save
 */
export function saveSettings(settings) {
    try {
        const toSave = { ...settings };
        delete toSave.systemPrompt; // Never cache system prompt
        localStorage.setItem('unityDemoSettings', JSON.stringify(toSave));
        console.log('Settings saved to cache');
    } catch (error) {
        console.error('Failed to save settings to cache:', error);
    }
}

/**
 * Apply cached settings to UI elements
 * @param {Object} settings - Settings object to apply
 * @param {Function} updateAllVolumeSliders - Callback to update volume sliders
 */
export function applySettingsToUI(settings, updateAllVolumeSliders) {
    // Apply to form elements
    const elements = {
        modelSelect: settings.model,
        voiceSelect: settings.voice,
        voicePlayback: settings.voicePlayback,
        voiceVolume: settings.voiceVolume,
        imageModel: settings.imageModel,
        seedInput: settings.seed,
        textTemperature: settings.textTemperature,
        reasoningEffort: settings.reasoningEffort,
        imageWidth: settings.imageWidth,
        imageHeight: settings.imageHeight,
        imageEnhance: settings.imageEnhance
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = elements[id];
            } else {
                element.value = elements[id];
            }
        }
    });

    // Update all volume sliders and displays (desktop + mobile modals)
    if (updateAllVolumeSliders) {
        updateAllVolumeSliders(settings.voiceVolume);
    }

    // Update temperature display
    const textTempValue = document.getElementById('textTempValue');
    if (textTempValue) {
        textTempValue.textContent = settings.textTemperature;
    }
}

/**
 * Setup controls synchronization with settings
 * @param {Object} settings - Settings object reference
 * @param {Function} saveSettingsCallback - Callback to save settings
 * @param {Function} updateAllVolumeSliders - Callback to update volume sliders
 * @param {Function} stopVoicePlayback - Callback to stop voice playback
 */
export function setupControlsSync(settings, saveSettingsCallback, updateAllVolumeSliders, stopVoicePlayback) {
    // Volume control
    const volumeSlider = document.getElementById('voiceVolume');
    const volumeValue = document.getElementById('volumeValue');
    volumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        settings.voiceVolume = value;
        updateAllVolumeSliders(value);
        saveSettingsCallback();
    });

    // Voice playback toggle
    const voicePlaybackCheckbox = document.getElementById('voicePlayback');
    voicePlaybackCheckbox.addEventListener('change', (e) => {
        settings.voicePlayback = e.target.checked;
        // If toggling off while playing, stop talking
        if (!e.target.checked) {
            stopVoicePlayback();
        }
        saveSettingsCallback();
    });

    // Make the entire toggle switch clickable (Firefox compatibility)
    const voicePlaybackToggle = voicePlaybackCheckbox.closest('.toggle-switch');
    if (voicePlaybackToggle) {
        voicePlaybackToggle.addEventListener('click', (e) => {
            // Prevent double-firing when clicking the checkbox itself
            if (e.target === voicePlaybackCheckbox) return;
            e.preventDefault();
            voicePlaybackCheckbox.checked = !voicePlaybackCheckbox.checked;
            voicePlaybackCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    // Voice selection
    document.getElementById('voiceSelect').addEventListener('change', (e) => {
        settings.voice = e.target.value;
        saveSettingsCallback();
    });

    // Image model
    document.getElementById('imageModel').addEventListener('change', (e) => {
        settings.imageModel = e.target.value;
        saveSettingsCallback();
    });

    // Seed input
    document.getElementById('seedInput').addEventListener('change', (e) => {
        settings.seed = parseInt(e.target.value);
        saveSettingsCallback();
    });

    // System prompt
    document.getElementById('systemPrompt').addEventListener('input', (e) => {
        settings.systemPrompt = e.target.value.trim();
    });

    // Text temperature
    const textTempSlider = document.getElementById('textTemperature');
    const textTempValue = document.getElementById('textTempValue');
    textTempSlider.addEventListener('input', (e) => {
        settings.textTemperature = parseFloat(e.target.value);
        textTempValue.textContent = e.target.value;
        saveSettingsCallback();
    });

    // Reasoning effort
    document.getElementById('reasoningEffort').addEventListener('change', (e) => {
        settings.reasoningEffort = e.target.value;
        saveSettingsCallback();
    });

    // Image dimensions with auto logic
    const imageWidthSelect = document.getElementById('imageWidth');
    const imageHeightSelect = document.getElementById('imageHeight');

    imageWidthSelect.addEventListener('change', (e) => {
        const value = e.target.value;

        if (value === 'auto') {
            // If width set to auto, set height to auto too
            imageHeightSelect.value = 'auto';
            settings.imageWidth = 'auto';
            settings.imageHeight = 'auto';
        } else if (settings.imageWidth === 'auto') {
            // If switching off auto, set height back to 1024
            settings.imageWidth = value;
            settings.imageHeight = '1024';
            imageHeightSelect.value = '1024';
        } else {
            settings.imageWidth = value;
        }

        saveSettingsCallback();
    });

    imageHeightSelect.addEventListener('change', (e) => {
        const value = e.target.value;

        if (value === 'auto') {
            // If height set to auto, set width to auto too
            imageWidthSelect.value = 'auto';
            settings.imageWidth = 'auto';
            settings.imageHeight = 'auto';
        } else if (settings.imageHeight === 'auto') {
            // If switching off auto, set width back to 1024
            settings.imageHeight = value;
            settings.imageWidth = '1024';
            imageWidthSelect.value = '1024';
        } else {
            settings.imageHeight = value;
        }

        saveSettingsCallback();
    });

    // Image enhance toggle
    const imageEnhanceCheckbox = document.getElementById('imageEnhance');
    imageEnhanceCheckbox.addEventListener('change', (e) => {
        settings.imageEnhance = e.target.checked;
        saveSettingsCallback();
    });

    // Make the entire toggle switch clickable (Firefox compatibility)
    const imageEnhanceToggle = imageEnhanceCheckbox.closest('.toggle-switch');
    if (imageEnhanceToggle) {
        imageEnhanceToggle.addEventListener('click', (e) => {
            // Prevent double-firing when clicking the checkbox itself
            if (e.target === imageEnhanceCheckbox) return;
            e.preventDefault();
            imageEnhanceCheckbox.checked = !imageEnhanceCheckbox.checked;
            imageEnhanceCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
}
