// screensaver.js

document.addEventListener("DOMContentLoaded", () => {
    const screensaverContainer = document.getElementById("screensaver-container");
    const toggleScreensaverButton = document.getElementById("toggle-screensaver");
    const fullscreenButton = document.getElementById("fullscreen-screensaver");
    const stopButton = document.getElementById("screensaver-exit");
    const playPauseButton = document.getElementById("screensaver-playpause");
    const saveButton = document.getElementById("screensaver-save");
    const copyButton = document.getElementById("screensaver-copy");
    const screensaverImage = document.getElementById("screensaver-image");
  
    // Extended controls.
    const promptInput = document.getElementById("screensaver-prompt");
    const timerInput = document.getElementById("screensaver-timer");
    const aspectSelect = document.getElementById("screensaver-aspect");
    const enhanceCheckbox = document.getElementById("screensaver-enhance");
    const privateCheckbox = document.getElementById("screensaver-private");
    const modelSelect = document.getElementById("screensaver-model");
  
    let screensaverActive = false;
    let imageInterval;
    let paused = false;
  
    // Fetch image generation models from the API.
    fetch("https://image.pollinations.ai/models")
      .then(res => res.json())
      .then(models => {
        // Expecting an array of strings (e.g. ["flux","turbo"]).
        models.forEach(m => {
          const opt = document.createElement("option");
          opt.value = m;
          // Capitalize first letter for display.
          opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
          opt.title = "Image generation model: " + m;
          modelSelect.appendChild(opt);
        });
      })
      .catch(err => console.error("Error fetching image models:", err));
  
    function generateSeed() {
      const length = Math.floor(Math.random() * 8) + 1;
      let seed = "";
      for (let i = 0; i < length; i++) {
        seed += Math.floor(Math.random() * 10);
      }
      return seed;
    }
  
    function getDimensions(aspect) {
      switch (aspect) {
        case "widescreen":
          return { width: 1280, height: 720 };
        case "square":
          return { width: 1024, height: 1024 };
        case "portrait":
          return { width: 720, height: 1280 };
        case "ultrawide":
          return { width: 1920, height: 720 };
        default:
          return { width: 1280, height: 720 };
      }
    }
  
    function fetchNewImage() {
      const prompt = promptInput.value || "random artistic scene, high quality, detailed";
      const { width, height } = getDimensions(aspectSelect.value);
      const seed = generateSeed();
      const model = modelSelect.value || "flux";
      const enhance = enhanceCheckbox.checked;
      const priv = privateCheckbox.checked;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true&private=${priv}&enhance=${enhance}`;
      screensaverImage.src = url;
    }
  
    function setOrResetInterval() {
      clearInterval(imageInterval);
      const intervalSeconds = parseInt(timerInput.value) || 30;
      imageInterval = setInterval(() => {
        if (!paused) fetchNewImage();
      }, intervalSeconds * 1000);
    }
  
    function startScreensaver() {
      screensaverActive = true;
      paused = false;
      screensaverContainer.classList.remove("hidden");
      fetchNewImage();
      setOrResetInterval();
      playPauseButton.textContent = "⏸️";
    }
  
    function stopScreensaver() {
      screensaverActive = false;
      paused = false;
      screensaverContainer.classList.add("hidden");
      clearInterval(imageInterval);
    }
  
    function togglePause() {
      paused = !paused;
      playPauseButton.textContent = paused ? "▶️" : "⏸️";
    }
  
    // Download image as file using Blob.
    function saveImage() {
      fetch(screensaverImage.src)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "generated_image.jpg";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch(err => console.error("Error downloading image:", err));
    }
  
    // Copy image to clipboard using ClipboardItem.
    function copyImage() {
      fetch(screensaverImage.src)
        .then(response => response.blob())
        .then(blob => {
          const item = new ClipboardItem({ "image/png": blob });
          return navigator.clipboard.write([item]);
        })
        .then(() => alert("Image copied to clipboard"))
        .catch(err => console.error("Error copying image:", err));
    }
  
    timerInput.addEventListener("change", () => {
      if (screensaverActive) setOrResetInterval();
    });
  
    toggleScreensaverButton.addEventListener("click", () => {
      if (screensaverActive) {
        stopScreensaver();
      } else {
        startScreensaver();
      }
    });
  
    fullscreenButton.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        screensaverContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
  
    stopButton.addEventListener("click", stopScreensaver);
    playPauseButton.addEventListener("click", togglePause);
    saveButton.addEventListener("click", saveImage);
    copyButton.addEventListener("click", copyImage);
  });
  