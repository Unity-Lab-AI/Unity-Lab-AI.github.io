/**
 * Slash Command System Module
 * Unity AI Lab Demo Page
 *
 * Handles slash commands, autocomplete, and command execution
 */

import { triggerSmokeEffect, triggerLighterEffect, trigger420Effect } from './ui.js';
import { generateImageFromCommand } from './tools.js';
import { getAvailableVoices } from './api.js';

// Current autocomplete state
let autocompleteSelectedIndex = -1;
let autocompleteVisible = false;

/**
 * Define all available slash commands
 */
export function getSlashCommands(context) {
    return [
        {
            command: '/image',
            title: 'Generate Image',
            description: 'Generate an image with AI',
            requiresParam: true,
            paramPlaceholder: '<prompt>',
            handler: function(param) {
                if (!param) {
                    context.addMessage('ai', 'Please provide a prompt for the image. Example: /image a beautiful sunset');
                    return;
                }
                // Add user message showing the command
                context.addMessage('user', `/image ${param}`);
                // Add to history
                context.chatHistory.push({
                    role: 'user',
                    content: `Generate an image: ${param}`
                });
                // Trigger image generation
                generateImageFromCommand(
                    param,
                    context.settings,
                    context.addMessage.bind(context),
                    context.showTypingIndicator.bind(context),
                    context.removeTypingIndicator.bind(context)
                );
            }
        },
        {
            command: '/speak',
            title: 'Speak Text',
            description: 'Make Unity speak specific text',
            requiresParam: true,
            paramPlaceholder: '<text>',
            handler: function(param) {
                if (!param) {
                    context.addMessage('ai', 'Please provide text to speak. Example: /speak Hello world');
                    return;
                }
                // Add user message
                context.addMessage('user', `/speak ${param}`);
                // Prepend instruction and speak
                if (context.settings.voicePlayback) {
                    context.playVoice(param);
                }
                context.addMessage('ai', param);
            }
        },
        {
            command: '/clear',
            title: 'Clear Chat',
            description: 'Clear all chat history',
            handler: function() {
                context.addMessage('user', '/clear');
                context.clearSession();
            }
        },
        {
            command: '/delete-data',
            title: 'Delete All Data',
            description: 'Delete all stored data and settings',
            handler: function() {
                context.addMessage('user', '/delete-data');
                context.deleteAllData();
            }
        },
        {
            command: '/model',
            title: 'Select Model',
            description: 'Change the AI model',
            requiresParam: true,
            paramPlaceholder: '<model>',
            subOptions: ['unity', 'openai', 'mistral', 'claude'],
            handler: function(param) {
                const validModels = ['unity', 'openai', 'mistral', 'claude'];
                if (!param || !validModels.includes(param.toLowerCase())) {
                    context.addMessage('ai', `Please specify a valid model: ${validModels.join(', ')}`);
                    return;
                }
                context.addMessage('user', `/model ${param}`);
                document.getElementById('modelSelect').value = param.toLowerCase();
                context.settings.model = param.toLowerCase();
                context.updateModelInfo(param.toLowerCase());
                context.saveSettings();
                context.addMessage('ai', `Model changed to ${param}`);
            }
        },
        {
            command: '/voice',
            title: 'Select Voice',
            description: 'Change the voice model',
            requiresParam: true,
            paramPlaceholder: '<voice>',
            get subOptions() { return getAvailableVoices(); },
            handler: function(param) {
                const validVoices = getAvailableVoices();
                if (!param || !validVoices.includes(param.toLowerCase())) {
                    context.addMessage('ai', `Please specify a valid voice: ${validVoices.join(', ')}`);
                    return;
                }
                context.addMessage('user', `/voice ${param}`);
                document.getElementById('voiceSelect').value = param.toLowerCase();
                context.settings.voice = param.toLowerCase();
                context.saveSettings();
                context.addMessage('ai', `Voice changed to ${param}`);
            }
        },
        {
            command: '/playback',
            title: 'Toggle Voice Playback',
            description: 'Enable or disable voice playback',
            requiresParam: true,
            paramPlaceholder: 'on|off',
            subOptions: ['on', 'off'],
            handler: function(param) {
                if (param === 'on') {
                    context.addMessage('user', '/playback on');
                    document.getElementById('voicePlayback').checked = true;
                    context.settings.voicePlayback = true;
                    context.saveSettings();
                    context.addMessage('ai', 'Voice playback enabled');
                } else if (param === 'off') {
                    context.addMessage('user', '/playback off');
                    document.getElementById('voicePlayback').checked = false;
                    context.settings.voicePlayback = false;
                    context.saveSettings();
                    context.addMessage('ai', 'Voice playback disabled');
                } else {
                    context.addMessage('ai', 'Please specify "on" or "off". Example: /playback on');
                }
            }
        },
        {
            command: '/smoke',
            title: 'Smoke Effect',
            description: 'Trigger smoke particle effect',
            handler: function() {
                context.addMessage('user', '/smoke');
                triggerSmokeEffect();
                context.addMessage('ai', '🌫️ Smoke effect activated');
            }
        },
        {
            command: '/light-up',
            title: 'Lighter Effect',
            description: 'Trigger lighter flame effect',
            handler: function() {
                context.addMessage('user', '/light-up');
                triggerLighterEffect();
                context.addMessage('ai', '🔥 Lighter effect activated');
            }
        },
        {
            command: '/shutup',
            title: 'Stop Voice',
            description: 'Stop all voice playback and disable',
            handler: function() {
                context.addMessage('user', '/shutup');
                context.stopVoicePlayback();
                document.getElementById('voicePlayback').checked = false;
                context.settings.voicePlayback = false;
                context.saveSettings();
                context.addMessage('ai', '🔇 Voice playback stopped and disabled');
            }
        },
        {
            command: '/420',
            title: '420 Effect',
            description: 'Trigger green pot leaf animation',
            handler: function() {
                context.addMessage('user', '/420');
                trigger420Effect();
                context.addMessage('ai', '🍃 420 effect activated');
            }
        }
    ];
}

/**
 * Handle slash command input
 */
export function handleSlashCommandInput(slashCommands) {
    const input = document.getElementById('messageInput');
    const text = input.value;
    const autocompleteEl = document.getElementById('slashAutocomplete');

    // Safety check for slashCommands
    if (!slashCommands || !Array.isArray(slashCommands)) {
        console.error('slashCommands is not defined or not an array:', slashCommands);
        hideAutocomplete();
        return;
    }

    // Check if input starts with "/"
    if (text.startsWith('/')) {
        const parts = text.slice(1).split(' ');
        const commandPart = parts[0].toLowerCase();
        const paramPart = parts.slice(1).join(' ');

        // Find matching commands
        const matches = slashCommands.filter(cmd =>
            cmd.command.slice(1).toLowerCase().startsWith(commandPart)
        );

        if (matches.length > 0) {
            console.log('[SlashCmd] Found', matches.length, 'matches, showing autocomplete');
            showAutocomplete(matches, commandPart, paramPart);
            autocompleteVisible = true;
        } else {
            hideAutocomplete();
        }
    } else {
        hideAutocomplete();
    }
}

/**
 * Show autocomplete dropdown
 */
function showAutocomplete(commands, commandPart, paramPart) {
    const autocompleteEl = document.getElementById('slashAutocomplete');
    autocompleteEl.innerHTML = '';
    autocompleteSelectedIndex = -1;

    commands.forEach((cmd, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.index = index;
        item.dataset.command = cmd.command;

        const titleRow = document.createElement('div');
        titleRow.style.display = 'flex';
        titleRow.style.alignItems = 'center';

        const commandSpan = document.createElement('span');
        commandSpan.className = 'autocomplete-item-command';
        commandSpan.textContent = cmd.command;
        if (cmd.requiresParam) {
            commandSpan.textContent += ' ' + cmd.paramPlaceholder;
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'autocomplete-item-title';
        titleSpan.textContent = cmd.title;

        titleRow.appendChild(commandSpan);
        titleRow.appendChild(titleSpan);

        const descSpan = document.createElement('div');
        descSpan.className = 'autocomplete-item-description';
        descSpan.textContent = cmd.description;

        item.appendChild(titleRow);
        item.appendChild(descSpan);

        // Add sub-options if available and command is partially typed
        if (cmd.subOptions && commandPart === cmd.command.slice(1).toLowerCase()) {
            const subOptionsContainer = document.createElement('div');
            subOptionsContainer.className = 'autocomplete-suboptions';

            cmd.subOptions.forEach(option => {
                const subOption = document.createElement('div');
                subOption.className = 'autocomplete-suboption';
                subOption.textContent = option;
                subOption.addEventListener('click', (e) => {
                    e.stopPropagation();
                    applySlashCommand(cmd.command, option, cmd);
                });
                subOptionsContainer.appendChild(subOption);
            });

            item.appendChild(subOptionsContainer);
        }

        // Click handler for main item
        item.addEventListener('click', () => {
            if (cmd.requiresParam && !paramPart) {
                // Just fill in the command, let user type parameter
                const input = document.getElementById('messageInput');
                input.value = cmd.command + ' ';
                input.focus();
                hideAutocomplete();
            } else {
                applySlashCommand(cmd.command, paramPart, cmd);
            }
        });

        autocompleteEl.appendChild(item);
    });

    autocompleteEl.classList.add('active');
}

/**
 * Hide autocomplete
 */
export function hideAutocomplete() {
    const autocompleteEl = document.getElementById('slashAutocomplete');
    autocompleteEl.classList.remove('active');
    autocompleteEl.innerHTML = '';
    autocompleteVisible = false;
    autocompleteSelectedIndex = -1;
}

/**
 * Handle autocomplete navigation with arrow keys
 */
export function handleAutocompleteNavigation(e) {
    if (!autocompleteVisible) return false;

    const autocompleteEl = document.getElementById('slashAutocomplete');
    const items = autocompleteEl.querySelectorAll('.autocomplete-item');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        autocompleteSelectedIndex = Math.min(autocompleteSelectedIndex + 1, items.length - 1);
        updateAutocompleteSelection(items);
        return true;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        autocompleteSelectedIndex = Math.max(autocompleteSelectedIndex - 1, -1);
        updateAutocompleteSelection(items);
        return true;
    } else if (e.key === 'Enter' && autocompleteSelectedIndex >= 0) {
        e.preventDefault();
        items[autocompleteSelectedIndex].click();
        return true;
    } else if (e.key === 'Escape') {
        e.preventDefault();
        hideAutocomplete();
        return true;
    }

    return false;
}

/**
 * Update autocomplete selection visual
 */
function updateAutocompleteSelection(items) {
    items.forEach((item, index) => {
        if (index === autocompleteSelectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
        }
    });
}

/**
 * Apply slash command
 */
function applySlashCommand(command, param, cmd) {
    if (cmd && cmd.handler) {
        // Clear input
        const input = document.getElementById('messageInput');
        input.value = '';
        input.style.height = 'auto';

        // Hide autocomplete
        hideAutocomplete();

        // Execute command handler
        cmd.handler.call(null, param);
    }
}

/**
 * Get autocomplete visibility state
 */
export function isAutocompleteVisible() {
    return autocompleteVisible;
}
