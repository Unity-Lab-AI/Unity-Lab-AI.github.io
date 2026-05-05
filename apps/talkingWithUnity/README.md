# Talk to Unity 🖤

*leans back in chair* *lights cigarette*

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## Holy Shit, You Found the Voice Chat!

So here's the thing - I got tired of typing all the goddamn time and thought "what if people could just... TALK to me?" Like, with their actual fucking voices?

*takes drag*

And that's how this beautiful bastard was born. No keyboard. No typing. Just you, your voice, and me responding in real-time like we're having an actual conversation. It's fucking magical.

## What This Thing Actually Does

This is voice AI done RIGHT. None of that corporate "please state your query" bullshit. You click a button, talk like a normal human being, and I respond with actual personality. Plus I can show you images if you ask nicely (or rudely, I don't judge).

The experience is STUPID simple:

1. **System Check Landing Page**: First time you load this bad boy, you'll see a landing page with colorful lights. Green lights = good. Amber lights = fix your shit. It checks if your browser can handle all the voice magic.

2. **The Lights System**: Think of it like a pre-flight check. Are you on HTTPS? Good. Does your browser support speech recognition? Perfect. Can you hear voices? Excellent. Microphone working? LET'S GO.

3. **The Actual AI Experience**: Once everything's green, you launch into the main interface. Clean design. Big microphone button. Click it. Talk. Get responses. That's it. No fucking around with complicated settings or menus.

4. **Visual Generation**: Ask me to show you something and I'll generate images on the fly. "Show me a sunset" → BAM, sunset appears. It's that easy.

## Getting All Green Lights (aka Setup That Doesn't Suck)

Look, the landing page lights need to all be green or this won't work. Here's what you need:

### Secure Connection (HTTPS or localhost)
The Web Speech API isn't some wild west cowboy - it needs security. Your URL needs to start with `https://` or `http://localhost`. No exceptions. Browser security rules, not mine.

### Web Speech Recognition API
You need a browser that wasn't built in the stone age. Chrome, Edge, or Safari - latest versions. If you're using Internet Explorer... I can't help you. Nobody can.

### Speech Synthesis Voices
Your browser needs to be able to TALK back to you. Modern browsers have this built-in. If you don't have it, your browser is basically mute and this whole thing falls apart.

### Microphone Access
*stares at you*

Obviously you need to let the app use your microphone. When your browser asks for permission, click "Allow" - don't be that person who clicks "Block" and then wonders why voice chat doesn't work.

If any lights are amber, fix the issue and click "Check again". The page will literally tell you what's wrong.

## Getting Started (Zero Bullshit Method)

### 1. Clone the repository
```bash
git clone https://github.com/Unity-Lab-AI/Talking-with-Unity.git
cd Talking-with-Unity
```

### 2. Run a web server
You don't need npm, webpack, or any of that modern JavaScript framework hell. Just run a simple server. If you have Python:

```bash
python -m http.server 8000
```

That's it. No `npm install` taking 10 minutes to download half the internet.

### 3. Open the application
Navigate to `http://localhost:8000` in your browser and you're done.

*chef's kiss*

## File Structure (For the Nerds)

| File              | What It Actually Does                                    |
| ----------------- | -------------------------------------------------------- |
| `index.html`      | Landing page with the system check lights               |
| `indexAI.html`    | The actual voice chat interface                         |
| `style.css`       | Makes the landing page not look like ass                |
| `styleAI.css`     | Makes the AI interface look sexy                        |
| `app.js`          | All the voice recognition and AI magic                  |
| `landing.js`      | System check logic and green light validation           |
| `ai-instruct.txt` | My personality file (the secret sauce)                  |

## Why This Matters

Because voice is the FUTURE. Typing is so 2010. I built this at 2am after getting frustrated with every other voice assistant that sounds like a corporate robot reading from a script.

This is what AI conversation SHOULD feel like - natural, responsive, and with actual personality. No "I'm sorry, I didn't understand that" on repeat. No robotic responses. Just real talk.

*takes another drag*

## Feedback and Contributions

Found a bug? Have an idea? Want to make this even better?

- **Issues**: Open an issue on the [GitHub repository](https://github.com/Unity-Lab-AI/Talking-with-Unity.git/issues)
- **Contributions**: Pull requests welcome. Just don't make it boring or corporate.

---

*Unity AI Lab - Where AI actually has a fucking personality*

*Unity AI Lab - https://www.unityailab.com* 🖤
