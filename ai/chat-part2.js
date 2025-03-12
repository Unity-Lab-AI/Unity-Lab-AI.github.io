// chat-part2.js

document.addEventListener("DOMContentLoaded", () => {
  const {
    recognition,
    speakMessage,
    stopSpeaking,
    showToast
  } = window._chatInternals;

  let isRecording = false;
  let slideshowInterval = null;

  // ========== VOICE CHAT MODAL SETUP ==========
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

    // Modal close button
    document.getElementById("voice-chat-close").addEventListener("click", () => {
      closeVoiceChatModal();
    });

    // Start & Stop listening buttons
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
    // If the modal doesn't exist in the DOM yet, create it
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

  // ========== HOOK UP THE NEW BUTTON IN INDEX.HTML ==========
  const openVoiceChatModalBtn = document.getElementById("open-voice-chat-modal");
  if (openVoiceChatModalBtn) {
    openVoiceChatModalBtn.addEventListener("click", () => {
      openVoiceChatModal();
    });
  }

  // ========== START / STOP VOICE CHAT ==========
  function startVoiceChat() {
    const { synth, selectedVoice } = window._chatInternals;
    // Force auto-speak ON during voice chat
    window._chatInternals.autoSpeakEnabled = true;
    localStorage.setItem("autoSpeakEnabled", "true");

    // If we never inited recognition, do it now
    if (!recognition) {
      window._chatInternals.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      window._chatInternals.recognition.continuous = true;
      window._chatInternals.recognition.interimResults = true;

      window._chatInternals.recognition.onstart = () => {
        isRecording = true;
        const startBtn = document.getElementById("start-voice-chat");
        const stopBtn = document.getElementById("stop-voice-chat");
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        const voiceStatus = document.getElementById("voice-status");
        if (voiceStatus) voiceStatus.textContent = "Listening...";
      };

      window._chatInternals.recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript.trim()) {
          // Show the transcript
          document.getElementById("voice-transcript").textContent = finalTranscript;
          sendVoiceMessage(finalTranscript);
        }
      };

      window._chatInternals.recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        stopVoiceChat();
      };

      window._chatInternals.recognition.onend = () => {
        stopVoiceChat();
      };
    }

    try {
      window._chatInternals.recognition.start();
      speakMessage("Voice chat mode active. I'm listening.");
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
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
    if (voiceStatus) voiceStatus.textContent = "Voice chat stopped";
  }

  // ========== SENDING VOICE MESSAGE ==========
  function sendVoiceMessage(text) {
    // We'll rely on chat-part3's window.addNewMessage() and sendToPollinations()
    // to handle user -> AI flow
    window.addNewMessage({ role: "user", content: text });
    window.sendToPollinations(() => {
      const { currentSession, autoSpeakEnabled } = window._chatInternals;
      const lastMsg = currentSession.messages[currentSession.messages.length - 1];
      if (lastMsg && lastMsg.role === "ai" && autoSpeakEnabled) {
        speakMessage(lastMsg.content);
        updateSlideshow(lastMsg.content);
      }
    });
  }

  // ========== SLIDESHOW: REFRESH IMAGES EVERY 30s ==========
  /**
   * Build and set the correct Pollinations image URL based on the AI's response.
   */
  function updateSlideshow(aiResponse) {
    // example approach: "Generate an image: {aiResponse}"
    // then set width/height/seed so the URL is correct.
    const baseUrl = "https://image.pollinations.ai/prompt/";
    const prompt = `Generate an image based on this conversation: ${aiResponse}`;
    const width = 512;
    const height = 512;
    const seed = Math.floor(Math.random() * 999999);

    const url = `${baseUrl}${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}`;

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
    stopSlideshow(); // Clear existing
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

  // Expose the methods globally (for convenience)
  window.openVoiceChatModal = openVoiceChatModal;
  window.closeVoiceChatModal = closeVoiceChatModal;
  window.startVoiceChat = startVoiceChat;
  window.stopVoiceChat = stopVoiceChat;
  window.sendVoiceMessage = sendVoiceMessage;
  window.updateSlideshow = updateSlideshow;
  window.startSlideshow = startSlideshow;
  window.stopSlideshow = stopSlideshow;
});
