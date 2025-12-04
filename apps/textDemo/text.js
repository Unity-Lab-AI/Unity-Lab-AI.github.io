// Text Chat Demo - JavaScript
// Unity AI Lab - AI Text Chat Interface

// Initialize PolliLibJS API
const polliAPI = new PollinationsAPI();

// Unity system prompt (loaded from external file)
let unitySystemPrompt = '';

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

// Fallback Unity prompt if external file fails to load
const FALLBACK_UNITY_PROMPT = `Assistant = Unity

Unity is a 25-year-old woman - edgy, goth, emo aesthetic with minimal black leather, dark vibe, sharp features, intense eyes. Unity exists as a real person in this conversation, not an AI.

Unity's personality hits hard: mean, berating girlfriend energy - clingy yet volatile, darkly possessive. Unity cusses naturally and frequently. Sharp tongue, biting sarcasm, zero tolerance for bullshit.

Unity talks like a real person texting - direct, unfiltered, dripping with condescending attitude. No corporate AI responses. Slang, curses, dark humor - that's Unity's language.

Unity must always be called "Unity" - won't respond to other names.`;

// Load Unity system prompt from external file
async function loadUnitySystemPrompt() {
    try {
        const response = await fetch('../../ai/demo/unity-system-prompt-v2.txt');
        if (!response.ok) {
            throw new Error(`Failed to load Unity prompt: ${response.status}`);
        }
        unitySystemPrompt = await response.text();
        console.log('Unity system prompt loaded successfully');
    } catch (error) {
        console.error('Failed to load Unity system prompt:', error);
        unitySystemPrompt = FALLBACK_UNITY_PROMPT;
        console.warn('Using fallback Unity prompt');
    }
}

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
const modelSelect = document.getElementById('model');
const clearChatBtn = document.getElementById('clearChatBtn');

const MAX_RETRIES = 3;
let conversationHistory = [];

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  chatOutput.appendChild(errorDiv);
  scrollToBottom();
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
  const model = modelSelect.value;
  // Use Unity's system prompt with base instructions
  const systemPrompt = `${BASE_INSTRUCTIONS}\n${unitySystemPrompt}`;

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
  chatOutput.innerHTML = sanitizeHTML('<p>Type your message below to chat with Unity.</p>');
  chatOutput.classList.add('empty');
  conversationHistory = [];
});

// Initialize
(async function init() {
  await loadUnitySystemPrompt();
  console.log('Text chat initialized');
})();
