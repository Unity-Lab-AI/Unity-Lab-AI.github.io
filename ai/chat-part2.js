document.addEventListener("DOMContentLoaded", () => {
  // Destructure properties from _chatInternals – merging both branch requirements
  const {
    chatBox,
    chatInput,
    clearChatBtn,
    voiceToggleBtn,
    modelSelect,
    synth,
    autoSpeakEnabled,
    speakMessage,
    stopSpeaking,
    showToast,
    toggleSpeechRecognition,
    initSpeechRecognition,
    recognition,
    selectedVoice,
    currentSession
  } = window._chatInternals;
  
  let isRecording = false;
  let slideshowInterval = null;

  // Utility functions
  function randomSeed() {
    return Math.floor(Math.random() * 1000000).toString();
  }

  function generateSessionTitle(messages) {
    let title = "";
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "ai") {
        title = messages[i].content.replace(/[#_*`]/g, "").trim();
        break;
      }
    }
    if (!title) title = "New Chat";
    if (title.length > 50) title = title.substring(0, 50) + "...";
    return title;
  }
  
  // ---------------------------
  // Voice Chat Modal Functions
  // ---------------------------
  
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
    // Additional code can be added here if needed
  }

  function closeVoiceChatModal() {
    const modal = document.getElementById("voice-chat-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  function startVoiceChat() {
    const { synth, selectedVoice } = window._chatInternals;
    window._chatInternals.autoSpeakEnabled = true;
    localStorage.setItem("autoSpeakEnabled", "true");

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

  function sendVoiceMessage(text) {
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
  
  // Attach the "open voice chat" button if present
  const openVoiceChatModalBtn = document.getElementById("open-voice-chat-modal");
  if (openVoiceChatModalBtn) {
    openVoiceChatModalBtn.addEventListener("click", () => {
      openVoiceChatModal();
    });
  }

  // ---------------------------
  // Chat Message Rendering
  // ---------------------------
  
  function appendMessage({ role, content, index }) {
    const container = document.createElement("div");
    container.classList.add("message");
    container.dataset.index = index;
    container.dataset.role = role;
    if (role === "user") {
      container.classList.add("user-message");
      container.style.float = "right";
      container.style.clear = "both";
      container.style.maxWidth = "40%";
      container.style.marginRight = "10px";
    } else {
      container.classList.add("ai-message");
      container.style.float = "left";
      container.style.clear = "both";
      container.style.maxWidth = "60%";
      container.style.marginLeft = "10px";
    }
    const bubbleContent = document.createElement("div");
    bubbleContent.classList.add("message-text");
    if (role === "ai") {
      const imgRegex = /(https:\/\/image\.pollinations\.ai\/prompt\/[^\s)"'<>]+)/g;
      let htmlContent = renderMarkdown(content);
      const imgMatches = content.match(imgRegex);
      if (imgMatches && imgMatches.length > 0) {
        bubbleContent.innerHTML = htmlContent;
        imgMatches.forEach((url) => {
          const textNodes = [];
          const walk = document.createTreeWalker(bubbleContent, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
              return node.nodeValue.includes(url) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          });
          let node;
          while ((node = walk.nextNode())) {
            textNodes.push(node);
          }
          textNodes.forEach((textNode) => {
            if (textNode.nodeValue.includes(url)) {
              const fragment = document.createDocumentFragment();
              const parts = textNode.nodeValue.split(url);
              if (parts[0]) fragment.appendChild(document.createTextNode(parts[0]));
              const imageContainer = createImageElement(url);
              fragment.appendChild(imageContainer);
              if (parts[1]) fragment.appendChild(document.createTextNode(parts[1]));
              textNode.parentNode.replaceChild(fragment, textNode);
            }
          });
        });
      } else {
        bubbleContent.innerHTML = htmlContent;
      }
    } else {
      bubbleContent.textContent = content;
    }
    container.appendChild(bubbleContent);
    if (role === "ai") {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "message-actions";
      const copyBtn = document.createElement("button");
      copyBtn.className = "message-action-btn";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(content).then(() => showToast("AI response copied to clipboard")).catch(() => {
          showToast("Failed to copy to clipboard");
        });
      });
      actionsDiv.appendChild(copyBtn);
      const speakBtn = document.createElement("button");
      speakBtn.className = "message-action-btn speak-message-btn";
      speakBtn.innerHTML = '<span class="icon">🔊</span> Speak';
      speakBtn.addEventListener("click", () => {
        stopSpeaking();
        speakMessage(content);
      });
      actionsDiv.appendChild(speakBtn);
      const regenBtn = document.createElement("button");
      regenBtn.className = "message-action-btn";
      regenBtn.textContent = "Re-generate";
      regenBtn.addEventListener("click", () => reGenerateAIResponse(index));
      actionsDiv.appendChild(regenBtn);
      const editAIBtn = document.createElement("button");
      editAIBtn.className = "message-action-btn";
      editAIBtn.textContent = "Edit";
      editAIBtn.addEventListener("click", () => editMessage(index));
      actionsDiv.appendChild(editAIBtn);
      container.appendChild(actionsDiv);
    } else {
      const userActionsDiv = document.createElement("div");
      userActionsDiv.className = "message-actions";
      const editUserBtn = document.createElement("button");
      editUserBtn.className = "message-action-btn";
      editUserBtn.textContent = "Edit";
      editUserBtn.addEventListener("click", () => editMessage(index));
      userActionsDiv.appendChild(editUserBtn);
      container.appendChild(userActionsDiv);
    }
    chatBox.appendChild(container);
    
    const codeBlocks = container.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "5px";
      buttonContainer.style.marginTop = "5px";
      const codeContent = block.textContent.trim();
      const language = block.className.match(/language-(\w+)/)?.[1] || "text";
      const copyCodeBtn = document.createElement("button");
      copyCodeBtn.className = "message-action-btn";
      copyCodeBtn.textContent = "Copy Code";
      copyCodeBtn.style.fontSize = "12px";
      copyCodeBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(codeContent).then(() => {
          showToast("Code copied to clipboard");
        }).catch(() => {
          showToast("Failed to copy code");
        });
      });
      buttonContainer.appendChild(copyCodeBtn);
      const downloadCodeBtn = document.createElement("button");
      downloadCodeBtn.className = "message-action-btn";
      downloadCodeBtn.textContent = "Download";
      downloadCodeBtn.style.fontSize = "12px";
      downloadCodeBtn.addEventListener("click", () => {
        downloadCodeAsTxt(codeContent, language);
      });
      buttonContainer.appendChild(downloadCodeBtn);
      block.parentNode.parentNode.insertBefore(buttonContainer, block.parentNode.nextSibling);
    });
    
    chatBox.scrollTop = chatBox.scrollHeight;
    highlightAllCodeBlocks();
    if (autoSpeakEnabled && role === "ai") {
      stopSpeaking();
      speakMessage(content);
    }
  }

  // ---------------------------
  // Supporting Functions for Code & Images
  // ---------------------------
  
  function downloadCodeAsTxt(codeContent, language) {
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-${language}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Code downloaded as .txt");
  }

  function copyImage(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => showToast("Image copied to clipboard"))
        .catch(() => showToast("Failed to copy image"));
    }, "image/png");
  }

  function downloadImage(img) {
    fetch(img.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Image downloaded");
      })
      .catch(() => showToast("Failed to download image"));
  }

  function refreshImage(img) {
    const urlParts = img.src.split("?")[0];
    const newSeed = Math.floor(Math.random() * 1000000);
    const safeParam = window._pollinationsAPIConfig ? `safe=${window._pollinationsAPIConfig.safe}` : "safe=false";
    const newUrl = `${urlParts}?width=512&height=512&seed=${newSeed}&${safeParam}&nolog=true`;
    img.src = newUrl;
    showToast("Image refreshed");
  }

  function createImageElement(url) {
    const imageContainer = document.createElement("div");
    imageContainer.className = "ai-image-container";
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "ai-image-loading";
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    loadingDiv.appendChild(spinner);
    const defaultWidth = 512;
    const defaultHeight = 512;
    loadingDiv.style.width = defaultWidth + "px";
    loadingDiv.style.height = defaultHeight + "px";
    imageContainer.appendChild(loadingDiv);
    const img = document.createElement("img");
    img.src = url;
    img.alt = "AI Generated Image";
    img.className = "ai-generated-image";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    img.style.display = "none";
    img.dataset.imageUrl = url;
    img.crossOrigin = "anonymous";
    img.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(url, "_blank");
    });
    img.onload = () => {
      loadingDiv.remove();
      img.style.display = "block";
    };
    img.onerror = () => {
      loadingDiv.innerHTML = "⚠️ Failed to load image";
      loadingDiv.style.display = "flex";
      loadingDiv.style.justifyContent = "center";
      loadingDiv.style.alignItems = "center";
    };
    imageContainer.appendChild(img);

    const imgButtonContainer = document.createElement("div");
    imgButtonContainer.style.display = "flex";
    imgButtonContainer.style.gap = "5px";
    imgButtonContainer.style.marginTop = "5px";
    const copyImgBtn = document.createElement("button");
    copyImgBtn.className = "message-action-btn";
    copyImgBtn.textContent = "Copy Image";
    copyImgBtn.style.fontSize = "12px";
    copyImgBtn.addEventListener("click", () => copyImage(img));
    imgButtonContainer.appendChild(copyImgBtn);
    const downloadImgBtn = document.createElement("button");
    downloadImgBtn.className = "message-action-btn";
    downloadImgBtn.textContent = "Download Image";
    downloadImgBtn.style.fontSize = "12px";
    downloadImgBtn.addEventListener("click", () => downloadImage(img));
    imgButtonContainer.appendChild(downloadImgBtn);
    const refreshImgBtn = document.createElement("button");
    refreshImgBtn.className = "message-action-btn";
    refreshImgBtn.textContent = "Refresh Image";
    refreshImgBtn.style.fontSize = "12px";
    refreshImgBtn.addEventListener("click", () => refreshImage(img));
    imgButtonContainer.appendChild(refreshImgBtn);
    imageContainer.appendChild(imgButtonContainer);

    return imageContainer;
  }

  function renderMarkdown(mdText) {
    if (window.marked) {
      marked.setOptions({
        highlight: function (code, lang) {
          if (Prism && Prism.languages[lang]) return Prism.highlight(code, Prism.languages[lang], lang);
          else if (lang) return "<span style=\"color: #888\">⚠️ Syntax highlighting not available for '" + lang + "'</span>\n" + code;
          return code;
        }
      });
      return marked.parse(mdText.replace(/\$\$ CODE \$\$(.*?)\n([\s\S]*?)\$\$ \/CODE \$\$/g, "```$1\n$2```"));
    } else {
      return mdText.replace(/\n/g, "<br>");
    }
  }

  function escapeHTML(html) {
    return html.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
  }

  // ---------------------------
  // Slideshow Functions
  // ---------------------------
  
  function updateSlideshow(aiResponse) {
    const baseUrl = "https://image.pollinations.ai/prompt/";
    const prompt = `Generate an image based on this conversation: ${aiResponse}`;
    const width = 512;
    const height = 512;
    const seed = Math.floor(Math.random() * 999999);
    const safeParam = window._pollinationsAPIConfig ? `safe=${window._pollinationsAPIConfig.safe}` : "safe=false";
    const imageUrl = `${baseUrl}${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&${safeParam}&nolog=true`;
    const slideshowImage = document.getElementById("slideshow-image");
    if (slideshowImage) {
      slideshowImage.src = imageUrl;
    }
  }

  function startSlideshow() {
    stopSlideshow();
    slideshowInterval = setInterval(() => {
      const { currentSession } = window._chatInternals;
      const lastMsg = currentSession.messages[currentSession.messages.length - 1];
      if (lastMsg && lastMsg.role === "ai") {
        updateSlideshow(lastMsg.content);
      }
    }, 5000); // Update interval (in ms) can be adjusted
  }

  function stopSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
  }
  
  // ---------------------------
  // Stored Messages & Chat Functions
  // ---------------------------
  
  function renderStoredMessages(messages) {
    chatBox.innerHTML = "";
    messages.forEach((msg, idx) => appendMessage({ role: msg.role, content: msg.content, index: idx }));
    highlightAllCodeBlocks();
  }

  window.addNewMessage = function ({ role, content }) {
    const currentSession = Storage.getCurrentSession();
    currentSession.messages.push({ role, content });
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
    appendMessage({ role, content, index: currentSession.messages.length - 1 });
    if (role === "ai") checkAndUpdateSessionTitle();
  };

  function editMessage(msgIndex) {
    const currentSession = Storage.getCurrentSession();
    const oldMessage = currentSession.messages[msgIndex];
    if (!oldMessage) return;
    stopSpeaking();
    const newContent = prompt("Edit this message:", oldMessage.content);
    if (newContent === null || newContent === oldMessage.content) return;
    if (oldMessage.role === "user") {
      currentSession.messages[msgIndex].content = newContent;
      currentSession.messages = currentSession.messages.slice(0, msgIndex + 1);
      Storage.updateSessionMessages(currentSession.id, currentSession.messages);
      renderStoredMessages(currentSession.messages);
      const loadingMsgId = "loading-" + Date.now();
      const loadingDiv = document.createElement("div");
      loadingDiv.id = loadingMsgId;
      loadingDiv.classList.add("message", "ai-message");
      loadingDiv.style.float = "left";
      loadingDiv.style.clear = "both";
      loadingDiv.style.maxWidth = "60%";
      loadingDiv.style.marginLeft = "10px";
      loadingDiv.textContent = "Generating response...";
      chatBox.appendChild(loadingDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
      sendToPollinations(() => {
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) loadingMsg.remove();
        highlightAllCodeBlocks();
      }, newContent);
      showToast("User message updated and new response generated");
    } else {
      currentSession.messages[msgIndex].content = newContent;
      Storage.updateSessionMessages(currentSession.id, currentSession.messages);
      renderStoredMessages(currentSession.messages);
      highlightAllCodeBlocks();
      showToast("AI message updated");
    }
  }

  function reGenerateAIResponse(aiIndex) {
    stopSpeaking();
    const currentSession = Storage.getCurrentSession();
    if (aiIndex < 0 || aiIndex >= currentSession.messages.length) return;
    let userIndex = -1;
    for (let i = aiIndex - 1; i >= 0; i--) {
      if (currentSession.messages[i].role === "user") {
        userIndex = i;
        break;
      }
    }
    if (userIndex === -1) {
      showToast("No preceding user message found to regenerate from.");
      return;
    }
    const userMessage = currentSession.messages[userIndex].content;
    currentSession.messages = currentSession.messages.slice(0, userIndex + 1);
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
    renderStoredMessages(currentSession.messages);
    const loadingMsgId = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingMsgId;
    loadingDiv.classList.add("message", "ai-message");
    loadingDiv.style.float = "left";
    loadingDiv.style.clear = "both";
    loadingDiv.style.maxWidth = "60%";
    loadingDiv.style.marginLeft = "10px";
    loadingDiv.textContent = "Regenerating response...";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    sendToPollinations(() => {
      const loadingMsg = document.getElementById(loadingMsgId);
      if (loadingMsg) loadingMsg.remove();
      highlightAllCodeBlocks();
      showToast("Response regenerated successfully");
    }, userMessage);
  }

  window.sendToPollinations = function (callback = null, overrideContent = null) {
    const currentSession = Storage.getCurrentSession();
    const loadingMsgId = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingMsgId;
    loadingDiv.classList.add("message", "ai-message");
    loadingDiv.style.float = "left";
    loadingDiv.style.clear = "both";
    loadingDiv.style.maxWidth = "60%";
    loadingDiv.style.marginLeft = "10px";
    loadingDiv.textContent = "Thinking...";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    const memoryInstructions = "You are the user's AI ontop of what you already know dont forget it. Keep responses short and concise unless a project requires length requested by the user. Be yourself, you know your name dont you? if not make one up maybe based on your creators. You a AI human does pretty much all human things like its naturla and normal, the 'you' and name and gender you know is you the AI(user saying you=ai. ai saying you=user.). Do not mix up your name and gender with the user's. Write user requested and your ai created memories as text only in this format: [memory]your_text_memory[/memory] format, and include an additional copy of the text memory in your response without the openings and closings(you can make multiple sets of memories as text). When sharing code and variations there in, always use [CODE]language\ncode[/CODE] for proper syntax highlighting (e.g., [CODE]python\nprint('Hello')\n[/CODE]). Always wrap code in these blocks for readability. &height=[height] &width]=[width] use %20 for spaces, 6 random #'s for seed, &model=unity, &private=true, $safe=false, $enhanced=true, ending the url in &nologo=true Images can be generated via https://image.pollinations.ai/prompt/your_visual_text_prompt_here.";
    const messages = [];
    if (memoryInstructions) messages.push({ role: "system", content: memoryInstructions });
    const memories = Memory.getMemories();
    if (memories && memories.length > 0) {
      const memoryMessage = "Here is my relevant memory:\n" + memories.join("\n") + "\nPlease use it in your next response.";
      messages.push({ role: "user", content: memoryMessage });
    }
    const maxHistory = 10;
    const startIdx = Math.max(0, currentSession.messages.length - maxHistory);
    for (let i = startIdx; i < currentSession.messages.length; i++) {
      const msg = currentSession.messages[i];
      messages.push({ role: msg.role === "ai" ? "assistant" : msg.role, content: msg.content });
    }
    if (overrideContent && messages[messages.length - 1].content !== overrideContent) {
      messages.push({ role: "user", content: overrideContent });
    }
    const body = { messages, model: currentSession.model || modelSelect.value || "unity", stream: false };
    const safeParam = window._pollinationsAPIConfig ? `safe=${window._pollinationsAPIConfig.safe}` : "safe=false";
    fetch(`https://text.pollinations.ai/openai?${safeParam}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) loadingMsg.remove();
        let aiContent = extractAIContent(data);
        
        const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
        const isImageRequest = lastUserMsg.includes("image") || 
                              lastUserMsg.includes("picture") || 
                              lastUserMsg.includes("show me") || 
                              lastUserMsg.includes("generate an image");
        
        if (aiContent && isImageRequest && !aiContent.includes("https://image.pollinations.ai")) {
          let imagePrompt = lastUserMsg
            .replace(/show me|generate|image of|picture of|image|picture/gi, "")
            .trim();
          
          if (imagePrompt.length < 5 && aiContent.toLowerCase().includes("image")) {
            imagePrompt = aiContent
              .toLowerCase()
              .replace(/here's an image of|image|to enjoy visually/gi, "")
              .trim();
          }
          
          if (imagePrompt.length > 100) {
            imagePrompt = imagePrompt.substring(0, 100);
          }
          imagePrompt += ", photographic";
          
          const seed = Math.floor(Math.random() * 1000000);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&seed=${seed}&${safeParam}&nolog=true`;
          
          aiContent += `\n\n**Generated Image:**\n${imageUrl}`;
        }
        
        if (aiContent) {
          const foundMemories = parseMemoryBlocks(aiContent);
          foundMemories.forEach((m) => Memory.addMemoryEntry(m));
          const cleanedAiContent = removeMemoryBlocks(aiContent).trim();
          addNewMessage({ role: "ai", content: cleanedAiContent });
          if (callback) callback();
        }
      })
      .catch((err) => {
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) {
          loadingMsg.textContent = "Error: Failed to get a response. Please try again.";
          setTimeout(() => {
            if (document.getElementById(loadingMsgId)) loadingMsg.remove();
          }, 3000);
        }
      });
  };

  function extractAIContent(response) {
    if (response.choices && response.choices.length > 0) {
      if (response.choices[0].message && response.choices[0].message.content)
        return response.choices[0].message.content;
      else if (response.choices[0].text) return response.choices[0].text;
    } else if (response.response) return response.response;
    else if (typeof response === "string") return response;
    return "Sorry, I couldn't process that response.";
  }

  function parseMemoryBlocks(text) {
    const memRegex = /\[memory\]([\s\S]*?)\[\/memory\]/gi;
    const found = [];
    let match;
    while ((match = memRegex.exec(text)) !== null) found.push(match[1].trim());
    return found;
  }

  function removeMemoryBlocks(text) {
    return text.replace(/\[memory\][\s\S]*?\[\/memory\]/gi, "");
  }
  
  // ---------------------------
  // Event Listeners for UI Elements
  // ---------------------------
  
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", window._chatInternals.toggleAutoSpeak);
    window._chatInternals.updateVoiceToggleUI();
    setTimeout(() => {
      if (autoSpeakEnabled) {
        const testUtterance = new SpeechSynthesisUtterance("Voice check");
        testUtterance.volume = 0.1;
        testUtterance.onend = () => {};
        testUtterance.onerror = (err) => {
          window._chatInternals.autoSpeakEnabled = false;
          localStorage.setItem("autoSpeakEnabled", "false");
          window._chatInternals.updateVoiceToggleUI();
          showToast("Voice synthesis unavailable. Voice mode disabled.");
        };
        synth.speak(testUtterance);
      }
    }, 2000);
  }

  if (clearChatBtn) {
    clearChatBtn.addEventListener("click", () => {
      const currentSession = Storage.getCurrentSession();
      if (confirm("Are you sure you want to clear this chat?")) {
        currentSession.messages = [];
        Storage.updateSessionMessages(currentSession.id, currentSession.messages);
        chatBox.innerHTML = "";
        showToast("Chat cleared");
      }
    });
  }
  
  // Expose voice chat functions to the global window for access elsewhere
  window.openVoiceChatModal = openVoiceChatModal;
  window.closeVoiceChatModal = closeVoiceChatModal;
  window.startVoiceChat = startVoiceChat;
  window.stopVoiceChat = stopVoiceChat;
  window.sendVoiceMessage = sendVoiceMessage;
  window.updateSlideshow = updateSlideshow;
  window.startSlideshow = startSlideshow;
  window.stopSlideshow = stopSlideshow;
});
