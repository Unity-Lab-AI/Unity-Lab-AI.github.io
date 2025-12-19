/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// index.js - Legacy Unity Chat Application
// Extracted JavaScript from original index.html

// Copy to clipboard helper function
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const popup = document.createElement("div");
    popup.textContent = "Address copied. Thank you!";
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    popup.style.color = "#fff";
    popup.style.padding = "10px 20px";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "9999";
    document.body.appendChild(popup);
    setTimeout(() => {
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 500);
    }, 2000);
  }).catch((err) => {
    console.error("Failed to copy: ", err);
  });
}

// Make copyToClipboard available globally for inline onclick handlers
window.copyToClipboard = copyToClipboard;
