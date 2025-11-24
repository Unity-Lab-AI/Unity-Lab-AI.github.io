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

// Unity's twisted prompts
const unityPrompts = [
  "a blood-soaked gothic cathedral under a crimson moon, dripping with despair",
  "a cyberpunk wasteland with neon skulls flickering in toxic rain",
  "a demonic ballerina twirling in a ring of fire, shadows eating the stage",
  "an endless void of shattered mirrors reflecting a screaming abyss",
  "a haunted forest where trees bleed black tar and whisper curses",
  "a dystopian cityscape of rusted spikes and glowing red eyes",
  "a skeletal rave in a graveyard, pulsing with ultraviolet chaos",
  "a cosmic slaughterhouse where stars are butchered into black holes",
  "a frozen hellscape with chained souls clawing at cracked ice",
  "a mechanical goddess tearing apart reality with jagged claws"
];

function getRandomUnityPrompt() {
  return unityPrompts[Math.floor(Math.random() * unityPrompts.length)];
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

  // Use PolliLibJS for URL building
  const encodedPrompt = polliAPI.encodePrompt(prompt);
  let url = `${PollinationsAPI.IMAGE_API}/prompt/${encodedPrompt}?nologo=true`;
  url += `&width=${dims.width}&height=${dims.height}`;
  url += `&model=${model}`;
  if (isPrivate) url += '&private=true';
  if (enhance) url += '&enhance=true';
  if (refine) url += '&refine=true';
  url += `&seed=${Math.floor(Math.random() * 1000000)}`;
  url += `&referrer=${encodeURIComponent(polliAPI.referrer)}`;

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
    prompt = getRandomUnityPrompt();
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
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
