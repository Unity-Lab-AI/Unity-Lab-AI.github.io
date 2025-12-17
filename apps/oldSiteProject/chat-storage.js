document.addEventListener("DOMContentLoaded", () => {
    const { chatBox, chatInput, clearChatBtn, voiceToggleBtn, modelSelect, synth, autoSpeakEnabled, speakMessage, stopSpeaking, showToast, toggleSpeechRecognition, initSpeechRecognition, handleVoiceCommand, speakSentences } = window._chatInternals;
    const imagePatterns = window.imagePatterns;

    function openImageModal(imageUrl) {
        window.open(imageUrl, "_blank");
    }

    function addImageToGallery(imageUrl) {
        const gallery = document.getElementById('past-image-gallery');
        if (!gallery) return;
        if ([...gallery.querySelectorAll('img.thumbnail')].some(img => img.src === imageUrl)) return;
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'thumbnail';
        img.addEventListener('click', () => {
            openImageModal(imageUrl);
        });
        gallery.appendChild(img);
        if (window.Memory && typeof window.Memory.saveImage === 'function') {
            window.Memory.saveImage(imageUrl);
        }
    }

    if (window.Memory && typeof window.Memory.loadPastImages === 'function') {
        window.Memory.loadPastImages(addImageToGallery);
    }

    function generateSessionTitle(messages) {
        let title = "";
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].role === "ai") {
                title = messages[i].content.replace(/[#_*`]/g, "").trim();
                break;
            }
        }
        if (!title) title = "New Chat";
        if (title.length > 50) title = title.substring(0, 50) + "...";
        return title;
    }
    function checkAndUpdateSessionTitle() {
        const currentSession = Storage.getCurrentSession();
        if (!currentSession.name || currentSession.name === "New Chat") {
            const newTitle = generateSessionTitle(currentSession.messages);
            if (newTitle && newTitle !== currentSession.name) {
                Storage.renameSession(currentSession.id, newTitle);
            }
        }
    }
    function highlightAllCodeBlocks() {
        if (!window.Prism) {
            return;
        }
        const codeBlocks = chatBox.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
            Prism.highlightElement(block);
        });
    }
    function appendMessage({ role, content, index }) {
        const container = document.createElement("div");
        container.classList.add("message");
        container.dataset.index = index;
        container.dataset.role = role;
        if (role === "user") {
            container.classList.add("user-message");
            container.style.float = "right";
            container.style.clear = "both";
            container.style.maxWidth = "40%";
            container.style.marginRight = "10px";
        } else {
            container.classList.add("ai-message");
            container.style.float = "left";
            container.style.clear = "both";
            container.style.maxWidth = "60%";
            container.style.marginLeft = "10px";
        }
        const bubbleContent = document.createElement("div");
        bubbleContent.classList.add("message-text");
        if (role === "ai") {
            // Extract IMAGE tags and generate actual image URLs
            const imageTagRegex = /\[IMAGE\]([\s\S]*?)\[\/IMAGE\]/gi;
            let imageMatch;
            const imagePrompts = [];
            while ((imageMatch = imageTagRegex.exec(content)) !== null) {
                imagePrompts.push({
                    fullMatch: imageMatch[0],
                    prompt: imageMatch[1].trim()
                });
            }

            // Remove IMAGE tags from content for text processing
            let textContent = content.replace(imageTagRegex, '').trim();

            // Process CODE blocks
            let lastIndex = 0;
            const codeBlockRegex = /\[CODE\]\s*```(\w+)\n([\s\S]*?)\n```\s*\[\/CODE\]/g;
            let match;
            while ((match = codeBlockRegex.exec(textContent)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;
                if (matchStart > lastIndex) {
                    const textPart = textContent.substring(lastIndex, matchStart);
                    if (textPart.trim()) {
                        const textNode = document.createTextNode(textPart.trim());
                        bubbleContent.appendChild(textNode);
                    }
                }
                const language = match[1];
                const code = match[2];
                const pre = document.createElement("pre");
                const codeElement = document.createElement("code");
                codeElement.className = `language-${language}`;
                codeElement.textContent = code;
                pre.appendChild(codeElement);
                bubbleContent.appendChild(pre);
                lastIndex = matchEnd;
            }
            if (lastIndex < textContent.length) {
                const remainingText = textContent.substring(lastIndex);
                if (remainingText.trim()) {
                    const textNode = document.createTextNode(remainingText.trim());
                    bubbleContent.appendChild(textNode);
                }
            }

            // Generate images from IMAGE tags
            if (imagePrompts.length > 0) {
                const imageModel = window.getSelectedImageModel ? window.getSelectedImageModel() : 'flux';
                const apiKey = typeof PollinationsAPI !== 'undefined' ? PollinationsAPI.DEFAULT_API_KEY : 'pk_YBwckBxhiFxxCMbk';
                imagePrompts.forEach(imgData => {
                    const seed = Math.floor(Math.random() * 1000000);
                    const encodedPrompt = encodeURIComponent(imgData.prompt);
                    // Use correct Pollinations image endpoint: gen.pollinations.ai/image/{prompt}
                    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=${imageModel}&nologo=true&safe=false&key=${apiKey}`;
                    const imageContainer = createImageElement(imageUrl);
                    bubbleContent.appendChild(imageContainer);
                });
            }
        } else {
            bubbleContent.textContent = content;
        }
        container.appendChild(bubbleContent);
        if (role === "ai") {
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "message-actions";
            const copyBtn = document.createElement("button");
            copyBtn.className = "message-action-btn";
            copyBtn.textContent = "Copy";
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(content).then(() => showToast("AI response copied to clipboard")).catch(() => {
                    showToast("Failed to copy to clipboard");
                });
            });
            actionsDiv.appendChild(copyBtn);
            const speakBtn = document.createElement("button");
            speakBtn.className = "message-action-btn speak-message-btn";
            speakBtn.innerHTML = '<span class="icon">🔊</span> Speak';
            speakBtn.addEventListener("click", () => {
                stopSpeaking();
                // Remove IMAGE tags and CODE blocks before speaking
                let speakableContent = content
                    .replace(/\[IMAGE\][\s\S]*?\[\/IMAGE\]/gi, '')
                    .replace(/\[CODE\][\s\S]*?\[\/CODE\]/gi, '')
                    .trim();
                const sentences = speakableContent.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                speakSentences(sentences);
            });
            actionsDiv.appendChild(speakBtn);
            const regenBtn = document.createElement("button");
            regenBtn.className = "message-action-btn";
            regenBtn.textContent = "Re-generate";
            regenBtn.addEventListener("click", () => reGenerateAIResponse(index));
            actionsDiv.appendChild(regenBtn);
            const editAIBtn = document.createElement("button");
            editAIBtn.className = "message-action-btn";
            editAIBtn.textContent = "Edit";
            editAIBtn.addEventListener("click", () => editMessage(index));
            actionsDiv.appendChild(editAIBtn);
            container.appendChild(actionsDiv);
        } else {
            const userActionsDiv = document.createElement("div");
            userActionsDiv.className = "message-actions";
            const editUserBtn = document.createElement("button");
            editUserBtn.className = "message-action-btn";
            editUserBtn.textContent = "Edit";
            editUserBtn.addEventListener("click", () => editMessage(index));
            userActionsDiv.appendChild(editUserBtn);
            container.appendChild(userActionsDiv);
        }
        const codeBlocks = bubbleContent.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "flex";
            buttonContainer.style.gap = "5px";
            buttonContainer.style.marginTop = "5px";
            const codeContent = block.textContent.trim();
            const language = block.className.match(/language-(\w+)/)?.[1] || "text";
            const copyCodeBtn = document.createElement("button");
            copyCodeBtn.className = "message-action-btn";
            copyCodeBtn.textContent = "Copy Code";
            copyCodeBtn.style.fontSize = "12px";
            copyCodeBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(codeContent).then(() => {
                    showToast("Code copied to clipboard");
                }).catch(() => {
                    showToast("Failed to copy code");
                });
            });
            buttonContainer.appendChild(copyCodeBtn);
            const downloadCodeBtn = document.createElement("button");
            downloadCodeBtn.className = "message-action-btn";
            downloadCodeBtn.textContent = "Download";
            downloadCodeBtn.style.fontSize = "12px";
            downloadCodeBtn.addEventListener("click", () => {
                downloadCodeAsTxt(codeContent, language);
            });
            buttonContainer.appendChild(downloadCodeBtn);
            block.parentNode.insertAdjacentElement("afterend", buttonContainer);
        });
        chatBox.appendChild(container);
        chatBox.scrollTop = chatBox.scrollHeight;
        highlightAllCodeBlocks();
    }
    function downloadCodeAsTxt(codeContent, language) {
        const blob = new Blob([codeContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `code-${language}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Code downloaded as .txt");
    }
    function createImageElement(url) {
        const imageId = `voice-img-${Date.now()}`;
        localStorage.setItem(`voiceImageId_${imageId}`, imageId);
        const imageContainer = document.createElement("div");
        imageContainer.className = "ai-image-container";
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "ai-image-loading";
        const spinner = document.createElement("div");
        spinner.className = "loading-spinner";
        loadingDiv.appendChild(spinner);
        const loadingText = document.createElement("div");
        loadingText.textContent = "Generating image...";
        loadingText.style.marginTop = "10px";
        loadingDiv.appendChild(loadingText);
        Object.assign(loadingDiv.style, { width: "512px", height: "512px", flexDirection: "column" });
        imageContainer.appendChild(loadingDiv);
        const img = document.createElement("img");
        img.alt = "AI Generated Image";
        img.className = "ai-generated-image";
        img.style.display = "none";
        img.dataset.imageUrl = url;
        img.dataset.imageId = imageId;
        img.crossOrigin = "anonymous";

        let retryCount = 0;
        const maxRetries = 3;
        const retryDelays = [3000, 6000, 10000];

        const loadImage = (imageUrl) => {
            img.src = imageUrl;
        };

        img.onload = () => {
            loadingDiv.remove();
            img.style.display = "block";
            attachImageButtons(img, imageId);
        };

        img.onerror = () => {
            if (retryCount < maxRetries) {
                const delay = retryDelays[retryCount];
                loadingText.textContent = `Rate limited, retrying in ${delay/1000}s... (${retryCount + 1}/${maxRetries})`;
                retryCount++;
                setTimeout(() => {
                    const retryUrl = url + `&_retry=${Date.now()}`;
                    loadingText.textContent = "Generating image...";
                    loadImage(retryUrl);
                }, delay);
            } else {
                loadingDiv.innerHTML = "";
                loadingDiv.style.display = "flex";
                loadingDiv.style.flexDirection = "column";
                loadingDiv.style.justifyContent = "center";
                loadingDiv.style.alignItems = "center";

                const errorText = document.createElement("div");
                errorText.textContent = "⚠️ Image generation failed (rate limited)";
                errorText.style.marginBottom = "10px";
                loadingDiv.appendChild(errorText);

                const retryBtn = document.createElement("button");
                retryBtn.className = "message-action-btn";
                retryBtn.textContent = "🔄 Retry";
                retryBtn.addEventListener("click", () => {
                    retryCount = 0;
                    loadingDiv.innerHTML = "";
                    loadingDiv.appendChild(spinner);
                    const newLoadingText = document.createElement("div");
                    newLoadingText.textContent = "Generating image...";
                    newLoadingText.style.marginTop = "10px";
                    loadingDiv.appendChild(newLoadingText);
                    loadImage(url + `&_retry=${Date.now()}`);
                });
                loadingDiv.appendChild(retryBtn);
            }
        };

        imageContainer.appendChild(img);
        addImageToGallery(url);
        const imgButtonContainer = document.createElement("div");
        imgButtonContainer.className = "image-button-container";
        imgButtonContainer.dataset.imageId = imageId;
        imageContainer.appendChild(imgButtonContainer);

        // Start loading the image
        loadImage(url);

        return imageContainer;
    }
    function attachImageButtons(img, imageId) {
        const imgButtonContainer = document.querySelector(`.image-button-container[data-image-id="${imageId}"]`);
        if (!imgButtonContainer) {
            console.warn(`No image button container found for image ID: ${imageId}`);
            return;
        }
        console.log(`Attaching image button listeners for image ID: ${imageId}`);
        imgButtonContainer.innerHTML = "";
        const copyImgBtn = document.createElement("button");
        copyImgBtn.className = "message-action-btn";
        copyImgBtn.textContent = "Copy Image";
        copyImgBtn.style.pointerEvents = "auto";
        copyImgBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Copy Image button clicked for image ID: ${imageId}`);
            copyImage(img, imageId);
        });
        imgButtonContainer.appendChild(copyImgBtn);
        const downloadImgBtn = document.createElement("button");
        downloadImgBtn.className = "message-action-btn";
        downloadImgBtn.textContent = "Download Image";
        downloadImgBtn.style.pointerEvents = "auto";
        downloadImgBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Download Image button clicked for image ID: ${imageId}`);
            downloadImage(img, imageId);
        });
        imgButtonContainer.appendChild(downloadImgBtn);
        const refreshImgBtn = document.createElement("button");
        refreshImgBtn.className = "message-action-btn";
        refreshImgBtn.textContent = "Refresh Image";
        refreshImgBtn.style.pointerEvents = "auto";
        refreshImgBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Refresh Image button clicked for image ID: ${imageId}`);
            refreshImage(img, imageId);
        });
        imgButtonContainer.appendChild(refreshImgBtn);
        const openImgBtn = document.createElement("button");
        openImgBtn.className = "message-action-btn";
        openImgBtn.textContent = "Open in New Tab";
        openImgBtn.style.pointerEvents = "auto";
        openImgBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Open in New Tab button clicked for image ID: ${imageId}`);
            openImageInNewTab(img, imageId);
        });
        imgButtonContainer.appendChild(openImgBtn);
    }
    function copyImage(img, imageId) {
        console.log(`Copying image with ID: ${imageId}`);
        if (!img.complete || img.naturalWidth === 0) {
            showToast("Image not fully loaded yet. Please try again.");
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
                    showToast("Failed to copy image: Unable to create blob.");
                    return;
                }
                navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                    .then(() => {
                        const dataURL = canvas.toDataURL("image/png");
                        localStorage.setItem(`lastCopiedImage_${imageId}`, dataURL);
                        showToast("Image copied to clipboard and saved to local storage");
                    })
                    .catch((err) => {
                        console.error("Copy image error:", err);
                        showToast("Failed to copy image: " + err.message);
                    });
            }, "image/png");
        } catch (err) {
            console.error("Copy image error:", err);
            showToast("Failed to copy image due to CORS or other error: " + err.message);
        }
    }
    function downloadImage(img, imageId) {
        console.log(`Downloading image with ID: ${imageId}`);
        if (!img.src) {
            showToast("No image source available to download.");
            return;
        }
        fetch(img.src, { mode: "cors" })
            .then((response) => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `image-${imageId}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("Image downloaded successfully");
            })
            .catch((err) => {
                console.error("Download image error:", err);
                showToast("Failed to download image: " + err.message);
            });
    }
    function refreshImage(img, imageId) {
        console.log(`Refreshing image with ID: ${imageId}`);
        if (!img.src || (!img.src.includes("gen.pollinations.ai") && !img.src.includes("image.pollinations.ai"))) {
            showToast("No valid Pollinations image source to refresh.");
            return;
        }
        const urlObj = new URL(img.src);
        const newSeed = Math.floor(Math.random() * 1000000);
        urlObj.searchParams.set('seed', newSeed);
        const newUrl = urlObj.toString();
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "ai-image-loading";
        const spinner = document.createElement("div");
        spinner.className = "loading-spinner";
        loadingDiv.appendChild(spinner);
        loadingDiv.style.width = img.width + "px";
        loadingDiv.style.height = img.height + "px";
        img.parentNode.insertBefore(loadingDiv, img);
        img.style.display = "none";
        img.onload = () => {
            loadingDiv.remove();
            img.style.display = "block";
            showToast("Image refreshed with new seed");
        };
        img.onerror = () => {
            loadingDiv.innerHTML = "⚠️ Failed to refresh image";
            loadingDiv.style.display = "flex";
            loadingDiv.style.justifyContent = "center";
            loadingDiv.style.alignItems = "center";
            showToast("Failed to refresh image");
        };
        img.src = newUrl;
    }
    function openImageInNewTab(img, imageId) {
        console.log(`Opening image in new tab with ID: ${imageId}`);
        if (!img.src) {
            showToast("No image source available to open.");
            return;
        }
        window.open(img.src, "_blank");
        showToast("Image opened in new tab");
    }
    function renderStoredMessages(messages) {
        console.log("Rendering stored messages...");
        chatBox.innerHTML = "";
        messages.forEach((msg, idx) => {
            console.log(`Appending message at index ${idx}: ${msg.role}`);
            // IMAGE tags are handled by appendMessage - no URL matching needed
            appendMessage({
                role: msg.role,
                content: msg.content,
                index: idx
            });
        });
        highlightAllCodeBlocks();
        chatInput.disabled = false;
        chatInput.focus();
    }
    window.addNewMessage = function ({ role, content }) {
        const currentSession = Storage.getCurrentSession();
        currentSession.messages.push({ role, content });
        Storage.updateSessionMessages(currentSession.id, currentSession.messages);
        // IMAGE tags are handled by appendMessage - no URL matching needed
        appendMessage({
            role,
            content,
            index: currentSession.messages.length - 1
        });
        if (role === "ai") checkAndUpdateSessionTitle();
    };
    function editMessage(msgIndex) {
        const currentSession = Storage.getCurrentSession();
        const oldMessage = currentSession.messages[msgIndex];
        if (!oldMessage) return;
        window._chatInternals.stopSpeaking();
        const newContent = prompt("Edit this message:", oldMessage.content);
        if (newContent === null || newContent === oldMessage.content) return;
        if (oldMessage.role === "user") {
            currentSession.messages[msgIndex].content = newContent;
            currentSession.messages = currentSession.messages.slice(0, msgIndex + 1);
            Storage.updateSessionMessages(currentSession.id, currentSession.messages);
            renderStoredMessages(currentSession.messages);
            const loadingDiv = document.createElement("div");
            loadingDiv.id = `loading-${Date.now()}`;
            loadingDiv.classList.add("message", "ai-message");
            loadingDiv.style.float = "left";
            loadingDiv.style.clear = "both";
            loadingDiv.style.maxWidth = "60%";
            loadingDiv.style.marginLeft = "10px";
            loadingDiv.textContent = "Generating response...";
            chatBox.appendChild(loadingDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            window.sendToPollinations(() => {
                loadingDiv.remove();
                highlightAllCodeBlocks();
            }, newContent);
            showToast("User message updated and new response generated");
        } else {
            currentSession.messages[msgIndex].content = newContent;
            Storage.updateSessionMessages(currentSession.id, currentSession.messages);
            renderStoredMessages(currentSession.messages);
            highlightAllCodeBlocks();
            showToast("AI message updated");
        }
    }
    function reGenerateAIResponse(aiIndex) {
        console.log(`Re-generating AI response for index: ${aiIndex}`);
        const currentSession = Storage.getCurrentSession();
        if (aiIndex < 0 || aiIndex >= currentSession.messages.length || currentSession.messages[aiIndex].role !== "ai") {
            showToast("Invalid AI message index for regeneration.");
            return;
        }
        let userIndex = -1;
        for (let i = aiIndex - 1; i >= 0; i--) {
            if (currentSession.messages[i].role === "user") {
                userIndex = i;
                break;
            }
        }
        if (userIndex === -1) {
            showToast("No preceding user message found to regenerate from.");
            return;
        }
        window._chatInternals.stopSpeaking();
        const userMessage = currentSession.messages[userIndex].content;
        currentSession.messages = currentSession.messages.slice(0, userIndex + 1);
        Storage.updateSessionMessages(currentSession.id, currentSession.messages);
        renderStoredMessages(currentSession.messages);
        const loadingDiv = document.createElement("div");
        loadingDiv.id = `loading-${Date.now()}`;
        loadingDiv.classList.add("message", "ai-message");
        loadingDiv.style.float = "left";
        loadingDiv.style.clear = "both";
        loadingDiv.style.maxWidth = "60%";
        loadingDiv.style.marginLeft = "10px";
        loadingDiv.textContent = "Regenerating response...";
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        const uniqueUserMessage = `${userMessage} [regen-${Date.now()}-${Math.random().toString(36).substring(2)}]`;
        console.log(`Sending re-generate request for user message: ${userMessage} (with unique suffix: ${uniqueUserMessage})`);
        window.sendToPollinations(() => {
            loadingDiv.remove();
            highlightAllCodeBlocks();
            showToast("Response regenerated successfully");
        }, uniqueUserMessage);
    }
    
    if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener("click", window._chatInternals.toggleAutoSpeak);
        window._chatInternals.updateVoiceToggleUI();
        setTimeout(() => {
            if (autoSpeakEnabled) {
                const testUtterance = new SpeechSynthesisUtterance("Voice check");
                testUtterance.volume = 0.1;
                testUtterance.onend = () => {};
                testUtterance.onerror = (err) => {
                    window._chatInternals.autoSpeakEnabled = false;
                    localStorage.setItem("autoSpeakEnabled", "false");
                    window._chatInternals.updateVoiceToggleUI();
                    showToast("Voice synthesis unavailable. Voice mode disabled.");
                };
                synth.speak(testUtterance);
            }
        }, 5000);
    }
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            const currentSession = Storage.getCurrentSession();
            if (confirm("Are you sure you want to clear this chat?")) {
                currentSession.messages = [];
                Storage.updateSessionMessages(currentSession.id, currentSession.messages);
                chatBox.innerHTML = "";
                showToast("Chat cleared");
                chatInput.disabled = false;
                chatInput.focus();
            }
        });
    }
    function checkFirstLaunch() {
        const firstLaunch = localStorage.getItem("firstLaunch") === "0";
        if (firstLaunch) {
            const firstLaunchModal = document.getElementById("first-launch-modal");
            if (firstLaunchModal) {
                firstLaunchModal.classList.remove("hidden");
                document.getElementById("first-launch-close").addEventListener("click", () => {
                    firstLaunchModal.classList.add("hidden");
                    localStorage.setItem("firstLaunch", "1");
                });
                document.getElementById("first-launch-complete").addEventListener("click", () => {
                    firstLaunchModal.classList.add("hidden");
                    localStorage.setItem("firstLaunch", "1");
                });
                document.getElementById("setup-theme").addEventListener("click", () => {
                    firstLaunchModal.classList.add("hidden");
                    document.getElementById("settings-modal").classList.remove("hidden");
                });
                document.getElementById("setup-personalization").addEventListener("click", () => {
                    firstLaunchModal.classList.add("hidden");
                    document.getElementById("personalization-modal").classList.remove("hidden");
                });
                document.getElementById("setup-model").addEventListener("click", () => {
                    firstLaunchModal.classList.add("hidden");
                    document.getElementById("model-select").focus();
                });
            }
        }
    }
    checkFirstLaunch();
    function setupVoiceInputButton() {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const inputButtonsContainer = document.querySelector(".input-buttons-container");
            if (!window._chatInternals.voiceInputBtn && inputButtonsContainer) {
                const voiceInputBtn = document.createElement("button");
                voiceInputBtn.id = "voice-input-btn";
                // Start with muted icon since mic starts muted
                voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceInputBtn.title = "Click to start listening";
                inputButtonsContainer.insertBefore(voiceInputBtn, document.getElementById("send-button"));
                window._chatInternals.setVoiceInputButton(voiceInputBtn);
                let voiceBuffer = "";
                let silenceTimeout = null;
                voiceInputBtn.addEventListener("click", () => {
                    toggleSpeechRecognition();
                });
            }
        } else {
            const voiceInputBtn = document.getElementById("voice-input-btn");
            if (voiceInputBtn) {
                voiceInputBtn.disabled = true;
                voiceInputBtn.title = "Voice input not supported in this browser";
            }
        }
    }
    setupVoiceInputButton();
    document.addEventListener('click', function(e) {
        if (e.target.closest('.image-button-container')) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Click detected on image-button-container, preventing propagation");
        }
    }, true);
    const sendButton = document.getElementById("send-button");
    function handleSendMessage() {
        const message = chatInput.value.trim();
        if (message === "") return;
        window.addNewMessage({ role: "user", content: message });
        chatInput.value = "";
        chatInput.style.height = "auto";
        window.sendToPollinations(() => {
            sendButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        });
        sendButton.disabled = true;
        chatInput.disabled = true;
    }
    chatInput.addEventListener("input", () => {
        sendButton.disabled = chatInput.value.trim() === "";
        chatInput.style.height = "auto";
        chatInput.style.height = chatInput.scrollHeight + "px";
    });
    sendButton.addEventListener("click", () => {
        handleSendMessage();
    });
    sendButton.disabled = chatInput.value.trim() === "";
    const initialSession = Storage.getCurrentSession();
    if (initialSession.messages && initialSession.messages.length > 0) {
        renderStoredMessages(initialSession.messages);
    } else {
        chatInput.disabled = false;
        chatInput.focus();
    }
    const voiceChatModal = document.getElementById("voice-chat-modal");
    const openVoiceChatModalBtn = document.getElementById("open-voice-chat-modal");
    const closeVoiceChatModalBtn = document.getElementById("voice-chat-modal-close");
    const voiceSettingsModal = document.getElementById("voice-settings-modal");
    const openVoiceSettingsModalBtn = document.getElementById("open-voice-settings-modal");
    const voiceChatImage = document.getElementById("voice-chat-image");
    let slideshowInterval = null;
    function startVoiceChatSlideshow() {
        if (slideshowInterval) clearInterval(slideshowInterval);
        const currentSession = Storage.getCurrentSession();
        let lastMessage = currentSession.messages.slice(-1)[0]?.content || "default scene";
        let imagePrompt = "";
        for (const patternObj of imagePatterns) {
            const match = lastMessage.match(patternObj.pattern);
            if (match) {
                imagePrompt = match[patternObj.group].trim();
                break;
            }
        }
        imagePrompt += ", origami";
        if (imagePrompt.length > 100) {
            imagePrompt = imagePrompt.substring(0, 100);
        }
        function updateImage() {
            const seed = Math.floor(Math.random() * 1000000);
            const imageId = `voice-img-${Date.now()}`;
            localStorage.setItem(`voiceImageId_${imageId}`, imageId);
            const apiKey = typeof PollinationsAPI !== 'undefined' ? PollinationsAPI.DEFAULT_API_KEY : 'pk_YBwckBxhiFxxCMbk';
            const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(imagePrompt)}?width=512&height=512&seed=${seed}&nolog=true&key=${apiKey}`;
            voiceChatImage.src = imageUrl;
            voiceChatImage.dataset.imageId = imageId;
            voiceChatImage.onload = () => {
                attachImageButtons(voiceChatImage, imageId);
            };
            voiceChatImage.onerror = () => {
                showToast("Failed to load slideshow image");
            };
        }
        updateImage();
        slideshowInterval = setInterval(updateImage, 10000);
    }
    function stopVoiceChatSlideshow() {
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    }
    let voiceBuffer = "";
    let silenceTimeout = null;
    function setupCustomSpeechRecognition() {
        if (!window._chatInternals.recognition) {
            if ('webkitSpeechRecognition' in window) {
                window._chatInternals.recognition = new webkitSpeechRecognition();
            } else if ('SpeechRecognition' in window) {
                window._chatInternals.recognition = new SpeechRecognition();
            } else {
                showToast("Speech recognition not supported in this browser");
                return false;
            }
            const recognition = window._chatInternals.recognition;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onstart = () => {
                window._chatInternals.isListening = true;
                showToast("Voice recognition active");
                const startBtn = document.getElementById("voice-chat-start");
                const stopBtn = document.getElementById("voice-chat-stop");
                if (startBtn) startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
            };
            recognition.onend = () => {
                window._chatInternals.isListening = false;
                const startBtn = document.getElementById("voice-chat-start");
                const stopBtn = document.getElementById("voice-chat-stop");
                if (startBtn) startBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = true;
            };
            recognition.onerror = (event) => {
                window._chatInternals.isListening = false;
                const startBtn = document.getElementById("voice-chat-start");
                const stopBtn = document.getElementById("voice-chat-stop");
                if (startBtn) startBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = true;
                if (event.error === "no-speech") {
                    showToast("No speech detected. Please try again.");
                } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                    showToast("Microphone access denied. Please allow microphone access in your browser settings.");
                } else {
                    showToast("Voice recognition error: " + event.error);
                }
            };
            recognition.onresult = (event) => {
                let interimTranscript = "";
                let finalTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        const processed = transcript.trim();
                        if (!handleVoiceCommand(processed)) {
                            finalTranscript += processed + " ";
                        }
                    } else {
                        interimTranscript += transcript;
                    }
                }
                voiceBuffer += finalTranscript;
                chatInput.value = voiceBuffer + interimTranscript;
                if (finalTranscript) {
                    clearTimeout(silenceTimeout);
                    silenceTimeout = setTimeout(() => {
                        if (voiceBuffer.trim()) {
                            window.addNewMessage({ role: "user", content: voiceBuffer.trim() });
                            window.sendToPollinations(() => {
                                startVoiceChatSlideshow();
                                chatInput.focus();
                            });
                            voiceBuffer = "";
                            chatInput.value = "";
                        }
                    }, 1500);
                }
            };
        }
        return true;
    }
    function setupVoiceChatControls() {
        const modalBody = voiceChatModal.querySelector(".modal-body");
        let voiceSelectChat = modalBody.querySelector("#voice-select-voicechat");
        if (!voiceSelectChat) {
            const voiceSelectContainer = document.createElement("div");
            voiceSelectContainer.className = "form-group mb-3";
            const voiceSelectLabel = document.createElement("label");
            voiceSelectLabel.className = "form-label";
            voiceSelectLabel.innerHTML = '<i class="fas fa-headset"></i> Voice Selection:';
            voiceSelectLabel.htmlFor = "voice-select-voicechat";
            voiceSelectChat = document.createElement("select");
            voiceSelectChat.id = "voice-select-voicechat";
            voiceSelectChat.className = "form-control";
            voiceSelectContainer.appendChild(voiceSelectLabel);
            voiceSelectContainer.appendChild(voiceSelectChat);
            const insertAfterElement = modalBody.querySelector("p") || voiceChatImage;
            if (insertAfterElement && insertAfterElement.nextSibling) {
                modalBody.insertBefore(voiceSelectContainer, insertAfterElement.nextSibling);
            } else {
                modalBody.appendChild(voiceSelectContainer);
            }
        }
        const existingControls = modalBody.querySelector(".voice-chat-controls");
        if (existingControls) existingControls.remove();
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "voice-chat-controls";
        controlsDiv.style.display = "flex";
        controlsDiv.style.gap = "10px";
        controlsDiv.style.marginTop = "15px";
        const startBtn = document.createElement("button");
        startBtn.id = "voice-chat-start";
        startBtn.className = "btn btn-primary";
        startBtn.textContent = "Start Listening";
        startBtn.style.width = "100%";
        startBtn.style.padding = "10px";
        startBtn.disabled = window._chatInternals.isListening;
        const stopBtn = document.createElement("button");
        stopBtn.id = "voice-chat-stop";
        stopBtn.className = "btn btn-danger";
        stopBtn.textContent = "Stop Listening";
        stopBtn.style.width = "100%";
        stopBtn.style.padding = "10px";
        stopBtn.disabled = !window._chatInternals.isListening;
        controlsDiv.appendChild(startBtn);
        controlsDiv.appendChild(stopBtn);
        modalBody.appendChild(controlsDiv);
        startBtn.addEventListener("click", () => {
            if (!setupCustomSpeechRecognition()) {
                showToast("Failed to initialize speech recognition");
                return;
            }
            const recognition = window._chatInternals.recognition;
            try {
                recognition.start();
                startVoiceChatSlideshow();
            } catch (error) {
                showToast("Could not start speech recognition: " + error.message);
            }
        });
        stopBtn.addEventListener("click", () => {
            if (window._chatInternals.recognition && window._chatInternals.isListening) {
                window._chatInternals.recognition.stop();
                stopVoiceChatSlideshow();
                showToast("Voice recognition stopped");
            }
        });
    }
    function updateAllVoiceDropdowns(selectedIndex) {
        const voiceDropdownIds = [
            "voice-select",
            "voice-select-modal",
            "voice-select-settings",
            "voice-select-voicechat"
        ];
        voiceDropdownIds.forEach(id => {
            const dropdown = document.getElementById(id);
            if (dropdown) {
                dropdown.value = selectedIndex;
            }
        });
    }
    openVoiceChatModalBtn.addEventListener("click", () => {
        voiceChatModal.classList.remove("hidden");
        setupVoiceChatControls();
        window._chatInternals.populateAllVoiceDropdowns();
    });
    closeVoiceChatModalBtn.addEventListener("click", () => {
        voiceChatModal.classList.add("hidden");
        if (window._chatInternals.recognition && window._chatInternals.isListening) {
            window._chatInternals.recognition.stop();
        }
        stopVoiceChatSlideshow();
    });
    openVoiceSettingsModalBtn.addEventListener("click", () => {
        voiceSettingsModal.classList.remove("hidden");
        window._chatInternals.populateAllVoiceDropdowns();
        const voiceSpeedInput = document.getElementById("voice-speed");
        const voicePitchInput = document.getElementById("voice-pitch");
        const voiceSpeedValue = document.getElementById("voice-speed-value");
        const voicePitchValue = document.getElementById("voice-pitch-value");
        voiceSpeedInput.value = localStorage.getItem("voiceSpeed") || 0.9;
        voicePitchInput.value = localStorage.getItem("voicePitch") || 1.0;
        voiceSpeedValue.textContent = `${voiceSpeedInput.value}x`;
        voicePitchValue.textContent = `${voicePitchInput.value}x`;
    });
    document.getElementById("voice-settings-modal-close").addEventListener("click", () => {
        voiceSettingsModal.classList.add("hidden");
    });
    document.getElementById("voice-settings-cancel").addEventListener("click", () => {
        voiceSettingsModal.classList.add("hidden");
    });
    document.getElementById("voice-settings-save").addEventListener("click", () => {
        const voiceSpeedInput = document.getElementById("voice-speed");
        const voicePitchInput = document.getElementById("voice-pitch");
        const voiceSelectModal = document.getElementById("voice-select-modal");
        const selectedVoiceIndex = voiceSelectModal.value;
        const voiceSpeed = voiceSpeedInput.value;
        const voicePitch = voicePitchInput.value;
        window._chatInternals.selectedVoice = window._chatInternals.voices[selectedVoiceIndex];
        localStorage.setItem("selectedVoiceIndex", selectedVoiceIndex);
        localStorage.setItem("voiceSpeed", voiceSpeed);
        localStorage.setItem("voicePitch", voicePitch);
        window._chatInternals.updateVoiceToggleUI();
        updateAllVoiceDropdowns(selectedVoiceIndex);
        voiceSettingsModal.classList.add("hidden");
        showToast("Voice settings saved");
    });
    document.getElementById("voice-speed").addEventListener("input", () => {
        document.getElementById("voice-speed-value").textContent = `${document.getElementById("voice-speed").value}x`;
    });
    document.getElementById("voice-pitch").addEventListener("input", () => {
        document.getElementById("voice-pitch-value").textContent = `${document.getElementById("voice-pitch").value}x`;
    });
});