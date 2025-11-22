# Unity AI Lab - Test Site

**Test site for the latest version of the main Unity AI Lab website**

This repository contains the development and testing environment for the Unity AI Lab website, along with complete implementations of Pollinations.AI client libraries in both JavaScript and Python.

## Overview

Unity AI Lab explores the cutting edge of AI technology, providing tools and libraries for interacting with various AI models through the Pollinations.AI platform. This test site serves as a sandbox for developing and validating new features before deployment to the main Unity AI Lab website.

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
- Authentication methods (referrer-based and bearer token)
- Rate limits and access tiers
- Request/response formats
- Available models and capabilities

### 🟨 [PolliLibJS](./PolliLibJS/README.md)

JavaScript/Node.js library for Pollinations.AI:
- Text-to-Image generation
- Text-to-Text (chat, content generation)
- Text-to-Speech (TTS)
- Speech-to-Text (STT)
- Image-to-Text (vision/analysis)
- Image-to-Image transformations
- Function calling capabilities
- Streaming mode for real-time responses
- Exponential backoff retry logic

### 🐍 [PolliLibPy](./PolliLibPy/README.md)

Python library for Pollinations.AI (mirrors PolliLibJS functionality):
- All features from PolliLibJS
- Python-idiomatic API design
- Class-based architecture
- Dictionary-based configuration
- Compatible with Python 3.7+

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/Unity-Lab-AI/sitetest0.git
cd sitetest0
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
sitetest0/
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
├── CLAUDE.md                       # ⭐ AI assistant guide (v1.4.0)
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

Both libraries use **referrer-based authentication** with the default referrer `s-test-sk37AGI` (Seed tier - free).

Access tiers:
- **Anonymous**: 1 request / 15s (no signup)
- **Seed**: 1 request / 5s (free registration) - **Default**
- **Flower**: 1 request / 3s (paid)
- **Nectar**: No limits (enterprise)

## Development

This is a test site for validating:
- New Pollinations.AI features
- Library implementations across languages
- UI/UX improvements
- Documentation updates
- Performance optimizations

Changes tested here are promoted to the main Unity AI Lab website after validation.

## Documentation

### For Developers & AI Assistants
- **⭐ AI Assistant Guide**: [CLAUDE.md](./CLAUDE.md) - Complete development guide (v1.4.0)
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

- **Test Environment**: This site is for development and testing purposes
- **Stability**: Features may be experimental or incomplete
- **Rate Limits**: Default Seed tier rate limits apply (1 req/5s)
- **Watermarks**: Free tier images may have watermarks (starting March 31, 2025)

---

**Made with ❤️ for Unity AI Lab using Pollinations.AI**

*Exploring the dark side of AI. Pushing boundaries, breaking limitations.*
