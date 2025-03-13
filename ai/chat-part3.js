document.addEventListener("DOMContentLoaded", () => {
  const { chatBox, chatInput, clearChatBtn, voiceToggleBtn, modelSelect, synth, autoSpeakEnabled, speakMessage, stopSpeaking, showToast, toggleSpeechRecognition, initSpeechRecognition } = window._chatInternals;

  // No static currentSession; we'll fetch it fresh each time
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

  function checkAndUpdateSessionTitle() {
    const currentSession = Storage.getCurrentSession();
    if (!currentSession.name || currentSession.name === "New Chat") {
      const newTitle = generateSessionTitle(currentSession.messages);
      if (newTitle && newTitle !== currentSession.name) {
        Storage.renameSession(currentSession.id, newTitle);
      }
    }
  }

  function waitForPrism(callback) {
    if (window.Prism) callback();
    else setTimeout(() => waitForPrism(callback), 100);
  }

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
    waitForPrism(() => {
      const codeBlocks = container.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        Prism.highlightElement(block);
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
    });
    chatBox.scrollTop = chatBox.scrollHeight;
    if (autoSpeakEnabled && role === "ai") {
      stopSpeaking();
      speakMessage(content);
    }
  }

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
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "image-button-container";
    imageContainer.appendChild(buttonContainer);
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
    return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function renderStoredMessages(messages) {
    chatBox.innerHTML = "";
    messages.forEach((msg, idx) => appendMessage({ role: msg.role, content: msg.content, index: idx }));
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
      }, newContent);
      showToast("User message updated and new response generated");
    } else {
      currentSession.messages[msgIndex].content = newContent;
      Storage.updateSessionMessages(currentSession.id, currentSession.messages);
      renderStoredMessages(currentSession.messages);
      showToast("AI message updated");
    }
  }

  function reGenerateAIResponse(aiIndex) {
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
    const userMessage = currentSession.messages[userIndex].content;
    sendToPollinations(() => {
      const loadingMsg = document.getElementById(loadingMsgId);
      if (loadingMsg) loadingMsg.remove();
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
    const memoryInstructions = "You are the user's AI. Be yourself, the 'you' and name and gender you know is you the AI. Do not mix up your name and gender with the user's. Write user 'memories' you make in [memory]your_text_memory[/memory] format, and include an additional plain text description in your response. When sharing code, always use [CODE]language\ncode[/CODE] for proper syntax highlighting (e.g., [CODE]python\nprint('Hello')\n[/CODE]). Always wrap code in these blocks for readability. Images can be generated via https://image.pollinations.ai/prompt/your_detailed_prompt_here.";
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
    fetch("https://text.pollinations.ai/openai", {
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
        
        // Check if the user's prompt is requesting an image
        const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
        const isImageRequest = lastUserMsg.includes("image") || lastUserMsg.includes("picture") || lastUserMsg.includes("show me") || lastUserMsg.includes("generate an image");
        
        // If the prompt suggests an image request but no image URL is in the response, generate one
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
          
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&seed=${randomSeed()}`;
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
      if (response.choices[0].message && response.choices[0].message.content) return response.choices[0].message.content;
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

  function checkFirstLaunch() {
    const firstLaunch = localStorage.getItem("firstLaunch") === "0";
    if (firstLaunch) {
      const firstLaunchModal = document.getElementById("first-launch-modal");
      if (firstLaunchModal) {
        firstLaunchModal.classList.remove("hidden");
        document.getElementById("first-launch-close").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          localStorage.setItem("firstLaunch", "1");
        });
        document.getElementById("first-launch-complete").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          localStorage.setItem("firstLaunch", "1");
        });
        document.getElementById("setup-theme").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          document.getElementById("settings-modal").classList.remove("hidden");
        });
        document.getElementById("setup-personalization").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          document.getElementById("personalization-modal").classList.remove("hidden");
        });
        document.getElementById("setup-model").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          document.getElementById("model-select").focus();
        });
      }
    }
  }
  checkFirstLaunch();

  function setupVoiceInputButton() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const inputButtonsContainer = document.querySelector(".input-buttons-container");
      if (!window._chatInternals.voiceInputBtn && inputButtonsContainer) {
        const voiceInputBtn = document.createElement("button");
        voiceInputBtn.id = "voice-input-btn";
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceInputBtn.title = "Voice input";
        inputButtonsContainer.insertBefore(voiceInputBtn, document.getElementById("send-button"));
        window._chatInternals.voiceInputBtn = voiceInputBtn;
        voiceInputBtn.addEventListener("click", toggleSpeechRecognition);
      }
    }
  }
  setupVoiceInputButton();

  const sendButton = document.getElementById("send-button");
  function handleSendMessage() {
    const message = chatInput.value.trim();
    if (message === "") return;
    window.addNewMessage({ role: "user", content: message });
    chatInput.value = "";
    chatInput.style.height = "auto";
    window.sendToPollinations();
    sendButton.disabled = true;
  }

  chatInput.addEventListener("input", () => {
    sendButton.disabled = chatInput.value.trim() === "";
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  sendButton.addEventListener("click", () => {
    handleSendMessage();
  });

  const initialSession = Storage.getCurrentSession();
  if (initialSession.messages && initialSession.messages.length > 0) {
    renderStoredMessages(initialSession.messages);
  }
});
