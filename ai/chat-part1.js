// chat-part1.js
// Fix: remove concurrency check that led to partial TTS, allow full reading

document.addEventListener("DOMContentLoaded", () => {
  // Grab essential DOM elements
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");
  const clearChatBtn = document.getElementById("clear-chat");
  const voiceToggleBtn = document.getElementById("voice-toggle");
  const modelSelect = document.getElementById("model-select");

  // Current session from Storage
  let currentSession = Storage.getCurrentSession();
  if (!currentSession) {
    currentSession = Storage.createSession("New Chat");
    localStorage.setItem("currentSessionId", currentSession.id);
  }

  // Browser speech synthesis / voices
  const synth = window.speechSynthesis;
  let voices = [];
  let selectedVoice = null;
  let isSpeaking = false;
  let autoSpeakEnabled = localStorage.getItem("autoSpeakEnabled") === "true";
  let currentlySpeakingMessage = null;

  // Speech recognition
  let recognition = null;
  let isListening = false;
  let voiceInputBtn = null; // We'll create it if needed
  let slideshowInterval = null;

  // ========== LOAD VOICES ==========
  function loadVoices() {
    return new Promise((resolve) => {
      let voicesLoaded = false;

      function setVoices() {
        voices = synth.getVoices();
        if (voices.length > 0) {
          voicesLoaded = true;
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
            // fallback to the first female voice or just the first available
            selectedVoice =
              voices.find((v) => v.name.toLowerCase().includes("female")) ||
              voices[0];
          }
          console.log("Selected voice:", selectedVoice ? selectedVoice.name : "None");
          resolve(selectedVoice);
        }
      }

      // Try immediate
      setVoices();

      // If not loaded, wait for onvoiceschanged or a fallback
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

  loadVoices().then(() => {
    updateVoiceToggleUI();
  });

  // ========== TOGGLES / SPEECH SYNTHESIS ==========

  /**
   * Toggle the 'autoSpeakEnabled' state. If enabling, speak a short message.
   */
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

  /**
   * Speak the entire text. 
   * We removed the concurrency logic that cut off if the same text is triggered again,
   * so it won't skip reading the rest anymore.
   */
  function speakMessage(text, onEnd = null) {
    if (!synth || !window.SpeechSynthesisUtterance) {
      console.error("Speech synthesis not supported in this browser");
      showToast("Speech synthesis not supported in your browser");
      return;
    }

    // If something is currently speaking, forcibly stop it before starting again.
    if (isSpeaking) {
      synth.cancel();
    }

    // (Optional) sanitize or remove code blocks / links from spoken text
    let cleanText = text
      .replace(/```[\s\S]*?```/g, "code block omitted.")
      .replace(/`[\s\S]*?`/g, "inline code omitted.")
      .replace(/https?:\/\/[^\s]+/g, "URL link.");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // If we don't have a voice yet, force load
      loadVoices().then((voice) => {
        if (voice) {
          utterance.voice = voice;
          synth.speak(utterance);
        }
      });
      return;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      isSpeaking = true;
      currentlySpeakingMessage = text;
    };
    utterance.onend = () => {
      isSpeaking = false;
      currentlySpeakingMessage = null;
      if (onEnd) onEnd();
    };
    utterance.onerror = (err) => {
      console.error("Speech synthesis error:", err);
      isSpeaking = false;
      currentlySpeakingMessage = null;
      if (onEnd) onEnd();
    };

    try {
      synth.speak(utterance);
    } catch (err) {
      console.error("Error speaking:", err);
      showToast("Error with speech synthesis");
    }
  }

  function stopSpeaking() {
    if (isSpeaking) {
      synth.cancel();
      isSpeaking = false;
      currentlySpeakingMessage = null;
    }
  }

  // ========== SPEECH RECOGNITION ==========
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

  // ========== UTILITY TOAST ==========
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

  // Put everything we need on a global object for chat-part2.js & chat-part3.js
  window._chatInternals = {
    // DOM
    chatBox,
    chatInput,
    sendButton,
    clearChatBtn,
    voiceToggleBtn,
    modelSelect,
    // Session state
    currentSession,
    // Synthesis
    synth,
    voices,
    selectedVoice,
    isSpeaking,
    autoSpeakEnabled,
    currentlySpeakingMessage,
    // Recognition
    recognition,
    isListening,
    voiceInputBtn,
    slideshowInterval,
    // Functions
    toggleAutoSpeak,
    updateVoiceToggleUI,
    speakMessage,
    stopSpeaking,
    initSpeechRecognition,
    toggleSpeechRecognition,
    showToast
  };
});
