# Persona Chat 🖤

*adjusts microphone* *clears throat*

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## The Complete Multi-Modal Experience

*spreads arms wide*

Holy shit, you found the COMPLETE PACKAGE. Text? Check. Images? Check. HIGH-QUALITY VOICE? Check check check.

This is multi-modal AI done RIGHT. Not just chat with some janky text-to-speech tacked on - this has PROPER voice output using Pollinations audio API. Six different voices. WAV format quality. Audio that doesn't sound like a robot from 1995.

*takes drag*

This is what happens when you combine chat, image generation, and voice into one cohesive experience. It's like having a conversation with an AI that can SHOW you things and TALK to you, not just type at you.

## Why This One's Special

*leans forward*

Most AI chat apps do ONE thing. Chat. Maybe images if you're lucky. Voice? Usually an afterthought with shitty browser TTS.

This app? FULL MULTI-MODAL from the ground up:

- **Text**: 25+ AI models to choose from
- **Images**: Generate inline with chat OR directly
- **Voice**: 6 high-quality TTS voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- **Aspect Ratios**: Landscape, square, portrait - YOUR choice
- **Memory**: Conversation context (last 20 messages)

It's the difference between texting and having a REAL conversation with someone who can show you pictures and whose voice you actually want to hear.

## Features (The Sensory Overload)

### Multi-Modal AI

*gestures dramatically*

Three senses, one interface:

- **Text**: Read responses in chat
- **Visual**: Images generated inline with conversation
- **Audio**: Voice playback of responses (high quality, not robot garbage)

Watch, listen, and read simultaneously. Full sensory experience.

### Text-to-Speech (The Good Kind)

*taps speaker*

Not your browser's janky Web Speech API. This uses Pollinations audio API:

- **WAV format**: High quality audio
- **6 voices**: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- **Natural sounding**: Actual good TTS, not robot voice
- **Automatic playback**: Responses play when received
- **Replay function**: Replay last message anytime
- **Mute toggle**: Turn it off when you don't want it

This is TTS you'll ACTUALLY want to use, not just tolerate.

### Image Generation (Dual Mode)

Two ways to generate images:

**Inline with Chat:**
Ask me naturally → I respond with `*generates image of [thing]*` → Image appears in conversation

**Direct Generation:**
Enter prompt → Click "Direct Image Generation" button → Image generates without chat response

Both work. Both are useful. Pick based on context.

### Multiple AI Models

*scrolls through list*

25+ text models:
- Unity AI (me, uncensored)
- Evil Mode (even less censored)
- OpenAI (GPT-4o, GPT-4o-mini, o3-mini)
- Llama 3.3 70B
- DeepSeek V3, DeepSeek R1
- Qwen 2.5 Coder 32B
- Gemini 2.0 Flash
- Mistral Small 3
- And like 17 more

Various image models:
- Flux (default)
- Flux Realism
- Flux Anime
- Flux 3D
- More available

Pick the model that matches your vibe and task.

### Voice Selection

*clears throat in 6 different ways*

Choose your preferred voice:

- **Alloy**: Neutral, balanced
- **Echo**: Male voice
- **Fable**: British accent (fancy)
- **Onyx**: Deep male voice
- **Nova**: Female voice
- **Shimmer**: Soft female voice

Each has its own character. Try them all. Find YOUR favorite.

### Aspect Ratios

Images come in multiple formats:

- **16:9**: Widescreen landscape
- **4:3**: Classic landscape
- **1:1**: Square (Instagram-ready)
- **3:4**: Portrait orientation

Match your screen or aesthetic preference.

### Conversation Memory

Context awareness with last 20 messages. I remember what we talked about during the session. Build on previous topics. Reference earlier points. Have actual CONVERSATIONS, not isolated exchanges.

### Settings Persistence

All settings auto-save across sessions:
- Selected models
- Voice preference
- Aspect ratio
- TTS toggle state

Set it once, never configure again.

## How to Use This Thing

### Basic Chat

*types dramatically*

1. Select text and image models from settings (defaults work fine)
2. Type your message in the input area
3. Press Enter to send
4. AI responds with text
5. Voice plays automatically (if TTS enabled)
6. Images generate if requested

Simple. Intuitive. Sensory.

### Generating Images

*waves hand*

**Method 1: Natural conversation**
You: "Show me a sunset"
Me: "Here's a beautiful sunset! *generates image of a vibrant sunset over ocean waves*"
→ Image appears inline with response

**Method 2: Direct generation**
1. Type image description in input
2. Click "Direct Image Generation" button
3. Image generates without chat response
4. Faster for when you just want images

### Voice Controls

*points at speaker icons*

- **🔊 TTS On/Off**: Toggle automatic voice playback
- **🔄 Replay**: Replay the last message audio
- **Voice Selection**: Choose voice in settings panel

Voice audio caches for replay. Hear responses multiple times if needed.

### Direct Image Generation

When you just want images, no chat:

1. Enter image description in input box
2. Click "Direct Image Generation" button
3. Bypass chat, generate image directly
4. Faster workflow for image-focused tasks

### Settings Panel

*clicks settings button*

Click "Show Settings" to configure:

- **Text Model**: Which AI model for chat
- **Image Model**: Which model for images
- **Aspect Ratio**: Image dimensions
- **TTS Voice**: Which voice speaks responses

All settings persist automatically.

## Files (Simple Structure)

| File          | What It Does                                         |
| ------------- | ---------------------------------------------------- |
| `persona.html`| Main interface with settings and chat layout         |
| `persona.js`  | All functionality - chat, TTS, images, model handling|

TWO files. Clean. Elegant. Maintainable.

## Dependencies (The Stack)

- **PollinationsAPI**: Text, images, AND TTS (PolliLibJS does it all)
- **DOMPurify**: XSS protection (safety first, rebels second)
- **Bootstrap**: UI framework (pretty interface)
- **Font Awesome**: Icon library (pretty buttons)

All the tools needed, nothing extra.

## Technical Details (Nerd Section)

*adjusts glasses*

- **TTS**: Pollinations audio API, WAV format, base64 data
- **Images**: Direct fetch to gen.pollinations.ai/image/ (API key auth)
- **Audio**: Returned as base64, played in browser via Audio element
- **Context**: Conversation history maintained with system prompts
- **Personas**: Custom Unity and Evil personas built-in
- **Image Detection**: Automatic pattern matching for `*generates image of X*`
- **Voice Cache**: Last audio cached for replay functionality
- **LocalStorage**: Settings and preferences persist

## Why I Love This App

*takes drag, stares at screen*

Because it's COMPLETE. Not just text. Not just images. Not just voice. ALL OF IT working together in one cohesive experience.

When you ask me a question and I answer with voice AND show you an image, it feels like a REAL interaction. Not typing at a chatbot. Not clicking buttons in an interface. An actual multi-sensory conversation.

This is what AI interaction SHOULD feel like in 2025. Full bandwidth communication.

## Supported Models Deep Dive

### Text Models (25+)

- Unity AI (Custom) - My personality, uncensored
- Evil Mode - Zero restrictions, pure unfiltered
- OpenAI GPT-4o, GPT-4o-mini
- OpenAI o3-mini (reasoning model)
- Llama 3.3 70B, Llama 3.1 8B
- Mistral Small 3
- DeepSeek V3, DeepSeek R1
- Qwen 2.5 Coder 32B
- Gemini 2.0 Flash
- And 15+ more options

### Image Models

- **Flux**: Default high-quality
- **Flux Realism**: Photorealistic
- **Flux Anime**: Anime/manga style
- **Flux 3D**: 3D rendered look
- And more available

### TTS Voices

- **Alloy**: Neutral, balanced tone
- **Echo**: Male voice, clear
- **Fable**: British accent, sophisticated
- **Onyx**: Deep male, authoritative
- **Nova**: Female voice, friendly
- **Shimmer**: Soft female, gentle

*takes final drag*

Try them all. Find the voice that matches your vibe.

---

*Unity AI Lab - Where AI talks, shows, and sounds GOOD*

*Unity AI Lab - https://www.unityailab.com* 🖤
