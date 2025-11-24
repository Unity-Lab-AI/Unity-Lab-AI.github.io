// ===== network.js =====
async function pollinationsFetch(url, options = {}, { timeoutMs = 45000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'AbortError')), timeoutMs);
    try {
        const res = await fetch(
            url,
            { ...options, signal: controller.signal, cache: 'no-store' }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
    } finally {
        clearTimeout(timer);
    }
}
window.pollinationsFetch = pollinationsFetch;

// Load global AI instructions from external text file
window.aiInstructions = "";
window.aiInstructionPromise = fetch("ai-instruct.txt")
    .then(res => res.text())
    .then(text => { window.aiInstructions = text; })
    .catch(err => {
        console.error("Failed to load AI instructions", err);
        window.aiInstructions = "";
    });

document.addEventListener("DOMContentLoaded", () => {

    const chatBox = document.getElementById("chat-box");
    const chatInput = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-button");
    const clearChatBtn = document.getElementById("clear-chat");
    const voiceToggleBtn = document.getElementById("voice-toggle");
    const modelSelect = document.getElementById("model-select");

    let currentSession = Storage.getCurrentSession();
    if (!currentSession) {
        currentSession = Storage.createSession("New Chat");
        localStorage.setItem("currentSessionId", currentSession.id);
    }

    const synth = window.speechSynthesis;
    let voices = [];
    let selectedVoice = null;
    let isSpeaking = false;
    let autoSpeakEnabled = localStorage.getItem("autoSpeakEnabled") === "true";
    let currentlySpeakingMessage = null;
    let activeUtterance = null;
    let recognition = null;
    let isListening = false;
    let voiceInputBtn = null;
    let slideshowInterval = null;

    function normalize(str) {
        return str?.toLowerCase().trim() || "";
    }

    function autoTagVoiceTargets(root = document) {
        const selectors = 'button, [role="button"], a, input, select, textarea';
        const elements = root.querySelectorAll(selectors);
        for (const el of elements) {
            if (el.dataset.voice) continue;
            const labels = [
                el.id?.replace(/[-_]/g, ' '),
                el.getAttribute('aria-label'),
                el.getAttribute('title'),
                el.textContent
            ].map(normalize).filter(Boolean);
            if (!labels.length) continue;
            const variants = new Set();
            for (const label of labels) {
                variants.add(label);
                if (label.endsWith('s')) variants.add(label.slice(0, -1));
                else variants.add(label + 's');
            }
            el.dataset.voice = Array.from(variants).join(' ');
        }
    }

    autoTagVoiceTargets();
    const voiceTagObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                autoTagVoiceTargets(node);
            }
        }
    });
    voiceTagObserver.observe(document.body, { childList: true, subtree: true });

    function findElement(phrase) {
        const norm = normalize(phrase);
        const id = norm.replace(/\s+/g, "-");
        let el = document.getElementById(id) ||
                 document.querySelector(`[data-voice~="${norm}"]`);

        if (!el && norm.endsWith('s')) {
            const singular = norm.slice(0, -1);
            const singularId = singular.replace(/\s+/g, "-");
            el = document.getElementById(singularId) ||
                document.querySelector(`[data-voice~="${singular}"]`);
        }

        if (el) return el;

        const candidates = Array.from(document.querySelectorAll("*"));
        for (const candidate of candidates) {
            const texts = [
                candidate.getAttribute("aria-label"),
                candidate.getAttribute("title"),
                candidate.textContent,
                candidate.dataset?.voice
            ].map(normalize);
            if (texts.some(t => t && (t.includes(norm) || norm.includes(t)))) {
                return candidate;
            }
        }
        return null;
    }

    function executeCommand(message) {
        const lower = message.toLowerCase().trim();

        const openScreensaver = /^(open|start)( the)? screensaver$/.test(lower);
        const closeScreensaver = /^(close|stop)( the)? screensaver$/.test(lower);

        if (openScreensaver) {
            const reply = "Just a second, opening the screensaver.";
            if (!window.screensaverActive) document.getElementById("toggle-screensaver")?.click();
            window.addNewMessage({ role: "ai", content: reply });
            if (autoSpeakEnabled) speakMessage(reply);
            return true;
        }
        if (closeScreensaver) {
            const reply = "Closing the screensaver.";
            if (window.screensaverActive) document.getElementById("toggle-screensaver")?.click();
            window.addNewMessage({ role: "ai", content: reply });
            if (autoSpeakEnabled) speakMessage(reply);
            return true;
        }


        const themeMatch = lower.match(/change theme to\s+(.+)/);
        if (themeMatch) {
            const theme = themeMatch[1].trim().replace(/\s+/g, '-');
            const themeSelect = document.getElementById("theme-select");
            const themeSettings = document.getElementById("theme-select-settings");
            if (themeSelect) {
                themeSelect.value = theme;
                themeSelect.dispatchEvent(new Event('change'));
            }
            if (themeSettings) {
                themeSettings.value = theme;
                themeSettings.dispatchEvent(new Event('change'));
            }
            showToast(`Theme changed to ${theme}`);
            return true;
        }

        const modelMatch = lower.match(/^(change|set|switch) model to (.+)$/);
        if (modelMatch) {
            const desired = modelMatch[2].trim();
            const option = Array.from(modelSelect.options).find(opt =>
                opt.textContent.toLowerCase().includes(desired));
            let reply;
            if (option) {
                modelSelect.value = option.value;
                modelSelect.dispatchEvent(new Event("change"));
                reply = `Model changed to ${option.textContent}.`;
            } else {
                reply = `I couldn't find a model named ${desired}.`;
            }
            window.addNewMessage({ role: "ai", content: reply });
            if (autoSpeakEnabled) speakMessage(reply);
            return true;
        }

        const setMatch = message.match(/^set (?:the )?(.+?) to[:]?\s*(.+)$/i);
        if (setMatch) {
            const target = setMatch[1].trim();
            const value = (setMatch[2] || "").trim();
            const el = findElement(target);
            let reply;
            if (el && "value" in el) {
                el.value = value;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                reply = `${target} set to ${value}.`;
            } else {
                reply = `I couldn't find ${target}.`;
            }
            window.addNewMessage({ role: "ai", content: reply });
            if (autoSpeakEnabled) speakMessage(reply);
            return true;
        }

        const clickMatch = message.match(/^(click|press|activate|toggle|open|start|close|stop|pause|resume|play|save|copy|hide|show|exit|fullscreen) (?:the )?(.+)$/i);
        if (clickMatch) {
            const verb = clickMatch[1].toLowerCase();
            const target = clickMatch[2].trim();
            let el = findElement(target);
            if (!el && target === "screensaver") {
                el = findElement(verb);
            }
            if (!el) {
                const actionTarget = `${verb} ${target}`;
                el = findElement(actionTarget);
            }
            if (!el) {
                el = findElement(verb);
            }
            let reply;
            if (el) {
                el.click();
                reply = `${target} activated.`;
            } else {
                reply = `I couldn't find ${target}.`;
            }
            window.addNewMessage({ role: "ai", content: reply });
            if (autoSpeakEnabled) speakMessage(reply);
            return true;
        }

        const singleMatch = message.match(/^(pause|resume|play|save|copy|hide|show|exit|fullscreen)$/i);
        if (singleMatch) {
            const verb = singleMatch[1];
            const el = findElement(verb);
            let reply;
            if (el) {
                el.click();
                reply = `${verb} activated.`;
            } else {
                reply = `I couldn't find ${verb}.`;
            }
            window.addNewMessage({ role: "ai", content: reply });
            if (autoSpeakEnabled) speakMessage(reply);
            return true;
        }

        return false;
    }

    function handleVoiceCommand(text) {
        return executeCommand(text);
    }

    function setVoiceInputButton(btn) {
        voiceInputBtn = btn;
        if (window._chatInternals) {
            window._chatInternals.voiceInputBtn = btn;
        }
    }

    function loadVoices() {
        return new Promise((resolve) => {
            voices = synth.getVoices();
            if (voices.length === 0) {
                synth.onvoiceschanged = () => {
                    voices = synth.getVoices();
                    if (voices.length > 0) {
                        setVoiceOptions(resolve);
                    }
                };
                setTimeout(() => {
                    if (voices.length === 0) {
                        voices = synth.getVoices();
                        setVoiceOptions(resolve);
                    }
                }, 2000);
            } else {
                setVoiceOptions(resolve);
            }
        });
    }

    function setVoiceOptions(resolve) {
        const savedVoiceIndex = localStorage.getItem("selectedVoiceIndex");
        if (savedVoiceIndex && voices[savedVoiceIndex]) {
            selectedVoice = voices[savedVoiceIndex];
        } else {
            selectedVoice = voices.find((v) => v.name === "Google UK English Female") || 
                            voices.find((v) => v.lang === "en-GB" && v.name.toLowerCase().includes("female")) || 
                            voices[0];
            const selectedIndex = voices.indexOf(selectedVoice);
            if (selectedIndex >= 0) {
                localStorage.setItem("selectedVoiceIndex", selectedIndex);
            }
        }
        populateAllVoiceDropdowns();
        resolve(selectedVoice);
    }

    function getVoiceDropdowns() {
        const voiceSelect = document.getElementById("voice-select");
        const voiceSelectModal = document.getElementById("voice-select-modal");
        const voiceSelectSettings = document.getElementById("voice-select-settings");
        const voiceSelectVoiceChat = document.getElementById("voice-select-voicechat");
        return [voiceSelect, voiceSelectModal, voiceSelectSettings, voiceSelectVoiceChat];
    }

    function populateAllVoiceDropdowns() {
        const dropdowns = getVoiceDropdowns();

        dropdowns.forEach((dropdown) => {
            if (dropdown) {
                dropdown.innerHTML = "";
                voices.forEach((voice, index) => {
                    const option = document.createElement("option");
                    option.value = index;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    dropdown.appendChild(option);
                });

                const savedVoiceIndex = localStorage.getItem("selectedVoiceIndex");
                if (savedVoiceIndex && voices[savedVoiceIndex]) {
                    dropdown.value = savedVoiceIndex;
                }

                dropdown.addEventListener("change", () => {
                    selectedVoice = voices[dropdown.value];
                    localStorage.setItem("selectedVoiceIndex", dropdown.value);
                    updateAllVoiceDropdowns(dropdown.value);
                    showToast(`Voice changed to ${selectedVoice.name}`);
                });
            }
        });
    }

    function updateAllVoiceDropdowns(selectedIndex) {
        const dropdowns = getVoiceDropdowns();

        dropdowns.forEach((dropdown) => {
            if (dropdown && dropdown.value !== selectedIndex) {
                dropdown.value = selectedIndex;
            }
        });
    }

    loadVoices().then(() => {
        updateVoiceToggleUI();
    });

    function toggleAutoSpeak() {
        autoSpeakEnabled = !autoSpeakEnabled;
        localStorage.setItem("autoSpeakEnabled", autoSpeakEnabled.toString());
        updateVoiceToggleUI();
        showToast(autoSpeakEnabled ? "Auto-speak enabled" : "Auto-speak disabled");
        if (autoSpeakEnabled) {
            speakMessage("Voice mode enabled. I'll speak responses out loud.");
        } else {
            stopSpeaking();
        }
    }

    function updateVoiceToggleUI() {
        if (voiceToggleBtn) {
            voiceToggleBtn.textContent = autoSpeakEnabled ? "🔊 Voice On" : "🔇 Voice Off";
            voiceToggleBtn.style.backgroundColor = autoSpeakEnabled ? "#4CAF50" : "";
        }
    }

    function speakMessage(text, onEnd = null) {
        if (!synth || !window.SpeechSynthesisUtterance) {
            showToast("Speech synthesis not supported in your browser");
            return;
        }

        if (isSpeaking) {
            synth.cancel();
            isSpeaking = false;
            activeUtterance = null;
        }

        let speakText = text.replace(/\[CODE\][\s\S]*?\[\/CODE\]/gi, "").replace(/https?:\/\/[^\s)"'<>]+/gi, "").trim();

        const utterance = new SpeechSynthesisUtterance(speakText);
        activeUtterance = utterance;

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            loadVoices().then((voice) => {
                if (voice) {
                    utterance.voice = voice;
                    synth.speak(utterance);
                }
            });
            return;
        }

        utterance.rate = parseFloat(localStorage.getItem("voiceSpeed")) || 0.9;
        utterance.pitch = parseFloat(localStorage.getItem("voicePitch")) || 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            isSpeaking = true;
            currentlySpeakingMessage = speakText;
        };

        utterance.onend = () => {
            isSpeaking = false;
            currentlySpeakingMessage = null;
            activeUtterance = null;
            if (onEnd) onEnd();
        };

        utterance.onerror = (event) => {
            isSpeaking = false;
            currentlySpeakingMessage = null;
            activeUtterance = null;
            showToast(`Speech error: ${event.error}`);
            if (onEnd) onEnd();
        };

        try {
            synth.speak(utterance);
        } catch (err) {
            showToast("Error initiating speech synthesis");
            isSpeaking = false;
            activeUtterance = null;
        }

        const keepAlive = setInterval(() => {
            if (!isSpeaking || !activeUtterance) {
                clearInterval(keepAlive);
            }
        }, 10000);
    }

    function stopSpeaking() {
        if (synth && (isSpeaking || synth.speaking)) {
            synth.cancel();
            isSpeaking = false;
            currentlySpeakingMessage = null;
            activeUtterance = null;
        }
    }

    function shutUpTTS() {
        if (synth) {
            synth.cancel();
            isSpeaking = false;
            currentlySpeakingMessage = null;
            activeUtterance = null;
            showToast("TTS stopped");
        }
    }

    // Directly handle whatever response shape the API returns without filtering.

    function speakSentences(sentences, index = 0) {
        if (index >= sentences.length) {
            return;
        }
        speakMessage(sentences[index], () => speakSentences(sentences, index + 1));
    }

    window.sendToPollinations = async function sendToPollinations(callback = null, overrideContent = null) {
        const currentSession = Storage.getCurrentSession();
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "message ai-message";
        loadingDiv.textContent = "Thinking...";
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        if (!window.aiInstructions) {
            try {
                const res = await fetch("ai-instruct.txt", { cache: "no-store" });
                window.aiInstructions = await res.text();
            } catch (e) {
                window.aiInstructions = "";
            }
        }

        const messages = [];
        if (window.aiInstructions) {
            messages.push({ role: "system", content: window.aiInstructions });
        }
        const memories = Memory.getMemories();
        if (memories?.length) {
            messages.push({ role: "system", content: `Relevant memory:\n${memories.join("\n")}\nUse it in your response.` });
        }

        const HISTORY = 10;
        const end = currentSession.messages.length - 1;
        const start = Math.max(0, end - HISTORY);
        for (let i = start; i < end; i++) {
            messages.push(currentSession.messages[i]);
        }

        const lastUser = overrideContent || currentSession.messages[end]?.content;
        if (lastUser) {
            messages.push({ role: "user", content: lastUser });
        }

        const modelSelectEl = document.getElementById("model-select");
        const model = modelSelectEl?.value || currentSession.model || Storage.getDefaultModel();
        if (!model) {
            loadingDiv.textContent = "Error: No model selected.";
            setTimeout(() => loadingDiv.remove(), 3000);
            const btn = window._chatInternals?.sendButton || document.getElementById("send-button");
            const input = window._chatInternals?.chatInput || document.getElementById("chat-input");
            if (btn) btn.disabled = false;
            if (input) input.disabled = false;
            showToast("Please select a model before sending a message.");
            if (callback) callback();
            return;
        }

        try {
            const res = await window.pollinationsFetch("https://text.pollinations.ai/openai", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ model, messages })
            }, { timeoutMs: 45000 });
            const data = await res.json();
            loadingDiv.remove();
            const aiContentRaw = data?.choices?.[0]?.message?.content || "";
            let aiContent = aiContentRaw;

            const memRegex = /\[memory\]([\s\S]*?)\[\/memory\]/gi;
            let m;
            while ((m = memRegex.exec(aiContent)) !== null) Memory.addMemoryEntry(m[1].trim());
            aiContent = aiContent.replace(memRegex, "").trim();

            window.addNewMessage({ role: "ai", content: aiContent });
            if (autoSpeakEnabled) {
                const sentences = aiContent.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                speakSentences(sentences);
            } else {
                stopSpeaking();
            }
            if (callback) callback();
        } catch (err) {
            loadingDiv.textContent = "Error: Failed to get a response.";
            setTimeout(() => loadingDiv.remove(), 3000);
            console.error("Pollinations error:", err);
            if (callback) callback();
            const btn = window._chatInternals?.sendButton || document.getElementById("send-button");
            const input = window._chatInternals?.chatInput || document.getElementById("chat-input");
            if (btn) btn.disabled = false;
            if (input) input.disabled = false;
        }
    };

    function initSpeechRecognition() {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            showToast("Speech recognition not supported in this browser");
            return false;
        }

        try {
            if ("webkitSpeechRecognition" in window) {
                recognition = new window.webkitSpeechRecognition();
            } else {
                recognition = new window.SpeechRecognition();
            }

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            if (window._chatInternals) {
                window._chatInternals.recognition = recognition;
            }

            recognition.onstart = () => {
                isListening = true;
                if (voiceInputBtn) {
                    voiceInputBtn.classList.add("listening");
                    voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                }
            };

            recognition.onresult = (event) => {
                let finalTranscript = "";
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        const processed = transcript.trim();
                        if (!handleVoiceCommand(processed)) {
                            finalTranscript += processed + " ";
                        }
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    chatInput.value = (chatInput.value + " " + finalTranscript).trim();
                    chatInput.dispatchEvent(new Event("input"));
                    const btn = window._chatInternals?.sendButton || document.getElementById("send-button");
                    if (btn) {
                        btn.disabled = false;
                        btn.click();
                    }
                }
            };

            recognition.onerror = (event) => {
                isListening = false;
                if (voiceInputBtn) {
                    voiceInputBtn.classList.remove("listening");
                    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                }
                console.error("Speech recognition error:", event.error);
            };

            recognition.onend = () => {
                isListening = false;
                if (voiceInputBtn) {
                    voiceInputBtn.classList.remove("listening");
                    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                }
            };

            return true;
        } catch (error) {
            console.error("Error initializing speech recognition:", error);
            showToast("Failed to initialize speech recognition");
            return false;
        }
    }

    function toggleSpeechRecognition() {
        if (!recognition && !initSpeechRecognition()) {
            showToast("Speech recognition not supported in this browser. Please use Chrome, Edge, or Firefox.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            try {
                showToast("Requesting microphone access...");
                recognition.start();
            } catch (error) {
                showToast("Could not start speech recognition: " + error.message);
                console.error("Speech recognition start error:", error);
            }
        }
    }

    function showToast(message, duration = 3000) {
        let toast = document.getElementById("toast-notification");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast-notification";
            toast.style.position = "fixed";
            toast.style.top = "5%";
            toast.style.left = "50%";
            toast.style.transform = "translateX(-50%)";
            toast.style.backgroundColor = "rgba(0,0,0,0.7)";
            toast.style.color = "#fff";
            toast.style.padding = "10px 20px";
            toast.style.borderRadius = "5px";
            toast.style.zIndex = "9999";
            toast.style.transition = "opacity 0.3s";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = "1";
        clearTimeout(toast.timeout);
        toast.timeout = setTimeout(() => {
            toast.style.opacity = "0";
        }, duration);
    }

    window._chatInternals = {
        chatBox,
        chatInput,
        sendButton,
        clearChatBtn,
        voiceToggleBtn,
        modelSelect,
        currentSession,
        synth,
        voices,
        selectedVoice,
        isSpeaking,
        autoSpeakEnabled,
        currentlySpeakingMessage,
        recognition,
        isListening,
        voiceInputBtn,
        slideshowInterval,
        setVoiceInputButton,
        toggleAutoSpeak,
        updateVoiceToggleUI,
        speakMessage,
        stopSpeaking,
        speakSentences,
        shutUpTTS,
        initSpeechRecognition,
        toggleSpeechRecognition,
        handleVoiceCommand,
        findElement,
        executeCommand,
        showToast,
        loadVoices,
        populateAllVoiceDropdowns,
        updateAllVoiceDropdowns,
        getVoiceDropdowns
    };

});

