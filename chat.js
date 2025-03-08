// chat.js
document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");
  const clearChatBtn = document.getElementById("clear-chat");
  const voiceToggle = document.getElementById("voice-toggle");

  // Ensure there's a valid session; create one if necessary.
  let currentSession = Storage.getCurrentSession();
  if (!currentSession) {
    currentSession = Storage.createSession("New Chat");
    localStorage.setItem("currentSessionId", currentSession.id);
  }

  // Voice synthesis
  const synth = window.speechSynthesis;
  let voices = [];
  let voiceEnabled = false;

  // Update voices when available
  synth.onvoiceschanged = () => {
    voices = synth.getVoices();
  };

  // Helper: Escape HTML.
  function escapeHTML(html) {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper: Generate a random seed.
  function randomSeed() {
    return Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
  }

  // Helper: Extract JSON substring.
  function extractJSON(str) {
    const start = str.indexOf("{");
    const end = str.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return str.substring(start, end + 1);
    }
    return str;
  }

  // Process response sections – extract code blocks with improved regex patterns
  function processResponseSections(text) {
    const sections = [];
    let lastIndex = 0;
    
    // Combined regex to match [code]...[/code] or markdown code blocks
    const combinedRegex = /(\[code\]([\s\S]*?)\[\/code\]|```([\w-]*)\n([\s\S]*?)```)/gi;
    
    let match;
    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        sections.push({
          type: "TEXT",
          content: text.substring(lastIndex, match.index)
        });
      }
      
      let codeContent;
      let language = "auto";
      
      if (match[0].toLowerCase().startsWith("[code]")) {
        codeContent = match[0].replace(/^\[code\]/i, '').replace(/\[\/code\]$/i, '');
      } else {
        const langMatch = match[0].match(/```([\w-]*)\n/);
        if (langMatch && langMatch[1]) {
          language = langMatch[1] || "auto";
        }
        codeContent = match[0].replace(/```[\w-]*\n/, '').replace(/```$/, '');
      }
      
      sections.push({
        type: "CODE",
        content: codeContent.trim(),
        language: language
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      sections.push({
        type: "TEXT",
        content: text.substring(lastIndex)
      });
    }
    
    return sections.length > 0 ? sections : [{ type: "TEXT", content: text }];
  }

  // Detect language based on code content
  function detectLanguage(code) {
    if (code.includes("console.log") || code.includes("const ") || code.includes("let ") || code.includes("function")) {
      return "javascript";
    }
    if (code.includes("def ") || code.includes("print(") || code.includes("import ")) {
      return "python";
    }
    if (code.includes("public class") || code.includes("System.out.println")) {
      return "java";
    }
    if (code.includes("<html>") || code.includes("</div>") || code.includes("<script>")) {
      return "html";
    }
    if (code.includes("SELECT ") || code.includes("FROM ") || code.includes("WHERE ")) {
      return "sql";
    }
    if (code.includes("#include") || code.includes("int main")) {
      return "c";
    }
    if (code.includes("<?php")) {
      return "php";
    }
    if (code.includes("package") && code.includes("import") && code.includes("func")) {
      return "go";
    }
    return "javascript"; // Default language
  }

  // Append a structured message (code blocks and text).
  function appendStructuredMessage({ role, content }) {
    const container = document.createElement("div");
    container.classList.add("message", role === "user" ? "user-message" : "ai-message");

    const sections = processResponseSections(content);
    sections.forEach(section => {
      if (section.type === "CODE") {
        const codeBlockContainer = document.createElement("div");
        codeBlockContainer.classList.add("code-block-container");
        
        const language = section.language !== "auto" ? section.language : detectLanguage(section.content);
        
        const codeHeader = document.createElement("div");
        codeHeader.classList.add("code-block-header");
        const langIndicator = document.createElement("span");
        langIndicator.classList.add("code-language");
        langIndicator.textContent = language;
        codeHeader.appendChild(langIndicator);
        
        const copyBtn = document.createElement("button");
        copyBtn.classList.add("copy-code-btn");
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(section.content).then(() => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
          }).catch(err => console.error("Failed to copy:", err));
        });
        codeHeader.appendChild(copyBtn);
        
        const codeBlock = document.createElement("pre");
        codeBlock.classList.add("code-block");
        
        const codeElement = document.createElement("code");
        codeElement.classList.add(`language-${language}`);
        codeElement.textContent = section.content;
        codeBlock.appendChild(codeElement);
        
        codeBlockContainer.appendChild(codeHeader);
        codeBlockContainer.appendChild(codeBlock);
        container.appendChild(codeBlockContainer);
        
        if (window.Prism) {
          Prism.highlightElement(codeElement);
        }
      } else if (section.type === "TEXT") {
        const textDiv = document.createElement("div");
        textDiv.classList.add("message-text");
        textDiv.textContent = section.content;
        container.appendChild(textDiv);
      }
    });

    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Append a message.
  function appendMessage({ role, content }) {
    if (content.includes("[code]") || content.includes("[/code]") || content.includes("```")) {
      appendStructuredMessage({ role, content });
      return;
    }
    
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", role === "user" ? "user-message" : "ai-message");

    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex);
    
    const messageContent = document.createElement("div");
    messageContent.classList.add("message-text");
    
    if (urls) {
      let textContent = content;
      urls.forEach(url => {
        if (url.includes("image.pollinations.ai")) {
          const imgContainer = document.createElement("div");
          imgContainer.classList.add("message-image-container");
          
          const img = document.createElement("img");
          img.src = url;
          img.classList.add("message-image");
          img.alt = "Generated image";
          img.loading = "lazy";
          
          imgContainer.appendChild(img);
          messageDiv.appendChild(imgContainer);
        } else {
          textContent = textContent.replace(url, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
        }
      });
      
      if (textContent.replace(urlRegex, "").trim()) {
        messageContent.innerHTML = textContent;
        messageDiv.appendChild(messageContent);
      }
    } else {
      messageContent.textContent = content;
      messageDiv.appendChild(messageContent);
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Function that sends the user message.
  function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;
    if (currentSession.name === "New Chat" && currentSession.messages.length === 0) {
      generateChatTitle(userMessage);
    }
    addNewMessage({ role: "user", content: userMessage });
    chatInput.value = "";
    sendButton.disabled = true;
    sendToPollinations();
  }

  // Add a new message and update session.
  function addNewMessage({ role, content }) {
    appendMessage({ role, content });
    currentSession.messages.push({ role, content });
    if (currentSession.messages.length > 10) {
      currentSession.messages = currentSession.messages.slice(-10);
    }
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
  }

  function renderStoredMessages(messages) {
    chatBox.innerHTML = "";
    messages.forEach(msg => appendMessage(msg));
  }

  renderStoredMessages(currentSession.messages);

  // Voice recognition.
  let recognition;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.addEventListener("result", (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join("");
      chatInput.value += transcript;
      sendButton.disabled = chatInput.value.trim() === "";
    });
    recognition.addEventListener("error", (event) => {
      console.error("Speech recognition error:", event.error);
    });
  }
  voiceToggle.addEventListener("click", () => {
    if (recognition) {
      recognition.start();
    } else {
      alert("Voice recognition is not supported in this browser.");
    }
  });
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatInput.addEventListener("input", () => {
    sendButton.disabled = chatInput.value.trim() === "";
  });

  sendButton.addEventListener("click", sendMessage);

  clearChatBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear this chat?")) return;
    currentSession.messages = [];
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
    chatBox.innerHTML = "";
  });

  // Generate chat title.
  function generateChatTitle(initialInput) {
    const prompt = `Generate a creative, 3-8 word chat title based on this conversation:\nUser: ${initialInput}`;
    const body = {
      messages: [
        {
          role: "system",
          content: "You are yourself, interact and conversate with the user as yourself. Any code you create shall be wrapped in [CODE] and [/CODE] tags containing all the code. You can generate images using: https://image.pollinations.ai/prompt/your_prompt_here\n\n" + initialInput
        }
      ],
      model: "flux",
      seed: randomSeed(),
      jsonMode: true,
      private: true
    };

    console.debug("Generating chat title with payload:", body);
    fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        console.debug("Raw title generation response:", data);
        let title = "Untitled Chat";
        if (data?.choices && data.choices.length > 0) {
          const titleJSON = data.choices[0].message.content.trim();
          try {
            const parsedTitle = JSON.parse(titleJSON);
            title = parsedTitle.response || parsedTitle.chatTitle || titleJSON;
          } catch (e) {
            console.error("Error parsing chat title JSON:", e);
            title = titleJSON;
          }
        }
        console.debug("Extracted chat title:", title);
        Storage.renameSession(currentSession.id, title);
        currentSession = Storage.getCurrentSession();
      })
      .catch(err => {
        console.error("Error generating chat title:", err);
      });
  }

  // Send message to Pollinations API.
  function sendToPollinations() {
    const modelName = currentSession.model || "flux";
    const messagesToSend = currentSession.messages.slice(-10);
    const normalizedMessages = messagesToSend.map(m => {
      return { role: m.role === "ai" ? "assistant" : m.role, content: m.content };
    });
    
    const systemPrompt = {
      role: "system",
      content: "You are yourself, interact and conversate with the user as yourself using plain text only. " +
               "Do not format your responses in JSON" +
               "When providing code, you MUST wrap it in one of these formats:\n" +
               "1. [CODE] and [/CODE] tags (e.g., [CODE]console.log('hello')[/CODE])\n" +
               "2. Markdown code blocks with language specification (preferred):\n" +
               "   ```javascript\n" +
               "   console.log('hello');\n" +
               "   ```\n\n" +
               "Always specify the language in markdown code blocks for proper syntax highlighting. " +
               "Never use both formats for the same code block. " +
               "For multi-file responses, use separate code blocks for each file, each with appropriate language specification. " +
               "You can generate images using this: https://image.pollinations.ai/prompt/your_prompt_here&width=1080&height=1920&enhance=true&private=true&seed=497283&nologo=true&model=flux"
    };         "You use %20 for spaces when creating 'your_prompt_here', use a random generated 6 digit number for seed, and use standard height witdh for aspect ratios or user specified. You can use this method to generate likness' or anything you and/or the user come up with. respect the user's wishes and requests. these generations can be called an image, pic, photo, art and any variation there-in and more."
    
    const body = {
      messages: [systemPrompt, ...normalizedMessages],
      model: modelName,
      seed: randomSeed(),
      private: true
    };

    console.debug("Sending message payload:", body);
    fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.debug("Raw Pollinations response:", data);
        const aiResponse = formatAIResponse(data);
        console.debug("Formatted AI response:", aiResponse);
        addNewMessage({ role: "ai", content: aiResponse });
      })
      .catch(err => {
        console.error("Pollinations error:", err);
        addNewMessage({ role: "ai", content: "Error reaching Pollinations API: " + err.message });
      });
  }
  // Format AI response.
  function formatAIResponse(data) {
    let rawResponse;
    if (typeof data === "string") {
      rawResponse = extractJSON(data);
      console.debug("Extracted JSON from raw response:", rawResponse);
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        console.error("Failed to parse JSON from response:", e);
        return rawResponse;
      }
    }
    console.debug("Parsed JSON response:", data);

    let content = "No response available";
    if (data?.response) {
      content = data.response;
    } else if (data?.message) {
      content = data.message;
    } else if (data?.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      const messageContent = data.choices[0].message.content.trim();
      try {
        const parsedContent = JSON.parse(messageContent);
        content = parsedContent.response || messageContent;
      } catch (e) {
        content = messageContent;
      }
    } else if (typeof data === "string") {
      content = data;
    } else {
      console.debug("No valid content field in response, returning full JSON.");
      return JSON.stringify(data, null, 2);
    }

    return content;
  }

  // Additional event listeners.
  function setupEventListeners() {
    chatInput.addEventListener("input", function () {
      this.style.height = "auto";
      const newHeight = Math.min(this.scrollHeight, 150);
      this.style.height = newHeight + "px";
      sendButton.disabled = !this.value.trim();
    });
    
    window.addEventListener("beforeunload", () => {
      if (window.speechSynthesis) {
        synth.cancel();
      }
    });
    
    setupImageHandling();
  }

  function setupImageHandling() {
    chatBox.addEventListener("dragenter", e => {
      e.preventDefault();
      e.stopPropagation();
      chatBox.classList.add("drag-over");
    });
    
    chatBox.addEventListener("dragover", e => {
      e.preventDefault();
      e.stopPropagation();
      chatBox.classList.add("drag-over");
    });
    
    chatBox.addEventListener("dragleave", e => {
      e.preventDefault();
      e.stopPropagation();
      chatBox.classList.remove("drag-over");
    });
    
    chatBox.addEventListener("drop", async e => {
      e.preventDefault();
      e.stopPropagation();
      chatBox.classList.remove("drag-over");
      const files = e.dataTransfer.files;
      if (files && files[0] && files[0].type.startsWith("image/")) {
        handleImageInput(files[0]);
      }
    });
    
    chatInput.addEventListener("paste", async e => {
      const items = e.clipboardData.items;
      const text = e.clipboardData.getData("text");
      
      if (text) {
        return;
      }
      
      for (let item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          handleImageInput(file);
          break;
        } else if (item.type === "text/plain") {
          item.getAsString(async maybeUrl => {
            if (maybeUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              e.preventDefault();
              handleImageUrl(maybeUrl);
            }
          });
        }
      }
    });
  }

  async function handleImageInput(file) {
    try {
      const objectUrl = URL.createObjectURL(file);
      const base64Image = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const imagePlaceholder = `[Attached Image]`;
      chatInput.value += chatInput.value.length > 0 ? "\n" + imagePlaceholder : imagePlaceholder;
      chatInput.dataset.pendingImage = base64Image;
      chatInput.dataset.displayUrl = objectUrl;
      showImageFeedback("Image attached ✓");
    } catch (error) {
      console.error("Error handling image:", error);
      showError("Failed to process image");
    }
  }

  async function handleImageUrl(url) {
    try {
      const imagePlaceholder = `[Attached Image URL]`;
      chatInput.value += chatInput.value.length > 0 ? "\n" + imagePlaceholder : imagePlaceholder;
      chatInput.dataset.pendingImage = url;
      chatInput.dataset.displayUrl = url;
      const feedback = document.createElement("div");
      feedback.className = "image-upload-feedback";
      feedback.textContent = "Image URL attached ✓";
      chatInput.parentElement.appendChild(feedback);
      setTimeout(() => feedback.remove(), 2000);
    } catch (error) {
      console.error("Error handling image URL:", error);
      showError("Failed to process image URL");
    }
  }

  async function getImageDescription(imageUrl) {
    try {
      const requestBody = {
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe the image exactly as you see it." },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        model: "openai",
        jsonMode: false
      };
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        throw new Error("Failed to get image description");
      }
      return await response.text();
    } catch (error) {
      console.error("Error getting image description:", error);
      return "Image description unavailable";
    }
  }

  function showImageFeedback(message) {
    const feedback = document.createElement("div");
    feedback.className = "image-upload-feedback";
    feedback.textContent = message;
    chatInput.parentElement.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  // Voice synthesis functions
  function speak(text) {
    if (!voiceEnabled || !window.speechSynthesis) {
      return;
    }
    
    let cleanText = text
      .replace(/\[CODE\](.*?)\[\/CODE\]/gi, "")
      .replace(/\[CODE\]/g, "")
      .replace(/\[\/CODE\]/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/http[s]?:\/\/\S+/g, "")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\s+/g, " ")
      .trim();
      
    if (cleanText) {
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.voice = getPreferredVoice();
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const messageContent = document.querySelector(".ai-message:last-child .message-text");
      if (messageContent) {
        messageContent.style.border = "1px solid var(--accent-color)";
        utterance.onend = () => {
          messageContent.style.border = "none";
        };
      }
      
      synth.speak(utterance);
    }
  }

  function getPreferredVoice() {
    const voices = synth.getVoices();
    return (
      voices.find(voice => voice.name.includes("Zira")) || 
      voices.find(voice => voice.name.includes("Samantha")) ||
      voices.find(voice => voice.name.includes("Google") && voice.lang.includes("en-")) ||
      voices.find(voice => voice.lang.includes("en-")) ||
      voices[0]
    );
  }

  function stopTTS() {
    if (window.speechSynthesis) {
      synth.cancel();
    }
  }

  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-popup";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
      errorDiv.classList.add("show");
      setTimeout(() => {
        errorDiv.classList.remove("show");
        setTimeout(() => errorDiv.remove(), 300);
      }, 3000);
    }, 100);
  }

  setupEventListeners();
});