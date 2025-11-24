document.addEventListener("DOMContentLoaded", () => {
    const newSessionBtn = document.getElementById("new-session-btn");
    const modelSelect = document.getElementById("model-select");
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
        try {
            const res = await window.pollinationsFetch("https://text.pollinations.ai/models", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store"
            });
            const models = await res.json();
            modelSelect.innerHTML = "";
            let hasValidModel = false;

            if (!Array.isArray(models) || models.length === 0) {
                console.error("Models response is not a valid array or is empty:", models);
                throw new Error("Invalid models response");
            }

            models.forEach(m => {
                if (m && m.name) {
                    const opt = document.createElement("option");
                    opt.value = m.name;
                    opt.textContent = m.description || m.name;

                    let tooltip = m.description || m.name;
                    if (m.censored !== undefined) {
                        tooltip += m.censored ? " (Censored)" : " (Uncensored)";
                    }
                    if (m.reasoning) tooltip += " | Reasoning";
                    if (m.vision) tooltip += " | Vision";
                    if (m.audio) tooltip += " | Audio: " + (m.voices ? m.voices.join(", ") : "N/A");
                    if (m.provider) tooltip += " | Provider: " + m.provider;

                    opt.title = tooltip;
                    modelSelect.appendChild(opt);
                    hasValidModel = true;
                } else {
                    console.warn("Skipping invalid model entry:", m);
                }
            });

            const currentSession = Storage.getCurrentSession();
            const preferredModel = currentSession?.model || Storage.getDefaultModel();
            if (preferredModel) {
                const exists = Array.from(modelSelect.options).some(option => option.value === preferredModel);
                if (exists) {
                    modelSelect.value = preferredModel;
                } else {
                    const tempOpt = document.createElement("option");
                    tempOpt.value = preferredModel;
                    tempOpt.textContent = `${preferredModel} (Previously Selected - May Be Unavailable)`;
                    tempOpt.title = "This model may no longer be available";
                    modelSelect.appendChild(tempOpt);
                    modelSelect.value = preferredModel;
                    console.warn(`Model ${preferredModel} not found in fetched list. Added as unavailable option.`);
                }
            }

            if (!modelSelect.value && modelSelect.options.length > 0) {
                const unityOption = Array.from(modelSelect.options).find(opt => opt.value === "unity");
                const firstModel = unityOption ? unityOption.value : modelSelect.options[0].value;
                modelSelect.value = firstModel;
                if (currentSession) {
                    Storage.setSessionModel(currentSession.id, firstModel);
                }
            }
        } catch (err) {
            console.error("Failed to fetch text models:", err);
            modelSelect.innerHTML = "";
            const currentSession = Storage.getCurrentSession();
            const fallbackModel = currentSession?.model || Storage.getDefaultModel();
            if (fallbackModel) {
                const sessOpt = document.createElement("option");
                sessOpt.value = fallbackModel;
                sessOpt.textContent = `${fallbackModel} (From Session - May Be Unavailable)`;
                modelSelect.appendChild(sessOpt);
                modelSelect.value = fallbackModel;
            }
        }
    }
    fetchPollinationsModels();
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