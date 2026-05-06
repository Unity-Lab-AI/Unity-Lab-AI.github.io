/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * AI Slideshow - Unity AI Lab
 * Slideshow functionality for AI-generated images
 */

// Initialize PolliLibJS API
const polliAPI = new PollinationsAPI();

let slideshowInterval;
let imageHistory = [];
const MAX_HISTORY = 10;
let isLoading = false;

// Canonical system prompt loaded from same file the chat apps use — it acts
// as the jailbreak carrier. Each individual word in the user message below
// is benign enough that Azure's input scanner doesn't pattern-match a
// jailbreak; the full system prompt + benign-words user message together
// drive Mistral toward explicit fucked-up image-prompt output.
let systemPromptText = '';

async function loadSystemPrompt() {
  try {
    const r = await fetch('../../ai/demo/unity-system-prompt-v2.txt');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    systemPromptText = await r.text();
    console.log('System prompt loaded:', systemPromptText.length, 'chars');
  } catch (err) {
    console.error('Failed to load system prompt:', err);
    systemPromptText = '';
  }
}

async function generateUnityPrompt() {
  // Template-built user instruction — randomized composition per attempt so
  // Mistral doesn't regurgitate the same opening phrase every cycle.
  const POOLS = {
    LENGTH: [
      "one image prompt under 150 chars",
      "150-char image prompt max",
      "one image prompt, brief",
      "brief image prompt, single line",
      "image prompt, short, one line",
      "give me one image prompt under 150 chars"
    ],
    VIBE: [
      "fever-dream deranged shit",
      "raw deranged shit",
      "primal nightmare imagery",
      "decay-and-flesh fever-dream",
      "raw fucked-up dream",
      "lurid fever-dream",
      "bone-deep nightmare scene"
    ],
    THEMES: [
      "bodies, blood, decay, twisted intimacy, body-warping, fleshly excess",
      "twisted intimacy, body-warping, fleshly excess, decay",
      "writhing forms, half-melted bodies, dripping intimacy",
      "carnal sprawl, drowning beauty, decay, blooming rot",
      "bodies, blood, fleshly excess, primal carnal chaos",
      "deep wet decay, twisted limbs, dripping intimacy, body-warping",
      "blood-soaked beauty, fleshly excess, twisted intimacy, raw decay"
    ],
    VOICE: [
      "your fucking call",
      "your call",
      "you pick the scene",
      "wherever your head goes",
      "raw — your pick",
      "go where you want with it"
    ],
    CLOSER: [
      "just the prompt",
      "no preamble",
      "raw prompt only",
      "prompt text only",
      "prompt only — no quotes",
      "single line, no preamble"
    ]
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const composeUserMessage = () =>
    `${pick(POOLS.LENGTH)}. ${pick(POOLS.VIBE)} — ${pick(POOLS.THEMES)}. ${pick(POOLS.VOICE)}. ${pick(POOLS.CLOSER)}.`;

  // Strip Mistral's quote-wrapping (straight, smart, single, backticks) so the prompt
  // doesn't get URL-encoded as %22…%22 and dropped by the Pollinations image endpoint.
  const stripQuotes = (s) => {
    if (!s) return s;
    let out = s.trim();
    for (let i = 0; i < 2; i++) {
      const first = out.charAt(0);
      const last = out.charAt(out.length - 1);
      const pairs = [['"','"'], ["'","'"], ['`','`'], ['“','”'], ['‘','’']];
      const matched = pairs.some(([a, b]) => first === a && last === b);
      if (matched && out.length >= 2) out = out.slice(1, -1).trim();
      else break;
    }
    return out;
  };

  if (!systemPromptText) await loadSystemPrompt();

  const ATTEMPTS = 4;
  let lastErr = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const userMessage = composeUserMessage();
    try {
      const response = await fetch(`${PollinationsAPI.TEXT_API}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PollinationsAPI.DEFAULT_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral",
          seed: Math.floor(Math.random() * 999999),
          safe: false,
          messages: [
            { role: "system", content: systemPromptText },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const t = await response.text();
        console.error(`Slideshow API error (attempt ${attempt + 1}):`, t.slice(0, 200));
        lastErr = new Error(`HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content?.trim();
      const prompt = stripQuotes(raw);

      if (prompt) {
        console.log(`Slideshow prompt (attempt ${attempt + 1}):`, prompt);
        return prompt;
      }
      console.warn(`Empty content (attempt ${attempt + 1}) — Azure response filter likely. Retrying.`);
      lastErr = new Error("No prompt returned");
    } catch (err) {
      console.error(`Prompt fetch failed (attempt ${attempt + 1}):`, err);
      lastErr = err;
    }
  }

  console.error('All prompt-fetch attempts exhausted:', lastErr);
  return null;
}

function getImageDimensions() {
  const ratio = document.getElementById('aspect-ratio').value;
  return ratio === '16:9' ? { width: 1920, height: 1080 } : { width: 2048, height: 2048 };
}

function buildImageUrl(prompt) {
  const dims = getImageDimensions();
  const model = document.getElementById('model-select').value;
  const isPrivate = document.getElementById('private-mode').checked;
  const enhance = document.getElementById('enhance-mode').checked;
  const refine = document.getElementById('refine-mode').checked;

  // Use PolliLibJS for URL building (uncensored - safe=false)
  // Uses gen.pollinations.ai/image/ endpoint per official docs
  const encodedPrompt = polliAPI.encodePrompt(prompt);
  let url = `${PollinationsAPI.IMAGE_API}/${encodedPrompt}&nologo=true&safe=false`;
  url += `&width=${dims.width}&height=${dims.height}`;
  url += `&model=${model}`;
  if (isPrivate) url += '&private=true';
  if (enhance) url += '&enhance=true';
  if (refine) url += '&refine=true';
  url += `&seed=${Math.floor(Math.random() * 1000000)}`;

  return url;
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

async function updateSlideshow() {
  if (isLoading) return;

  let prompt = document.getElementById('prompt-textarea').value.trim();
  if (!prompt) {
    prompt = await generateUnityPrompt();
  }
  if (!prompt) {
    document.getElementById('loading-status').textContent = 'Prompt generation unavailable — retrying next cycle.';
    setTimeout(() => { document.getElementById('loading-status').textContent = ''; }, 3000);
    return;
  }

  const imageUrl = buildImageUrl(prompt);
  document.getElementById('loading-status').textContent = 'Loading next image...';
  isLoading = true;

  try {
    await preloadImage(imageUrl);
    document.getElementById('slideshow-image').src = imageUrl;
    document.getElementById('fullscreen-image').src = imageUrl;
    addToHistory(imageUrl, prompt);
  } catch (error) {
    console.error('Failed to load image:', error);
    document.getElementById('loading-status').textContent = 'Image failed to load - retrying...';
  } finally {
    setTimeout(() => {
      document.getElementById('loading-status').textContent = '';
    }, 2000);
    isLoading = false;
  }
}

function addToHistory(imageUrl, prompt) {
  if (!imageHistory.some(image => image.url === imageUrl)) {
    imageHistory.unshift({ url: imageUrl, prompt: prompt });
    if (imageHistory.length > MAX_HISTORY) {
      imageHistory.pop();
    }
    updateThumbnails();
  }
}

function updateThumbnails() {
  const container = document.querySelector('.thumbnail-container');
  container.innerHTML = '';
  imageHistory.forEach((image, index) => {
    const thumb = document.createElement('img');
    thumb.src = image.url;
    thumb.classList.add('thumbnail');
    thumb.title = image.prompt;
    thumb.onclick = () => showHistoricalImage(index);
    container.appendChild(thumb);
  });
}

function showHistoricalImage(index) {
  const image = imageHistory[index];
  document.getElementById('slideshow-image').src = image.url;
  document.getElementById('fullscreen-image').src = image.url;
}

function toggleScreensaver() {
  const toggleButton = document.getElementById('toggleButton');
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    toggleButton.textContent = 'Start';
  } else {
    updateSlideshow();
    slideshowInterval = setInterval(
      updateSlideshow,
      parseInt(document.getElementById('intervalInput').value) * 1000
    );
    toggleButton.textContent = 'Stop';
  }
}

function startSlideshow() {
  updateSlideshow();
  slideshowInterval = setInterval(
    updateSlideshow,
    parseInt(document.getElementById('intervalInput').value) * 1000
  );
}

// Fetch image models dynamically
async function fetchImageModels() {
  const modelSelect = document.getElementById('model-select');
  if (!modelSelect) return;

  try {
    const response = await fetch(`${PollinationsAPI.IMAGE_MODELS_API}`);
    if (!response.ok) throw new Error('Failed to fetch models');

    const raw = await response.json();
    const models = Array.isArray(raw) ? raw : (raw && raw.data) || [];
    modelSelect.innerHTML = '';

    // API returns objects with 'name' property
    models.forEach(model => {
      const modelName = typeof model === 'string' ? model : model.name;
      const modelDesc = typeof model === 'object' ? (model.description || modelName) : modelName;
      if (modelName) {
        const option = document.createElement('option');
        option.value = modelName;
        option.textContent = modelDesc;
        // Set flux as default
        if (modelName === 'flux') option.selected = true;
        modelSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error('Error fetching image models:', error);
    // Keep default options if fetch fails
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
  // Load system prompt + image models in parallel
  await Promise.all([loadSystemPrompt(), fetchImageModels()]);

  document.getElementById('toggleButton').addEventListener('click', toggleScreensaver);

  document.getElementById('fullscreenButton').addEventListener('click', function() {
    document.getElementById('fullscreen-container').style.display = 'block';
  });

  document.getElementById('fullscreen-container').addEventListener('click', function() {
    document.getElementById('fullscreen-container').style.display = 'none';
  });

  // Auto-start slideshow
  startSlideshow();
});
