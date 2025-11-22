/**
 * UI Event Handlers Module
 * Unity AI Lab Demo Page
 *
 * Handles all UI interactions, buttons, modals, panels, and atmospheric effects
 */

import { getCurrentModelMetadata } from './api.js';

/**
 * Setup all main event listeners
 */
export function setupEventListeners(
    sendMessage,
    clearSession,
    stopVoicePlayback,
    deleteAllData,
    updateModelInfo,
    saveSettings,
    handleAutocompleteNavigation,
    autoResizeTextarea,
    handleSlashCommandInput
) {
    // Send button
    document.getElementById('sendButton').addEventListener('click', () => sendMessage());

    // Message input - Enter to send, Shift+Enter for new line
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keydown', (e) => {
        // Handle autocomplete navigation
        if (handleAutocompleteNavigation(e)) {
            return; // Autocomplete handled the event
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea and handle slash commands
    messageInput.addEventListener('input', () => {
        autoResizeTextarea(messageInput);
        handleSlashCommandInput();
    });

    // Input wrapper click - focus on textarea
    const inputWrapper = document.querySelector('.input-wrapper');
    if (inputWrapper) {
        inputWrapper.addEventListener('click', (e) => {
            // Don't focus if clicking the send button
            if (!e.target.closest('.send-button')) {
                messageInput.focus();
            }
        });
    }

    // Clear session button
    document.getElementById('clearSession').addEventListener('click', () => clearSession());

    // Stop talking button
    document.getElementById('stopTalking').addEventListener('click', () => stopVoicePlayback());

    // Delete all data button
    document.getElementById('deleteAllData').addEventListener('click', () => deleteAllData());

    // Model info update
    document.getElementById('modelSelect').addEventListener('change', (e) => {
        updateModelInfo(e.target.value);
        saveSettings();
    });
}

/**
 * Setup desktop panel collapse/expand functionality
 */
export function setupDesktopPanelCollapse() {
    const collapseLeftBtn = document.getElementById('collapseLeftPanel');
    const collapseRightBtn = document.getElementById('collapseRightPanel');
    const expandLeftBtn = document.getElementById('expandLeftPanel');
    const expandRightBtn = document.getElementById('expandRightPanel');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');

    // Collapse left panel
    if (collapseLeftBtn && leftPanel && expandLeftBtn) {
        collapseLeftBtn.addEventListener('click', () => {
            leftPanel.classList.add('collapsed');
            expandLeftBtn.classList.add('visible');
        });
    }

    // Expand left panel
    if (expandLeftBtn && leftPanel) {
        expandLeftBtn.addEventListener('click', () => {
            leftPanel.classList.remove('collapsed');
            expandLeftBtn.classList.remove('visible');
        });
    }

    // Collapse right panel
    if (collapseRightBtn && rightPanel && expandRightBtn) {
        collapseRightBtn.addEventListener('click', () => {
            rightPanel.classList.add('collapsed');
            expandRightBtn.classList.add('visible');
        });
    }

    // Expand right panel
    if (expandRightBtn && rightPanel) {
        expandRightBtn.addEventListener('click', () => {
            rightPanel.classList.remove('collapsed');
            expandRightBtn.classList.remove('visible');
        });
    }
}

/**
 * Auto-resize textarea based on content
 */
export function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
}

/**
 * Update model info display
 */
export function updateModelInfo(modelValue, availableTextModels) {
    // Get ALL modelInfo elements (desktop sidebar + mobile modal)
    const modelInfoElements = document.querySelectorAll('#modelInfo');
    if (modelInfoElements.length === 0) return;

    // Try to find the model in available models
    const model = availableTextModels.find(m =>
        (m.name === modelValue || m.id === modelValue || m === modelValue)
    );

    let infoText = 'AI Model';

    if (model) {
        // If we have model metadata, use it
        if (typeof model === 'object') {
            const description = model.description || model.displayName || model.name || modelValue;
            infoText = description;
        } else {
            // Fallback to model value with formatting
            infoText = `${modelValue.charAt(0).toUpperCase() + modelValue.slice(1)} model`;
        }
    } else {
        // Fallback for unknown models
        infoText = `${modelValue.charAt(0).toUpperCase() + modelValue.slice(1)} model`;
    }

    // Update ALL model info elements
    modelInfoElements.forEach(modelInfo => {
        const spanElement = modelInfo.querySelector('span');
        if (spanElement) {
            spanElement.textContent = infoText;
        }
    });
}

/**
 * Update voice playback availability based on current model
 */
export function updateVoiceAvailability(settings) {
    const currentModel = getCurrentModelMetadata(settings.model);
    const isCommunityModel = currentModel && currentModel.community === true;

    // Unity is allowed voice playback (even though it's a community model)
    const isUnityModel = settings.model === 'unity';

    // Get ALL voice playback checkboxes (desktop sidebar + mobile modal)
    const voicePlaybackCheckboxes = document.querySelectorAll('#voicePlayback');

    voicePlaybackCheckboxes.forEach(voicePlaybackCheckbox => {
        const voiceSettings = voicePlaybackCheckbox.closest('.control-group');

        if (isCommunityModel && !isUnityModel) {
            // Disable voice playback ONLY for community models (excluding Unity)
            voicePlaybackCheckbox.disabled = true;
            voicePlaybackCheckbox.checked = false;
            settings.voicePlayback = false;

            // Add visual indicator
            if (voiceSettings) {
                voiceSettings.style.opacity = '0.5';
                voiceSettings.title = 'Voice playback is not available for community models';
            }
        } else {
            // Enable voice playback for Unity and non-community models
            voicePlaybackCheckbox.disabled = false;

            // Remove visual indicator
            if (voiceSettings) {
                voiceSettings.style.opacity = '1';
                voiceSettings.title = '';
            }
        }
    });

    // Stop any currently playing voice if disabling
    if (isCommunityModel && !isUnityModel) {
        console.log('Voice playback disabled for model:', settings.model);
    }
}

/**
 * Update system prompt availability based on current model
 */
export function updateSystemPromptAvailability(settings) {
    const currentModel = getCurrentModelMetadata(settings.model);
    const isCommunityModel = currentModel && currentModel.community === true;

    // Unity is allowed system prompts (user prompt gets appended to Unity prompt)
    const isUnityModel = settings.model === 'unity';

    // Get ALL system prompt textareas (desktop sidebar + mobile modal)
    const systemPromptTextareas = document.querySelectorAll('#systemPrompt');

    systemPromptTextareas.forEach(systemPromptTextarea => {
        const systemPromptSection = systemPromptTextarea.closest('.control-section');

        if (isCommunityModel && !isUnityModel) {
            // Disable system prompt for community models (excluding Unity)
            systemPromptTextarea.disabled = true;
            systemPromptTextarea.value = '';
            settings.systemPrompt = '';

            // Add visual indicator
            if (systemPromptSection) {
                systemPromptSection.style.opacity = '0.5';
                systemPromptTextarea.title = 'System prompts are not available for community models';
            }
        } else if (isUnityModel) {
            // Enable system prompt for Unity (it will be appended to Unity prompt)
            systemPromptTextarea.disabled = false;
            systemPromptTextarea.placeholder = 'Add to Unity\'s system prompt (optional)';

            // Remove visual indicator and set Unity-specific styling
            if (systemPromptSection) {
                systemPromptSection.style.opacity = '1';
                systemPromptTextarea.title = 'Your prompt will be appended to Unity\'s system prompt';
            }
        } else {
            // Enable system prompt for non-community models
            systemPromptTextarea.disabled = false;
            systemPromptTextarea.placeholder = 'Set AI personality (leave empty for default)';

            // Remove visual indicator
            if (systemPromptSection) {
                systemPromptSection.style.opacity = '1';
                systemPromptTextarea.title = '';
            }
        }
    });

    if (isCommunityModel && !isUnityModel) {
        console.log('System prompt disabled for model:', settings.model);
    }
}

/**
 * Expand image to fullscreen overlay
 */
export function expandImage(imageUrl, prompt) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlay.id = 'imageOverlay';

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-overlay-container';

    // Create expanded image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = prompt || 'Expanded image';
    img.className = 'image-overlay-image';

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-overlay-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeImageOverlay();
    });

    // Close on overlay click (but not image click)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeImageOverlay();
        }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeImageOverlay();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    imageContainer.appendChild(img);
    overlay.appendChild(imageContainer);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

/**
 * Close image overlay
 */
export function closeImageOverlay() {
    const overlay = document.getElementById('imageOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

/**
 * Setup mobile modal listeners
 */
export function setupMobileModalListeners(settings, saveSettings, updateAllVolumeSliders, clearSession, stopVoicePlayback, deleteAllData) {
    const openLeftBtn = document.getElementById('openLeftModal');
    const openRightBtn = document.getElementById('openRightModal');
    const closeLeftBtn = document.getElementById('closeLeftModal');
    const closeRightBtn = document.getElementById('closeRightModal');
    const backdrop = document.getElementById('mobileModalBackdrop');
    const leftModal = document.getElementById('leftModal');
    const rightModal = document.getElementById('rightModal');

    // Clone panel contents into modals on first load
    initializeMobileModals(settings, saveSettings, updateAllVolumeSliders, clearSession, stopVoicePlayback, deleteAllData);

    // Open left modal
    if (openLeftBtn) {
        openLeftBtn.addEventListener('click', () => {
            openMobileModal('left');
        });
    }

    // Open right modal
    if (openRightBtn) {
        openRightBtn.addEventListener('click', () => {
            openMobileModal('right');
        });
    }

    // Close left modal
    if (closeLeftBtn) {
        closeLeftBtn.addEventListener('click', () => {
            closeMobileModal('left');
        });
    }

    // Close right modal
    if (closeRightBtn) {
        closeRightBtn.addEventListener('click', () => {
            closeMobileModal('right');
        });
    }

    // Close on backdrop click
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            closeMobileModal('left');
            closeMobileModal('right');
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (leftModal && leftModal.classList.contains('active')) {
                closeMobileModal('left');
            }
            if (rightModal && rightModal.classList.contains('active')) {
                closeMobileModal('right');
            }
        }
    });
}

/**
 * Initialize mobile modals by cloning panel content
 */
function initializeMobileModals(settings, saveSettings, updateAllVolumeSliders, clearSession, stopVoicePlayback, deleteAllData) {
    const leftPanel = document.querySelector('.left-panel .panel-content');
    const rightPanel = document.querySelector('.right-panel .panel-content');
    const leftModalContent = document.getElementById('leftModalContent');
    const rightModalContent = document.getElementById('rightModalContent');

    if (leftPanel && leftModalContent) {
        // Clone left panel content
        leftModalContent.innerHTML = leftPanel.innerHTML;
        // Attach event listeners to cloned controls
        attachControlListeners(leftModalContent, settings, saveSettings, updateAllVolumeSliders, clearSession, stopVoicePlayback, deleteAllData);
    }

    if (rightPanel && rightModalContent) {
        // Clone right panel content
        rightModalContent.innerHTML = rightPanel.innerHTML;
        // Attach event listeners to cloned controls
        attachControlListeners(rightModalContent, settings, saveSettings, updateAllVolumeSliders, clearSession, stopVoicePlayback, deleteAllData);
    }

    // Sync volume sliders after cloning
    updateAllVolumeSliders(settings.voiceVolume);
}

/**
 * Attach event listeners to controls within a container
 */
function attachControlListeners(container, settings, saveSettings, updateAllVolumeSliders, clearSession, stopVoicePlayback, deleteAllData) {
    // Model select
    const modelSelect = container.querySelector('#modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            settings.model = e.target.value;
            saveSettings();
        });
    }

    // Voice select
    const voiceSelect = container.querySelector('#voiceSelect');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', (e) => {
            settings.voice = e.target.value;
            saveSettings();
        });
    }

    // Image model select
    const imageModel = container.querySelector('#imageModel');
    if (imageModel) {
        imageModel.addEventListener('change', (e) => {
            settings.imageModel = e.target.value;
            saveSettings();
        });
    }

    // Seed input
    const seedInput = container.querySelector('#seedInput');
    if (seedInput) {
        seedInput.addEventListener('change', (e) => {
            settings.seed = parseInt(e.target.value);
            saveSettings();
        });
    }

    // System prompt
    const systemPrompt = container.querySelector('#systemPrompt');
    if (systemPrompt) {
        systemPrompt.addEventListener('input', (e) => {
            settings.systemPrompt = e.target.value;
        });
    }

    // Text temperature slider
    const textTempSlider = container.querySelector('#textTemperature');
    const textTempValue = container.querySelector('#textTempValue');
    if (textTempSlider && textTempValue) {
        textTempSlider.addEventListener('input', (e) => {
            settings.textTemperature = parseFloat(e.target.value);
            textTempValue.textContent = e.target.value;
            saveSettings();
        });
    }

    // Reasoning effort
    const reasoningEffort = container.querySelector('#reasoningEffort');
    if (reasoningEffort) {
        reasoningEffort.addEventListener('change', (e) => {
            settings.reasoningEffort = e.target.value;
            saveSettings();
        });
    }

    // Image width
    const imageWidthSelect = container.querySelector('#imageWidth');
    if (imageWidthSelect) {
        imageWidthSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'auto') {
                settings.imageWidth = null;
            } else {
                settings.imageWidth = parseInt(value);
            }
            saveSettings();
        });
    }

    // Image height
    const imageHeightSelect = container.querySelector('#imageHeight');
    if (imageHeightSelect) {
        imageHeightSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'auto') {
                settings.imageHeight = null;
            } else {
                settings.imageHeight = parseInt(value);
            }
            saveSettings();
        });
    }

    // Image enhance checkbox
    const imageEnhanceCheckbox = container.querySelector('#imageEnhance');
    if (imageEnhanceCheckbox) {
        imageEnhanceCheckbox.addEventListener('change', (e) => {
            settings.imageEnhance = e.target.checked;
            saveSettings();
        });

        // Make the entire toggle switch clickable
        const imageEnhanceToggle = imageEnhanceCheckbox.closest('.toggle-switch');
        if (imageEnhanceToggle) {
            imageEnhanceToggle.addEventListener('click', (e) => {
                if (e.target !== imageEnhanceCheckbox) {
                    e.preventDefault();
                    imageEnhanceCheckbox.checked = !imageEnhanceCheckbox.checked;
                    imageEnhanceCheckbox.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    // Voice playback checkbox
    const voicePlaybackCheckbox = container.querySelector('#voicePlayback');
    if (voicePlaybackCheckbox) {
        voicePlaybackCheckbox.addEventListener('change', (e) => {
            settings.voicePlayback = e.target.checked;
            saveSettings();
        });

        // Make the entire toggle switch clickable
        const voicePlaybackToggle = voicePlaybackCheckbox.closest('.toggle-switch');
        if (voicePlaybackToggle) {
            voicePlaybackToggle.addEventListener('click', (e) => {
                if (e.target !== voicePlaybackCheckbox) {
                    e.preventDefault();
                    voicePlaybackCheckbox.checked = !voicePlaybackCheckbox.checked;
                    voicePlaybackCheckbox.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    // Voice volume slider
    const volumeSlider = container.querySelector('#voiceVolume');
    const volumeValue = container.querySelector('#volumeValue');
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            settings.voiceVolume = value;
            updateAllVolumeSliders(value);
            saveSettings();
        });
    }

    // Clear session button
    const clearSessionBtn = container.querySelector('#clearSession');
    if (clearSessionBtn) {
        clearSessionBtn.addEventListener('click', () => clearSession());
    }

    // Stop talking button
    const stopTalkingBtn = container.querySelector('#stopTalking');
    if (stopTalkingBtn) {
        stopTalkingBtn.addEventListener('click', () => stopVoicePlayback());
    }

    // Delete all data button
    const deleteAllDataBtn = container.querySelector('#deleteAllData');
    if (deleteAllDataBtn) {
        deleteAllDataBtn.addEventListener('click', () => deleteAllData());
    }
}

/**
 * Open mobile modal
 */
function openMobileModal(side) {
    const backdrop = document.getElementById('mobileModalBackdrop');
    const modal = document.getElementById(side === 'left' ? 'leftModal' : 'rightModal');

    if (backdrop && modal) {
        // Show backdrop
        backdrop.classList.add('active');

        // Show modal
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close mobile modal
 */
function closeMobileModal(side) {
    const backdrop = document.getElementById('mobileModalBackdrop');
    const modal = document.getElementById(side === 'left' ? 'leftModal' : 'rightModal');
    const leftModal = document.getElementById('leftModal');
    const rightModal = document.getElementById('rightModal');

    if (modal) {
        modal.classList.remove('active');
    }

    // Only hide backdrop if both modals are closed
    if (leftModal && rightModal && backdrop) {
        if (!leftModal.classList.contains('active') && !rightModal.classList.contains('active')) {
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

/**
 * Show custom alert dialog
 */
export function showAlert(title, message, isError = false) {
    return new Promise((resolve) => {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.style.opacity = '0';

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'confirmation-popup';

        popup.innerHTML = `
            <h3 style="color: ${isError ? '#dc143c' : '#fff'}">${title}</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button class="confirmation-btn confirm">OK</button>
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        // Trigger animation
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
        });

        // Button handler
        const okBtn = popup.querySelector('.confirm');

        const cleanup = () => {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(backdrop);
            }, 300);
        };

        okBtn.addEventListener('click', () => {
            cleanup();
            resolve();
        });

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                cleanup();
                resolve();
            }
        });
    });
}

/**
 * Show custom confirmation dialog
 */
export function showConfirmation(title, message, items = null, isDanger = false) {
    return new Promise((resolve) => {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.style.opacity = '0';

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'confirmation-popup';

        // Build content
        let content = `<h3>${title}</h3><p>${message}</p>`;

        if (items && items.length > 0) {
            content += '<ul>';
            items.forEach(item => {
                content += `<li>${item}</li>`;
            });
            content += '</ul>';
        }

        popup.innerHTML = content + `
            <div class="confirmation-buttons">
                <button class="confirmation-btn cancel">Cancel</button>
                <button class="confirmation-btn ${isDanger ? 'danger' : 'confirm'}">Confirm</button>
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        // Trigger animation
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
        });

        // Button handlers
        const cancelBtn = popup.querySelector('.cancel');
        const confirmBtn = popup.querySelector('.confirm, .danger');

        const cleanup = () => {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(backdrop);
            }, 300);
        };

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });

        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                cleanup();
                resolve(false);
            }
        });
    });
}

/**
 * Delete all site data (cache, cookies, localStorage)
 */
export async function deleteAllData() {
    // First confirmation
    const confirmed = await showConfirmation(
        'WARNING: Delete All Data',
        'This will delete ALL site data including:',
        [
            'Cached settings',
            'Chat history',
            'Cookies',
            'Local storage'
        ]
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirm = await showConfirmation(
        'Final Confirmation',
        'Are you ABSOLUTELY sure you want to delete all data? This will reset everything to defaults.',
        null,
        true
    );

    if (!doubleConfirm) return;

    try {
        // Clear localStorage
        localStorage.clear();

        // Clear sessionStorage
        sessionStorage.clear();

        // Clear cookies for this domain
        document.cookie.split(";").forEach(cookie => {
            const name = cookie.split("=")[0].trim();
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
        });

        // Clear IndexedDB (if any)
        if (window.indexedDB) {
            indexedDB.databases().then(dbs => {
                dbs.forEach(db => indexedDB.deleteDatabase(db.name));
            }).catch(err => console.warn('IndexedDB clear error:', err));
        }

        // Clear service worker caches (if any)
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }

        console.log('All site data deleted');

        // Show success message
        await showAlert(
            'Success',
            'All data has been deleted successfully. The page will now reload.'
        );

        // Reload the page to apply changes
        window.location.reload();
    } catch (error) {
        console.error('Error deleting data:', error);

        // Show error message
        await showAlert(
            'Error',
            'An error occurred while deleting data. Check console for details.',
            true
        );
    }
}

/**
 * Populate text model dropdown
 */
export function populateTextModels(models, settings) {
    // Get ALL model select elements (desktop sidebar + mobile modal)
    const modelSelects = document.querySelectorAll('#modelSelect');
    if (modelSelects.length === 0 || !models || models.length === 0) return;

    // Sort models to put Unity first
    const sortedModels = [...models].sort((a, b) => {
        const aName = a.name || a.id || a;
        const bName = b.name || b.id || b;
        if (aName === 'unity') return -1;
        if (bName === 'unity') return 1;
        return 0;
    });

    // Update ALL model select dropdowns
    modelSelects.forEach(modelSelect => {
        // Clear existing options
        modelSelect.innerHTML = '';

        // Add models from API
        sortedModels.forEach((model, index) => {
            const option = document.createElement('option');
            // Use the model name or id as value
            const modelValue = model.name || model.id || model;
            option.value = modelValue;
            // Use display name or name as label
            option.textContent = model.displayName || model.name || modelValue;

            // Select Unity as default, or first model if Unity not found
            if (modelValue === 'unity' || (index === 0 && !sortedModels.find(m => (m.name || m.id || m) === 'unity'))) {
                option.selected = true;
                // Only update settings.model if not already set from cache
                if (!localStorage.getItem('unityDemoSettings')) {
                    settings.model = modelValue;
                }
            }

            // Select the cached model if it exists
            if (modelValue === settings.model) {
                option.selected = true;
            }

            modelSelect.appendChild(option);
        });

        // Ensure the selected option matches current settings
        modelSelect.value = settings.model;
    });
}

/**
 * Populate image model dropdown
 */
export function populateImageModels(models, settings) {
    // Get ALL image model select elements (desktop sidebar + mobile modal)
    const imageModelSelects = document.querySelectorAll('#imageModel');
    if (imageModelSelects.length === 0 || !models || models.length === 0) return;

    // Update ALL image model select dropdowns
    imageModelSelects.forEach(imageModelSelect => {
        // Clear existing options
        imageModelSelect.innerHTML = '';

        // Add "Auto" option first (let AI choose)
        const autoOption = document.createElement('option');
        autoOption.value = 'auto';
        autoOption.textContent = 'Auto (AI Chooses)';
        if (settings.imageModel === 'auto') {
            autoOption.selected = true;
        }
        imageModelSelect.appendChild(autoOption);

        // Add models from API
        models.forEach(model => {
            const option = document.createElement('option');
            // Use the model name or id as value
            const modelValue = model.name || model.id || model;
            option.value = modelValue;
            // Use display name or name as label
            option.textContent = model.displayName || model.name || modelValue;

            // Select the cached model if it exists
            if (modelValue === settings.imageModel) {
                option.selected = true;
            }

            imageModelSelect.appendChild(option);
        });

        // Ensure the selected option matches current settings
        imageModelSelect.value = settings.imageModel;
    });
}

/**
 * Populate voice dropdown
 */
export function populateVoices(voices, settings) {
    // Get ALL voice select elements (desktop sidebar + mobile modal)
    const voiceSelects = document.querySelectorAll('#voiceSelect');
    if (voiceSelects.length === 0 || !voices || voices.length === 0) return;

    // Update ALL voice select dropdowns
    voiceSelects.forEach(voiceSelect => {
        // Clear existing options
        voiceSelect.innerHTML = '';

        // Add voices
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = voice;
            option.textContent = formatVoiceName(voice);

            // Select sage as default, or first voice if sage not found
            // Only set default if not already cached
            if (!localStorage.getItem('unityDemoSettings')) {
                if (voice === 'sage' || (index === 0 && !voices.includes('sage'))) {
                    option.selected = true;
                    settings.voice = voice;
                }
            }

            // Select the cached voice if it exists
            if (voice === settings.voice) {
                option.selected = true;
            }

            voiceSelect.appendChild(option);
        });

        // Ensure the selected option matches current settings
        voiceSelect.value = settings.voice;
    });
}

/**
 * Format voice name for display
 */
function formatVoiceName(voice) {
    // Capitalize first letter
    return voice.charAt(0).toUpperCase() + voice.slice(1);
}

// ===================================
// Unity Atmospheric Effects System
// ===================================

// Effect queue to trigger effects sequentially
let effectQueue = [];
let isProcessingEffects = false;

/**
 * Detect and queue atmospheric effects from Unity's message
 */
export function detectAndQueueEffects(messageText, settings) {
    // Only trigger for Unity model
    if (settings.model !== 'unity') return;

    const effects = [];

    // Smoke-related keywords (case-insensitive)
    const smokePatterns = [
        /\bexhales?\b/gi,
        /\bblow(?:s|ing)?\s+(?:out\s+)?smoke\b/gi,
        /\bsmoke\s+(?:curl|drift|rise)s?\b/gi,
        /\btakes?\s+(?:a\s+)?(?:drag|puff|hit)\b/gi,
        /\bbreath(?:es?)?\s+out\b/gi
    ];

    // Lighter-related keywords (case-insensitive)
    const lighterPatterns = [
        /\bspark(?:s|ing)?\s+(?:up|it)\b/gi,
        /\bflick(?:s|ing)?\s+(?:the\s+)?lighter\b/gi,
        /\blight(?:s|ing)?\s+(?:up|it|a\s+\w+)\b/gi,
        /\bstrike(?:s|ing)?\s+(?:the\s+)?(?:lighter|match)\b/gi,
        /\b(?:pulls?\s+out|grabs?\s+|reaches?\s+for)\s+(?:a\s+|her\s+|the\s+)?lighter\b/gi
    ];

    // Find all matches with their positions
    const allMatches = [];

    // Find smoke matches
    smokePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(messageText)) !== null) {
            allMatches.push({
                type: 'smoke',
                position: match.index,
                text: match[0]
            });
        }
    });

    // Find lighter matches
    lighterPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(messageText)) !== null) {
            allMatches.push({
                type: 'lighter',
                position: match.index,
                text: match[0]
            });
        }
    });

    // Sort by position to maintain order
    allMatches.sort((a, b) => a.position - b.position);

    // Calculate timing based on position in message (reading speed)
    const wordsPerMinute = 200; // Average reading speed
    const msPerWord = 60000 / wordsPerMinute;

    allMatches.forEach((match, index) => {
        const wordsBefore = messageText.substring(0, match.position).split(/\s+/).length;
        const delay = wordsBefore * msPerWord;

        effects.push({
            type: match.type,
            delay: delay,
            text: match.text
        });
    });

    // Add effects to queue
    effectQueue.push(...effects);

    // Start processing if not already running
    if (!isProcessingEffects) {
        processEffectQueue();
    }

    console.log(`Queued ${effects.length} atmospheric effects:`, effects);
}

/**
 * Process effect queue sequentially
 */
async function processEffectQueue() {
    if (effectQueue.length === 0) {
        isProcessingEffects = false;
        return;
    }

    isProcessingEffects = true;
    const effect = effectQueue.shift();

    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, effect.delay));

    // Trigger the effect
    if (effect.type === 'smoke') {
        triggerSmokeEffect();
    } else if (effect.type === 'lighter') {
        triggerLighterEffect();
    }

    // Continue processing queue
    processEffectQueue();
}

/**
 * Trigger smoke effect with random particles
 */
export function triggerSmokeEffect() {
    const container = document.getElementById('smokeContainer');
    if (!container) return;

    // Generate 5-8 random smoke particles for heavier smoke
    const particleCount = Math.floor(Math.random() * 4) + 5; // 5-8 particles

    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'smoke-particle';

            // Random horizontal position (wider spread)
            const leftPos = Math.random() * 70 + 15; // 15-85%
            particle.style.left = `${leftPos}%`;

            // Random drift amount (CSS variable)
            const drift = (Math.random() - 0.5) * 250; // -125px to +125px
            particle.style.setProperty('--drift', `${drift}px`);

            // Random rotation for curl effect (CSS variable)
            const rotation = (Math.random() - 0.5) * 120; // -60deg to +60deg
            particle.style.setProperty('--rotation', `${rotation}deg`);

            // Random delay for more natural staggered effect
            particle.style.animationDelay = `${Math.random() * 0.8}s`;

            // Add to container
            container.appendChild(particle);

            // Remove after animation completes
            setTimeout(() => {
                particle.remove();
            }, 6000); // Animation is 5s + 0.8s max delay + buffer

        }, i * 150); // Stagger particle creation by 150ms for denser smoke
    }

    console.log('🌫️ Smoke effect triggered');
}

/**
 * Trigger lighter flicker effect
 */
export function triggerLighterEffect() {
    // Create lighter overlay
    const overlay = document.createElement('div');
    overlay.className = 'lighter-effect';
    document.body.appendChild(overlay);

    // Create flame element
    const flame = document.createElement('div');
    flame.className = 'lighter-flame';
    document.body.appendChild(flame);

    // Remove after animation completes
    setTimeout(() => {
        overlay.remove();
        flame.remove();
    }, 2100); // Animation is 2s + small buffer

    console.log('🔥 Lighter effect triggered');
}

/**
 * Trigger 420 effect (pot leaves)
 */
export function trigger420Effect() {
    const container = document.body;

    // Create 20 pot leaf emojis
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const leaf = document.createElement('div');
            leaf.textContent = '🍃';
            leaf.style.position = 'fixed';
            leaf.style.fontSize = '2rem';
            leaf.style.left = Math.random() * 100 + 'vw';
            leaf.style.bottom = '-50px';
            leaf.style.zIndex = '9999';
            leaf.style.pointerEvents = 'none';
            leaf.style.transition = 'all 4s ease-out';

            container.appendChild(leaf);

            // Animate upward
            setTimeout(() => {
                leaf.style.bottom = '100vh';
                leaf.style.opacity = '0';
                leaf.style.transform = `translateX(${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 360}deg)`;
            }, 50);

            // Remove after animation
            setTimeout(() => {
                leaf.remove();
            }, 4100);
        }, i * 200); // Stagger creation
    }

    console.log('🍃 420 effect triggered');
}
