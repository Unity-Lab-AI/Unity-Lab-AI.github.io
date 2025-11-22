/**
 * Chat Functionality Module
 * Unity AI Lab Demo Page
 *
 * Handles message display, chat history, and typing indicators
 */

/**
 * Add a message to the chat (with optional images)
 * @param {string} sender - 'user' or 'ai'
 * @param {string} content - Message content
 * @param {Array} images - Optional array of image objects
 * @param {Function} renderMarkdown - Markdown renderer function
 * @param {Function} expandImage - Image expansion handler
 * @param {Function} detectAndQueueEffects - Effects detection function
 */
export function addMessage(sender, content, images = [], renderMarkdown, expandImage, detectAndQueueEffects) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${sender}`;

    // Add images at the top if present (for AI messages)
    if (sender === 'ai' && images && images.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'message-images';

        images.forEach((imageData, index) => {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'message-image-wrapper';

            const img = document.createElement('img');
            img.src = imageData.url;
            img.alt = imageData.prompt || 'Generated image';
            img.title = imageData.prompt || 'Generated image';
            img.className = 'message-image';
            img.dataset.imageIndex = index;

            // Add click handler for expansion
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                expandImage(imageData.url, imageData.prompt);
            });

            // Add loading handler
            img.onload = () => {
                console.log(`Image ${index + 1} loaded successfully`);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            };

            img.onerror = () => {
                console.error(`Image ${index + 1} failed to load`);
                img.alt = 'Failed to load image';
                img.classList.add('image-error');
            };

            imageWrapper.appendChild(img);
            imagesContainer.appendChild(imageWrapper);
        });

        messageDiv.appendChild(imagesContainer);
    }

    // Add text content below images
    if (content) {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (sender === 'ai') {
            // Render markdown for AI messages
            contentDiv.innerHTML = renderMarkdown(content);
        } else {
            // Plain text for user messages
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
    }

    messagesContainer.appendChild(messageDiv);

    // Trigger atmospheric effects for Unity AI messages
    if (sender === 'ai' && content && detectAndQueueEffects) {
        detectAndQueueEffects(content);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Show typing indicator
 */
export function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Remove typing indicator
 */
export function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Clear chat session
 * @param {Array} chatHistory - Chat history array (will be modified)
 * @param {Function} stopVoicePlayback - Voice playback stop function
 */
export function clearSession(chatHistory, stopVoicePlayback) {
    // Confirm before clearing
    if (chatHistory.length > 0) {
        if (!confirm('Are you sure you want to clear the chat session?')) {
            return;
        }
    }

    // Clear history
    chatHistory.length = 0;

    // Clear messages
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    // Show empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'emptyState';
    emptyState.innerHTML = `
        <i class="fas fa-comments"></i>
        <p>Begin your journey with just a simple message</p>
    `;
    messagesContainer.appendChild(emptyState);

    // Stop any playing audio
    stopVoicePlayback();

    console.log('Chat session cleared');
}
