document.addEventListener("DOMContentLoaded", () => {
  // Define global API configuration
  window._pollinationsAPIConfig = { safe: false };

  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");
  const clearChatBtn = document.getElementById("clear-chat");
  const voiceToggleBtn = document.getElementById("voice-toggle");
  const modelSelect = document.getElementById("model-select");

  // Initialize current session from storage (or create a new one if none exists)
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
  
  // Combined variable declarations from both branches
  let activeUtterance = null;
  let recognition = null;
  let isListening = false;
  let voiceInputBtn = null;
  let slideshowInterval = null;

  // Voice Chat Modal Elements (from develop branch)
  const voiceChatModal =
    document.getElementById("voice-chat-modal") || createVoiceChatModal();
  const voiceChatBtn = document.getElementById("open-voice-chat-modal");
  const voiceChatClose = document.getElementById("voice-chat-modal-close");
  const voiceChatListen = document.getElementById("voice-chat-listen");
  const voiceChatStop = document.getElementById("voice-chat-stop");
  const voiceChatTranscript = document.getElementById("voice-chat-transcript");
  const micIndicator = document.getElementById("mic-indicator");
  const statusText = document.getElementById("status-text");

  let voiceChatActive = false;

  // Create Voice Chat Modal if not present in HTML
  function createVoiceChatModal() {
    const modal = document.createElement("div");
    modal.id = "voice-chat-modal";
    modal.className = "modal-backdrop hidden";
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fas fa-headset"></i> Voice Chat</h3>
          <button id="voice-chat-modal-close" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="voice-chat-controls">
            <button id="voice-chat-listen" class="btn btn-primary">Listen</button>
            <button id="voice-chat-stop" class="btn btn-danger" disabled>Stop</button>
            <span id="mic-indicator" style="margin-left: 10px;">🎤</span>
          </div>
          <textarea id="voice-chat-transcript" class="form-control mt-3" rows="4" readonly></textarea>
          <p id="status-text" class="text-muted mt-2">Press 'Listen' to start</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  // Load voices for TTS
  function loadVoices() {
    return new Promise((resolve) => {
      let voicesLoaded = false;
      function setVoices() {
        voices = synth.getVoices();
        if (voices.length > 0) {
          voicesLoaded = true;
          // First try to restore a previously selected voice
          const savedVoiceIndex = localStorage.getItem("selectedVoiceIndex");
          if (savedVoiceIndex && voices[savedVoiceIndex]) {
            selectedVoice = voices[savedVoiceIndex];
          } else {
            // Otherwise, use a list of preferred voices
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
              selectedVoice = voices.find((v) => v.name.toLowerCase().includes("female")) || voices[0];
            }
          }
          console.log("Selected voice:", selectedVoice ? selectedVoice.name : "None");
          resolve(selectedVoice);
        }
      }
      setVoices();
      if (!voicesLoaded && synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = setVoices;
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
  }

  function updateVoiceToggleUI() {
    if (voiceToggleBtn) {
      voiceToggleBtn.innerHTML = autoSpeakEnabled
        ? '<i class="fas fa-volume-up"></i> Voice On'
        : '<i class="fas fa-volume-mute"></i> Voice Off';
      voiceToggleBtn.style.backgroundColor = autoSpeakEnabled ? "#4CAF50" : "";
    }
  }

  function speakMessage(text, onEnd = null) {
    if (!synth || !window.SpeechSynthesisUtterance) {
      showToast("Speech synthesis not supported");
      return;
    }
    if (isSpeaking) {
      synth.cancel();
    }

    let cleanText = text
      .replace(/```[\s\S]*?```/g, "code block omitted.")
      .replace(/`[\s\S]*?`/g, "inline code omitted.")
      .replace(/https?:\/\/[^\s]+/g, "URL link.");

    const utterance = new SpeechSynthesisUtterance(cleanText);
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
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      isSpeaking = true;
      currentlySpeakingMessage = text;
      if (voiceChatActive) {
        voiceChatListen.disabled = true;
        voiceChatListen.style.opacity = "0.5";
      }
    };
    utterance.onend = () => {
      isSpeaking = false;
      currentlySpeakingMessage = null;
      activeUtterance = null;
      if (voiceChatActive) {
        voiceChatListen.disabled = false;
        voiceChatListen.style.opacity = "1";
        statusText.textContent = "Press 'Listen' to start";
      }
      if (onEnd) onEnd();
    };
    utterance.onerror = (event) => {
      isSpeaking = false;
      showToast(`Speech error: ${event.error}`);
      if (voiceChatActive) {
        voiceChatListen.disabled = false;
        voiceChatListen.style.opacity = "1";
        statusText.textContent = "Error occurred";
      }
    };
    synth.speak(utterance);
  }

  function stopSpeaking() {
    if (isSpeaking) {
      synth.cancel();
      isSpeaking = false;
      currentlySpeakingMessage = null;
      activeUtterance = null;
      if (voiceChatActive) {
        voiceChatListen.disabled = false;
        voiceChatListen.style.opacity = "1";
      }
    }
  }

  function initSpeechRecognition() {
    if ("webkitSpeechRecognition" in window) {
      recognition = new webkitSpeechRecognition();
    } else if ("SpeechRecognition" in window) {
      recognition = new SpeechRecognition();
    } else {
      showToast("Speech recognition not supported");
      return false;
    }
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      if (voiceChatActive) {
        micIndicator.textContent = "🎤";
        micIndicator.style.color = "red";
        statusText.textContent = "Listening...";
        voiceChatStop.disabled = false;
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript && voiceChatActive) {
        voiceChatTranscript.value = finalTranscript;
      }
    };

    recognition.onend = () => {
      isListening = false;
      if (voiceChatActive) {
        micIndicator.textContent = "🎤";
        micIndicator.style.color = "";
        voiceChatStop.disabled = true;
        if (voiceChatTranscript.value) {
          statusText.textContent = "Processing...";
          sendVoiceChatMessage(voiceChatTranscript.value);
        } else {
          statusText.textContent = "No input detected";
        }
      }
    };

    recognition.onerror = (event) => {
      isListening = false;
      showToast(`Voice recognition error: ${event.error}`);
      if (voiceChatActive) {
        micIndicator.textContent = "🎤";
        micIndicator.style.color = "";
        statusText.textContent = "Error occurred";
        voiceChatStop.disabled = true;
      }
    };
    return true;
  }

  // Send voice chat message to API and handle response
  function sendVoiceChatMessage(message) {
    // Use the global currentSession, but refresh it from Storage if needed
    const session = Storage.getCurrentSession();
    session.messages.push({ role: "user", content: message });
    Storage.updateSessionMessages(session.id, session.messages);
    window.addNewMessage({ role: "user", content: message }); // Display in chat
    statusText.textContent = "Waiting for AI response...";

    const messages = [
      { role: "system", content: "You are a helpful AI assistant. Respond concisely." },
      ...session.messages.slice(-10).map((msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.content
      }))
    ];

    const safeParam = window._pollinationsAPIConfig
      ? `safe=${window._pollinationsAPIConfig.safe}`
      : "safe=false";
    fetch(`https://text.pollinations.ai/openai?${safeParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model: modelSelect.value || "unity", stream: false })
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let aiContent = data.choices?.[0]?.message?.content || "Error: No response";

        // Check for image generation request
        const lastUserMsg = message.toLowerCase();
        const isImageRequest =
          lastUserMsg.includes("image") ||
          lastUserMsg.includes("picture") ||
          lastUserMsg.includes("show me") ||
          lastUserMsg.includes("generate an image");
        if (isImageRequest && !aiContent.includes("https://image.pollinations.ai")) {
          let imagePrompt = lastUserMsg.replace(/show me|generate|image of|picture of|image|picture/gi, "").trim();
          if (imagePrompt.length < 5 && aiContent.toLowerCase().includes("image")) {
            imagePrompt = aiContent.toLowerCase().replace(/here's an image of|image|to enjoy visually/gi, "").trim();
          }
          if (imagePrompt.length > 100) imagePrompt = imagePrompt.substring(0, 100);
          imagePrompt += ", photographic";
          const seed = Math.floor(Math.random() * 1000000);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
            imagePrompt
          )}?width=512&height=512&seed=${seed}&${safeParam}&nolog=true`;
          aiContent += `\n\n**Generated Image:**\n${imageUrl}`;
        }

        session.messages.push({ role: "ai", content: aiContent });
        Storage.updateSessionMessages(session.id, session.messages);
        window.addNewMessage({ role: "ai", content: aiContent }); // Display in chat
        voiceChatTranscript.value = aiContent;
        statusText.textContent = "Speaking response...";
        speakMessage(aiContent, () => {
          statusText.textContent = "Press 'Listen' to start";
        });
      })
      .catch((err) => {
        showToast("Failed to get AI response");
        statusText.textContent = "Error: Try again";
      });
  }

  // Voice chat modal controls
  if (voiceChatBtn && voiceChatModal) {
    voiceChatBtn.addEventListener("click", () => {
      voiceChatModal.classList.remove("hidden");
      voiceChatActive = true;
      if (!recognition) initSpeechRecognition();
      voiceChatTranscript.value = "";
      statusText.textContent = "Press 'Listen' to start";
      voiceChatListen.disabled = false;
      voiceChatListen.style.opacity = "1";
      voiceChatStop.disabled = true;
    });

    voiceChatClose.addEventListener("click", () => {
      voiceChatModal.classList.add("hidden");
      voiceChatActive = false;
      stopSpeaking();
      if (isListening) recognition.stop();
    });

    voiceChatListen.addEventListener("click", () => {
      if (!isListening && !isSpeaking) {
        recognition.start();
      }
    });

    voiceChatStop.addEventListener("click", () => {
      if (isListening) {
        recognition.stop();
      }
    });
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
    toast.timeout = setTimeout(() => (toast.style.opacity = "0"), duration);
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
    showToast
  };
});
