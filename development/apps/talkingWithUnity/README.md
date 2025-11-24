# Talk to Unity

This project is a simple, voice-controlled AI assistant that runs in your web browser.

## How it Works

The application is designed to be simple and intuitive. Here's a breakdown of the experience:

1.  **System Check:** When you first open the application, you'll see a landing page with a system check. This check ensures your browser has everything needed for the voice assistant to work correctly.
2.  **The Lights:** The system check uses a series of "lights" to indicate the status of each requirement. Green means you're good to go. Amber means there's something to fix.
3.  **The AI Experience:** Once all the lights are green, you can launch the AI assistant. You'll see a clean interface with a microphone button. Click it to talk to Unity, your voice-activated AI assistant.
4.  **Images:** The AI can generate and display images based on your conversation.

## How to Get All Green Lights

To get all the lights on the landing page to turn green, you need to make sure your setup meets the following requirements:

*   **Secure Connection (HTTPS or localhost):** The application must be run from a secure context. This means the URL in your browser's address bar should start with `https://` or `http://localhost`.
*   **Web Speech Recognition API:** You'll need a modern browser that supports the Web Speech API. We recommend the latest versions of Chrome, Edge, or Safari.
*   **Speech Synthesis Voices:** To hear the AI's responses, your browser needs to support speech synthesis. This is usually available in the recommended browsers.
*   **Microphone Access:** The application needs permission to use your microphone. When your browser asks for permission, make sure to click "Allow".

If any of the lights are amber, follow the instructions on the screen to fix the issue, and then click the "Check again" button.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Unity-Lab-AI/Talking-with-Unity.git
    cd Talking-with-Unity
    ```

2.  **Run a web server:**
    You don't need to install any dependencies to run this project. You can use any simple web server. If you have Python installed, you can use its built-in HTTP server:
    ```bash
    python -m http.server 8000
    ```

3.  **Open the application:**
    Open your web browser and navigate to `http://localhost:8000`.

## File Structure

| File              | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `index.html`      | The main HTML file for the application.                 |
| `indexAI.html`    | The HTML for the AI assistant interface.                |
| `style.css`       | The main stylesheet for the application.                |
| `styleAI.css`     | The stylesheet for the AI assistant interface.          |
| `app.js`          | The main JavaScript file for the application logic.     |
| `landing.js`      | The JavaScript file for the landing page.               |
| `ai-instruct.txt` | A text file containing the AI's system prompt.          |

## Feedback and Contributions

*   For issues and feedback, please open an issue on the [GitHub repository](https://github.com/Unity-Lab-AI/Talking-with-Unity.git/issues).
*   Contributions are welcome! Please feel free to submit a pull request.
