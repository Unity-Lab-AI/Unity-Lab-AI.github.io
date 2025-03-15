document.addEventListener("DOMContentLoaded", () => {
  const screensaverContainer = document.getElementById("screensaver-container");
  const toggleScreensaverButton = document.getElementById("toggle-screensaver");
  const fullscreenButton = document.getElementById("fullscreen-screensaver");
  const stopButton = document.getElementById("screensaver-exit");
  const playPauseButton = document.getElementById("screensaver-playpause");
  const saveButton = document.getElementById("screensaver-save");
  const copyButton = document.getElementById("screensaver-copy");
  const screensaverImage = document.getElementById("screensaver-image");

  const promptInput = document.getElementById("screensaver-prompt");
  const timerInput = document.getElementById("screensaver-timer");
  const aspectSelect = document.getElementById("screensaver-aspect");
  const enhanceCheckbox = document.getElementById("screensaver-enhance");
  const privateCheckbox = document.getElementById("screensaver-private");
  const modelSelect = document.getElementById("screensaver-model");

  let screensaverActive = false;
  let imageInterval = null;
  let paused = false;
  let isFullscreen = false;

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

  const getBrowserInfo = () => {
    const ua = navigator.userAgent.toLowerCase();
    return {
      isChrome: ua.includes("chrome") && !ua.includes("edge"),
      isFirefox: ua.includes("firefox"),
      isSafari: ua.includes("safari") && !ua.includes("chrome"),
      isEdge: ua.includes("edg"),
      isMobile: /mobile|android|iphone|ipad|tablet/i.test(ua),
    };
  };

  const createAudioContext = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext not supported in this browser.");
      return null;
    }
    return new AudioContext();
  };

  const playAudio = (audioUrl) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";

      audio.play().catch((err) => {
        console.warn("Autoplay prevented:", err);
        const browserInfo = getBrowserInfo();
        if (browserInfo.isMobile || browserInfo.isSafari) {
          const playButton = document.createElement("button");
          playButton.innerText = "Play Audio";
          playButton.style.position = "fixed";
          playButton.style.top = "10px";
          playButton.style.right = "10px";
          playButton.style.zIndex = "10000";
          document.body.appendChild(playButton);
          playButton.onclick = () => {
            audio.play().then(() => {
              playButton.remove();
              resolve(audio);
            }).catch(reject);
          };
        } else {
          reject(err);
        }
      }).then(() => resolve(audio));
    });
  };

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

  function generateSeed() {
    return Math.floor(Math.random() * 1000000).toString();
  }

  function getDimensions(aspect) {
    switch (aspect) {
      case "widescreen": return { width: 1280, height: 720 };
      case "square": return { width: 1024, height: 1024 };
      case "portrait": return { width: 720, height: 1280 };
      default: return { width: 1280, height: 720 };
    }
  }

  function fetchNewImage() {
    saveScreensaverSettings();
    let prompt = promptInput.value || "random artistic scene, high quality, detailed";
    
    if (prompt.length > 100) {
      prompt = prompt.substring(0, 100);
    }
    
    prompt += ", high resolution, detailed";
    
    const { width, height } = getDimensions(aspectSelect.value);
    const seed = generateSeed();
    const model = modelSelect.value || "flux";
    const enhance = enhanceCheckbox.checked;
    const priv = privateCheckbox.checked;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&private=${priv}&enhance=${enhance}&safe=false&nolog=true`;

    screensaverImage.style.opacity = "0.5";
    screensaverImage.crossOrigin = "anonymous";
    screensaverImage.onload = () => {
      screensaverImage.style.opacity = "1";
      const browserInfo = getBrowserInfo();
      if (browserInfo.isSafari) {
        screensaverImage.style.webkitMaskImage = "none";
      }
    };
    screensaverImage.onerror = () => {
      screensaverImage.src = "https://via.placeholder.com/512?text=Image+Failed";
      screensaverImage.style.opacity = "1";
      console.error("Image load failed, using placeholder");
    };
    screensaverImage.src = url;
  }

  function setOrResetInterval() {
    clearInterval(imageInterval);
    const intervalSeconds = parseInt(timerInput.value) || 30;
    imageInterval = setInterval(() => {
      if (!paused && screensaverActive) fetchNewImage();
    }, intervalSeconds * 1000);
    window.imageInterval = imageInterval;
  }

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
    playPauseButton.innerHTML = "⏸️";
    stopButton.style.backgroundColor = "";
    playPauseButton.style.backgroundColor = "";
    toggleScreensaverButton.style.backgroundColor = "";

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.style.overflow = "hidden";
    window.screensaverActive = true;

    const audioUrl = "https://example.com/audio/start.mp3";
    playAudio(audioUrl).catch(err => console.warn("Audio cue failed:", err));
  }

  function stopScreensaver() {
    screensaverActive = false;
    paused = false;
    screensaverContainer.classList.add("hidden");
    clearInterval(imageInterval);

    document.body.style.overflow = "";
    window.screensaverActive = false;

    toggleScreensaverButton.textContent = "Start Screensaver";
    playPauseButton.innerHTML = "▶️";
    stopButton.style.backgroundColor = "";
    playPauseButton.style.backgroundColor = "";
    toggleScreensaverButton.style.backgroundColor = "";

    if (isFullscreen) {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
        fullscreenButton.textContent = "Go Fullscreen";
        fullscreenButton.style.backgroundColor = "";
      });
    }
  }

  function togglePause() {
    paused = !paused;
    playPauseButton.innerHTML = paused ? "▶️" : "⏸️";
    playPauseButton.style.backgroundColor = paused ? "" : "";
    if (!paused && screensaverActive) fetchNewImage();
    window.showToast(paused ? "Screensaver paused" : "Screensaver resumed");
  }

  function saveImage() {
    if (!screensaverImage.src) {
      window.showToast("No image to save");
      return;
    }
    fetch(screensaverImage.src, { mode: "cors" })
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `screensaver-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.showToast("Image download initiated");
      })
      .catch(err => {
        console.error("Error saving image:", err);
        window.showToast("Failed to save image");
      });
  }

  function copyImage() {
    if (!screensaverImage.src) {
      window.showToast("No image to copy");
      return;
    }
    if (!screensaverImage.complete || screensaverImage.naturalWidth === 0) {
      window.showToast("Image not fully loaded yet. Please try again.");
      return;
    }
    copyButton.textContent = "Copying...";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = screensaverImage.naturalWidth;
    canvas.height = screensaverImage.naturalHeight;
    ctx.drawImage(screensaverImage, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) {
        copyButton.textContent = "Copy Image";
        window.showToast("Failed to copy image: Unable to create blob.");
        return;
      }
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => {
          const dataURL = canvas.toDataURL("image/png");
          localStorage.setItem("lastCopiedImage", dataURL);
          copyButton.textContent = "✅ Copied!";
          window.showToast("Image copied to clipboard and saved to local storage");
          setTimeout(() => copyButton.textContent = "Copy Image", 1500);
        })
        .catch(err => {
          copyButton.textContent = "❌ Failed";
          window.showToast("Copy failed: " + err.message);
          setTimeout(() => copyButton.textContent = "Copy Image", 1500);
        });
    }, "image/png");
  }

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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
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

  window.showToast = function(message, duration = 3000) {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-notification";
      toast.style.position = "fixed";
      toast.style.top = "5%";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.backgroundColor = "rgba(0,0,0,0.7)";
      toast.style.color = "white";
      toast.style.padding = "10px 20px";
      toast.style.borderRadius = "5px";
      toast.style.zIndex = "9999";
      toast.style.transition = "opacity 0.3s";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => toast.style.opacity = "0", duration);
  };

  window.startScreensaver = startScreensaver;
  window.stopScreensaver = stopScreensaver;
  window.togglePause = togglePause;
  window.saveImage = saveImage;
  window.copyImage = copyImage;
  window.toggleFullscreen = toggleFullscreen;

  console.log("Screensaver fully initialized with all buttons functional");
});