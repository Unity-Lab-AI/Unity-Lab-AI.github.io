document.addEventListener("DOMContentLoaded", () => {
    window._pollinationsAPIConfig = {
        safe: false
    };

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

    function populateAllVoiceDropdowns() {
        const voiceSelect = document.getElementById("voice-select");
        const voiceSelectModal = document.getElementById("voice-select-modal");
        const voiceSelectSettings = document.getElementById("voice-select-settings");
        const voiceSelectVoiceChat = document.getElementById("voice-select-voicechat");
        const dropdowns = [voiceSelect, voiceSelectModal, voiceSelectSettings, voiceSelectVoiceChat];

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
        const voiceSelect = document.getElementById("voice-select");
        const voiceSelectModal = document.getElementById("voice-select-modal");
        const voiceSelectSettings = document.getElementById("voice-select-settings");
        const voiceSelectVoiceChat = document.getElementById("voice-select-voicechat");
        const dropdowns = [voiceSelect, voiceSelectModal, voiceSelectSettings, voiceSelectVoiceChat];

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
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    chatInput.value = (chatInput.value + " " + finalTranscript).trim();
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
        toggleAutoSpeak,
        updateVoiceToggleUI,
        speakMessage,
        stopSpeaking,
        shutUpTTS,
        initSpeechRecognition,
        toggleSpeechRecognition,
        showToast,
        loadVoices,
        populateAllVoiceDropdowns,
        updateAllVoiceDropdowns
    };

});