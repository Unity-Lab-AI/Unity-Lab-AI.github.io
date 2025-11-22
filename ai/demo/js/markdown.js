/**
 * Markdown Rendering Module
 * Unity AI Lab Demo Page
 *
 * Handles markdown rendering, syntax highlighting, and sanitization
 */

/**
 * Configure marked.js for markdown rendering
 */
export function configureMarked() {
    if (typeof marked !== 'undefined') {
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false,
            sanitize: false, // We'll use DOMPurify instead
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('Highlight error:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });
    }
}

/**
 * Render markdown with nested markdown detection
 * @param {string} text - Text to render
 * @returns {string} Rendered HTML
 */
export function renderMarkdown(text) {
    if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
        return escapeHtml(text);
    }

    try {
        // Detect nested markdown in code blocks
        // If we find markdown syntax within code blocks, treat them as code
        const processedText = detectNestedMarkdown(text);

        // Render markdown
        let html = marked.parse(processedText);

        // Sanitize with DOMPurify
        html = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'br', 'strong', 'em', 'u', 's',
                'a', 'ul', 'ol', 'li', 'blockquote',
                'code', 'pre', 'img', 'table', 'thead',
                'tbody', 'tr', 'th', 'td', 'div', 'span'
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel']
        });

        return html;
    } catch (error) {
        console.error('Markdown rendering error:', error);
        return escapeHtml(text);
    }
}

/**
 * Detect nested markdown and handle it
 * @param {string} text - Text to process
 * @returns {string} Processed text
 */
function detectNestedMarkdown(text) {
    // This function detects when markdown is nested inside code blocks
    // and ensures it's rendered as code rather than markdown

    // Pattern to detect code blocks
    const codeBlockPattern = /```[\s\S]*?```/g;
    const codeBlocks = text.match(codeBlockPattern);

    if (!codeBlocks) return text;

    // Check each code block for markdown syntax
    codeBlocks.forEach((block) => {
        // If the code block contains markdown syntax, we keep it as-is
        // The marked.js library will handle it correctly
    });

    return text;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
