// screensaver.js

/* ===============================
   Global Variables
=============================== */
let screensaverInterval = null;
let screensaverActive = false;
const SCREENSAVER_MIN_INTERVAL = 5; // minimum 5 seconds
let lastScreensaverUpdate = 0;
let touchStartY = 0;

/* ===============================
   Screensaver Config
=============================== */
const SCREENSAVER_CONFIG = {
  models: {
    unity: {
      name: 'unity',
      displayName: 'Unity (Default)',
      defaultPrompt: 'artistic scene, unity style, highly detailed, 8k uhd',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Best for artistic and creative scenes',
      enhanceDefault: true
    },
    flux: {
      name: 'flux',
      displayName: 'Flux',
      defaultPrompt: 'photorealistic scene, highly detailed, professional photography',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Excellent for photorealistic images',
      enhanceDefault: true
    },
    'flux-realism': {
      name: 'flux-realism',
      displayName: 'Flux Realism',
      defaultPrompt: 'hyperrealistic photograph, ultra detailed, professional quality',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Specialized in hyperrealistic imagery',
      enhanceDefault: true
    },
    'flux-cablyai': {
      name: 'flux-cablyai',
      displayName: 'Flux CablyAI',
      defaultPrompt: 'vibrant digital art, detailed illustration, modern style',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Optimized for digital art and illustrations',
      enhanceDefault: true
    },
    'flux-anime': {
      name: 'flux-anime',
      displayName: 'Flux Anime',
      defaultPrompt: 'anime style artwork, detailed, vibrant colors',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Specialized in anime and manga style',
      enhanceDefault: true
    },
    'flux-3d': {
      name: 'flux-3d',
      displayName: 'Flux 3D',
      defaultPrompt: '3d rendered scene, high quality, detailed textures',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Best for 3D-style renderings',
      enhanceDefault: true
    },
    'any-dark': {
      name: 'any-dark',
      displayName: 'Any Dark',
      defaultPrompt: 'dark themed artwork, moody atmosphere, detailed shadows',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Specialized in dark and moody themes',
      enhanceDefault: true
    },
    'any-nightly': {
      name: 'any-nightly',
      displayName: 'Any Nightly',
      defaultPrompt: 'nighttime scene, atmospheric lighting, detailed',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Optimized for night scenes',
      enhanceDefault: true
    },
    'flux-pro': {
      name: 'flux-pro',
      displayName: 'Flux Pro',
      defaultPrompt: 'professional grade artwork, ultra detailed, masterful composition',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Premium quality for professional use',
      enhanceDefault: true
    },
    turbo: {
      name: 'turbo',
      displayName: 'Turbo',
      defaultPrompt: 'fast-rendered detailed scene, quality artwork',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Quick generation with good quality',
      enhanceDefault: false
    },
    lcm: {
      name: 'lcm',
      displayName: 'LCM',
      defaultPrompt: 'artistic composition, balanced detail, quality rendering',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'Balanced performance and quality',
      enhanceDefault: true
    },
    sdxl: {
      name: 'sdxl',
      displayName: 'SDXL',
      defaultPrompt: 'high resolution artwork, exceptional detail, professional quality',
      dimensions: { width: 1920, height: 1080 },
      capabilities: 'High-resolution detailed images',
      enhanceDefault: true
    }
  },
  aspectRatios: {
    widescreen: { width: 1920, height: 1080 },
    square: { width: 1024, height: 1024 },
    portrait: { width: 1080, height: 1920 },
    ultrawide: { width: 2560, height: 1080 }
  },
  intervals: {
    min: 5,
    default: 30,
    max: 3600
  },
  imageSettings: {
    defaults: {
      nologo: true,
      enhance: true,
      private: true,
      seed: () => Math.floor(Math.random() * 1000000)
    }
  }
};

/* ===============================
   Basic State Validation
=============================== */
function validateState(state) {
  const requiredFields = ['prompt', 'interval', 'model', 'aspect', 'enhance', 'private'];
  return (
    state &&
    typeof state === 'object' &&
    requiredFields.every(field => field in state) &&
    typeof state.timestamp === 'number' &&
    Date.now() - state.timestamp < 24 * 60 * 60 * 1000 // State not older than 24 hours
  );
}

/* ===============================
   Save / Restore Screensaver State
=============================== */
function saveScreensaverState() {
  const state = {
    active: screensaverActive,
    prompt: document.getElementById('screensaver-prompt')?.value || 'random artistic scene, high quality, detailed',
    interval: document.getElementById('screensaver-interval')?.value || '30',
    lastUpdate: lastScreensaverUpdate,
    model: document.getElementById('screensaver-model')?.value || 'unity',
    aspect: document.getElementById('screensaver-aspect')?.value || 'widescreen',
    enhance: document.getElementById('screensaver-enhance')?.checked || true,
    private: document.getElementById('screensaver-private')?.checked || true,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('screensaver-state', JSON.stringify(state));
    sessionStorage.setItem('screensaver-state', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving screensaver state:', error);
    try {
      sessionStorage.setItem('screensaver-state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to sessionStorage:', e);
    }
  }
}
async function restoreScreensaverState() {
  try {
    let savedState = localStorage.getItem('screensaver-state') || 
                     sessionStorage.getItem('screensaver-state');
    
    if (savedState) {
      const state = JSON.parse(savedState);
      
      if (!validateState(state)) {
        throw new Error('Invalid or expired state');
      }

      const elements = {
        'screensaver-prompt': state.prompt || 'random artistic scene, high quality, detailed',
        'screensaver-interval': state.interval || '30',
        'screensaver-model': state.model || 'unity',
        'screensaver-aspect': state.aspect || 'widescreen',
        'screensaver-enhance': state.enhance,
        'screensaver-private': state.private
      };

      Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          if (element.type === 'checkbox') {
            element.checked = value;
          } else {
            element.value = value;
          }
        }
      });

      lastScreensaverUpdate = state.lastUpdate || 0;

      if (state.active && 
          document.getElementById('chat-box').children.length === 0 && 
          navigator.onLine && 
          document.visibilityState === 'visible') {
        await startScreensaver();
      }

      saveScreensaverState();
    }
  } catch (error) {
    console.error('Error restoring screensaver state:', error);
    localStorage.removeItem('screensaver-state');
    sessionStorage.removeItem('screensaver-state');
  }
}

/* ===============================
   Save / Load Screensaver Settings
=============================== */
function saveScreensaverSettings() {
  const settings = {
    prompt: document.getElementById('screensaver-prompt')?.value || 'random artistic scene, high quality, detailed',
    interval: document.getElementById('screensaver-interval')?.value || '30',
    aspect: document.getElementById('screensaver-aspect')?.value || 'widescreen',
    model: document.getElementById('screensaver-model')?.value || 'unity',
    enhance: document.getElementById('screensaver-enhance')?.checked,
    private: document.getElementById('screensaver-private')?.checked,
    active: screensaverActive
  };
  localStorage.setItem('screensaver-settings', JSON.stringify(settings));
}

function loadScreensaverSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem('screensaver-settings'));
    if (settings) {
      document.getElementById('screensaver-prompt').value = settings.prompt || 'random artistic scene, high quality, detailed';
      document.getElementById('screensaver-interval').value = settings.interval || '30';
      document.getElementById('screensaver-aspect').value = settings.aspect || 'widescreen';
      document.getElementById('screensaver-model').value = settings.model || 'unity';
      document.getElementById('screensaver-enhance').checked = settings.enhance !== false;
      document.getElementById('screensaver-private').checked = settings.private !== false;

      if (settings.active) {
        startScreensaver();
      }
    }
  } catch (error) {
    console.error('Error loading screensaver settings:', error);
  }
}

/* ===============================
   Utility & Error Handling
=============================== */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-popup';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.classList.add('show');
    setTimeout(() => {
      errorDiv.classList.remove('show');
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  }, 100);
}

/* ===============================
   Image Copy & Download Functions
=============================== */
async function copyImageToClipboard() {
  try {
    const img = document.getElementById('screensaver-image');
    if (!img || !img.src) {
      showError('No image to copy');
      return;
    }
    
    // Fetch the image and create a clipboard item
    const response = await fetch(img.src);
    const blob = await response.blob();
    const data = [new ClipboardItem({ [blob.type]: blob })];
    await navigator.clipboard.write(data);
    
    // Show success feedback
    const feedback = document.createElement('div');
    feedback.className = 'image-upload-feedback';
    feedback.textContent = 'Image copied to clipboard! ✓';
    img.parentElement.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  } catch (error) {
    console.error('Failed to copy image:', error);
    showError('Failed to copy image to clipboard');
  }
}

async function downloadScreensaverImage() {
  try {
    const img = document.getElementById('screensaver-image');
    if (!img || !img.src) {
      showError('No image to download');
      return;
    }

    // Fetch image and create download link
    const response = await fetch(img.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screensaver-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // Show feedback
    const feedback = document.createElement('div');
    feedback.className = 'image-upload-feedback';
    feedback.textContent = 'Image download started ✓';
    img.parentElement.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  } catch (error) {
    console.error('Failed to download image:', error);
    showError('Failed to download image');
  }
}

/* ===============================
   Screensaver Logic
=============================== */
function buildScreensaverImageUrl(prompt) {
  if (!prompt) return '';
  
  const aspectSelect = document.getElementById('screensaver-aspect');
  const modelSelect = document.getElementById('screensaver-model');
  const enhanceCheck = document.getElementById('screensaver-enhance');
  const privateCheck = document.getElementById('screensaver-private');
  
  const aspectRatios = SCREENSAVER_CONFIG.aspectRatios;
  const selectedAspect = aspectRatios[aspectSelect.value] || aspectRatios.widescreen;

  const params = new URLSearchParams({
    width: selectedAspect.width.toString(),
    height: selectedAspect.height.toString(),
    seed: Math.floor(Math.random() * 1000000).toString(),
    nologo: 'true',
    model: modelSelect.value || 'unity',
    enhance: enhanceCheck.checked.toString(),
    private: privateCheck.checked.toString()
  });

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

function updateScreensaverImage() {
  if (!screensaverActive) return;
  
  const now = Date.now();
  if (now - lastScreensaverUpdate < SCREENSAVER_MIN_INTERVAL * 1000) return;
  
  const promptInput = document.getElementById('screensaver-prompt');
  const screensaverImg = document.getElementById('screensaver-image');
  const container = document.getElementById('screensaver-container');
  
  if (!promptInput || !screensaverImg || !container) {
    console.error('Required screensaver elements not found');
    return;
  }

  const prompt = promptInput.value.trim() || 'random artistic scene, high quality, detailed';
  const imageUrl = buildScreensaverImageUrl(prompt);
  if (!imageUrl) return;

  screensaverImg.style.opacity = '0.5';
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'screensaver-loading';
  loadingIndicator.textContent = '🔄';
  container.appendChild(loadingIndicator);

  // Create new image for loading
  const tempImage = new Image();
  tempImage.crossOrigin = 'anonymous';
  tempImage.onload = () => {
    screensaverImg.src = imageUrl;
    lastScreensaverUpdate = now;
    screensaverImg.style.opacity = '1';
    loadingIndicator.remove();
  };
  
  tempImage.onerror = (error) => {
    console.error('Failed to load screensaver image:', error);
    loadingIndicator.remove();
    screensaverImg.style.opacity = '1';
    showError('Failed to load screensaver image');
  };
  
  tempImage.src = imageUrl;
}

function startScreensaver() {
  const container = document.getElementById('screensaver-container');
  const toggle = document.getElementById('screensaver-toggle');
  const intervalInput = document.getElementById('screensaver-interval');
  
  screensaverActive = true;
  container.style.display = 'block';
  if (toggle) toggle.classList.add('active');

  // Ensure settings panel is visible when starting screensaver
  const settingsPanel = document.getElementById('my-settings-panel');
  if (settingsPanel) {
    settingsPanel.style.display = 'flex';
  }

  // Cancel any TTS
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  updateScreensaverImage();
  const interval = Math.max(SCREENSAVER_MIN_INTERVAL, parseInt(intervalInput.value, 10)) * 1000;
  screensaverInterval = setInterval(updateScreensaverImage, interval);
  
  saveScreensaverSettings();
  saveScreensaverState();
}

function stopScreensaver() {
  const container = document.getElementById('screensaver-container');
  const toggle = document.getElementById('screensaver-toggle');
  
  if (screensaverInterval) {
    clearInterval(screensaverInterval);
    screensaverInterval = null;
  }
  
  const image = document.getElementById('screensaver-image');
  if (image) {
    image.src = '';
  }
  
  screensaverActive = false;
  lastScreensaverUpdate = 0;
  
  container.style.display = 'none';
  if (toggle) toggle.classList.remove('active');
  
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => {
      console.warn('Error exiting fullscreen:', err);
    });
  }
  
  const loadingIndicator = container.querySelector('.screensaver-loading');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
  
  saveScreensaverSettings();
  saveScreensaverState();
}

function toggleScreensaver() {
  if (screensaverActive) {
    stopScreensaver();
  } else {
    startScreensaver();
  }
}

/* ===============================
   Touch Handling (Mobile)
=============================== */
function handleTouchMove(e) {
  if (!screensaverActive) return;
  
  const touchEndY = e.touches[0].clientY;
  const diff = touchStartY - touchEndY;
  
  if (Math.abs(diff) > 100) {
    stopScreensaver();
    e.preventDefault();
  }
}

function handleTouchStart(e) {
  touchStartY = e.touches[0].clientY;
}

/* ===============================
   Settings Panel Toggle
=============================== */
function toggleSettingsPanel() {
  const settingsPanel = document.getElementById('my-settings-panel');
  const promptInput = document.getElementById('screensaver-prompt');
  
  if (settingsPanel && (!promptInput || document.activeElement !== promptInput)) {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'flex' : 'none';
  }
}

/* ===============================
   Initialize & Event Listeners
=============================== */
function initializeScreensaver() {
  loadScreensaverSettings();
  restoreScreensaverState();

  const controls = document.querySelectorAll('.screensaver-control-group input, .screensaver-control-group select');
  controls.forEach(control => {
    control.addEventListener('change', () => {
      saveScreensaverSettings();
      if (screensaverActive) {
        updateScreensaverImage();
      }
    });
  });

  const container = document.getElementById('screensaver-container');
  if (container) {
    container.addEventListener('dblclick', () => {
      if (screensaverActive) stopScreensaver();
    });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (screensaverActive && e.key === 'Escape') {
      stopScreensaver();
    }
    
    if (screensaverActive && (e.key === 'h' || e.key === 'H')) {
      const promptInput = document.getElementById('screensaver-prompt');
      if (!promptInput || document.activeElement !== promptInput) {
        e.preventDefault();
        toggleSettingsPanel();
      }
    }
  });

  const toggle = document.getElementById('screensaver-toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleScreensaver);
  }

  const exitBtn = document.getElementById('screensaver-exit');
  if (exitBtn) {
    exitBtn.addEventListener('click', stopScreensaver);
  }

  const refreshBtn = document.getElementById('screensaver-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', updateScreensaverImage);
  }

  const copyBtn = document.getElementById('screensaver-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyImageToClipboard);
  }

  const downloadBtn = document.getElementById('screensaver-download');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadScreensaverImage);
  }

  window.addEventListener('unload', () => {
    if (screensaverActive) {
      saveScreensaverSettings();
      saveScreensaverState();
    }
  });
}

/* ===============================
   Expose Public Methods
=============================== */
window.screensaver = {
  start: startScreensaver,
  stop: stopScreensaver,
  toggle: toggleScreensaver,
  update: updateScreensaverImage,
  initialize: initializeScreensaver
};