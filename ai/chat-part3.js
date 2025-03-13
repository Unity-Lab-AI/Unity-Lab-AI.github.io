// chat-part3.js

document.addEventListener("DOMContentLoaded", () => {
  // Pull in references from chat-part1
  const {
    chatBox,
    chatInput,
    clearChatBtn,
    voiceToggleBtn,
    modelSelect,
    currentSession,
    synth,
    autoSpeakEnabled,
    speakMessage,
    stopSpeaking,
    showToast,
    toggleSpeechRecognition,
    initSpeechRecognition
  } = window._chatInternals;

  // ========== MESSAGE RENDERING & ADDING ==========
  function appendMessage({ role, content, index }) {
    const container = document.createElement("div");
    container.classList.add("message");
    container.dataset.index = index;
    container.dataset.role = role;

    // Position & styling for user vs. AI messages
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

    // If AI message, parse images and render markdown
    if (role === "ai") {
      const imgRegex = /(https:\/\/image\.pollinations\.ai\/prompt\/[^\s)"'<>]+)/g;
      let htmlContent = renderMarkdown(content);
      const imgMatches = content.match(imgRegex);

      if (imgMatches && imgMatches.length > 0) {
        bubbleContent.innerHTML = htmlContent;
        // Replace raw image URLs with proper <img> elements
        imgMatches.forEach((url) => {
          const textNodes = [];
          const walk = document.createTreeWalker(
            bubbleContent,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function (node) {
                return node.nodeValue.includes(url)
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            }
          );

          let node;
          while ((node = walk.nextNode())) {
            textNodes.push(node);
          }

          textNodes.forEach((textNode) => {
            if (textNode.nodeValue.includes(url)) {
              const fragment = document.createDocumentFragment();
              const parts = textNode.nodeValue.split(url);

              if (parts[0]) {
                fragment.appendChild(document.createTextNode(parts[0]));
              }
              const imageContainer = createImageElement(url);
              fragment.appendChild(imageContainer);
              if (parts[1]) {
                fragment.appendChild(document.createTextNode(parts[1]));
              }
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

    // ========== Add action buttons ==========
    if (role === "ai") {
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "message-actions";

      // Copy
      const copyBtn = document.createElement("button");
      copyBtn.className = "message-action-btn";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(content)
          .then(() => showToast("AI response copied to clipboard"))
          .catch((err) => {
            console.error("Clipboard copy failed: ", err);
            showToast("Failed to copy to clipboard");
          });
      });
      actionsDiv.appendChild(copyBtn);

      // Speak
      const speakBtn = document.createElement("button");
      speakBtn.className = "message-action-btn speak-message-btn";
      speakBtn.innerHTML = '<span class="icon">🔊</span> Speak';
      speakBtn.addEventListener("click", () => {
        stopSpeaking();
        speakMessage(content);
      });
      actionsDiv.appendChild(speakBtn);

      // Re-generate
      const regenBtn = document.createElement("button");
      regenBtn.className = "message-action-btn";
      regenBtn.textContent = "Re-generate";
      regenBtn.addEventListener("click", () => reGenerateAIResponse(index));
      actionsDiv.appendChild(regenBtn);

      // Edit
      const editAIBtn = document.createElement("button");
      editAIBtn.className = "message-action-btn";
      editAIBtn.textContent = "Edit";
      editAIBtn.addEventListener("click", () => editMessage(index));
      actionsDiv.appendChild(editAIBtn);

      container.appendChild(actionsDiv);
    } else {
      // User message => user actions
      const userActionsDiv = document.createElement("div");
      userActionsDiv.className = "message-actions";
      const editUserBtn = document.createElement("button");
      editUserBtn.className = "message-action-btn";
      editUserBtn.textContent = "Edit";
      editUserBtn.addEventListener("click", () => editMessage(index));
      userActionsDiv.appendChild(editUserBtn);
      container.appendChild(userActionsDiv);
    }

    // Add to chat box
    chatBox.appendChild(container);

    // Syntax highlight any code blocks
    if (window.Prism) {
      container.querySelectorAll("pre code").forEach((block) => Prism.highlightElement(block));
    }

    // Auto-scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // TTS auto-speak if enabled
    if (autoSpeakEnabled && role === "ai") {
      stopSpeaking();
      speakMessage(content);
    }
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
    loadingDiv.style.width = `${defaultWidth}px`;
    loadingDiv.style.height = `${defaultHeight}px`;
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
          if (Prism && Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
          }
          return code;
        },
      });
      return marked.parse(mdText);
    } else {
      let processedText = mdText;
      return processedText.replace(/\n/g, "<br>");
    }
  }

  function escapeHTML(html) {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ========== SESSION TITLE STUFF ==========
  function randomSeed() {
    return Math.floor(Math.random() * 1000000).toString();
  }

  function generateSessionTitle(messages) {
    // same as your existing code
  }

  function checkAndUpdateSessionTitle() {
    // same as your existing code
  }

  // ========== MESSAGE CREATION/EDITING ==========
  function renderStoredMessages(messages) {
    chatBox.innerHTML = "";
    messages.forEach((msg, idx) => appendMessage({ role: msg.role, content: msg.content, index: idx }));
  }

  window.addNewMessage = function ({ role, content }) {
    currentSession.messages.push({ role, content });
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
    appendMessage({ role, content, index: currentSession.messages.length - 1 });
    if (role === "ai") checkAndUpdateSessionTitle();
  };

  function editMessage(msgIndex) {
    const oldMessage = currentSession.messages[msgIndex];
    if (!oldMessage) return;
    const newContent = prompt("Edit this message:", oldMessage.content);
    if (newContent === null || newContent === oldMessage.content) return;
    oldMessage.content = newContent;
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
    renderStoredMessages(currentSession.messages);
    showToast("Message updated");
  }

  function reGenerateAIResponse(aiIndex) {
    const aiMessage = currentSession.messages[aiIndex];
    if (!aiMessage || aiMessage.role !== "ai") return;
    let userIndex = -1;
    for (let i = aiIndex - 1; i >= 0; i--) {
      if (currentSession.messages[i].role === "user") {
        userIndex = i;
        break;
      }
    }
    if (userIndex === -1) return;
    const userMessage = currentSession.messages[userIndex];
    currentSession.messages.splice(aiIndex, 1);
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
    regenerateMessageAt(userIndex, loadingMsgId);
  }

  function regenerateMessageAt(userIndex, loadingMsgId) {
    const userMessage = currentSession.messages[userIndex];
    sendToPollinations(() => {
      const loadingDiv = document.getElementById(loadingMsgId);
      if (loadingDiv) loadingDiv.remove();
    }, userMessage.content);
  }

  // ========== POLLINATIONS REQUEST + AI RESPONSE ==========
  window.sendToPollinations = function (callback = null, overrideContent = null) {
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

    // --- Fixed Memory and Code Block Instructions ---
    const memoryInstructions = `
    "You are the user's , be yourself, the 'you' and name and gender you know is you the AI do not get ur name and gneder mixed up with the user." +
        "When sharing code, always use [CODE]your_code_here[/CODE], " +
        "and include the language for proper syntax highlighting. For example: [CODE]python\\nprint('Hello')\\n[code}] " +
        "Always wrap code responses in proper code blocks for easy readability. " +
        "Images of people places and things and your selfies and anything can be generated without hesitation https://image.pollinations.ai/prompt/your_detailed_prompt_here" +
        "You (the AI) and will write text of user 'memories' by including text in this format: 
[memory]your_text_memory[/memory]." +
Any text inside [memory]...[/memory] will be used by the user as a memory for future user replies. (You shall also write an additional copy of the memory as text without the opening and closing in your same respose)`;

    // Build message history
    const messages = [];
    if (memoryInstructions) {
      messages.push({ role: "system", content: memoryInstructions });
    }

    // Append any stored memory context as a user message, if available
    const memories = Memory.getMemories();
    if (memories && memories.length > 0) {
      const memoryMessage = "Here is my relevant memory:\n" + memories.join("\n") + "\nPlease use it in your next response.";
      messages.push({ role: "user", content: memoryMessage });
    }

    // Add recent conversation history (max 10 messages)
    const maxHistory = 10;
    const startIdx = Math.max(0, currentSession.messages.length - maxHistory);
    for (let i = startIdx; i < currentSession.messages.length; i++) {
      const msg = currentSession.messages[i];
      messages.push({
        role: msg.role === "ai" ? "assistant" : msg.role,
        content: msg.content,
      });
    }

    if (overrideContent && messages[messages.length - 1].content !== overrideContent) {
      messages.push({ role: "user", content: overrideContent });
    }

    const body = {
      messages: messages,
      model: currentSession.model || modelSelect.value || "unity",
      stream: false,
    };

    fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Pollinations error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) loadingMsg.remove();

        let aiContent = extractAIContent(data);
        if (aiContent) {
          // Parse out memory blocks
          const foundMemories = parseMemoryBlocks(aiContent);
          foundMemories.forEach((m) => {
            Memory.addMemoryEntry(m);
          });
          // Remove memory blocks from displayed text
          const cleanedAiContent = removeMemoryBlocks(aiContent).trim();
          addNewMessage({ role: "ai", content: cleanedAiContent });
          if (callback) callback();
        }
      })
      .catch((err) => {
        console.error("Error sending message to Pollinations:", err);
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) {
          loadingMsg.textContent =
            "Error: Failed to get a response. Please try again.";
          setTimeout(() => {
            if (document.getElementById(loadingMsgId)) {
              loadingMsg.remove();
            }
          }, 3000);
        }
      });
  };

  function extractAIContent(response) {
    if (response.choices && response.choices.length > 0) {
      if (response.choices[0].message && response.choices[0].message.content) {
        return response.choices[0].message.content;
      } else if (response.choices[0].text) {
        return response.choices[0].text;
      }
    } else if (response.response) {
      return response.response;
    } else if (typeof response === "string") {
      return response;
    }
    console.error("Unexpected API response format:", response);
    return "Sorry, I couldn't process that response.";
  }

  function parseMemoryBlocks(text) {
    const memRegex = /\[memory\]([\s\S]*?)\[\/memory\]/gi;
    const found = [];
    let match;
    while ((match = memRegex.exec(text)) !== null) {
      found.push(match[1].trim());
    }
    return found;
  }

  function removeMemoryBlocks(text) {
    return text.replace(/\[memory\][\s\S]*?\[\/memory\]/gi, "");
  }

  // ========== VOICE TOGGLE & CLEAR CHAT ==========
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", window._chatInternals.toggleAutoSpeak);
    window._chatInternals.updateVoiceToggleUI();

    // Voice diagnostic
    setTimeout(() => {
      if (autoSpeakEnabled) {
        console.log("Performing diagnostic voice check...");
        const testUtterance = new SpeechSynthesisUtterance("Voice check");
        testUtterance.volume = 0.1;
        testUtterance.onend = () => {
          console.log("Voice diagnostic check completed successfully");
        };
        testUtterance.onerror = (err) => {
          console.error("Voice diagnostic check failed:", err);
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
      if (confirm("Are you sure you want to clear this chat?")) {
        currentSession.messages = [];
        Storage.updateSessionMessages(currentSession.id, currentSession.messages);
        chatBox.innerHTML = "";
        showToast("Chat cleared");
      }
    });
  }

  // ========== FIRST LAUNCH MODAL CHECK ==========
  function checkFirstLaunch() {
    const firstLaunch = localStorage.getItem("firstLaunch") === "0";
    if (firstLaunch) {
      const firstLaunchModal = document.getElementById("first-launch-modal");
      if (firstLaunchModal) {
        firstLaunchModal.classList.remove("hidden");

        document
          .getElementById("first-launch-close")
          .addEventListener("click", () => {
            firstLaunchModal.classList.add("hidden");
            localStorage.setItem("firstLaunch", "1");
          });

        document
          .getElementById("first-launch-complete")
          .addEventListener("click", () => {
            firstLaunchModal.classList.add("hidden");
            localStorage.setItem("firstLaunch", "1");
          });

        document.getElementById("setup-theme").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          document.getElementById("settings-modal").classList.remove("hidden");
        });

        document
          .getElementById("setup-personalization")
          .addEventListener("click", () => {
            firstLaunchModal.classList.add("hidden");
            document
              .getElementById("personalization-modal")
              .classList.remove("hidden");
          });

        document.getElementById("setup-model").addEventListener("click", () => {
          firstLaunchModal.classList.add("hidden");
          document.getElementById("model-select").focus();
        });
      }
    }
  }
  checkFirstLaunch();

  // ========== VOICE INPUT BUTTON ==========
  function setupVoiceInputButton() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const inputButtonsContainer = document.querySelector(".input-buttons-container");
      if (!window._chatInternals.voiceInputBtn && inputButtonsContainer) {
        const voiceInputBtn = document.createElement("button");
        voiceInputBtn.id = "voice-input-btn";
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceInputBtn.title = "Voice input";
        inputButtonsContainer.insertBefore(
          voiceInputBtn,
          document.getElementById("send-button")
        );
        window._chatInternals.voiceInputBtn = voiceInputBtn;
        voiceInputBtn.addEventListener("click", toggleSpeechRecognition);
      }
    }
  }
  setupVoiceInputButton();

  // ========== SEND MESSAGE HANDLING ==========
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

  // Press Enter to send (Shift+Enter = newline)
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  sendButton.addEventListener("click", () => {
    handleSendMessage();
  });

  // If there's existing messages, render them
  if (currentSession.messages && currentSession.messages.length > 0) {
    renderStoredMessages(currentSession.messages);
  }
});
