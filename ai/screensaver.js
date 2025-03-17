document.addEventListener("DOMContentLoaded", () => {
  const screensaverContainer = document.getElementById("screensaver-container");
  const toggleScreensaverButton = document.getElementById("toggle-screensaver");
  const fullscreenButton = document.getElementById("fullscreen-screensaver");
  const stopButton = document.getElementById("screensaver-exit");
  const playPauseButton = document.getElementById("screensaver-playpause");
  const saveButton = document.getElementById("screensaver-save");
  const copyButton = document.getElementById("screensaver-copy");
  const screensaverImage1 = document.getElementById("screensaver-image1");
  const screensaverImage2 = document.getElementById("screensaver-image2");

  const promptInput = document.getElementById("screensaver-prompt");
  const timerInput = document.getElementById("screensaver-timer");
  const aspectSelect = document.getElementById("screensaver-aspect");
  const enhanceCheckbox = document.getElementById("screensaver-enhance");
  const privateCheckbox = document.getElementById("screensaver-private");
  const modelSelect = document.getElementById("screensaver-model");
  const soundCheckbox = document.getElementById("screensaver-sound");
  const particlesCheckbox = document.getElementById("screensaver-particles-enabled");
  const transitionDurationInput = document.getElementById("screensaver-transition-duration");

  let screensaverActive = false;
  let imageInterval = null;
  let paused = false;
  let isFullscreen = false;
  let imageHistory = [];
  let currentImage = 'image1';
  let particles = [];
  let animationFrameId;

  // Settings object with new epic features
  let settings = {
    prompt: '',
    timer: 30,
    aspect: 'widescreen',
    model: 'flux',
    enhance: true,
    priv: true,
    sound: true,
    particlesEnabled: true,
    transitionDuration: 1
  };

  // Tooltips for better usability
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
  soundCheckbox.title = "Enable or disable sound effects.";
  particlesCheckbox.title = "Enable or disable particle effects.";
  transitionDurationInput.title = "Set the duration of image transitions in seconds.";

  // Browser detection for audio handling
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

  // Play audio with fallback for autoplay restrictions
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

  // Play sound effect if enabled
  function playSound(url) {
    if (settings.sound) {
      playAudio(url).catch(err => console.warn("Failed to play sound:", err));
    }
  }

  // Save settings to localStorage
  function saveScreensaverSettings() {
    localStorage.setItem("screensaverSettings", JSON.stringify(settings));
  }

  // Load settings from localStorage
  function loadScreensaverSettings() {
    const raw = localStorage.getItem("screensaverSettings");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        settings.prompt = s.prompt || '';
        settings.timer = s.timer || 30;
        settings.aspect = s.aspect || 'widescreen';
        settings.model = s.model || 'flux';
        settings.enhance = s.enhance !== undefined ? s.enhance : true;
        settings.priv = s.priv !== undefined ? s.priv : true;
        settings.sound = s.sound !== undefined ? s.sound : true;
        settings.particlesEnabled = s.particlesEnabled !== undefined ? s.particlesEnabled : true;
        settings.transitionDuration = s.transitionDuration || 1;

        promptInput.value = settings.prompt;
        timerInput.value = settings.timer;
        aspectSelect.value = settings.aspect;
        modelSelect.value = settings.model;
        enhanceCheckbox.checked = settings.enhance;
        privateCheckbox.checked = settings.priv;
        soundCheckbox.checked = settings.sound;
        particlesCheckbox.checked = settings.particlesEnabled;
        transitionDurationInput.value = settings.transitionDuration;
      } catch (err) {
        console.warn("Failed to parse screensaver settings:", err);
      }
    }
  }

  loadScreensaverSettings();

  // Generate a random seed
  function generateSeed() {
    return Math.floor(Math.random() * 1000000).toString();
  }

  // Get image dimensions based on aspect ratio
  function getDimensions(aspect) {
    switch (aspect) {
      case "widescreen": return { width: 1280, height: 720 };
      case "square": return { width: 1024, height: 1024 };
      case "portrait": return { width: 720, height: 1280 };
      default: return { width: 1280, height: 720 };
    }
  }

  // Fetch a new image with cross-fade
  function fetchNewImage() {
    saveScreensaverSettings();
    let prompt = settings.prompt || "random artistic scene, high quality, detailed";
    if (prompt.length > 100) prompt = prompt.substring(0, 100);
    prompt += ", high resolution, detailed";

    const { width, height } = getDimensions(settings.aspect);
    const seed = generateSeed();
    const model = settings.model || "flux";
    const enhance = settings.enhance;
    const priv = settings.priv;

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&private=${priv}&enhance=${enhance}&safe=false&nolog=true`;

    const nextImage = currentImage === 'image1' ? 'image2' : 'image1';
    const nextImgElement = document.getElementById(`screensaver-${nextImage}`);
    const currentImgElement = document.getElementById(`screensaver-${currentImage}`);

    nextImgElement.src = url;
    nextImgElement.onload = () => {
      currentImgElement.style.opacity = 0;
      nextImgElement.style.opacity = 1;
      currentImage = nextImage;
      playSound('sounds/transition.mp3');
      imageHistory.push(url);
      if (imageHistory.length > 10) imageHistory.shift();
      updateThumbnails();
    };
    nextImgElement.onerror = () => {
      nextImgElement.src = "https://via.placeholder.com/512?text=Image+Failed";
      currentImgElement.style.opacity = 0;
      nextImgElement.style.opacity = 1;
      currentImage = nextImage;
      imageHistory.push(nextImgElement.src);
      if (imageHistory.length > 10) imageHistory.shift();
      updateThumbnails();
    };
  }

  // Update thumbnails
  function updateThumbnails() {
    const thumbnailsContainer = document.getElementById('screensaver-thumbnails');
    thumbnailsContainer.innerHTML = '';
    const currentSrc = document.getElementById(`screensaver-${currentImage}`).src;
    imageHistory.forEach(url => {
      const thumb = document.createElement('img');
      thumb.src = url;
      if (url === currentSrc) thumb.classList.add('selected');
      thumb.addEventListener('click', () => {
        document.getElementById(`screensaver-${currentImage}`).style.opacity = 0;
        const nextImgElement = currentImage === 'image1' ? screensaverImage2 : screensaverImage1;
        nextImgElement.src = url;
        nextImgElement.style.opacity = 1;
        currentImage = currentImage === 'image1' ? 'image2' : 'image1';
        updateThumbnails();
      });
      thumbnailsContainer.appendChild(thumb);
    });
  }

  // Set or reset the image fetch interval
  function setOrResetInterval() {
    clearInterval(imageInterval);
    imageInterval = setInterval(() => {
      if (!paused && screensaverActive) fetchNewImage();
    }, settings.timer * 1000);
  }

  // Start the screensaver
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

    screensaverContainer.style.setProperty('--transition-duration', `${settings.transitionDuration}s`);

    fetchNewImage();
    setOrResetInterval();

    toggleScreensaverButton.textContent = "Stop Screensaver";
    playPauseButton.innerHTML = "⏸️";

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.style.overflow = "hidden";
    window.screensaverActive = true;

    if (settings.particlesEnabled) initParticles();

    playSound('sounds/start.mp3');
  }

  // Stop the screensaver
  function stopScreensaver() {
    screensaverActive = false;
    paused = false;
    screensaverContainer.classList.add("hidden");
    clearInterval(imageInterval);
    stopParticles();

    document.body.style.overflow = "";
    window.screensaverActive = false;

    toggleScreensaverButton.textContent = "Start Screensaver";
    playPauseButton.innerHTML = "▶️";

    if (isFullscreen) {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
        fullscreenButton.textContent = "Go Fullscreen";
      });
    }
  }

  // Toggle pause/resume
  function togglePause() {
    paused = !paused;
    playPauseButton.innerHTML = paused ? "▶️" : "⏸️";
    window.showToast(paused ? "Screensaver paused" : "Screensaver resumed");
  }

  // Save the current image
  function saveImage() {
    if (!document.getElementById(`screensaver-${currentImage}`).src) {
      window.showToast("No image to save");
      return;
    }
    fetch(document.getElementById(`screensaver-${currentImage}`).src, { mode: "cors" })
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

  // Copy the current image to clipboard
  function copyImage() {
    const currentImg = document.getElementById(`screensaver-${currentImage}`);
    if (!currentImg.src) {
      window.showToast("No image to copy");
      return;
    }
    if (!currentImg.complete || currentImg.naturalWidth === 0) {
      window.showToast("Image not fully loaded yet. Please try again.");
      return;
    }
    copyButton.textContent = "Copying...";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = currentImg.naturalWidth;
    canvas.height = currentImg.naturalHeight;
    ctx.drawImage(currentImg, 0, 0);
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

  // Toggle fullscreen mode
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
        })
        .catch(err => window.showToast("Failed to enter fullscreen"));
    } else {
      document.exitFullscreen()
        .then(() => {
          isFullscreen = false;
          fullscreenButton.textContent = "Go Fullscreen";
        })
        .catch(err => window.showToast("Failed to exit fullscreen"));
    }
  }

  // Particle class for visual flair
  class Particle {
    constructor() {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() * window.innerHeight;
      this.size = Math.random() * 5 + 1;
      this.speedX = Math.random() * 3 - 1.5;
      this.speedY = Math.random() * 3 - 1.5;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x > window.innerWidth) this.x = 0;
      if (this.x < 0) this.x = window.innerWidth;
      if (this.y > window.innerHeight) this.y = 0;
      if (this.y < 0) this.y = window.innerHeight;
    }
    draw(ctx) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize particle animation
  function initParticles() {
    const canvas = document.getElementById('screensaver-particles');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
  }

  // Stop particle animation
  function stopParticles() {
    cancelAnimationFrame(animationFrameId);
    const canvas = document.getElementById('screensaver-particles');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Event listeners for settings
  promptInput.addEventListener('input', () => {
    settings.prompt = promptInput.value;
    saveScreensaverSettings();
  });

  timerInput.addEventListener('change', () => {
    settings.timer = parseInt(timerInput.value) || 30;
    saveScreensaverSettings();
    if (screensaverActive) setOrResetInterval();
  });

  aspectSelect.addEventListener('change', () => {
    settings.aspect = aspectSelect.value;
    saveScreensaverSettings();
  });

  modelSelect.addEventListener('change', () => {
    settings.model = modelSelect.value;
    saveScreensaverSettings();
  });

  enhanceCheckbox.addEventListener('change', () => {
    settings.enhance = enhanceCheckbox.checked;
    saveScreensaverSettings();
  });

  privateCheckbox.addEventListener('change', () => {
    settings.priv = privateCheckbox.checked;
    saveScreensaverSettings();
  });

  soundCheckbox.addEventListener('change', () => {
    settings.sound = soundCheckbox.checked;
    saveScreensaverSettings();
  });

  particlesCheckbox.addEventListener('change', () => {
    settings.particlesEnabled = particlesCheckbox.checked;
    saveScreensaverSettings();
    if (screensaverActive) {
      if (settings.particlesEnabled) initParticles();
      else stopParticles();
    }
  });

  transitionDurationInput.addEventListener('change', () => {
    settings.transitionDuration = parseFloat(transitionDurationInput.value) || 1;
    saveScreensaverSettings();
    screensaverContainer.style.setProperty('--transition-duration', `${settings.transitionDuration}s`);
  });

  // Button event listeners with sound effects
  toggleScreensaverButton.addEventListener("click", () => {
    playSound('sounds/click.mp3');
    screensaverActive ? stopScreensaver() : startScreensaver();
  });

  fullscreenButton.addEventListener("click", (e) => {
    e.stopPropagation();
    playSound('sounds/click.mp3');
    toggleFullscreen();
  });

  stopButton.addEventListener("click", (e) => {
    e.stopPropagation();
    playSound('sounds/click.mp3');
    stopScreensaver();
  });

  playPauseButton.addEventListener("click", (e) => {
    e.stopPropagation();
    playSound('sounds/click.mp3');
    if (screensaverActive) togglePause();
    else window.showToast("Start the screensaver first!");
  });

  saveButton.addEventListener("click", (e) => {
    e.stopPropagation();
    playSound('sounds/click.mp3');
    if (screensaverActive) saveImage();
    else window.showToast("Start the screensaver first!");
  });

  copyButton.addEventListener("click", (e) => {
    e.stopPropagation();
    playSound('sounds/click.mp3');
    if (screensaverActive) copyImage();
    else window.showToast("Start the screensaver first!");
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!screensaverActive) return;
    switch (e.key) {
      case 'p': togglePause(); break;
      case 's': saveImage(); break;
      case 'c': copyImage(); break;
      case 'f': toggleFullscreen(); break;
      case 'Escape': stopScreensaver(); break;
    }
  });

  // Toast notification
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

  console.log("Screensaver initialized with epic enhancements!");
});