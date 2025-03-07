// chat.js

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");
  const clearChatBtn = document.getElementById("clear-chat");
  const voiceToggle = document.getElementById("voice-toggle");
  const codePanel = document.getElementById("code-panel");
  const codeContent = document.getElementById("code-content");

  let currentSession = Storage.getCurrentSession();
  if (!currentSession) return;

  // Helper: Escape HTML for safe rendering.
  function escapeHTML(html) {
    return html.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
  }

  // Helper: Generate a random seed.
  function randomSeed() {
    return Math.floor(Math.random() * 1000000).toString();
  }

  // Helper: Extract JSON substring (from first "{" to last "}").
  function extractJSON(str) {
    const start = str.indexOf("{");
    const end = str.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return str.substring(start, end + 1);
    }
    return str;
  }

  // Process structured response text by extracting sections.
  // Returns an array of objects: { type: 'message'|'code'|'image', content: string }
  function processResponseSections(text) {
    const sections = [];
    const regex = /\[(message|code|image)]([\s\S]*?)\[\/\1]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      sections.push({
        type: match[1],
        content: match[2].trim()
      });
    }
    return sections;
  }

  // Append a structured message (with sections) to the chat UI.
  function appendStructuredMessage({ role, content }) {
    const container = document.createElement("div");
    container.classList.add("structured-message", role === "user" ? "user-message" : "ai-message");

    const sections = processResponseSections(content);
    if (sections.length === 0) {
      // Fallback if no structured sections are found.
      container.textContent = content;
    } else {
      sections.forEach(section => {
        if (section.type === "message") {
          // Render plain text.
          const msgDiv = document.createElement("div");
          msgDiv.classList.add("structured-text");
          msgDiv.textContent = section.content;
          container.appendChild(msgDiv);
        } else if (section.type === "code") {
          // Create a "Show Code" icon button.
          const codeBtn = document.createElement("button");
          codeBtn.classList.add("expand-code-btn");
          codeBtn.textContent = "Show Code"; // You can replace this text with an icon if desired.
          codeBtn.dataset.code = section.content;
          codeBtn.addEventListener("click", () => {
            // Insert the code as a markdown formatted block for syntax highlighting.
            codeContent.innerHTML = `<pre class="language-python"><code>${escapeHTML(section.content)}</code></pre>`;
            if (window.Prism) {
              const codeEl = codeContent.querySelector("code");
              Prism.highlightElement(codeEl);
            }
            // Simulate clicking the expand icon to switch the view.
            document.getElementById("expand-code-btn").click();
          });
          container.appendChild(codeBtn);
        } else if (section.type === "image") {
          // Render an image.
          const img = document.createElement("img");
          img.classList.add("structured-image");
          img.src = section.content;
          img.alt = "AI Generated Image";
          container.appendChild(img);
        }
      });
    }

    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Append a message to the chat UI.
  function appendMessage({ role, content }) {
    if (content.includes("[message]") || content.includes("[code]") || content.includes("[image]")) {
      appendStructuredMessage({ role, content });
    } else {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", role === "user" ? "user-message" : "ai-message");
      messageDiv.innerHTML = content;
      chatBox.appendChild(messageDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  // Add a new message and update session storage.
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
    messages.forEach((msg) => {
      appendMessage(msg);
    });
  }

  renderStoredMessages(currentSession.messages);

  // Voice recognition integration.
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

  // Send message on Enter key (Shift+Enter for newline).
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  chatInput.addEventListener("input", () => {
    sendButton.disabled = chatInput.value.trim() === "";
  });

  sendButton.addEventListener("click", () => {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;
    if (currentSession.name === "New Chat" && currentSession.messages.length === 0) {
      generateChatTitle(userMessage);
    }
    addNewMessage({ role: "user", content: userMessage });
    chatInput.value = "";
    sendButton.disabled = true;
    sendToPollinations();
  });

  clearChatBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear this chat?")) return;
    currentSession.messages = [];
    Storage.updateSessionMessages(currentSession.id, currentSession.messages);
    chatBox.innerHTML = "";
  });

  // Generate a chat title using a system prompt.
  function generateChatTitle(initialInput) {
    const prompt = `Generate a creative, 3-8 word chat title based on this conversation:\nUser: ${initialInput}`;
    const body = {
      messages: [
        {
          role: "system",
          content: "You are a creative assistant. Generate a concise chat title strictly as a raw JSON object with exactly one key 'chatTitle'. Do not output any extra text."
        },
        { role: "user", content: prompt }
      ],
      model: "openai",
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
      .then((res) => res.json())
      .then((data) => {
        console.debug("Raw title generation response:", data);
        if (data?.choices && data.choices.length > 0) {
          const titleJSON = data.choices[0].message.content.trim();
          try {
            const parsedTitle = JSON.parse(titleJSON);
            const title = parsedTitle.chatTitle ? parsedTitle.chatTitle : titleJSON;
            console.debug("Extracted chat title:", title);
            Storage.renameSession(currentSession.id, title);
            currentSession = Storage.getCurrentSession();
          } catch (e) {
            console.error("Error parsing chat title JSON:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Error generating chat title:", err);
      });
  }

  // Send message to Pollinations API with a system prompt enforcing structured output.
  function sendToPollinations() {
    const modelName = currentSession.model || "openai";
    const messagesToSend = currentSession.messages.slice(-10);
    const normalizedMessages = messagesToSend.map((m) => {
      return { role: m.role === "ai" ? "assistant" : m.role, content: m.content };
    });
    const systemPrompt = {
      role: "system",
      content:
        "You are a creative assistant. For every response, output your answer strictly as a raw JSON object with exactly one key 'message'. " +
        "The value must be a string divided into clearly delineated sections. Each section must be wrapped with specific tags: " +
        "[message] and [/message] for plain text, [code] and [/code] for code sections, and [image] and [/image] for images. " +
        "For example, when outputting code, include the actual code in a code block using triple backticks with the language specified, like so: " +
        "[code] ```python\nprint(\"Hello World!\")\n``` [/code]. " +
        "You may include one or many sections of any type, in any order. Do not output any extra keys or text."
    };
    const body = {
      messages: [systemPrompt, ...normalizedMessages],
      model: modelName,
      seed: randomSeed(),
      jsonMode: true,
      private: true
    };

    console.debug("Sending message payload:", body);
    fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.debug("Raw Pollinations response:", data);
        const aiResponse = formatAIResponse(data);
        console.debug("Formatted AI response:", aiResponse);
        addNewMessage({ role: "ai", content: aiResponse });
      })
      .catch((err) => {
        console.error("Pollinations error:", err);
        addNewMessage({ role: "ai", content: "Error reaching Pollinations API: " + err.message });
      });
  }

  // Format the AI response.
  // If the parsed JSON contains keys like "message", "code", or "image", wrap them with our custom tags.
  function formatAIResponse(data) {
    let rawResponse;
    if (typeof data === "string") {
      rawResponse = extractJSON(data);
      console.debug("Extracted JSON from raw response:", rawResponse);
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        console.error("Failed to parse JSON from response:", e);
        return `<pre>${escapeHTML(rawResponse)}</pre>`;
      }
    }
    console.debug("Parsed JSON response:", data);

    let content = "";
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      content = data.choices[0].message.content.trim();
    } else if (data.response) {
      content = typeof data.response === "string" ? data.response.trim() : "";
    } else {
      console.debug("No valid content field in response, returning full JSON.");
      return JSON.stringify(data, null, 2);
    }
    
    // Try parsing the content as JSON.
    let structured;
    try {
      structured = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse response content as JSON:", e);
      return `<pre>${escapeHTML(content)}</pre>`;
    }
    
    // Build the final structured string with our custom tags.
    if (typeof structured === "object" && structured !== null) {
      let finalStr = "";
      if (structured.message) {
        finalStr += "[message]" + structured.message + "[/message]\n";
      }
      if (structured.code) {
        finalStr += "[code] ```python\n" + structured.code + "\n``` [/code]\n";
      }
      if (structured.image) {
        finalStr += "[image]" + structured.image + "[/image]\n";
      }
      return finalStr.trim() || JSON.stringify(structured, null, 2);
    }
    return structured;
  }

  // --- New Code Panel Toggle Controls ---
  // These assume that your index.html contains two icon buttons with IDs:
  // "minimize-code-btn" (left arrow) and "expand-code-btn" (right arrow)
  const expandBtn = document.getElementById("expand-code-btn");
  const minimizeBtn = document.getElementById("minimize-code-btn");
  const chatLayout = document.querySelector(".chat-layout");

  // When the expand button is clicked:
  expandBtn.addEventListener("click", () => {
    if (chatLayout.classList.contains("code-full")) {
      // If already fully expanded, revert to split view.
      chatLayout.classList.remove("code-full");
      chatLayout.classList.add("split-view");
    } else {
      // Expand code panel fully: hide chat panel.
      chatLayout.classList.remove("chat-only", "split-view");
      chatLayout.classList.add("code-full");
    }
  });

  // When the minimize button is clicked:
  minimizeBtn.addEventListener("click", () => {
    // Minimize the code panel and show only chat responses.
    chatLayout.classList.remove("code-full", "split-view");
    chatLayout.classList.add("chat-only");
  });
});
