/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
        #simple-mode-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: #121212;
            color: #ffffff;
            z-index: 10000;
            display: flex;
            flex-direction: column;
        }
        .simple-header {
            padding: 10px;
            background-color: #1e1e1e;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .simple-header h2 {
            margin: 0;
            font-size: 1.2rem;
        }
        .simple-chat-box {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        .simple-input-container {
            display: flex;
            padding: 12px 15px;
            background: #1e1e1e;
            align-items: center;
        }
        .simple-input {
            flex-grow: 1;
            background: #333333;
            color: #ffffff;
            border: 1px solid #555555;
            border-radius: 20px;
            font-size: 14px;
            padding: 12px 15px;
            resize: none;
            overflow-y: auto;
            min-height: 50px;
            max-height: 120px;
            transition: box-shadow 0.2s ease;
        }
        .simple-input:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(100,100,100,0.3);
        }
        .simple-send-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            margin-left: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        .simple-send-btn:hover {
            transform: scale(1.05);
            background: #45a049;
        }
        .simple-send-btn:disabled {
            background: #555555;
            cursor: not-allowed;
            opacity: 0.6;
        }
        .simple-message {
            margin: 12px 0;
            padding: 12px 16px;
            border-radius: 18px;
            animation: fadeIn 0.3s ease;
            word-break: break-word;
            clear: both;
            max-width: 70%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .simple-user-message {
            background-color: #333333;
            color: #ffffff;
            float: right;
            border-bottom-right-radius: 6px;
            max-width: 40%;
            margin-right: 10px;
        }
        .simple-ai-message {
            background-color: #444444;
            color: #ffffff;
            float: left;
            border-bottom-left-radius: 6px;
            max-width: 60%;
            margin-left: 10px;
        }
        .simple-message-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
            flex-wrap: wrap;
        }
        .simple-action-btn {
            background: #555555;
            border: none;
            border-radius: 15px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #ffffff;
            min-width: 80px;
            text-align: center;
        }
        .simple-action-btn:hover {
            background: #666666;
        }
        .simple-message-text {
            width: 100%;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
        }
        .simple-ai-image-container {
            position: relative;
            margin: 10px 0;
            max-width: 100%;
            border-radius: 8px;
            overflow: hidden;
        }
        .simple-ai-image-loading {
            background-color: rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            width: 512px;
            height: 512px;
            border-radius: 8px;
        }
        .simple-loading-spinner {
            border: 4px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            border-top: 4px solid #666666;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .simple-image-button-container {
            display: flex;
            gap: 5px;
            margin-top: 5px;
            flex-wrap: wrap;
            z-index: 10;
        }
        .simple-ai-generated-image {
            position: relative;
            z-index: 1;
            display: block;
            max-width: 100%;
            border-radius: 8px;
        }
    `;
    document.head.appendChild(style);

    function openSimpleMode() {
        const existingModal = document.getElementById("simple-mode-modal");
        if (existingModal) existingModal.remove();

        const modal = document.createElement("div");
        modal.id = "simple-mode-modal";

        const header = document.createElement("div");
        header.className = "simple-header";
        const title = document.createElement("h2");
        title.textContent = "Simple Mode";

        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.gap = "10px";

        let isMuted = true;
        const muteBtn = document.createElement("button");
        muteBtn.className = "simple-action-btn";
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        muteBtn.title = "Toggle audio mute";
        muteBtn.addEventListener("click", () => {
            isMuted = !isMuted;
            muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });

        const clearBtn = document.createElement("button");
        clearBtn.className = "simple-action-btn";
        clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
        clearBtn.title = "Clear chat";
        clearBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the chat?")) {
                const currentSession = Storage.getCurrentSession();
                currentSession.messages = [];
                Storage.updateSessionMessages(currentSession.id, currentSession.messages);
                simpleChatBox.innerHTML = "";
                window._chatInternals.stopSpeaking();
                window.showToast("Chat cleared");
            }
        });

        const exitBtn = document.createElement("button");
        exitBtn.className = "simple-action-btn";
        exitBtn.textContent = "Exit";
        exitBtn.title = "Exit simple mode";
        exitBtn.addEventListener("click", closeSimpleMode);

        buttonsContainer.appendChild(muteBtn);
        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(exitBtn);
        header.appendChild(title);
        header.appendChild(buttonsContainer);

        const simpleChatBox = document.createElement("div");
        simpleChatBox.className = "simple-chat-box";

        const inputContainer = document.createElement("div");
        inputContainer.className = "simple-input-container";
        const simpleInput = document.createElement("textarea");
        simpleInput.className = "simple-input";
        simpleInput.placeholder = "Type your message... (Shift+Enter for new line, Enter to send)";
        const simpleSendBtn = document.createElement("button");
        simpleSendBtn.className = "simple-send-btn";
        simpleSendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        simpleSendBtn.disabled = true;

        inputContainer.appendChild(simpleInput);
        inputContainer.appendChild(simpleSendBtn);

        modal.appendChild(header);
        modal.appendChild(simpleChatBox);
        modal.appendChild(inputContainer);
        document.body.appendChild(modal);

        const currentSession = Storage.getCurrentSession();
        currentSession.messages.forEach((msg, index) => {
            appendSimpleMessage(msg.role, msg.content, index);
        });

        simpleInput.addEventListener("input", () => {
            simpleSendBtn.disabled = simpleInput.value.trim() === "";
            simpleInput.style.height = "auto";
            simpleInput.style.height = simpleInput.scrollHeight + "px";
        });

        const handleSimpleSend = () => {
            const message = simpleInput.value.trim();
            if (message === "") return;
            const currentSession = Storage.getCurrentSession();
            currentSession.messages.push({ role: "user", content: message });
            Storage.updateSessionMessages(currentSession.id, currentSession.messages);
            appendSimpleMessage("user", message, currentSession.messages.length - 1);
            simpleInput.value = "";
            simpleSendBtn.disabled = true;
            window.sendToPollinations(() => {
                const updatedSession = Storage.getCurrentSession();
                const lastMessage = updatedSession.messages[updatedSession.messages.length - 1];
                if (lastMessage.role === "ai") {
                    appendSimpleMessage("ai", lastMessage.content, updatedSession.messages.length - 1);
                }
                simpleInput.focus();
            });
        };
        simpleSendBtn.addEventListener("click", handleSimpleSend);

        // Send on Enter, allow newline with Shift+Enter
        simpleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) return; // allow newline
                e.preventDefault();
                // Call the same handler used by the send button
                handleSimpleSend();
            }
        });

        function appendSimpleMessage(role, content, index) {
            const container = document.createElement("div");
            container.classList.add("simple-message");
            container.dataset.index = index;
            container.dataset.role = role;
            if (role === "user") {
                container.classList.add("simple-user-message");
            } else {
                container.classList.add("simple-ai-message");
            }

            const bubbleContent = document.createElement("div");
            bubbleContent.classList.add("simple-message-text");

            if (role === "ai") {
                // Match both old and new Pollinations image URL formats
                const imgRegex = /https:\/\/(?:image\.pollinations\.ai\/prompt|gen\.pollinations\.ai\/image)\/[^\s)]+/g;
                const matches = content.match(imgRegex) || [];
                let lastIndex = 0;
                matches.forEach((url) => {
                    const matchIndex = content.indexOf(url, lastIndex);
                    if (matchIndex > lastIndex) {
                        const textPart = content.substring(lastIndex, matchIndex);
                        const textNode = document.createTextNode(textPart);
                        bubbleContent.appendChild(textNode);
                    }
                    const imageContainer = createSimpleImageElement(url, index);
                    bubbleContent.appendChild(imageContainer);
                    lastIndex = matchIndex + url.length;
                });
                if (lastIndex < content.length) {
                    const textPart = content.substring(lastIndex);
                    const textNode = document.createTextNode(textPart);
                    bubbleContent.appendChild(textNode);
                }
            } else {
                bubbleContent.textContent = content;
            }

            container.appendChild(bubbleContent);

            if (role === "ai") {
                const actionsDiv = document.createElement("div");
                actionsDiv.className = "simple-message-actions";

                const copyBtn = document.createElement("button");
                copyBtn.className = "simple-action-btn";
                copyBtn.textContent = "Copy";
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard.writeText(content).then(() => window.showToast("Copied to clipboard"));
                });
                actionsDiv.appendChild(copyBtn);

                const speakBtn = document.createElement("button");
                speakBtn.className = "simple-action-btn";
                speakBtn.textContent = "Speak";
                speakBtn.title = "Speak this message";
                speakBtn.addEventListener("click", () => {
                    if (isMuted) {
                        window.showToast("Audio is muted");
                    } else {
                        window._chatInternals.speakMessage(content);
                    }
                });
                actionsDiv.appendChild(speakBtn);

                const regenBtn = document.createElement("button");
                regenBtn.className = "simple-action-btn";
                regenBtn.textContent = "Re-generate";
                regenBtn.title = "Regenerate entire response (based on last user message)";
                regenBtn.addEventListener("click", () => {
                    reGenerateEntireResponse(index);
                });
                actionsDiv

.appendChild(regenBtn);

                container.appendChild(actionsDiv);
            }

            simpleChatBox.appendChild(container);
            simpleChatBox.scrollTop = simpleChatBox.scrollHeight;

            if (role === "ai") {
                const storedImageId = localStorage.getItem(`simpleImageId_${index}`);
                if (storedImageId) {
                    const img = simpleChatBox.querySelector(`img[data-image-id="${storedImageId}"]`);
                    if (img) {
                        console.log(`Re-attaching image button listeners for stored image ID: ${storedImageId} in simple mode`);
                        attachImageButtonListeners(img, storedImageId);
                    } else {
                        console.warn(`Image with ID ${storedImageId} not found in DOM in simple mode`);
                    }
                }
            }
        }

        function createSimpleImageElement(url, msgIndex) {
            const imageId = `simple-img-${msgIndex}-${Date.now()}`;
            localStorage.setItem(`simpleImageId_${msgIndex}`, imageId);

            const imageContainer = document.createElement("div");
            imageContainer.className = "simple-ai-image-container";

            const loadingDiv = document.createElement("div");
            loadingDiv.className = "simple-ai-image-loading";
            const spinner = document.createElement("div");
            spinner.className = "simple-loading-spinner";
            loadingDiv.appendChild(spinner);
            imageContainer.appendChild(loadingDiv);

            const img = document.createElement("img");
            img.src = url;
            img.alt = "AI Generated Image";
            img.className = "simple-ai-generated-image";
            img.style.display = "none";
            img.dataset.imageUrl = url;
            img.dataset.imageId = imageId;
            img.crossOrigin = "anonymous";

            img.onload = () => {
                loadingDiv.remove();
                img.style.display = "block";
                attachImageButtonListeners(img, imageId);
            };
            img.onerror = () => {
                loadingDiv.innerHTML = "⚠️ Failed to load image";
                loadingDiv.style.display = "flex";
                loadingDiv.style.justifyContent = "center";
                loadingDiv.style.alignItems = "center";
            };
            imageContainer.appendChild(img);

            const imgButtonContainer = document.createElement("div");
            imgButtonContainer.className = "simple-image-button-container";
            imgButtonContainer.dataset.imageId = imageId;
            imageContainer.appendChild(imgButtonContainer);

            return imageContainer;
        }

        function attachImageButtonListeners(img, imageId) {
            const imgButtonContainer = document.querySelector(`.simple-image-button-container[data-image-id="${imageId}"]`);
            if (!imgButtonContainer) {
                console.warn(`No image button container found for image ID: ${imageId} in simple mode`);
                return;
            }

            console.log(`Attaching image button listeners for image ID: ${imageId} in simple mode`);
            imgButtonContainer.innerHTML = "";

            const copyImgBtn = document.createElement("button");
            copyImgBtn.className = "simple-action-btn";
            copyImgBtn.textContent = "Copy Image";
            copyImgBtn.style.pointerEvents = "auto"; // Ensure the button is clickable
            copyImgBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Copy Image button clicked for image ID: ${imageId} in simple mode`);
                copyImage(img, imageId);
            });
            imgButtonContainer.appendChild(copyImgBtn);

            const downloadImgBtn = document.createElement("button");
            downloadImgBtn.className = "simple-action-btn";
            downloadImgBtn.textContent = "Download Image";
            downloadImgBtn.style.pointerEvents = "auto";
            downloadImgBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Download Image button clicked for image ID: ${imageId} in simple mode`);
                downloadImage(img, imageId);
            });
            imgButtonContainer.appendChild(downloadImgBtn);

            const refreshImgBtn = document.createElement("button");
            refreshImgBtn.className = "simple-action-btn";
            refreshImgBtn.textContent = "Refresh Image";
            refreshImgBtn.style.pointerEvents = "auto";
            refreshImgBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Refresh Image button clicked for image ID: ${imageId} in simple mode`);
                refreshImage(img, imageId);
            });
            imgButtonContainer.appendChild(refreshImgBtn);

            const openImgBtn = document.createElement("button");
            openImgBtn.className = "simple-action-btn";
            openImgBtn.textContent = "Open in New Tab";
            openImgBtn.style.pointerEvents = "auto";
            openImgBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Open in New Tab button clicked for image ID: ${imageId} in simple mode`);
                openImageInNewTab(img, imageId);
            });
            imgButtonContainer.appendChild(openImgBtn);
        }

        function copyImage(img, imageId) {
            console.log(`Copying image with ID: ${imageId} in simple mode`);
            if (!img.complete || img.naturalWidth === 0) {
                window.showToast("Image not fully loaded yet. Please try again.");
                return;
            }
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            try {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        window.showToast("Failed to copy image: Unable to create blob.");
                        return;
                    }
                    navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                        .then(() => {
                            const dataURL = canvas.toDataURL("image/png");
                            localStorage.setItem(`lastCopiedImage_${imageId}`, dataURL);
                            window.showToast("Image copied to clipboard and saved to local storage");
                        })
                        .catch((err) => {
                            console.error("Copy image error in simple mode:", err);
                            window.showToast("Failed to copy image: " + err.message);
                        });
                }, "image/png");
            } catch (err) {
                console.error("Copy image error in simple mode:", err);
                window.showToast("Failed to copy image due to CORS or other error: " + err.message);
            }
        }

        function downloadImage(img, imageId) {
            console.log(`Downloading image with ID: ${imageId} in simple mode`);
            if (!img.src) {
                window.showToast("No image source available to download.");
                return;
            }
            fetch(img.src, { mode: "cors" })
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.blob();
                })
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `image-${imageId}-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    window.showToast("Image downloaded successfully");
                })
                .catch(err => {
                    console.error("Download image error in simple mode:", err);
                    window.showToast("Failed to download image: " + err.message);
                });
        }

        function refreshImage(img, imageId) {
            console.log(`Refreshing image with ID: ${imageId} in simple mode`);
            if (!img.src || !img.src.includes("gen.pollinations.ai/image")) {
                window.showToast("No valid Pollinations image source to refresh.");
                return;
            }
            const urlObj = new URL(img.src);
            const newSeed = Math.floor(Math.random() * 1000000);
            urlObj.searchParams.set('seed', newSeed);
            urlObj.searchParams.set('nolog', 'true');
            const newUrl = urlObj.toString();

            const loadingDiv = document.createElement("div");
            loadingDiv.className = "simple-ai-image-loading";
            const spinner = document.createElement("div");
            spinner.className = "simple-loading-spinner";
            loadingDiv.appendChild(spinner);
            loadingDiv.style.width = img.width + "px";
            loadingDiv.style.height = img.height + "px";
            img.parentNode.insertBefore(loadingDiv, img);
            img.style.display = "none";

            img.onload = () => {
                loadingDiv.remove();
                img.style.display = "block";
                window.showToast("Image refreshed with new seed");
            };
            img.onerror = () => {
                loadingDiv.innerHTML = "⚠️ Failed to refresh image";
                loadingDiv.style.display = "flex";
                loadingDiv.style.justifyContent = "center";
                loadingDiv.style.alignItems = "center";
                window.showToast("Failed to refresh image");
            };
            img.src = newUrl;
        }

        function openImageInNewTab(img, imageId) {
            console.log(`Opening image in new tab with ID: ${imageId} in simple mode`);
            if (!img.src) {
                window.showToast("No image source available to open.");
                return;
            }
            window.open(img.src, "_blank");
            window.showToast("Image opened in new tab");
        }

        function reGenerateEntireResponse(aiMsgIndex) {
            console.log(`Re-generating entire response for index: ${aiMsgIndex} in simple mode`);
            const currentSession = Storage.getCurrentSession();
            if (!currentSession) {
                window.showToast("No session found.");
                return;
            }

            if (aiMsgIndex < 0 || aiMsgIndex >= currentSession.messages.length) {
                window.showToast("Invalid AI message index");
                return;
            }
            const aiMsg = currentSession.messages[aiMsgIndex];
            if (!aiMsg || aiMsg.role !== "ai") {
                window.showToast("No AI message found at this index to re-generate from");
                return;
            }
            let userIndex = -1;
            for (let i = aiMsgIndex - 1; i >= 0; i--) {
                if (currentSession.messages[i].role === "user") {
                    userIndex = i;
                    break;
                }
            }
            if (userIndex === -1) {
                window.showToast("No preceding user message found. Can't re-generate.");
                return;
            }

            const userMessage = currentSession.messages[userIndex].content;
            currentSession.messages = currentSession.messages.slice(0, userIndex + 1);
            Storage.updateSessionMessages(currentSession.id, currentSession.messages);

            simpleChatBox.innerHTML = "";
            currentSession.messages.forEach((m, i) => {
                appendSimpleMessage(m.role, m.content, i);
            });

            window.showToast("Re-generating entire response. One moment...");
            window.sendToPollinations(() => {
                const updatedSession = Storage.getCurrentSession();
                const lastMsg = updatedSession.messages[updatedSession.messages.length - 1];
                if (lastMsg.role === "ai") {
                    appendSimpleMessage("ai", lastMsg.content, updatedSession.messages.length - 1);
                }
            }, userMessage);
        }

        function closeSimpleMode() {
            const modal = document.getElementById("simple-mode-modal");
            if (modal) modal.remove();
        }
    }

    window.openSimpleMode = openSimpleMode;

    if (document.getElementById("toggle-simple-mode")) {
        document.getElementById("toggle-simple-mode").addEventListener("click", () => {
            openSimpleMode();
        });
    }
});