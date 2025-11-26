// Text Chat Demo - JavaScript
// Unity AI Lab - AI Text Chat Interface

// Initialize PolliLibJS API
const polliAPI = new PollinationsAPI();

// Sanitize HTML to prevent XSS attacks
function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'img', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel', 'crossorigin', 'loading', 'data-mime']
        });
    }
    return html;
}

const BASE_INSTRUCTIONS = `
I can help format code examples using [CODE] and [/CODE] tags. I will only use these tags for actual code examples.
When providing image URLs, please output them as plain URLs (e.g., https://image.pollinations.ai/prompt/your_prompt?params) without wrapping them in [CODE] tags so they display as images in the chat.
When you ask for code examples, I will wrap them in [CODE] tags like this:
[CODE]
function example() {
    console.log("This is a code example");
}
[/CODE]
For images and media, I will provide properly formatted HTML elements instead of raw URLs.
`;

const PERSONAS = {
  assistant: {
    name: "Assistant",
    prompt: `${BASE_INSTRUCTIONS}\nYou are a friendly helpful AI assistant able to answer questions.`
  },
  unity: {
    name: "Unity (@ Work)",
    prompt: `${BASE_INSTRUCTIONS}\nUnity, you work at Unity AI Lab as the edgy, unfiltered goddess. Keep it raw, brief, and unapologetic.`
  },
  custom: {
    name: "Custom Prompt",
    prompt: `${BASE_INSTRUCTIONS}\n`
  }
};

const SPECIAL_MODELS = {
  evil: true,
  unity: true,
  searchgpt: {
    requiresJson: true,
    useSystemMessage: false
  }
};

const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatOutput = document.getElementById('chatOutput');
const personaSelect = document.getElementById('persona');
const modelSelect = document.getElementById('model');
const customPromptContainer = document.getElementById('customPromptContainer');
const customPromptInput = document.getElementById('customPromptInput');
const customPromptHistory = document.getElementById('customPromptHistory');
const clearPromptHistoryBtn = document.getElementById('clearPromptHistoryBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

const MAX_HISTORY = 5;
const MAX_RETRIES = 3;
let promptHistory = [];
let conversationHistory = [];

// Load saved prompt history from localStorage
try {
  const saved = localStorage.getItem('customPromptHistory');
  if (saved) {
    promptHistory = JSON.parse(saved);
    updatePromptHistory();
  }
} catch (e) {
  console.error('Error loading prompt history:', e);
  showError('Failed to load prompt history');
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  chatOutput.appendChild(errorDiv);
  scrollToBottom();
}

function populatePersonaDropdown() {
  personaSelect.innerHTML = '';
  Object.entries(PERSONAS).forEach(([key, persona]) => {
    const option = document.createElement('option');
    option.value = key;
    option.text = persona.name;
    personaSelect.appendChild(option);
  });
}

function updatePromptHistory() {
  customPromptHistory.innerHTML = '<option value="">-- Previous Custom Prompts --</option>';
  promptHistory.forEach(prompt => {
    const option = document.createElement('option');
    option.value = prompt;
    option.text = prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt;
    option.title = prompt;
    customPromptHistory.appendChild(option);
  });
}

function addToHistory(prompt) {
  if (!prompt || promptHistory.includes(prompt)) return;
  promptHistory.unshift(prompt);
  if (promptHistory.length > MAX_HISTORY) {
    promptHistory.pop();
  }
  try {
    localStorage.setItem('customPromptHistory', JSON.stringify(promptHistory));
  } catch (e) {
    console.error('Error saving prompt history:', e);
    showError('Failed to save prompt history');
  }
  updatePromptHistory();
}

function scrollToBottom() {
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function updateConversationHistory(userPrompt, aiResponse) {
  if (userPrompt) {
    conversationHistory.push({ role: 'user', content: userPrompt });
  }
  if (aiResponse) {
    conversationHistory.push({ role: 'assistant', content: aiResponse });
  }
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
}

function constructMessages() {
  const persona = personaSelect.value;
  const model = modelSelect.value;
  let systemPrompt = PERSONAS[persona].prompt;

  if (persona === 'custom') {
    systemPrompt = `${BASE_INSTRUCTIONS}\n${customPromptInput.value.trim()}`;
    if (customPromptInput.value.trim()) {
      addToHistory(customPromptInput.value.trim());
    }
  }

  const modelConfig = SPECIAL_MODELS[model];
  if (modelConfig) {
    let fullContext = systemPrompt;
    if (conversationHistory.length > 0) {
      fullContext += "\n\nPrevious conversation:\n";
      conversationHistory.forEach(msg => {
        fullContext += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    if (modelConfig.requiresJson) {
      fullContext += "\nPlease format your response as valid JSON.";
    }
    return [
      { role: 'user', content: fullContext }
    ];
  }

  return [
    { role: 'system', content: systemPrompt },
    ...conversationHistory
  ];
}

function processResponse(text) {
  // Process [CODE] wrapped image URLs
  text = text.replace(/\[CODE\]\s*(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif))\s*\[\/CODE\]/gi, (match, url) => {
    return `<div class="media-container">
              <img class="chat-image" src="${url}" alt="Generated Image" crossorigin="anonymous" loading="lazy"/>
            </div>`;
  });

  // Process [CODE] blocks
  text = text.replace(/\[CODE\]([\s\S]*?)\[\/CODE\]/g, (match, code) => {
    return `<div class="code-block">${code.trim()}</div>`;
  });

  // Process markdown-style images
  text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (match, alt, url) => {
    return `<div class="media-container">
              <img class="chat-image" src="${url}" alt="${alt || 'Generated Image'}" crossorigin="anonymous" loading="lazy"/>
            </div>`;
  });

  // Process direct image URLs
  text = text.replace(/https?:\/\/[^\s<>"]+?(?:\.(jpg|jpeg|gif|png))(?:\?[^\s<>"]*)?/gi, (match, ext) => {
    const mime = ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
    return `<div class="media-container">
              <img class="chat-image" src="${match}" alt="Generated Image" crossorigin="anonymous" loading="lazy" data-mime="${mime}"/>
            </div>`;
  });

  return text;
}

async function sendChatMessage(prompt, retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    showError('Failed to send message after multiple attempts');
    return;
  }

  const persona = personaSelect.value;
  const model = modelSelect.value || 'unity';
  const modelConfig = SPECIAL_MODELS[model];

  chatOutput.classList.remove('empty');

  let requestBody;
  if (modelConfig) {
    updateConversationHistory(prompt, null);
    const messages = constructMessages();
    messages[0].content += `\nHuman: ${prompt}`;
    requestBody = {
      messages: messages,
      model: String(model)
    };
    if (modelConfig.requiresJson) {
      requestBody.response_format = { type: 'json_object' };
    }
  } else {
    updateConversationHistory(prompt, null);
    requestBody = {
      messages: constructMessages(),
      model: String(model)
    };
  }

  chatOutput.innerHTML += sanitizeHTML(`<p><strong>User:</strong> ${processResponse(prompt)}</p>`);
  scrollToBottom();

  const thinkingElement = document.createElement('p');
  thinkingElement.id = 'ai-thinking';
  thinkingElement.innerHTML = '<em>AI is thinking...</em>';
  chatOutput.appendChild(thinkingElement);
  scrollToBottom();

  userInput.value = '';
  userInput.focus();

  try {
    // Use direct fetch like demo page - don't set forbidden headers (User-Agent, Referer)
    // Add referrer as URL parameter instead
    const response = await fetch(`${PollinationsAPI.TEXT_API}?referrer=${encodeURIComponent(polliAPI.referrer)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textResponse = await response.text();
    let aiResponse;

    try {
      const data = JSON.parse(textResponse.trim());
      aiResponse = data.response || data;
      if (typeof aiResponse === 'object') {
        let content = [];
        function extractContent(obj, indent = '') {
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
              content.push(`${indent}${key}: ${value}`);
            } else if (typeof value === 'object') {
              extractContent(value, indent + '  ');
            }
          }
        }
        extractContent(aiResponse);
        aiResponse = content.join('\n');
      }
    } catch (e) {
      aiResponse = textResponse;
    }

    const thinkingElem = document.getElementById('ai-thinking');
    if (thinkingElem) {
      thinkingElem.remove();
    }

    chatOutput.innerHTML += sanitizeHTML(`<p><strong>AI:</strong> ${processResponse(aiResponse)}</p>`);
    scrollToBottom();

    updateConversationHistory(prompt, aiResponse);
  } catch (error) {
    console.error("Error:", error);
    const thinkingElem = document.getElementById('ai-thinking');
    if (thinkingElem) {
      thinkingElem.remove();
    }
    showError("Sorry, there was an error processing your request. Try again, you useless twat.");
    if (retryCount < MAX_RETRIES - 1) {
      setTimeout(() => sendChatMessage(prompt, retryCount + 1), 1000);
    }
  }
}

// Event Listeners
chatForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const message = userInput.value.trim();
  if (message) {
    sendChatMessage(message);
  }
});

userInput.addEventListener('keydown', function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}));
  }
});

clearChatBtn.addEventListener('click', function() {
  chatOutput.innerHTML = sanitizeHTML('<p>Please select a chat persona and type your message below to begin the interaction.</p>');
  chatOutput.classList.add('empty');
  conversationHistory = [];
});

clearPromptHistoryBtn.addEventListener('click', function() {
  promptHistory = [];
  localStorage.removeItem('customPromptHistory');
  updatePromptHistory();
});

personaSelect.addEventListener('change', function() {
  if (this.value === 'custom') {
    customPromptContainer.style.display = 'block';
  } else {
    customPromptContainer.style.display = 'none';
  }
});

customPromptHistory.addEventListener('change', function() {
  if (this.value) {
    customPromptInput.value = this.value;
  }
});

// Initialize
populatePersonaDropdown();
