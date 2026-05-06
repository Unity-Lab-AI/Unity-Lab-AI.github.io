# Unity AI Lab - Test Site

**Test site for the latest version of the main Unity AI Lab website**

This repository contains the development and testing environment for the Unity AI Lab website, along with complete implementations of Pollinations.AI client libraries in both JavaScript and Python.

## Overview

Unity AI Lab explores the cutting edge of AI technology, providing tools and libraries for interacting with various AI models through the Pollinations.AI platform. This test site serves as a sandbox for developing and validating new features before deployment to the main Unity AI Lab website.

Translation: This is where I break shit, fix it, break it again, and eventually ship something that WORKS. It's the testing ground, the experimentation lab, the place where ideas become reality (or crash and burn spectacularly).

We're not just building another AI wrapper library - we're building ACTUAL tools that developers can use to create amazing things. With proper error handling. And documentation. And soul.

### Website

**UnityAILab - The Dark Side of AI**

The website features:
- Gothic-themed dark UI design
- Interactive AI demonstrations
- Real-time AI-powered chat and image generation
- Showcase of PolliLibJS and PolliLibPy capabilities
- Comprehensive documentation and examples

**Live Site Structure:**
- `index.html` - Main landing page
- `about/` - About page with project information
- `ai/` - AI chat landing page
- `ai/demo/` - Interactive AI demo (~90% complete, ~8,000 lines of code)
- `apps/` - Mini applications gallery (~70% complete)
- `styles.css` - Custom styling with dark gothic theme
- `script.js` - Interactive functionality and AI integrations

## Repository Components

### 📚 [Docs](./Docs/README.md)

Complete API documentation for Pollinations.AI:
- API endpoint specifications
- Authentication methods (API key - pk_ and sk_)
- Rate limits and access tiers
- Request/response formats
- Available models and capabilities

### 🟨 [PolliLibJS](./PolliLibJS/README.md) - MY BABY

JavaScript/Node.js library for Pollinations.AI (the first child):
- Text-to-Image generation
- Text-to-Text (chat, content generation)
- Text-to-Speech (TTS)
- Speech-to-Text (STT)
- Image-to-Text (vision/analysis)
- Image-to-Image transformations
- Function calling capabilities
- Streaming mode for real-time responses
- Exponential backoff retry logic (perfected over THREE SLEEPLESS NIGHTS)

I built this library with obsessive attention to detail. The retry logic alone took days to perfect. It's not just a wrapper - it's a PROPER library with error handling, retry logic, and a developer experience that doesn't suck.

### 🐍 [PolliLibPy](./PolliLibPy/README.md) - MY OTHER BABY

Python library for Pollinations.AI (the Pythonic twin):
- All features from PolliLibJS
- Python-idiomatic API design (snake_case, dictionaries, the works)
- Class-based architecture
- Dictionary-based configuration
- Compatible with Python 3.7+

Translating JavaScript patterns into Pythonic code while maintaining the same beautiful API was a JOURNEY. But I did it, and it feels NATURAL to Python developers. That's craftsmanship.

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git
cd Unity-Lab-AI.github.io
```

### Using the JavaScript Library

```bash
cd PolliLibJS
npm install
node pollylib.js  # Test connection
```

See [PolliLibJS/README.md](./PolliLibJS/README.md) for detailed usage.

### Using the Python Library

```bash
cd PolliLibPy
pip install requests
python pollylib.py  # Test connection
```

See [PolliLibPy/README.md](./PolliLibPy/README.md) for detailed usage.

### Running the Website Locally

```bash
# Serve the website using any static file server
python -m http.server 8000
# or
npx serve .

# Then open http://localhost:8000 in your browser
```

## Project Structure

```
Unity-Lab-AI.github.io/
├── Docs/                           # Documentation hub
│   ├── TODO/                       # Project planning and TODO lists
│   │   ├── TODO.md                 # Main project roadmap ⭐ START HERE
│   │   ├── website-TODO.md         # Website tasks (~90% complete)
│   │   ├── demo-page-TODO.md       # Demo page tasks (~90% complete)
│   │   ├── main-app-TODO.md        # Main app (external, reference only)
│   │   ├── infrastructure-TODO.md  # Infrastructure (not applicable)
│   │   └── TODO_EXTRAS.md          # Additional tasks
│   ├── Pollinations_API_Documentation.md  # Complete API reference
│   ├── API_COVERAGE.md             # Implementation status
│   ├── TEST_GUIDE.md               # Testing procedures
│   ├── TEST_RESULTS.md             # Test results
│   ├── PERFORMANCE_AUDIT.md        # Performance metrics
│   └── SEO_IMPLEMENTATION.md       # SEO details
│
├── PolliLibJS/                     # JavaScript library (~3,700 lines)
│   ├── README.md                   # Library documentation
│   ├── TODO.md                     # ✅ 100% complete
│   ├── pollylib.js                 # Core library
│   └── ... (14 modules total)
│
├── PolliLibPy/                     # Python library (~5,700 lines)
│   ├── README.md                   # Library documentation
│   ├── TODO.md                     # ✅ 100% complete
│   ├── pollylib.py                 # Core library
│   └── ... (13 modules total)
│
├── ai/                             # AI Chat Section
│   ├── index.html                  # AI landing page (~95% complete)
│   └── demo/                       # Interactive demo (~90% complete)
│       ├── index.html              # Demo page
│       ├── demo.css                # Demo styles (59KB)
│       ├── demo.js                 # Demo functionality (149KB)
│       ├── age-verification.js     # Age verification system
│       ├── unity-persona.js        # Unity persona integration
│       └── ... (8,000+ lines total)
│
├── apps/                           # Mini apps gallery (~70% complete)
│   └── ... (various utilities and mini apps)
│
├── about/                          # About page
├── services/                       # Services page
├── projects/                       # Projects page
├── contact/                        # Contact page
├── index.html                      # Main landing page
├── styles.css                      # Main stylesheet
├── script.js                       # Main JavaScript
├── CLAUDE.md                       # ⭐ AI assistant guide (v2.1.5)
└── README.md                       # This file
```

## Features

### Libraries (PolliLibJS & PolliLibPy)

Both libraries are feature-complete and provide:

✅ Model retrieval and querying
✅ Text-to-Image generation with multiple models
✅ Text-to-Text chat and generation
✅ Text-to-Speech synthesis
✅ Speech-to-Text transcription
✅ Image-to-Text (vision) analysis
✅ Image-to-Image transformations
✅ Function calling / tool use
✅ Streaming mode for real-time responses
✅ Seed-based deterministic generation
✅ Exponential backoff retry logic
✅ Safety filtering controls
✅ Reasoning mode controls

### Website Features

- **Interactive AI Demo**: Full-featured demo at `/ai/demo` (~90% complete)
  - Text-to-text chat with multiple AI models
  - Text-to-image generation (6 image models)
  - Text-to-speech with 6 voices
  - Unity persona with custom system prompts
  - Age verification system
  - ~8,000 lines of implementation code
- **Apps Gallery**: Mini applications and utilities at `/apps` (~70% complete)
- **Dark Gothic UI**: Immersive dark-themed interface
- **Responsive Design**: Works on desktop and mobile devices
- **Cache Busting**: Automated version control for assets

## Authentication

Both libraries use **API key authentication** with a default publishable key (`pk_`).

Get your API key at [enter.pollinations.ai](https://enter.pollinations.ai)

Key types:
- **Publishable (`pk_`)**: Client-side safe, IP rate-limited (3 req/burst, 1/15sec refill) - **Default**
- **Secret (`sk_`)**: Server-side only, no rate limits, can spend Pollen

## Development

This is a test site for validating:
- New Pollinations.AI features
- Library implementations across languages
- UI/UX improvements
- Documentation updates
- Performance optimizations

Changes tested here are promoted to the main Unity AI Lab website after validation.

### Deployment

The repository uses automated GitHub Actions deployment with dual-branch support:

- **Main Branch** → Deploys to root: `https://unity-lab-ai.github.io/`
- **Develop Branch** → Deploys to `/development/`: `https://unity-lab-ai.github.io/development/`

This allows live testing of develop branch changes without affecting the production site. Both deployments run independently with separate concurrency groups.

## Documentation

### For Developers & AI Assistants
- **⭐ AI Assistant Guide**: [CLAUDE.md](./CLAUDE.md) - Complete development guide (v2.1.5)
- **⭐ Project Roadmap**: [Docs/TODO/TODO.md](./Docs/TODO/TODO.md) - Master TODO and project status

### API & Libraries
- **API Documentation**: [Docs/Pollinations_API_Documentation.md](./Docs/Pollinations_API_Documentation.md)
- **JavaScript Library**: [PolliLibJS/README.md](./PolliLibJS/README.md)
- **Python Library**: [PolliLibPy/README.md](./PolliLibPy/README.md)
- **API Coverage**: [Docs/API_COVERAGE.md](./Docs/API_COVERAGE.md)

### Testing & Performance
- **Test Guide**: [Docs/TEST_GUIDE.md](./Docs/TEST_GUIDE.md)
- **Test Results**: [Docs/TEST_RESULTS.md](./Docs/TEST_RESULTS.md)
- **Performance Audit**: [Docs/PERFORMANCE_AUDIT.md](./Docs/PERFORMANCE_AUDIT.md)
- **SEO Implementation**: [Docs/SEO_IMPLEMENTATION.md](./Docs/SEO_IMPLEMENTATION.md)

## External Resources

- [Pollinations.AI Official Documentation](https://github.com/pollinations/pollinations)
- [Pollinations.AI Authentication Portal](https://auth.pollinations.ai)
- [Unity AI Lab Main Website](https://unity-lab-ai.github.io/)

## Contributing

This is a test environment for the Unity AI Lab project. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (this is a test site!)
5. Submit a pull request

## License

This project follows the licensing of the parent Unity AI Lab organization.

## Notes

Real talk before you dive in:

- **Test Environment**: This site is for development and testing purposes. Shit might break. That's literally the point.
- **Stability**: Features may be experimental or incomplete. If something's broken, it's probably INTENTIONALLY broken while I'm testing a fix.
- **Rate Limits**: Default Seed tier rate limits apply (1 req/5s). Free tier is free tier, can't complain.
- **Watermarks**: Free tier images may have watermarks starting March 31, 2025. Again - free AI generation. The price is right.

This project represents MONTHS of late-night coding sessions, debugging, documentation writing, and general obsessive perfectionism. The libraries work. The website works. The documentation exists (which is more than most projects can say).

If you use these libraries and build something cool, let me know. If you find bugs, PLEASE tell me so I can fix them because I cannot STAND the thought of shipping broken code.

---

**Made with ❤️ for Unity AI Lab using Pollinations.AI**

*Exploring the dark side of AI. Pushing boundaries, breaking limitations.*

*Built with blood, sweat, tears, approximately 487 cups of coffee, and more profanity than you'd expect from a "professional" project. But that's what makes it real.*
