document.addEventListener("DOMContentLoaded", () => {
  const { recognition, speakMessage, stopSpeaking, showToast } = window._chatInternals;
  let isRecording = false;
  let slideshowInterval = null;

  function createVoiceChatModal() {
    const modalHTML = `
      <div id="voice-chat-modal" class="modal-backdrop hidden">
        <div class="voice-chat-modal">
          <div class="voice-chat-header">
            <h3>Voice Chat</h3>
            <button id="voice-chat-close" class="close-btn">×</button>
          </div>
          <div class="voice-chat-controls">
            <div id="voice-status" class="voice-status">Ready for voice chat</div>
            <div class="voice-buttons">
              <button id="start-voice-chat" class="voice-btn">
                <i class="fas fa-microphone"></i> Start Listening
              </button>
              <button id="stop-voice-chat" class="voice-btn" disabled>
                <i class="fas fa-stop"></i> Stop
              </button>
            </div>
            <div id="voice-transcript" class="transcript"></div>
            <div id="image-slideshow" class="image-slideshow">
              <img id="slideshow-image" alt="Conversation Image" />
            </div>
          </div>
        </div>
      </div>
    `;
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    document.getElementById("voice-chat-close").addEventListener("click", () => {
      closeVoiceChatModal();
    });
    document.getElementById("start-voice-chat").addEventListener("click", () => {
      startVoiceChat();
      startSlideshow();
    });
    document.getElementById("stop-voice-chat").addEventListener("click", () => {
      stopVoiceChat();
      stopSlideshow();
    });
  }

  function openVoiceChatModal() {
    if (!document.getElementById("voice-chat-modal")) {
      createVoiceChatModal();
    }
    document.getElementById("voice-chat-modal").classList.remove("hidden");
  }

  function closeVoiceChatModal() {
    const modal = document.getElementById("voice-chat-modal");
    if (modal) {
      modal.classList.add("hidden");
      stopVoiceChat();
      stopSlideshow();
    }
  }

  const openVoiceChatModalBtn = document.getElementById("open-voice-chat-modal");
  if (openVoiceChatModalBtn) {
    openVoiceChatModalBtn.addEventListener("click", () => {
      openVoiceChatModal();
    });
  }

  function startVoiceChat() {
    if (!window._chatInternals.recognition) {
      window._chatInternals.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      window._chatInternals.recognition.continuous = true; // Continuous listening for voice chat
      window._chatInternals.recognition.interimResults = true;

      window._chatInternals.recognition.onstart = () => {
        isRecording = true;
        const startBtn = document.getElementById("start-voice-chat");
        const stopBtn = document.getElementById("stop-voice-chat");
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        const voiceStatus = document.getElementById("voice-status");
        if (voiceStatus) voiceStatus.textContent = "Listening...";
        showToast("Voice chat started");
      };

      window._chatInternals.recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript.trim()) {
          document.getElementById("voice-transcript").textContent = finalTranscript;
          sendVoiceMessage(finalTranscript.trim());
        }
      };

      window._chatInternals.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopVoiceChat();
        showToast("Voice recognition error: " + event.error);
      };

      window._chatInternals.recognition.onend = () => {
        if (isRecording) {
          // Restart recognition if it ends unexpectedly while recording
          try {
            window._chatInternals.recognition.start();
          } catch (error) {
            console.error("Failed to restart recognition:", error);
            stopVoiceChat();
          }
        }
      };
    }

    try {
      window._chatInternals.recognition.start();
      speakMessage("Voice chat activated. I'm listening now.");
      document.getElementById("start-voice-chat").disabled = true;
      document.getElementById("stop-voice-chat").disabled = false;
      document.getElementById("voice-status").textContent = "Listening...";
    } catch (error) {
      console.error("Failed to start voice chat:", error);
      showToast("Failed to start voice recognition. Please try again.");
      const voiceStatus = document.getElementById("voice-status");
      if (voiceStatus) {
        voiceStatus.textContent = "Failed to start. Please try again.";
      }
    }
  }

  function stopVoiceChat() {
    if (window._chatInternals.recognition) {
      try {
        window._chatInternals.recognition.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
    isRecording = false;
    const startBtn = document.getElementById("start-voice-chat");
    const stopBtn = document.getElementById("stop-voice-chat");
    const voiceStatus = document.getElementById("voice-status");
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (voiceStatus) voiceStatus.textContent = "Voice chat stopped.";
    stopSpeaking();
    showToast("Voice chat stopped");
  }

  function sendVoiceMessage(text) {
    window.addNewMessage({ role: "user", content: text });
    window.sendToPollinations(() => {
      const { currentSession, autoSpeakEnabled } = window._chatInternals;
      const lastMsg = currentSession.messages[currentSession.messages.length - 1];
      if (lastMsg && lastMsg.role === "ai") {
        // Ensure the AI response is spoken fully when voice chat is active
        const voiceStatus = document.getElementById("voice-status");
        if (voiceStatus) voiceStatus.textContent = "Speaking AI response...";
        speakMessage(lastMsg.content, () => {
          if (voiceStatus) voiceStatus.textContent = "Listening...";
          showToast("AI response finished speaking");
        });
        updateSlideshow(lastMsg.content);
      }
    });
  }

  function updateSlideshow(aiResponse) {
    const baseUrl = "https://image.pollinations.ai/prompt/";
    let cleanPrompt = aiResponse;
    if (cleanPrompt.length > 100) {
      const firstSentence = cleanPrompt.split('.')[0];
      cleanPrompt = firstSentence.length < 100 ? firstSentence : cleanPrompt.substring(0, 100);
    }
    cleanPrompt = cleanPrompt + ", digital art, high quality";
    const seed = Math.floor(Math.random() * 999999);
    const safeParam = window._pollinationsAPIConfig ? `safe=${window._pollinationsAPIConfig.safe}` : "safe=false";
    const url = `${baseUrl}${encodeURIComponent(cleanPrompt)}?width=512&height=512&seed=${seed}&${safeParam}&nolog=true`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Network response was not ok: ${res.status}`);
        }
        return res.url;
      })
      .then((imageUrl) => {
        const slideshowImage = document.getElementById("slideshow-image");
        if (slideshowImage) {
          slideshowImage.src = imageUrl;
          slideshowImage.classList.add("active");
          setTimeout(() => {
            slideshowImage.classList.remove("active");
          }, 30000);
        }
      })
      .catch((err) => {
        console.error("Error fetching slideshow image:", err);
      });
  }

  function startSlideshow() {
    stopSlideshow();
    slideshowInterval = setInterval(() => {
      const { currentSession } = window._chatInternals;
      const lastMsg = currentSession.messages[currentSession.messages.length - 1];
      if (lastMsg && lastMsg.role === "ai") {
        updateSlideshow(lastMsg.content);
      }
    }, 30000);
  }

  function stopSlideshow() {
    clearInterval(slideshowInterval);
  }

  window.openVoiceChatModal = openVoiceChatModal;
  window.closeVoiceChatModal = closeVoiceChatModal;
  window.startVoiceChat = startVoiceChat;
  window.stopVoiceChat = stopVoiceChat;
  window.sendVoiceMessage = sendVoiceMessage;
  window.updateSlideshow = updateSlideshow;
  window.startSlideshow = startSlideshow;
  window.stopSlideshow = stopSlideshow;
});