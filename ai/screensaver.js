document.addEventListener("DOMContentLoaded", () => {
  // Screensaver Elements
  const screensaverContainer = document.getElementById("screensaver-container");
  const toggleScreensaverButton = document.getElementById("toggle-screensaver");
  const fullscreenButton = document.getElementById("fullscreen-screensaver");
  const stopButton = document.getElementById("screensaver-exit");
  const playPauseButton = document.getElementById("screensaver-playpause");
  const saveButton = document.getElementById("screensaver-save");
  const copyButton = document.getElementById("screensaver-copy");
  const screensaverImage = document.getElementById("screensaver-image");

  // Extended controls
  const promptInput = document.getElementById("screensaver-prompt");
  const timerInput = document.getElementById("screensaver-timer");
  const aspectSelect = document.getElementById("screensaver-aspect");
  const enhanceCheckbox = document.getElementById("screensaver-enhance");
  const privateCheckbox = document.getElementById("screensaver-private");
  const modelSelect = document.getElementById("screensaver-model");

  // Internal state
  let screensaverActive = false;
  let imageInterval = null;
  let paused = false;
  let isFullscreen = false;

  // ========== TOOLTIP SETUP ==========
  toggleScreensaverButton.title = "Toggle the screensaver on/off.";
  fullscreenButton.title = "Go full screen (or exit it).";
  stopButton.title = "Stop the screensaver.";
  playPauseButton.title = "Pause or resume the image rotation.";
  saveButton.title = "Save the current screensaver image.";
  copyButton.title = "Copy the current screensaver image to clipboard.";
  promptInput.title = "Prompt for the AI to create images from.";
  timerInput.title = "Interval between new images (in seconds).";
  aspectSelect.title = "Select the aspect ratio for the generated image.";
  modelSelect.title = "Choose the image-generation model.";
  enhanceCheckbox.title = "If enabled, the prompt is 'enhanced' via an LLM.";
  privateCheckbox.title = "If enabled, the image won't appear on the public feed.";

  // ========== LOCAL STORAGE HELPERS ==========
  function saveScreensaverSettings() {
    const settings = {
      prompt: promptInput.value,
      timer: timerInput.value,
      aspect: aspectSelect.value,
      model: modelSelect.value,
      enhance: enhanceCheckbox.checked,
      priv: privateCheckbox.checked
    };
    localStorage.setItem("screensaverSettings", JSON.stringify(settings));
  }

  function loadScreensaverSettings() {
    const raw = localStorage.getItem("screensaverSettings");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.prompt !== undefined) promptInput.value = s.prompt;
      if (s.timer !== undefined) timerInput.value = s.timer;
      if (s.aspect !== undefined) aspectSelect.value = s.aspect;
      if (s.model !== undefined) modelSelect.value = s.model;
      if (s.enhance !== undefined) enhanceCheckbox.checked = s.enhance;
      if (s.priv !== undefined) privateCheckbox.checked = s.priv;
    } catch (err) {
      console.warn("Failed to parse screensaver settings:", err);
    }
  }

  loadScreensaverSettings();

  // Generate a random seed for pollinations
  function generateSeed() {
    const length = Math.floor(Math.random() * 8) + 1;
    let seed = "";
    for (let i = 0; i < length; i++) {
      seed += Math.floor(Math.random() * 10);
    }
    return seed;
  }

  // Figure out width/height from the aspect ratio
  function getDimensions(aspect) {
    switch (aspect) {
      case "widescreen": return { width: 1280, height: 720 };
      case "square": return { width: 1024, height: 1024 };
      case "portrait": return { width: 720, height: 1280 };
      default: return { width: 1280, height: 720 };
    }
  }

  // Fetch a new image from pollinations
  function fetchNewImage() {
    saveScreensaverSettings();
    const prompt = promptInput.value || "random artistic scene, high quality, detailed";
    const { width, height } = getDimensions(aspectSelect.value);
    const seed = generateSeed();
    const model = modelSelect.value || "flux";
    const enhance = enhanceCheckbox.checked;
    const priv = privateCheckbox.checked;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&private=${priv}&enhance=${enhance}`;
    
    screensaverImage.style.opacity = "0.5";
    screensaverImage.onload = () => { screensaverImage.style.opacity = "1"; };
    screensaverImage.src = url;
  }

  // Set or reset the interval for fetching new images
  function setOrResetInterval() {
    clearInterval(imageInterval);
    const intervalSeconds = parseInt(timerInput.value) || 30;
    imageInterval = setInterval(() => {
      if (!paused && screensaverActive) fetchNewImage();
    }, intervalSeconds * 1000);
    window.imageInterval = imageInterval;
  }

  // Start screensaver
  function startScreensaver() {
    screensaverActive = true;
    paused = false;
    
    screensaverContainer.style.position = "fixed";
    screensaverContainer.style.top = "0";
    screensaverContainer.style.left = "0";
    screensaverContainer.style.width = "100vw";
    screensaverContainer.style.height = "100vh";
    screensaverContainer.style.zIndex = "9999";
    screensaverContainer.classList.remove("hidden");
    
    fetchNewImage();
    setOrResetInterval();
    
    toggleScreensaverButton.textContent = "Stop Screensaver";
    toggleScreensaverButton.style.backgroundColor = "";
    playPauseButton.innerHTML = "⏸️";
    playPauseButton.style.backgroundColor = "";
    stopButton.style.backgroundColor = "";
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.style.overflow = "hidden";
    window.screensaverActive = true;
  }

  // Stop screensaver
  function stopScreensaver() {
    screensaverActive = false;
    paused = false;
    screensaverContainer.classList.add("hidden");
    clearInterval(imageInterval);
    
    document.body.style.overflow = "";
    window.screensaverActive = false;
    
    toggleScreensaverButton.textContent = "Start Screensaver";
    toggleScreensaverButton.style.backgroundColor = "";
    playPauseButton.innerHTML = "▶️";
    playPauseButton.style.backgroundColor = "";
    stopButton.style.backgroundColor = "";
    if (isFullscreen) {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
        fullscreenButton.textContent = "Go Fullscreen";
        fullscreenButton.style.backgroundColor = "";
      });
    }
  }

  // Toggle pause
  function togglePause() {
    paused = !paused;
    playPauseButton.innerHTML = paused ? "▶️" : "⏸️";
    playPauseButton.style.backgroundColor = paused ? "" : "";
    if (!paused && screensaverActive) fetchNewImage();
    window.showToast(paused ? "Screensaver paused" : "Screensaver resumed");
  }

  // Save image to disk
  function saveImage() {
    if (!screensaverImage.src) {
      window.showToast("No image to save");
      return;
    }
    fetch(screensaverImage.src)
      .then(response => response.ok ? response.blob() : Promise.reject("Fetch failed"))
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "screensaver-image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        window.showToast("Image saved!");
      })
      .catch(err => {
        console.error("Error saving image:", err);
        window.showToast("Failed to save image");
      });
  }

  // Copy image to clipboard
  function copyImage() {
    if (!screensaverImage.src) {
      window.showToast("No image to copy");
      return;
    }
    copyButton.textContent = "Copying...";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (screensaverImage.complete && screensaverImage.naturalWidth > 0) {
      canvas.width = screensaverImage.naturalWidth;
      canvas.height = screensaverImage.naturalHeight;
      ctx.drawImage(screensaverImage, 0, 0);
      canvas.toBlob(blob => {
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
          .then(() => {
            copyButton.textContent = "✅ Copied!";
            window.showToast("Image copied!");
            setTimeout(() => copyButton.textContent = "Copy Image", 1500);
          })
          .catch(err => {
            copyButton.textContent = "❌ Failed";
            window.showToast("Copy failed");
            setTimeout(() => copyButton.textContent = "Copy Image", 1500);
          });
      }, "image/png", 1.0);
    } else {
      const tempImg = new Image();
      tempImg.crossOrigin = "anonymous";
      tempImg.onload = () => {
        canvas.width = tempImg.naturalWidth;
        canvas.height = tempImg.naturalHeight;
        ctx.drawImage(tempImg, 0, 0);
        canvas.toBlob(blob => {
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
            .then(() => {
              copyButton.textContent = "✅ Copied!";
              window.showToast("Image copied!");
              setTimeout(() => copyButton.textContent = "Copy Image", 1500);
            })
            .catch(() => {
              copyButton.textContent = "❌ Failed";
              window.showToast("Copy failed");
              setTimeout(() => copyButton.textContent = "Copy Image", 1500);
            });
        }, "image/png", 1.0);
      };
      tempImg.onerror = () => {
        copyButton.textContent = "❌ Failed";
        window.showToast("Failed to load image");
        setTimeout(() => copyButton.textContent = "Copy Image", 1500);
      };
      tempImg.src = screensaverImage.src;
    }
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    if (!screensaverActive) {
      window.showToast("Start the screensaver first!");
      return;
    }
    if (!isFullscreen) {
      screensaverContainer.requestFullscreen()
        .then(() => {
          isFullscreen = true;
          fullscreenButton.textContent = "Exit Fullscreen";
          fullscreenButton.style.backgroundColor = "";
        })
        .catch(err => window.showToast("Failed to enter fullscreen"));
    } else {
      document.exitFullscreen()
        .then(() => {
          isFullscreen = false;
          fullscreenButton.textContent = "Go Fullscreen";
          fullscreenButton.style.backgroundColor = "";
        })
        .catch(err => window.showToast("Failed to exit fullscreen"));
    }
  }

  // Event listeners
  toggleScreensaverButton.addEventListener("click", () => {
    screensaverActive ? stopScreensaver() : startScreensaver();
  });

  fullscreenButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  stopButton.addEventListener("click", (e) => {
    e.stopPropagation();
    stopScreensaver();
  });

  playPauseButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (screensaverActive) togglePause();
    else window.showToast("Start the screensaver first!");
  });

  saveButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (screensaverActive) saveImage();
    else window.showToast("Start the screensaver first!");
  });

  copyButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (screensaverActive) copyImage();
    else window.showToast("Start the screensaver first!");
  });

  timerInput.addEventListener("change", () => {
    if (screensaverActive) setOrResetInterval();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isFullscreen) {
        document.exitFullscreen().then(() => {
          isFullscreen = false;
          fullscreenButton.textContent = "Go Fullscreen";
          fullscreenButton.style.backgroundColor = "";
        });
      }
      if (screensaverActive) stopScreensaver();
    }
  });

  // Toast notification
  window.showToast = function(message, duration = 3000) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background-color:rgba(0,0,0,0.7);color:white;padding:10px 20px;border-radius:5px;z-index:9999;transition:opacity 0.3s;";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => toast.style.opacity = '0', duration);
  };

  // Global functions
  window.startScreensaver = startScreensaver;
  window.stopScreensaver = stopScreensaver;
  window.togglePause = togglePause;
  window.saveImage = saveImage;
  window.copyImage = copyImage;
  window.toggleFullscreen = toggleFullscreen;

  console.log("Screensaver fully initialized with all buttons functional");
});