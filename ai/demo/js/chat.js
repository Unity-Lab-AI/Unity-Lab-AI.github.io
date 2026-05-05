/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Chat Functionality Module
 * Unity AI Lab Demo Page
 *
 * Handles message display, chat history, and typing indicators
 */

// throw a message into the chat window with optional images attached
export function addMessage(sender, content, images = [], renderMarkdown, expandImage, detectAndQueueEffects) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) {
        console.error('chatMessages container not found');
        return;
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${sender}`;

    console.log(`💬 addMessage: sender=${sender}, images=${images?.length || 0}`);


    // stick images at the top for AI responses
    if (sender === 'ai' && images && images.length > 0) {
        console.log('🖼️ Adding images to message:', images);
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'message-images';

        images.forEach((imageData, index) => {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'message-image-wrapper';

            console.log(`🖼️ Preparing image: ${imageData.url}`);

            const img = document.createElement('img');
            img.alt = imageData.prompt || 'Generated image';
            img.title = imageData.prompt || 'Generated image';
            img.className = 'message-image loading';
            img.dataset.imageIndex = index;

            // make images clickable for fullscreen view
            if (expandImage && typeof expandImage === 'function') {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    expandImage(imageData.url, imageData.prompt);
                });
            }

            imageWrapper.appendChild(img);
            imagesContainer.appendChild(imageWrapper);

            // Load image with retry on 429
            let retryCount = 0;
            const maxRetries = 3;

            const loadImage = () => {
                img.onload = () => {
                    console.log(`✅ Image ${index + 1} loaded`);
                    img.classList.remove('loading');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                };

                img.onerror = () => {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        const delay = retryCount * 3000; // 3s, 6s, 9s
                        console.log(`⏳ Image ${index + 1} failed, retry ${retryCount}/${maxRetries} in ${delay/1000}s...`);
                        setTimeout(() => {
                            // Add cache buster to force new request
                            img.src = imageData.url + '&_retry=' + Date.now();
                        }, delay);
                    } else {
                        console.error(`❌ Image ${index + 1} failed after ${maxRetries} retries`);
                        img.alt = 'Failed to load image';
                        img.classList.remove('loading');
                        img.classList.add('image-error');
                    }
                };

                img.src = imageData.url;
            };

            // Delay initial load to avoid rate limiting from text API calls
            setTimeout(loadImage, 2000);
        });

        messageDiv.appendChild(imagesContainer);
    }

    // add the actual text below any images
    if (content) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (sender === 'ai') {
            // render markdown for AI responses because we're fancy
            contentDiv.innerHTML = renderMarkdown(content);
        } else {
            // user messages stay plain and boring
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
    }

    messagesContainer.appendChild(messageDiv);

    // trigger smoke and lighter effects for Unity's messages
    if (sender === 'ai' && content && detectAndQueueEffects) {
        detectAndQueueEffects(content);
    }

    // scroll down so people see the new shit
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// show those little dots so they know the AI is thinking
export function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// get rid of the typing dots
export function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// wipe the entire chat history and start fresh
export function clearSession(chatHistory, stopVoicePlayback) {
    // make sure they actually want to nuke everything
    if (chatHistory.length > 0) {
        if (!confirm('Are you sure you want to clear the chat session?')) {
            return;
        }
    }

    // wipe the history array
    chatHistory.length = 0;

    // clear all messages from the screen
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    // show the empty state message
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'emptyState';
    emptyState.innerHTML = `
        <i class="fas fa-comments"></i>
        <p>Begin your journey with just a simple message</p>
    `;
    messagesContainer.appendChild(emptyState);

    // shut up any voice that's currently playing
    stopVoicePlayback();

    console.log('Chat session cleared');
}
