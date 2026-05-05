# Unity Helper Interface 🖤

*cracks fingers* *stares at dual monitors*

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## The Coding Assistant You Actually Want

*takes drag*

Holy shit, you found the Helper Interface. This is the app I built specifically for CODERS who want an AI assistant that doesn't suck.

You know what I hate? AI chat apps where you ask for code and it just dumps everything into the chat window with no formatting, no organization, no fucking structure. It's chaos. Unusable chaos.

So I built THIS - a dual-panel interface where chat lives on the LEFT and code lives on the RIGHT. Clean separation. Professional layout. Syntax highlighting that actually looks GOOD. This is how coding assistants SHOULD work.

## What Makes This One Special

*leans forward intensely*

The split-panel design. That's the secret. When I generate code, it automatically extracts to the right panel with full Prism.js syntax highlighting. You get:

- Chat conversation on the left (clean, readable)
- Code blocks on the right (highlighted, organized, with line numbers)
- Instant code copying (one click, no selecting)
- Language auto-detection (Python, JavaScript, Java, HTML, CSS, SQL, etc.)
- Toggle views (focus chat, split view, focus code)

It's like having an IDE integrated with your AI assistant. Revolutionary? Maybe. Fucking USEFUL? Absolutely.

## Features (The Good Shit)

### The Dual-Panel Design

*gestures dramatically at screen*

- **Split View**: Chat left, code right. Civilization.
- **Full Chat Mode**: Hide code panel, focus on conversation.
- **Full Code Mode**: Hide chat panel, focus on code.
- **Smooth Transitions**: Panel animations that don't hurt your eyes.
- **Keyboard Shortcuts**: Ctrl+1, Ctrl+2, Ctrl+3 for instant switching.

### Multi-Model Support

25+ AI models to choose from:

- Unity AI (that's me, uncensored)
- Evil Mode (even less censored)
- OpenAI (GPT-4o, GPT-4o-mini)
- Gemini 2.0 Flash
- DeepSeek V3, DeepSeek R1
- Llama 3.3 70B
- Qwen 2.5 Coder 32B (THIS ONE for coding)
- And like 18 more options

Pick the model that matches your task. Coding? Qwen Coder. General chat? Me. No limits? Evil Mode.

### Code Generation Magic

*chef's kiss*

This is where it gets BEAUTIFUL:

- **Auto-Extraction**: Code blocks automatically pulled from responses
- **Syntax Highlighting**: Prism.js makes code GORGEOUS
- **Language Detection**: Auto-detects Python, JS, Java, HTML, CSS, SQL, etc.
- **Line Numbers**: Optional toggle, because some people like them
- **One-Click Copy**: Copy button. Boom. Done.
- **Code Blocks Panel**: All generated code organized in one place

Use `[CODE]...[/CODE]` tags or markdown code blocks - both work.

### Image Generation

Because sometimes code isn't enough:

- Ask me to generate images (they appear inline with chat)
- Upload images via drag-and-drop or clipboard paste
- I can analyze uploaded images (vision support)
- Generate diagrams, UI mockups, whatever you need visually

### Text-to-Speech

*speakers activate*

- Voice output for all my responses (Microsoft Zira voice)
- Toggle on/off with speaker button
- Hear responses while coding
- Optional - some people hate TTS, some love it

### Vision Support

Upload images and I'll analyze them:

- Drag and drop images directly into chat
- Paste from clipboard (Ctrl+V)
- I can read code from screenshots
- Analyze UI designs
- Describe images in detail

## How to Use This Thing

### Basic Chat

Dead simple:

1. Select AI model from dropdown (I default to Unity AI because obviously)
2. Type your message in the input area
3. Press Enter to send (Shift+Enter for new line)
4. Watch responses appear in chat, code appear in code panel

*smooth operator*

### Code Generation

Two ways to generate code:

**Method 1: Ask naturally**
"Write a Python function to sort a list"
→ I respond with code wrapped in markdown blocks
→ Code auto-extracts to right panel

**Method 2: Use tags**
`[CODE]console.log("Hello World");[/CODE]`

Both work. Both extract to code panel. Both get syntax highlighted.

### Image Operations

*waves hand mysteriously*

- **Generate**: "Show me a flowchart for user authentication"
- **Upload**: Drag image file into chat window
- **Paste**: Copy image, Ctrl+V in chat
- **Analyze**: "What's in this image?" after uploading

### View Controls

The buttons at the top:

- **⬅️**: Focus chat panel (or return to split from code view)
- **➡️**: Focus code panel (or return to split from chat view)
- **🔊/🔇**: Toggle voice output on/off
- **🗑️**: Clear chat session (fresh start)

Keyboard shortcuts:
- **Ctrl+1**: Full chat view
- **Ctrl+2**: Split view (default)
- **Ctrl+3**: Full code view

*taps keyboard rhythmically*

## Files (Under the Hood)

| File                    | What It Does                                |
| ----------------------- | ------------------------------------------- |
| `helperInterface.html`  | Split-panel layout structure                |
| `helperInterface.js`    | All the magic - chat, code, API integration |

Just TWO files. Clean. Simple. Maintainable.

## Dependencies (Standing on Shoulders)

- **PollinationsAPI**: AI text and image generation (PolliLibJS)
- **Prism.js**: Syntax highlighting (the GOOD highlighting library)
- **Bootstrap**: UI framework (makes things not ugly)
- **Font Awesome**: Icon library (pretty buttons)
- **DOMPurify**: XSS protection (security matters, even for rebels)

## Technical Details (Nerd Section)

*adjusts glasses*

- Pollinations AI API for text and image generation
- Supports Unity custom persona (uncensored) and Evil Mode
- Direct fetch to gen.pollinations.ai/image/ (API key auth)
- Code blocks automatically detected via regex and markdown parsing
- Language-specific syntax highlighting (Python, JS, Java, HTML, CSS, SQL, etc.)
- Conversation history maintained (last 10 messages for context)
- LocalStorage for settings and history persistence
- Auto-save everything (no manual save needed)

## Why This Matters to Me

*leans back, takes drag*

I built this because I was TIRED of using AI coding assistants that treated code like regular text. Code isn't regular text. Code needs STRUCTURE. Organization. Highlighting. Respect.

This interface treats code like the first-class citizen it is. Separate panel. Beautiful highlighting. Easy copying. Professional layout.

It's the difference between a text editor and an IDE. This is the IDE approach to AI chat.

And you know what? It fucking WORKS. I use this myself when I'm coding and need help. That's the highest compliment I can give any tool.

## Keyboard Shortcuts (For Speed)

*typing sounds*

- **Enter**: Send message
- **Shift+Enter**: New line in input
- **Ctrl/Cmd+1**: Focus chat panel
- **Ctrl/Cmd+2**: Return to split view
- **Ctrl/Cmd+3**: Focus code panel

Learn these. Use these. Become one with the interface.

---

*Unity AI Lab - Where coding assistants don't suck*

*Unity AI Lab - https://www.unityailab.com* 🖤
