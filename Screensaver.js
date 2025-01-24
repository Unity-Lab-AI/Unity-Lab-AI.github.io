(function () {
    /* ===============================
       Global Variables
    =============================== */
    let screensaverInterval = null;
    let screensaverActive = false;
    const SCREENSAVER_MIN_INTERVAL = 5; // minimum 5 seconds
    let lastScreensaverUpdate = 0;
    let touchStartY = 0;
    let controlsVisible = true;
    let slideshowPaused = false;

    /* ===============================
       Screensaver Config
    =============================== */
    window.SCREENSAVER_CONFIG = {
      models: {
        unity: {
          name: "unity",
          displayName: "Unity",
          tooltip: "Unity AI Model - Optimized for creative and varied outputs",
        },
        flux: {
          name: "flux",
          displayName: "Flux",
          tooltip: "Standard Flux model - Balanced quality and speed",
        },
        "flux-realism": {
          name: "flux-realism",
          displayName: "Realism",
          tooltip: "Enhanced photorealistic outputs with fine details",
        },
        "flux-cablyai": {
          name: "flux-cablyai",
          displayName: "CablyAI",
          tooltip: "Art-focused model with creative interpretations",
        },
        "flux-anime": {
          name: "flux-anime",
          displayName: "Anime",
          tooltip: "Specialized for anime and manga art styles",
        },
        "flux-3d": {
          name: "flux-3d",
          displayName: "3D",
          tooltip: "3D-style generation with dimensional depth",
        },
        "any-dark": {
          name: "any-dark",
          displayName: "Dark",
          tooltip: "Dark theme aesthetics and moody compositions",
        },
        "flux-pro": {
          name: "flux-pro",
          displayName: "Pro",
          tooltip: "Professional grade outputs with enhanced quality",
        },
        turbo: {
          name: "turbo",
          displayName: "Turbo",
          tooltip: "High-speed generation with rapid results",
        },
      },
      aspectRatios: {
        widescreen: { width: 1920, height: 1080 },
        square: { width: 1024, height: 1024 },
        portrait: { width: 1080, height: 1920 },
        ultrawide: { width: 2560, height: 1080 },
      },
      intervals: {
        min: 5,
        default: 30,
        max: 3600,
      },
      imageSettings: {
        defaults: {
          nologo: true,
          enhance: true,
          private: true,
          seed: () => Math.floor(Math.random() * 1000000),
        },
      },
    };

    /* ===============================
       Basic State Validation
    =============================== */
    function validateState(state) {
      const requiredFields = ["prompt", "interval", "model", "aspect", "enhance", "private"];
      return (
        state &&
        typeof state === "object" &&
        requiredFields.every((field) => field in state) &&
        typeof state.timestamp === "number" &&
        Date.now() - state.timestamp < 24 * 60 * 60 * 1000 // State not older than 24 hours
      );
    }

    /* ===============================
       Save / Restore Screensaver State
    =============================== */
    function saveScreensaverState() {
      const state = {
        active: screensaverActive,
        prompt: document.getElementById("screensaver-prompt")?.value || "random artistic scene, high quality, detailed",
        interval: document.getElementById("screensaver-interval")?.value || "30",
        lastUpdate: lastScreensaverUpdate,
        model: SCREENSAVER_CONFIG.models[document.getElementById("screensaver-model")?.value]
          ? document.getElementById("screensaver-model")?.value
          : "unity",
        aspect: document.getElementById("screensaver-aspect")?.value || "widescreen",
        enhance: document.getElementById("screensaver-enhance")?.checked || true,
        private: document.getElementById("screensaver-private")?.checked || true,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem("screensaver-state", JSON.stringify(state));
        sessionStorage.setItem("screensaver-state", JSON.stringify(state));
      } catch (error) {
        console.error("Error saving screensaver state:", error);
        try {
          sessionStorage.setItem("screensaver-state", JSON.stringify(state));
        } catch (e) {
          console.error("Failed to save state to sessionStorage:", e);
        }
      }
    }

    async function restoreScreensaverState() {
      try {
        let savedState = localStorage.getItem("screensaver-state") || sessionStorage.getItem("screensaver-state");

        if (savedState) {
          const state = JSON.parse(savedState);

          if (!validateState(state)) {
            throw new Error("Invalid or expired state");
          }

          const elements = {
            "screensaver-prompt": state.prompt || "random artistic scene, high quality, detailed",
            "screensaver-interval": state.interval || "30",
            "screensaver-model": SCREENSAVER_CONFIG.models[state.model] ? state.model : "unity",
            "screensaver-aspect": state.aspect || "widescreen",
            "screensaver-enhance": state.enhance,
            "screensaver-private": state.private,
          };

          Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
              if (element.type === "checkbox") {
                element.checked = value;
              } else {
                element.value = value;
              }
            }
          });

          lastScreensaverUpdate = state.lastUpdate || 0;

          if (
            state.active &&
            document.getElementById("chat-box").children.length === 0 &&
            navigator.onLine &&
            document.visibilityState === "visible"
          ) {
            await startScreensaver();
          }

          saveScreensaverState();
        }
      } catch (error) {
        console.error("Error restoring screensaver state:", error);
        localStorage.removeItem("screensaver-state");
        sessionStorage.removeItem("screensaver-state");
      }
    }

    /* ===============================
       Save / Load Screensaver Settings
    =============================== */
    function saveScreensaverSettings() {
      const settings = {
        prompt: document.getElementById("screensaver-prompt")?.value || "random artistic scene, high quality, detailed",
        interval: document.getElementById("screensaver-interval")?.value || "30",
        aspect: document.getElementById("screensaver-aspect")?.value || "widescreen",
        model: document.getElementById("screensaver-model")?.value || "unity",
        enhance: document.getElementById("screensaver-enhance")?.checked,
        private: document.getElementById("screensaver-private")?.checked,
        active: screensaverActive,
      };
      localStorage.setItem("screensaver-settings", JSON.stringify(settings));
    }

    function loadScreensaverSettings() {
      try {
        const settings = JSON.parse(localStorage.getItem("screensaver-settings"));
        if (settings) {
          document.getElementById("screensaver-prompt").value = settings.prompt || "random artistic scene, high quality, detailed";
          document.getElementById("screensaver-interval").value = settings.interval || "30";
          document.getElementById("screensaver-aspect").value = settings.aspect || "widescreen";
          document.getElementById("screensaver-model").value = SCREENSAVER_CONFIG.models[settings.model] ? settings.model : "unity";
          document.getElementById("screensaver-enhance").checked = settings.enhance !== false;
          document.getElementById("screensaver-private").checked = settings.private !== false;

          if (settings.active) {
            startScreensaver();
          }
        }
      } catch (error) {
        console.error("Error loading screensaver settings:", error);
      }
    }

    /* ===============================
       Utility & Error Handling
    =============================== */
    function showError(message) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-popup";
      errorDiv.textContent = message;
      document.body.appendChild(errorDiv);

      void errorDiv.offsetWidth;
      errorDiv.classList.add("show");
      setTimeout(() => {
        errorDiv.classList.remove("show");
        setTimeout(() => errorDiv.remove(), 300);
      }, 3000);
    }

    /* ===============================
       Image Copy & Download Functions
    =============================== */
    async function copyImageToClipboard() {
      try {
        const img = document.getElementById("screensaver-image");
        if (!img || !img.src) {
          showError("No image to copy");
          return;
        }

        const tempImage = new Image();
        tempImage.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          tempImage.onload = resolve;
          tempImage.onerror = reject;
          tempImage.src = img.src + "?t=" + new Date().getTime();
        });

        const canvas = document.createElement("canvas");
        canvas.width = tempImage.naturalWidth;
        canvas.height = tempImage.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(tempImage, 0, 0);

        try {
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1.0));
          const clipboardItem = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([clipboardItem]);

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            try {
              localStorage.setItem("lastScreensaverImage", base64data);
            } catch (e) {
              console.warn("Failed to save to localStorage:", e);
            }
          };
          reader.readAsDataURL(blob);

          const feedback = document.createElement("div");
          feedback.className = "image-upload-feedback show";
          feedback.textContent = "Image copied! ✓";
          img.parentElement.appendChild(feedback);
          setTimeout(() => feedback.remove(), 2000);
        } catch (clipboardError) {
          console.error("Clipboard write failed:", clipboardError);
          const link = document.createElement("a");
          const imgUrl = canvas.toDataURL("image/png");
          link.href = imgUrl;
          link.download = `screensaver-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          const feedback = document.createElement("div");
          feedback.className = "image-upload-feedback show";
          feedback.textContent = "Clipboard failed - Image downloaded instead";
          img.parentElement.appendChild(feedback);
          setTimeout(() => feedback.remove(), 2000);
        }
      } catch (error) {
        console.error("Error copying image:", error);
        showError("Failed to copy image - CORS or network error");

        const feedback = document.createElement("div");
        feedback.className = "image-upload-feedback show";
        feedback.style.backgroundColor = "#ef4444";
        feedback.textContent = "Failed to copy image";
        const img = document.getElementById("screensaver-image");
        if (img && img.parentElement) {
          img.parentElement.appendChild(feedback);
          setTimeout(() => feedback.remove(), 2000);
        }
      }
    }

    async function downloadScreensaverImage() {
      try {
        const img = document.getElementById("screensaver-image");
        if (!img || !img.src) {
          showError("No image to download");
          return;
        }

        const response = await fetch(img.src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `screensaver-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        const feedback = document.createElement("div");
        feedback.className = "image-upload-feedback show";
        feedback.textContent = "Image download started ✓";
        img.parentElement.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
      } catch (error) {
        console.error("Failed to download image:", error);
        showError("Failed to download image");
      }
    }

    /* ===============================
       Screensaver Logic
    =============================== */
    function buildScreensaverImageUrl(prompt) {
      if (!prompt) return "";

      const aspectSelect = document.getElementById("screensaver-aspect");
      const modelSelect = document.getElementById("screensaver-model");
      const enhanceCheck = document.getElementById("screensaver-enhance");
      const privateCheck = document.getElementById("screensaver-private");

      if (!aspectSelect || !modelSelect) return "";

      const aspectRatios = SCREENSAVER_CONFIG.aspectRatios;
      const selectedAspect = aspectRatios[aspectSelect.value] || aspectRatios.widescreen;

      const selectedModel = SCREENSAVER_CONFIG.models[modelSelect.value] ? modelSelect.value : "unity";

      let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?`;
      url += `nologo=true`;
      url += `&width=${selectedAspect.width}&height=${selectedAspect.height}`;
      url += `&seed=${Math.floor(Math.random() * 1000000)}`;
      if (privateCheck?.checked) url += "&private=true";
      if (enhanceCheck?.checked) url += "&enhance=true";
      url += `&model=${selectedModel}`;

      return url;
    }

    function updateScreensaverImage() {
      if (!screensaverActive || slideshowPaused) return;

      const now = Date.now();
      if (now - lastScreensaverUpdate < SCREENSAVER_MIN_INTERVAL * 1000) return;

      const promptInput = document.getElementById("screensaver-prompt");
      const screensaverImg = document.getElementById("screensaver-image");
      const container = document.getElementById("screensaver-container");

      if (!promptInput || !screensaverImg || !container) {
        console.error("Required screensaver elements not found");
        return;
      }

      const prompt = promptInput.value.trim() || "random artistic scene, high quality, detailed";
      const imageUrl = buildScreensaverImageUrl(prompt);
      if (!imageUrl) return;

      const tempImage = new Image();
      tempImage.crossOrigin = "anonymous";
      tempImage.onload = () => {
        screensaverImg.src = imageUrl;
        lastScreensaverUpdate = now;
      };

      tempImage.onerror = (error) => {
        console.error("Failed to load screensaver image:", error);
        showError("Failed to load screensaver image");
      };

      tempImage.src = imageUrl;
    }

    /* ===============================
       Settings Panel Toggle
    =============================== */
    function toggleSettingsPanel() {
      const controlGroup = document.getElementById("screensaver-control-group");
      if (controlGroup) {
        controlsVisible = !controlsVisible;
        controlGroup.style.transition = "transform 0.3s ease-in-out";
        controlGroup.style.transform = controlsVisible ? "translateY(0)" : "translateY(100%)";
      }
    }

    /* ===============================
       Keyboard Events Setup
    =============================== */
    function setupKeyboardEvents() {
      document.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "h") {
          const activeElement = document.activeElement;
          const isTyping = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";

          if (!isTyping && screensaverActive) {
            e.preventDefault();
            toggleSettingsPanel();
          }
        } else if (e.key === "Escape" && screensaverActive) {
          stopScreensaver();
        }
      });
    }

    /* ===============================
       Start & Stop Screensaver
    =============================== */
    function startScreensaver() {
      const container = document.getElementById("screensaver-container");
      const toggle = document.getElementById("screensaver-toggle");
      const intervalInput = document.getElementById("screensaver-interval");
      const controlGroup = document.getElementById("screensaver-control-group");
      const refreshButton = document.getElementById("screensaver-refresh");

      if (!container || !intervalInput) return;

      screensaverActive = true;
      slideshowPaused = false;
      container.style.display = "block";
      if (toggle) toggle.classList.add("active");

      if (refreshButton) {
        refreshButton.textContent = slideshowPaused ? "▶️ Resume" : "⏸️ Pause";
        refreshButton.style.backgroundColor = slideshowPaused ? 
          "rgba(59, 130, 246, 0.5)" : "rgba(239, 68, 68, 0.5)";
        refreshButton.style.borderColor = slideshowPaused ?
          "rgba(59, 130, 246, 0.2)" : "rgba(239, 68, 68, 0.2)";
      }

      if (controlGroup) {
        controlGroup.style.display = "flex";
        controlGroup.style.transform = "translateY(0)";
        controlsVisible = true;
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      updateScreensaverImage();
      const interval = Math.max(SCREENSAVER_MIN_INTERVAL, parseInt(intervalInput.value, 10)) * 1000;

      if (screensaverInterval) {
        clearInterval(screensaverInterval);
      }

      screensaverInterval = setInterval(updateScreensaverImage, interval);

      saveScreensaverSettings();
      saveScreensaverState();
    }

    function stopScreensaver() {
      const container = document.getElementById("screensaver-container");
      const toggle = document.getElementById("screensaver-toggle");
      const controlGroup = document.getElementById("screensaver-control-group");

      if (screensaverInterval) {
        clearInterval(screensaverInterval);
        screensaverInterval = null;
      }

      const image = document.getElementById("screensaver-image");
      if (image) {
        image.src = "";
      }

      screensaverActive = false;
      slideshowPaused = false;
      lastScreensaverUpdate = 0;

      container.style.display = "none";
      if (toggle) toggle.classList.remove("active");

      if (controlGroup) {
        controlGroup.style.transform = "translateY(0)";
        controlsVisible = true;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Error exiting fullscreen:", err);
        });
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
       Toggle Slideshow
    =============================== */
    function toggleSlideshow() {
        if (!screensaverActive) return;
      
        slideshowPaused = !slideshowPaused;
        const refreshButton = document.getElementById("screensaver-refresh");
        const img = document.getElementById("screensaver-image");
      
        if (slideshowPaused) {
          refreshButton.textContent = "▶️ Resume";
          refreshButton.style.backgroundColor = "rgba(59, 130, 246, 0.5)";
          refreshButton.style.borderColor = "rgba(59, 130, 246, 0.2)";
          if (screensaverInterval) {
            clearInterval(screensaverInterval);
            screensaverInterval = null;
          }
        } else {
          refreshButton.textContent = "⏸️ Pause";
          refreshButton.style.backgroundColor = "rgba(239, 68, 68, 0.5)";
          refreshButton.style.borderColor = "rgba(239, 68, 68, 0.2)";
          const interval = Math.max(SCREENSAVER_MIN_INTERVAL, parseInt(document.getElementById("screensaver-interval").value, 10)) * 1000;
          
          // Only update image if enough time has passed since last update
          const now = Date.now();
          if (now - lastScreensaverUpdate >= SCREENSAVER_MIN_INTERVAL * 1000) {
            updateScreensaverImage();
          }
          
          if (screensaverInterval) clearInterval(screensaverInterval);
          screensaverInterval = setInterval(updateScreensaverImage, interval);
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

    function setupTouchEvents() {
      const container = document.getElementById("screensaver-container");
      if (!container) return;

      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    /* ===============================
       Initialize & Event Listeners
    =============================== */
    function initializeScreensaver() {
        const refreshBtn = document.getElementById("screensaver-refresh");
        const copyBtn = document.getElementById("screensaver-copy");
        const downloadBtn = document.getElementById("screensaver-download");
        const exitBtn = document.getElementById("screensaver-exit");
        const container = document.getElementById("screensaver-container");
        const toggle = document.getElementById("screensaver-toggle");
      
        if (refreshBtn) {
          refreshBtn.addEventListener("click", toggleSlideshow);
        }
      
        if (copyBtn) {
          copyBtn.addEventListener("click", copyImageToClipboard);
        }
      
        if (downloadBtn) {
          downloadBtn.addEventListener("click", downloadScreensaverImage);
        }
      
        if (exitBtn) {
          exitBtn.addEventListener("click", stopScreensaver);
        }
      
        if (toggle) {
          toggle.addEventListener("click", toggleScreensaver);
        }
      
        if (container) {
          container.addEventListener("dblclick", () => {
            if (screensaverActive) stopScreensaver();
          });
        }
      }

    /* ===============================
       Expose Public Methods
    =============================== */
    window.screensaver = {
      start: startScreensaver,
      stop: stopScreensaver,
      toggle: toggleScreensaver,
      update: updateScreensaverImage,
      initialize: initializeScreensaver,
    };

    /* ===============================
       Initialize on DOM Content Loaded
    =============================== */
    document.addEventListener("DOMContentLoaded", function () {
      window.screensaver.initialize();
    });
  })();