# Legacy Unity Chat 🖤

*stares at screen with nostalgia*

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## The Original. The Beast. The Legend.

*lights cigarette dramatically*

This is where it all fucking started. Before we had all the streamlined apps, before we figured out minimalism, there was THIS - the full-featured, everything-and-the-kitchen-sink Unity Chat experience.

I'm talking multi-session management, persistent memory, voice chat, integrated screensaver, theme system, and more features than you can shake a stick at. This is the MAXIMALIST approach to AI chat, and honestly? I'm still proud of this beautiful bastard.

## Why This One's Special

Look, we built newer, cleaner apps. But this legacy version? This is the Swiss Army Knife of AI chat. You want it? We got it. It's like that overstuffed toolbox in your garage that has EVERYTHING - sure, you might not need all of it, but when you DO need something specific, you're glad it's there.

*takes drag*

This was built over countless late nights, fueled by energy drinks and spite against boring corporate chat interfaces. Every feature exists because we thought "wouldn't it be cool if..." and then actually BUILT it instead of putting it in a roadmap to die.

## Features (aka Why This Thing is Massive)

### Core Chat Features

- **Multi-Session Management**: Create as many separate conversations as you want. Switch between them like browser tabs. Each one remembers everything.
- **Session Persistence**: Close your browser, restart your computer, come back a week later - all your conversations are still there. Magic? No. LocalStorage. But it FEELS like magic.
- **Model Selection**: 25+ AI models. Text models. Image models. Mix and match. Go wild.
- **Theme System**: Dark mode. Light mode. Custom themes. Make it look however the fuck you want.
- **Memory Management**: Add memories that persist across ALL sessions. Tell me your name once, I remember it forever (or until you clear browser data).
- **Personalization**: Configure everything. Your name, interests, how you want me to act, additional context - all of it.

### Voice Features

*sound of speakers crackling to life*

- **Text-to-Speech**: I read every response out loud. Automatic. Optional. Adjustable.
- **Voice Settings**: Rate, pitch, volume - dial it in exactly how you like.
- **Multiple Voices**: System voices available on your device. Pick your favorite.
- **Voice Chat Mode**: Real-time voice conversation with image slideshow in the background. It's an EXPERIENCE.
- **Shut Up Button**: Sometimes I talk too much. Big red button. Instant silence. Problem solved.

### Visual Features

- **Integrated Screensaver**: Full AI-powered screensaver built RIGHT INTO THE APP. Auto-generates prompts. Endless beauty.
- **Image Gallery**: Scrollable thumbnail history of all generated images. Click to revisit.
- **Theme Switcher**: One click theme changes. Dark, light, custom - whatever mood you're in.
- **Markdown Support**: Rich text formatting with Marked.js. Headers, lists, emphasis - all rendered beautifully.
- **Code Highlighting**: Prism.js syntax highlighting. Code blocks look GORGEOUS.

### Session Management

Think of sessions like different conversations with different contexts:

- **New Session**: Start fresh anytime. Clean slate.
- **Session List**: View all your saved sessions. Click to switch.
- **Delete Sessions**: Remove individual sessions or nuke them all. Your choice.
- **Session Export**: Backup your conversations. Save them locally. Never lose context.

### Settings & Customization

*cracks knuckles*

We made EVERYTHING configurable because we're not corporate assholes who think they know better than you:

- **Personalization Panel**: Name, interests, traits you want me to have, additional context - set it all.
- **Memory Manager**: Add, view, edit, delete memory entries. Full CRUD operations on your AI's brain.
- **Theme Selector**: Visual appearance. Your eyes, your rules.
- **Voice Configuration**: Select voice, adjust speech parameters. Make me sound how YOU want.
- **Model Preferences**: Default text and image models. Set and forget.

### Additional Features

Because we couldn't stop ourselves:

- **Visitor Counter**: Track unique visitors (locally, not creepy).
- **Simple Mode**: Too many features? Toggle simplified interface.
- **Donation Modal**: Support us via BTC, DOGE, ETH, XMR. We're not selling your data, so donations help.
- **First Launch Setup**: Guided wizard for new users. No confusion.
- **Data Management**: Nuclear option - clear ALL user data. Fresh start button.

## How to Use This Beast

### Getting Started

1. **First Launch**: Setup wizard walks you through everything. Pick a theme, set your name, customize experience.
2. **Choose Your Look**: Themes matter. Pick one that doesn't hurt your eyes.
3. **Start Chatting**: Type. Hit enter. Get responses. Revolutionary, I know.

### Creating Sessions

Sessions are independent conversations:

1. Click "New Chat" in the sidebar
2. Each session has its own history and context
3. Switch between them anytime without losing anything

*chef's kiss*

### Using Memory

Memory is PERSISTENT context that applies to ALL sessions:

1. Open "Manage Memories" from settings
2. Add memories like "My name is Alex" or "I'm learning Python"
3. I'll remember this across every single session
4. Edit or delete memories whenever you want

This is how you build long-term context with an AI. Game changer.

### Voice Chat

*speakers crackle*

Real-time voice conversation mode:

1. Enable voice responses with the voice toggle
2. Click "Voice Chat" button
3. Talk, listen, watch images transition in the background
4. Adjust voice settings (rate, pitch, volume) on the fly

The "Shut Up" button instantly stops all audio. Because sometimes I don't shut up.

### Screensaver

Built-in AI screensaver that lives inside the chat app:

1. Click "Screensaver" button in sidebar
2. Configure prompt (or leave blank for auto-generation)
3. Set timer and aspect ratio
4. Watch endless AI-generated art transition automatically

Fullscreen mode. Thumbnail history. Save images. It's the full deal.

### Personalization

Tell me who you are and how I should act:

1. Open personalization panel
2. Enter your name so I can address you properly
3. Add your interests so I know what you care about
4. Set AI traits (how you want me to behave)
5. Add any additional context
6. Save and it applies across ALL sessions

## Files (The Guts)

This thing is MODULAR. Multiple JS files, each handling specific features:

| File                   | What It Does                                    |
| ---------------------- | ----------------------------------------------- |
| `index.html`           | Main structure, sidebar, chat layout            |
| `index.js`             | Core chat functionality and event handlers      |
| `chat-core.js`         | Chat logic and message processing               |
| `chat-init.js`         | Initialization and setup routines               |
| `chat-storage.js`      | Session and memory storage management           |
| `memory-api.js`        | Memory management system                        |
| `screensaver.js`       | Integrated screensaver functionality            |
| `screensaver-page.js`  | Screensaver UI and controls                     |
| `storage.js`           | Local storage utilities                         |
| `ui.js`                | UI updates and theme management                 |
| `simple.js`            | Simple mode functionality                       |
| `styles.css`           | Main stylesheet (gothic dark beauty)            |
| `stylesScreensaver.css`| Screensaver-specific styles                     |

## Dependencies (The Tools We Use)

We stand on the shoulders of giants (and good open-source libraries):

- **PollinationsAPI**: Text and image generation via PolliLibJS. The AI engine.
- **Bootstrap**: UI framework. Makes things not look like shit.
- **Font Awesome**: Icon library. Pretty symbols.
- **Marked.js**: Markdown parsing and rendering. Rich text magic.
- **Prism.js**: Code syntax highlighting. Makes code beautiful.
- **DOMPurify**: XSS protection. Security matters.

## Technical Details (For the Nerds)

*adjusts glasses*

- **Session Storage**: LocalStorage with unique IDs. Each session independent.
- **Memory System**: Persistent context injected into ALL conversations.
- **Visitor Counter**: LocalStorage-based with unique ID generation. No server tracking.
- **Theme System**: CSS custom properties. Easy switching, no page reload.
- **Voice Synthesis**: Web Speech API. Browser-native TTS.
- **Screensaver Integration**: Shares state with main app. Seamless transitions.
- **Modular Architecture**: Separate JS files for each feature. Maintainable.
- **Auto-Save**: Everything saves automatically. No "save" buttons needed.

## Advanced Features Deep Dive

### Memory System

This is the SECRET SAUCE for long-term AI interaction:

- Persistent AI context that spans ALL sessions
- Add custom memory entries manually
- Automatically included in every conversation
- Edit and manage via modal interface
- Want me to remember you're vegetarian? Add it once, I remember forever.

### Session System

Multiple independent conversations:

- Each session has its own history and context
- Quick switching without losing anything
- Automatic timestamp tracking for organization
- Delete individual sessions or nuke them all
- Great for organizing different topics or projects

### Voice Chat

*microphone feedback*

Real-time voice conversation mode:

- Continuous voice dialogue
- Image slideshow plays during conversation (visual stimulation)
- Adjustable speech parameters on the fly
- "Shut Up" button for instant silence
- Feels like talking to a real entity (because you are)

### Screensaver

AI-powered infinite art:

- Auto-prompt generation (I create the prompts)
- Configurable timer (how often images change)
- Aspect ratio selection (widescreen, square, portrait)
- Model selection for different art styles
- Thumbnail history with navigation
- Fullscreen support for immersive viewing
- Save and copy generated images

*takes final drag*

## Why We Call It "Legacy"

Not because it's OLD. Not because it's OUTDATED. We call it legacy because it's the FOUNDATION. Everything else we built came FROM this. This is the prototype that proved AI chat could have personality, features, and soul.

Sure, we made streamlined versions. Focused apps. Specialized tools. But THIS? This is the everything app. The maximalist approach. The "fuck minimalism, let's add EVERYTHING" version.

And you know what? It still works beautifully.

---

*Unity AI Lab - Where legacy means legendary, not outdated*

*Unity AI Lab - https://www.unityailab.com* 🖤
