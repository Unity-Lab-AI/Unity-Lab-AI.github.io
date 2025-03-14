document.addEventListener("DOMContentLoaded", () => {
  // Define global API configuration to enforce safe=false for all Pollinations API requests
  window._pollinationsAPIConfig = {
    safe: false // Ensures uncensored content across all API calls
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
  let activeUtterance = null; // Keep reference to the current utterance

  let recognition = null;
  let isListening = false;
  let voiceInputBtn = null;
  let slideshowInterval = null;

  function loadVoices() {
    return new Promise((resolve) => {
      let voicesLoaded = false;

      function setVoices() {
        voices = synth.getVoices();
        if (voices.length > 0) {
          voicesLoaded = true;
          const savedVoiceIndex = localStorage.getItem("selectedVoiceIndex");
          
          if (savedVoiceIndex && voices[savedVoiceIndex]) {
            selectedVoice = voices[savedVoiceIndex];
          } else {
            const preferredVoices = [
              "Google UK English Female",
              "Microsoft Zira",
              "Samantha",
              "Victoria"
            ];
            for (const name of preferredVoices) {
              const voice = voices.find((v) => v.name === name);
              if (voice) {
                selectedVoice = voice;
                break;
              }
            }
            if (!selectedVoice) {
              selectedVoice =
                voices.find((v) => v.name.toLowerCase().includes("female")) ||
                voices[0];
            }
          }
          console.log("Selected voice:", selectedVoice ? selectedVoice.name : "None");
          populateVoiceDropdown();
          resolve(selectedVoice);
        }
      }

      setVoices();

      if (!voicesLoaded && synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {
          setVoices();
          resolve(selectedVoice);
        };
        setTimeout(() => {
          if (!voicesLoaded) {
            setVoices();
            resolve(selectedVoice);
          }
        }, 1000);
      }
    });
  }
  
  function populateVoiceDropdown() {
    const voiceSelect = document.getElementById("voice-select");
    if (!voiceSelect) return;

    voiceSelect.innerHTML = "";
    voices.forEach((voice, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });

    if (selectedVoice) {
      const selectedIndex = voices.findIndex(v => v === selectedVoice);
      if (selectedIndex >= 0) {
        voiceSelect.value = selectedIndex;
        localStorage.setItem("selectedVoiceIndex", selectedIndex);
      }
    }

    voiceSelect.addEventListener("change", () => {
      selectedVoice = voices[voiceSelect.value];
      localStorage.setItem("selectedVoiceIndex", voiceSelect.value);
      showToast(`Voice changed to ${selectedVoice.name}`);
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
      console.error("Speech synthesis not supported in this browser");
      showToast("Speech synthesis not supported in your browser");
      return;
    }

    // Cancel any ongoing speech and clear the queue
    if (isSpeaking) {
      synth.cancel();
      isSpeaking = false;
      activeUtterance = null;
    }

    let cleanText = text
      .replace(/```[\s\S]*?```/g, "code block omitted.")
      .replace(/`[\s\S]*?`/g, "inline code omitted.");
      // The URL censoring replace call has been nuked!

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterance = utterance; // Store reference to prevent garbage collection

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

    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      isSpeaking = true;
      currentlySpeakingMessage = text;
      console.log("Speech started:", cleanText.substring(0, 50) + "...");
    };

    utterance.onend = () => {
      isSpeaking = false;
      currentlySpeakingMessage = null;
      activeUtterance = null;
      console.log("Speech completed naturally");
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      currentlySpeakingMessage = null;
      activeUtterance = null;
      console.error("Speech synthesis error:", event.error);
      showToast(`Speech error: ${event.error}`);
      if (onEnd) onEnd();
    };

    // Prevent interruptions by keeping the utterance alive
    try {
      synth.speak(utterance);
      console.log("Speech queued successfully");
    } catch (err) {
      console.error("Error queuing speech:", err);
      showToast("Error initiating speech synthesis");
      isSpeaking = false;
      activeUtterance = null;
    }

    // Ensure the script stays active during long speech
    const keepAlive = setInterval(() => {
      if (!isSpeaking || !activeUtterance) {
        clearInterval(keepAlive);
      }
      console.log("Speech still active:", currentlySpeakingMessage?.substring(0, 20) + "...");
    }, 10000); // Check every 10 seconds
  }

  function stopSpeaking() {
    if (isSpeaking) {
      synth.cancel();
      isSpeaking = false;
      currentlySpeakingMessage = null;
      activeUtterance = null;
      console.log("Speech manually stopped");
    }
  }

  function initSpeechRecognition() {
    if ("webkitSpeechRecognition" in window) {
      recognition = new webkitSpeechRecognition();
    } else if ("SpeechRecognition" in window) {
      recognition = new SpeechRecognition();
    } else {
      console.warn("Speech recognition not supported in this browser");
      return false;
    }
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      if (voiceInputBtn) {
        voiceInputBtn.classList.add("listening");
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      }
      showToast("Listening...");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      if (finalTranscript) {
        chatInput.value = (chatInput.value + " " + finalTranscript).trim();
      } else if (interimTranscript) {
        console.log("Interim:", interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      isListening = false;
      if (voiceInputBtn) {
        voiceInputBtn.classList.remove("listening");
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
      showToast("Voice recognition error: " + event.error);
    };

    recognition.onend = () => {
      isListening = false;
      if (voiceInputBtn) {
        voiceInputBtn.classList.remove("listening");
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
    };

    return true;
  }

  function toggleSpeechRecognition() {
    if (!recognition && !initSpeechRecognition()) {
      showToast("Speech recognition not supported in your browser");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (error) {
        console.error("Recognition error:", error);
        showToast("Could not start speech recognition");
      }
    }
  }

  function showToast(message, duration = 3000) {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-notification";
      toast.style.position = "fixed";
      toast.style.bottom = "20px";
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
    initSpeechRecognition,
    toggleSpeechRecognition,
    showToast
  };
});
