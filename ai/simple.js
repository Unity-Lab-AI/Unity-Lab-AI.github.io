document.addEventListener("DOMContentLoaded", () => {
    // Inject CSS styles for Simple Mode
    const style = document.createElement("style");
    style.textContent = `
        #simple-mode-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #121212; color: #ffffff; z-index: 10000; display: flex; flex-direction: column; }
        .simple-header { padding: 10px; background-color: #1e1e1e; display: flex; justify-content: space-between; align-items: center; }
        .simple-header h2 { margin: 0; font-size: 1.2rem; }
        .simple-chat-box { flex: 1; overflow-y: auto; padding: 20px; }
        .simple-input-container { display: flex; padding: 12px 15px; background: #1e1e1e; align-items: center; }
        .simple-input { flex-grow: 1; background: #333333; color: #ffffff; border: 1px solid #555555; border-radius: 20px; font-size: 14px; padding: 12px 15px; resize: none; overflow-y: auto; min-height: 50px; max-height: 120px; transition: box-shadow 0.2s ease; }
        .simple-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(100,100,100,0.3); }
        .simple-send-btn { background-color: #4CAF50; color: white; border: none; padding: 10px 20px; margin-left: 10px; border-radius: 5px; cursor: pointer; font-size: 1rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
        .simple-send-btn:hover { transform: scale(1.05); background: #45a049; }
        .simple-send-btn:disabled { background: #555555; cursor: not-allowed; opacity: 0.6; }
        .simple-message { margin: 12px 0; padding: 12px 16px; border-radius: 18px; animation: fadeIn 0.3s ease; word-break: break-word; clear: both; max-width: 70%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .simple-user-message { background-color: #333333; color: #ffffff; float: right; border-bottom-right-radius: 6px; max-width: 40%; margin-right: 10px; }
        .simple-ai-message { background-color: #444444; color: #ffffff; float: left; border-bottom-left-radius: 6px; max-width: 60%; margin-left: 10px; }
        .simple-message-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .simple-action-btn { background: #555555; border: none; border-radius: 15px; padding: 6px 12px; font-size: 12px; cursor: pointer; transition: all 0.2s ease; color: #ffffff; min-width: 80px; text-align: center; }
        .simple-action-btn:hover { background: #666666; }
        .simple-message-text { width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
        .simple-ai-image-container { position: relative; margin: 10px 0; max-width: 100%; border-radius: 8px; overflow: hidden; }
        .simple-ai-image-loading { background-color: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; min-height: 200px; width: 512px; height: 512px; border-radius: 8px; }
        .simple-loading-spinner { border: 4px solid rgba(0,0,0,0.1); border-radius: 50%; border-top: 4px solid #666666; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .simple-image-button-container { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; z-index: 10; }
        .simple-ai-generated-image { position: relative; z-index: 1; display: block; pointer-events: none; max-width: 100%; border-radius: 8px; }
    `;
    document.head.appendChild(style);

    // Function to open Simple Mode
    function openSimpleMode() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById("simple-mode-modal");
        if (existingModal) existingModal.remove();

        // Create modal structure
        const modal = document.createElement("div");
        modal.id = "simple-mode-modal";
        const header = document.createElement("div");
        header.className = "simple-header";
        const title = document.createElement("h2");
        title.textContent = "Simple Mode";

        // Container for header buttons
        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.gap = "10px";

        // Mute Audio Toggle (muted by default)
        let isMuted = true; // Audio is muted on by default
        const muteBtn = document.createElement("button");
        muteBtn.className = "simple-action-btn";
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>'; // Initial icon shows muted state
        muteBtn.title = "Toggle audio mute";
        muteBtn.addEventListener("click", () => {
            isMuted = !isMuted;
            muteBtn.innerHTML = isMuted
                ? '<i class="fas fa-volume-mute"></i>'
                : '<i class="fas fa-volume-up"></i>';
        });

        // Clear Chat Button
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

        // Exit Button
        const exitBtn = document.createElement("button");
        exitBtn.className = "simple-action-btn";
        exitBtn.textContent = "Exit";
        exitBtn.title = "Exit simple mode";
        exitBtn.addEventListener("click", closeSimpleMode);

        // Append buttons to container
        buttonsContainer.appendChild(muteBtn);
        buttonsContainer.appendChild(clearBtn);
        buttonsContainer.appendChild(exitBtn);
        header.appendChild(title);
        header.appendChild(buttonsContainer);

        // Chat box and input container
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

        // Assemble modal
        inputContainer.appendChild(simpleInput);
        inputContainer.appendChild(simpleSendBtn);
        modal.appendChild(header);
        modal.appendChild(simpleChatBox);
        modal.appendChild(inputContainer);
        document.body.appendChild(modal);

        // Load existing messages
        const currentSession = Storage.getCurrentSession();
        currentSession.messages.forEach((msg, index) => {
            appendSimpleMessage(msg.role, msg.content, index);
        });

        // Input event listeners
        simpleInput.addEventListener("input", () => {
            simpleSendBtn.disabled = simpleInput.value.trim() === "";
            simpleInput.style.height = "auto";
            simpleInput.style.height = simpleInput.scrollHeight + "px";
        });

        simpleInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                simpleSendBtn.click();
            }
        });

        simpleSendBtn.addEventListener("click", () => {
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
            });
        });

        // Function to append messages
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
                const imgRegex = /(https:\/\/image\.pollinations\.ai\/prompt\/[^\s)"'<>]+)/g;
                let htmlContent = window.marked.parse(content);
                const imgMatches = content.match(imgRegex);
                if (imgMatches && imgMatches.length > 0) {
                    bubbleContent.innerHTML = htmlContent;
                    imgMatches.forEach((url) => {
                        const textNodes = [];
                        const walk = document.createTreeWalker(bubbleContent, NodeFilter.SHOW_TEXT, {
                            acceptNode: function(node) {
                                return node.nodeValue.includes(url) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                            }
                        });
                        let node;
                        while ((node = walk.nextNode())) {
                            textNodes.push(node);
                        }
                        textNodes.forEach((textNode) => {
                            if (textNode.nodeValue.includes(url)) {
                                const fragment = document.createDocumentFragment();
                                const parts = textNode.nodeValue.split(url);
                                if (parts[0]) fragment.appendChild(document.createTextNode(parts[0]));
                                const imageContainer = createSimpleImageElement(url);
                                fragment.appendChild(imageContainer);
                                if (parts[1]) fragment.appendChild(document.createTextNode(parts[1]));
                                textNode.parentNode.replaceChild(fragment, textNode);
                            }
                        });
                    });
                } else {
                    bubbleContent.innerHTML = htmlContent;
                }
            } else {
                bubbleContent.textContent = content;
            }
            container.appendChild(bubbleContent);

            // Add actions for AI messages
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
                container.appendChild(actionsDiv);
            }
            simpleChatBox.appendChild(container);
            simpleChatBox.scrollTop = simpleChatBox.scrollHeight;
        }

        // Function to create image elements
        function createSimpleImageElement(url) {
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
            img.crossOrigin = "anonymous";
            img.onload = () => {
                loadingDiv.remove();
                img.style.display = "block";
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
            const copyImgBtn = document.createElement("button");
            copyImgBtn.className = "simple-action-btn";
            copyImgBtn.textContent = "Copy Image";
            copyImgBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => window.showToast("Image copied"));
                }, "image/png");
            });
            imgButtonContainer.appendChild(copyImgBtn);
            const downloadImgBtn = document.createElement("button");
            downloadImgBtn.className = "simple-action-btn";
            downloadImgBtn.textContent = "Download Image";
            downloadImgBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                fetch(img.src, { mode: "cors" }).then(response => response.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `image-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    window.showToast("Image downloaded");
                });
            });
            imgButtonContainer.appendChild(downloadImgBtn);
            imageContainer.appendChild(imgButtonContainer);
            return imageContainer;
        }
    }

    // Function to close Simple Mode
    function closeSimpleMode() {
        const modal = document.getElementById("simple-mode-modal");
        if (modal) modal.remove();
    }

    // Event listener to open Simple Mode
    document.getElementById("toggle-simple-mode").addEventListener("click", openSimpleMode);
});