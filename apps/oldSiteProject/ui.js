/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

document.addEventListener("DOMContentLoaded", () => {
    const newSessionBtn = document.getElementById("new-session-btn");
    const modelSelect = document.getElementById("model-select");
    const imageModelSelect = document.getElementById("image-model-select");
    const donationOpenBtn = document.getElementById("donation-open-btn");
    const donationModal = document.getElementById("donation-modal");
    const donationModalClose = document.getElementById("donation-modal-close");
    const openSettingsBtn = document.getElementById("open-settings-btn");
    const settingsModal = document.getElementById("settings-modal");
    const settingsModalClose = document.getElementById("settings-modal-close");
    const themeSelect = document.getElementById("theme-select");
    const themeSelectSettings = document.getElementById("theme-select-settings");
    const voiceSelectSettings = document.getElementById("voice-select-settings");
    const openPersonalizationBtn = document.getElementById("open-personalization-btn");
    const openPersonalizationSettings = document.getElementById("open-personalization-settings");
    const personalizationModal = document.getElementById("personalization-modal");
    const personalizationClose = document.getElementById("personalization-close");
    const savePersonalizationBtn = document.getElementById("save-personalization");
    const cancelPersonalizationBtn = document.getElementById("cancel-personalization");
    const openMemoryManagerBtn = document.getElementById("open-memory-manager");
    const memoryModal = document.getElementById("memory-modal");
    const memoryModalClose = document.getElementById("memory-modal-close");
    const memoryList = document.getElementById("memory-list");
    const addMemoryBtn = document.getElementById("add-memory-btn");
    const clearAllMemoryBtn = document.getElementById("clear-all-memory-btn");
    const addMemoryModal = document.getElementById("add-memory-modal");
    const addMemoryModalClose = document.getElementById("add-memory-modal-close");
    const newMemoryText = document.getElementById("new-memory-text");
    const saveNewMemoryBtn = document.getElementById("save-new-memory-btn");
    const cancelNewMemoryBtn = document.getElementById("cancel-new-memory-btn");
    const clearChatSessionsBtn = document.getElementById("clear-chat-sessions-btn");
    const clearUserDataBtn = document.getElementById("clear-user-data-btn");
    const toggleSimpleModeBtn = document.getElementById("toggle-simple-mode");

    let themeLinkElement = document.getElementById("theme-link");
    if (!themeLinkElement) {
        themeLinkElement = document.createElement("link");
        themeLinkElement.id = "theme-link";
        themeLinkElement.rel = "stylesheet";
        document.head.appendChild(themeLinkElement);
    }

    const allThemes = [
        { value: "light", label: "Light", file: "themes/light.css" },
        { value: "dark", label: "Dark", file: "themes/dark.css" },
        { value: "hacker", label: "Hacker", file: "themes/hacker.css" },
        { value: "oled", label: "OLED Dark", file: "themes/oled.css" },
        { value: "subtle-light", label: "Subtle Light", file: "themes/subtle_light.css" },
        { value: "burple", label: "Burple", file: "themes/burple.css" },
        { value: "pretty-pink", label: "Pretty Pink", file: "themes/pretty_pink.css" },
        { value: "nord", label: "Nord", file: "themes/nord.css" },
        { value: "solarized-light", label: "Solarized Light", file: "themes/solarized_light.css" },
        { value: "solarized-dark", label: "Solarized Dark", file: "themes/solarized_dark.css" },
        { value: "gruvbox-light", label: "Gruvbox Light", file: "themes/gruvbox_light.css" },
        { value: "gruvbox-dark", label: "Gruvbox Dark", file: "themes/gruvbox_dark.css" },
        { value: "cyberpunk", label: "Cyberpunk", file: "themes/cyberpunk.css" },
        { value: "dracula", label: "Dracula", file: "themes/dracula.css" },
        { value: "monokai", label: "Monokai", file: "themes/monokai.css" },
        { value: "material-dark", label: "Material Dark", file: "themes/material_dark.css" },
        { value: "material-light", label: "Material Light", file: "themes/material_light.css" },
        { value: "pastel-dream", label: "Pastel Dream", file: "themes/pastel_dream.css" },
        { value: "ocean-breeze", label: "Ocean Breeze", file: "themes/ocean_breeze.css" },
        { value: "vintage-paper", label: "Vintage Paper", file: "themes/vintage_paper.css" },
        { value: "honeycomb", label: "Honeycomb", file: "themes/honeycomb.css" },
        { value: "rainbow-throwup", label: "Rainbow Throwup", file: "themes/rainbow_throwup.css" },
        { value: "serenity", label: "Serenity", file: "themes/serenity.css" }
    ];

    function populateThemeDropdowns() {
        themeSelect.innerHTML = "";
        themeSelectSettings.innerHTML = "";
        allThemes.forEach(themeObj => {
            const opt1 = document.createElement("option");
            opt1.value = themeObj.value;
            opt1.textContent = themeObj.label;
            opt1.title = `Apply the ${themeObj.label} theme.`;
            themeSelect.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = themeObj.value;
            opt2.textContent = themeObj.label;
            opt2.title = `Apply the ${themeObj.label} theme.`;
            themeSelectSettings.appendChild(opt2);
        });
    }
    populateThemeDropdowns();

    function loadUserTheme() {
        const savedTheme = localStorage.getItem("selectedTheme") || "dark";
        themeSelect.value = savedTheme;
        themeSelectSettings.value = savedTheme;
        const found = allThemes.find(t => t.value === savedTheme);
        themeLinkElement.href = found ? found.file : "themes/dark.css";
    }
    loadUserTheme();

    function changeTheme(newThemeValue) {
        localStorage.setItem("selectedTheme", newThemeValue);
        themeSelect.value = newThemeValue;
        themeSelectSettings.value = newThemeValue;
        const found = allThemes.find(t => t.value === newThemeValue);
        themeLinkElement.href = found ? found.file : "";
    }

    themeSelect.addEventListener("change", () => {
        changeTheme(themeSelect.value);
    });
    themeSelectSettings.addEventListener("change", () => {
        changeTheme(themeSelectSettings.value);
    });

    async function fetchPollinationsModels() {
        console.log("[Unity] fetchPollinationsModels called, modelSelect:", modelSelect);

        // Ensure modelSelect exists
        if (!modelSelect) {
            console.error("[Unity] modelSelect element not found!");
            return;
        }

        // Step 1: Clear dropdown and add our custom Unity AI models FIRST
        modelSelect.innerHTML = "";
        console.log("[Unity] Cleared modelSelect, adding custom models...");

        const customModelsGroup = document.createElement("optgroup");
        customModelsGroup.label = "Unity AI Custom Models";

        const unityOption = document.createElement("option");
        unityOption.value = "unity";
        unityOption.textContent = "Unity AI (Uncensored Girlfriend)";
        unityOption.title = "Unity - Edgy goth girlfriend persona, uncensored, uses mistral as base";
        customModelsGroup.appendChild(unityOption);

        const evilOption = document.createElement("option");
        evilOption.value = "evil";
        evilOption.textContent = "Evil Mode (Unhinged)";
        evilOption.title = "Evil - Completely unhinged mode, no restrictions, uses mistral as base";
        customModelsGroup.appendChild(evilOption);

        modelSelect.appendChild(customModelsGroup);
        console.log("[Unity] Custom models added. Options count:", modelSelect.options.length);

        // Step 2: Fetch Pollinations models and add them
        try {
            const apiKey = typeof PollinationsAPI !== 'undefined' ? PollinationsAPI.DEFAULT_API_KEY : 'pk_YBwckBxhiFxxCMbk';
            const res = await window.pollinationsFetch(`https://gen.pollinations.ai/text/models?key=${apiKey}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                cache: "no-store"
            });
            const models = await res.json();

            if (Array.isArray(models) && models.length > 0) {
                const apiModelsGroup = document.createElement("optgroup");
                apiModelsGroup.label = "Pollinations Models";

                models.forEach(m => {
                    const modelName = typeof m === 'string' ? m : (m && m.name);
                    const modelDesc = typeof m === 'object' ? (m.description || modelName) : modelName;
                    const modelNameLower = modelName ? modelName.toLowerCase() : '';

                    // Skip unity and evil from API - we use our own custom versions with mistral
                    if (modelName && modelNameLower !== 'unity' && modelNameLower !== 'evil') {
                        const opt = document.createElement("option");
                        opt.value = modelName;
                        opt.textContent = modelDesc;

                        let tooltip = modelDesc;
                        if (typeof m === 'object') {
                            if (m.censored !== undefined) {
                                tooltip += m.censored ? " (Censored)" : " (Uncensored)";
                            }
                            if (m.reasoning) tooltip += " | Reasoning";
                            if (m.vision) tooltip += " | Vision";
                            if (m.audio) tooltip += " | Audio: " + (m.voices ? m.voices.join(", ") : "N/A");
                            if (m.provider) tooltip += " | Provider: " + m.provider;
                        }

                        opt.title = tooltip;
                        apiModelsGroup.appendChild(opt);
                    }
                });

                modelSelect.appendChild(apiModelsGroup);
                console.log("[Unity] API models added. Total options:", modelSelect.options.length);
            }
        } catch (err) {
            console.error("[Unity] Failed to fetch Pollinations models:", err);
            // Custom models already added above, so we're still functional
        }

        console.log("[Unity] Final dropdown state - options:", modelSelect.options.length);

        // Step 3: Select the appropriate model
        const currentSession = Storage.getCurrentSession();
        let preferredModel = currentSession?.model || Storage.getDefaultModel();

        // Normalize legacy "Unity" or "Evil" to lowercase
        if (preferredModel) {
            const lowerModel = preferredModel.toLowerCase();
            if (lowerModel === 'unity' || lowerModel === 'evil') {
                preferredModel = lowerModel;
                // Update storage with normalized lowercase value
                if (currentSession) Storage.setSessionModel(currentSession.id, preferredModel);
                Storage.setDefaultModel(preferredModel);
            }
        }

        // Try to select the preferred model, default to "unity" if not found or not set
        if (preferredModel) {
            const exists = Array.from(modelSelect.options).some(opt => opt.value === preferredModel);
            if (exists) {
                modelSelect.value = preferredModel;
            } else {
                // Model doesn't exist in our list - default to unity
                console.warn(`Model "${preferredModel}" not available, defaulting to unity`);
                modelSelect.value = "unity";
                if (currentSession) Storage.setSessionModel(currentSession.id, "unity");
                Storage.setDefaultModel("unity");
            }
        } else {
            // No preferred model - default to unity
            modelSelect.value = "unity";
            if (currentSession) Storage.setSessionModel(currentSession.id, "unity");
            Storage.setDefaultModel("unity");
        }
        console.log("[Unity] Model selection complete. Selected:", modelSelect.value);
    }

    // Call immediately and log completion
    fetchPollinationsModels().then(() => {
        console.log("[Unity] fetchPollinationsModels completed successfully");
    }).catch(err => {
        console.error("[Unity] fetchPollinationsModels failed:", err);
    });

    // Fetch and populate image models dropdown
    async function fetchImageModels() {
        console.log("[Unity] fetchImageModels called, imageModelSelect:", imageModelSelect);

        if (!imageModelSelect) {
            console.error("[Unity] imageModelSelect element not found!");
            return;
        }

        imageModelSelect.innerHTML = "";

        try {
            const apiKey = typeof PollinationsAPI !== 'undefined' ? PollinationsAPI.DEFAULT_API_KEY : 'pk_YBwckBxhiFxxCMbk';
            // Correct endpoint per Pollinations docs: gen.pollinations.ai/image/models
            const res = await window.pollinationsFetch(`https://gen.pollinations.ai/image/models?key=${apiKey}`, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });
            const models = await res.json();

            if (Array.isArray(models) && models.length > 0) {
                models.forEach(modelData => {
                    // API returns objects with 'name' property, not just strings
                    const modelName = typeof modelData === 'string' ? modelData : modelData.name;
                    if (modelName) {
                        const opt = document.createElement("option");
                        opt.value = modelName;
                        // Use description if available
                        opt.textContent = modelData.description ? `${modelName} - ${modelData.description}` : modelName;
                        imageModelSelect.appendChild(opt);
                    }
                });
                console.log("[Unity] Image models loaded:", models.length);
            } else {
                throw new Error("Empty or invalid model list");
            }
        } catch (err) {
            console.error("[Unity] Failed to fetch image models:", err);
            // Add fallback models based on docs
            const fallbackModels = ["flux", "turbo", "gptimage", "kontext", "seedream"];
            fallbackModels.forEach(modelName => {
                const opt = document.createElement("option");
                opt.value = modelName;
                opt.textContent = modelName;
                imageModelSelect.appendChild(opt);
            });
        }

        // Set default to flux
        const savedImageModel = localStorage.getItem("selectedImageModel") || "flux";
        if (Array.from(imageModelSelect.options).some(opt => opt.value === savedImageModel)) {
            imageModelSelect.value = savedImageModel;
        } else if (imageModelSelect.options.length > 0) {
            imageModelSelect.value = imageModelSelect.options[0].value;
        }
        console.log("[Unity] Image model selected:", imageModelSelect.value);
    }

    fetchImageModels().then(() => {
        console.log("[Unity] fetchImageModels completed");
    }).catch(err => {
        console.error("[Unity] fetchImageModels failed:", err);
    });

    // Save image model selection
    if (imageModelSelect) {
        imageModelSelect.addEventListener("change", () => {
            localStorage.setItem("selectedImageModel", imageModelSelect.value);
            window.showToast(`Image model set to: ${imageModelSelect.value}`);
        });
    }

    // Expose selected image model globally
    window.getSelectedImageModel = () => {
        return imageModelSelect?.value || localStorage.getItem("selectedImageModel") || "flux";
    };

    newSessionBtn.addEventListener("click", () => {
        const newSess = Storage.createSession("New Chat");
        Storage.setCurrentSessionId(newSess.id);
        const chatBox = document.getElementById("chat-box");
        if (chatBox) chatBox.innerHTML = "";
        if (modelSelect) {
            const selected = newSess.model || modelSelect.options[0]?.value || "";
            modelSelect.value = selected;
            Storage.setSessionModel(newSess.id, selected);
        }
        Storage.renderSessions();
        window.showToast("New chat session created");
    });

    modelSelect.addEventListener("change", () => {
        const currentSession = Storage.getCurrentSession();
        if (currentSession) {
            const newModel = modelSelect.value;
            Storage.setSessionModel(currentSession.id, newModel);
            const originalBg = modelSelect.style.backgroundColor;
            modelSelect.style.backgroundColor = "#4CAF50";
            modelSelect.style.color = "white";
            setTimeout(() => {
                modelSelect.style.backgroundColor = originalBg;
                modelSelect.style.color = "";
            }, 500);
            window.showToast(`Model updated to: ${newModel}`);
        }
    });

    donationOpenBtn.addEventListener("click", () => {
        donationModal.classList.remove("hidden");
    });
    donationModalClose.addEventListener("click", () => {
        donationModal.classList.add("hidden");
    });

    openSettingsBtn.addEventListener("click", () => {
        settingsModal.classList.remove("hidden");
        if (window._chatInternals && window._chatInternals.voices && window._chatInternals.voices.length > 0) {
            window._chatInternals.populateAllVoiceDropdowns();
        }
    });
    settingsModalClose.addEventListener("click", () => {
        settingsModal.classList.add("hidden");
    });

    if (openPersonalizationBtn) {
        openPersonalizationBtn.addEventListener("click", () => {
            openPersonalizationModal();
        });
    }
    if (openPersonalizationSettings) {
        openPersonalizationSettings.addEventListener("click", () => {
            openPersonalizationModal();
        });
    }
    if (personalizationClose) {
        personalizationClose.addEventListener("click", () => {
            personalizationModal.classList.add("hidden");
        });
    }
    if (cancelPersonalizationBtn) {
        cancelPersonalizationBtn.addEventListener("click", () => {
            personalizationModal.classList.add("hidden");
        });
    }
    if (savePersonalizationBtn) {
        savePersonalizationBtn.addEventListener("click", () => {
            const userData = {
                name: document.getElementById('user-name').value.trim(),
                interests: document.getElementById('user-interests').value.trim(),
                aiTraits: document.getElementById('ai-traits').value.trim(),
                additionalInfo: document.getElementById('additional-info').value.trim()
            };
            localStorage.setItem('userPersonalization', JSON.stringify(userData));
            const hasData = Object.values(userData).some(value => value !== '');
            if (hasData) {
                let memoryText = "User Personalization:";
                if (userData.name) memoryText += `\n- Name: ${userData.name}`;
                if (userData.interests) memoryText += `\n- Interests: ${userData.interests}`;
                if (userData.aiTraits) memoryText += `\n- Preferred AI traits: ${userData.aiTraits}`;
                if (userData.additionalInfo) memoryText += `\n- Additional info: ${userData.additionalInfo}`;
                addOrUpdatePersonalizationMemory(memoryText);
            }
            window.showToast("Personalization saved");
            personalizationModal.classList.add("hidden");
        });
    }

    function openPersonalizationModal() {
        if (!personalizationModal) return;
        loadPersonalization();
        personalizationModal.classList.remove("hidden");
    }

    function loadPersonalization() {
        const savedData = localStorage.getItem('userPersonalization');
        if (savedData) {
            try {
                const userData = JSON.parse(savedData);
                if (document.getElementById('user-name')) {
                    document.getElementById('user-name').value = userData.name || '';
                }
                if (document.getElementById('user-interests')) {
                    document.getElementById('user-interests').value = userData.interests || '';
                }
                if (document.getElementById('ai-traits')) {
                    document.getElementById('ai-traits').value = userData.aiTraits || '';
                }
                if (document.getElementById('additional-info')) {
                    document.getElementById('additional-info').value = userData.additionalInfo || '';
                }
            } catch (error) {
                console.error("Error loading personalization data:", error);
            }
        }
    }

    function addOrUpdatePersonalizationMemory(memoryText) {
        const memories = Memory.getMemories();
        const personalizationIndex = memories.findIndex(m => m.startsWith("User Personalization:"));
        if (personalizationIndex !== -1) {
            Memory.removeMemoryEntry(personalizationIndex);
        }
        Memory.addMemoryEntry(memoryText);
    }

    openMemoryManagerBtn.addEventListener("click", () => {
        memoryModal.classList.remove("hidden");
        loadMemoryEntries();
    });
    memoryModalClose.addEventListener("click", () => {
        memoryModal.classList.add("hidden");
    });

    addMemoryBtn.addEventListener("click", () => {
        addMemoryModal.classList.remove("hidden");
        newMemoryText.value = "";
    });
    addMemoryModalClose.addEventListener("click", () => {
        addMemoryModal.classList.add("hidden");
    });
    cancelNewMemoryBtn.addEventListener("click", () => {
        addMemoryModal.classList.add("hidden");
    });
    saveNewMemoryBtn.addEventListener("click", () => {
        const text = newMemoryText.value.trim();
        if (!text) {
            window.showToast("Memory text cannot be empty");
            return;
        }
        const result = Memory.addMemoryEntry(text);
        if (result) {
            window.showToast("Memory added!");
            addMemoryModal.classList.add("hidden");
            loadMemoryEntries();
        } else {
            window.showToast("Could not add memory entry");
        }
    });

    function loadMemoryEntries() {
        memoryList.innerHTML = "";
        const memories = Memory.getMemories();
        if (memories.length === 0) {
            const li = document.createElement("li");
            li.textContent = "No memories stored yet.";
            memoryList.appendChild(li);
            return;
        }
        memories.forEach((mem, index) => {
            const li = document.createElement("li");
            li.textContent = mem;
            li.addEventListener("click", () => {
                const newText = prompt("Edit this memory entry:", mem);
                if (newText === null) return;
                if (newText.trim() === "") {
                    window.showToast("Memory text cannot be empty");
                    return;
                }
                Memory.updateMemoryEntry(index, newText);
                loadMemoryEntries();
            });
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.className = "btn btn-danger btn-sm float-end";
            delBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this memory entry?")) {
                    Memory.removeMemoryEntry(index);
                    loadMemoryEntries();
                }
            });
            li.appendChild(delBtn);
            memoryList.appendChild(li);
        });
    }

    clearAllMemoryBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all memory entries?")) {
            const result = Memory.clearAllMemories();
            if (result) {
                window.showToast("All memories cleared!");
                loadMemoryEntries();
            } else {
                window.showToast("Failed to clear memories");
            }
        }
    });

    if (clearChatSessionsBtn) {
        clearChatSessionsBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear ALL chat sessions? This cannot be undone.")) {
                Storage.clearAllSessions();
                document.getElementById("chat-box").innerHTML = "";
                window.showToast("All chat sessions cleared");
            }
        });
    }

    if (clearUserDataBtn) {
        clearUserDataBtn.addEventListener("click", () => {
            if (confirm("This will permanently delete ALL your data (sessions, memories, settings). Are you absolutely sure?")) {
                Storage.deleteAllUserData();
            }
        });
    }

    if (toggleSimpleModeBtn) {
        toggleSimpleModeBtn.addEventListener("click", () => {
            if (typeof window.openSimpleMode === "function") {
                window.openSimpleMode();
            } else {
                window.showToast("Simple Mode script not loaded or function missing.");
            }
        });
    }
});