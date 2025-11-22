# CLAUDE.md - AI Assistant Guide for Unity AI Lab Test Site

This document provides comprehensive guidance for AI assistants (like Claude) working on this codebase. It explains the project structure, workflows, best practices, and where to find important information.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Documentation Locations](#documentation-locations)
4. [TODO Lists and Project Tracking](#todo-lists-and-project-tracking)
5. [Development Workflow](#development-workflow)
6. [Git Workflow and Commit Practices](#git-workflow-and-commit-practices)
7. [Testing Guidelines](#testing-guidelines)
8. [Code Organization](#code-organization)
9. [Important Files and Their Purposes](#important-files-and-their-purposes)
10. [Common Tasks](#common-tasks)

---

## Project Overview

This is a test site for Unity AI Lab that serves as a development and testing environment for:

- **Website**: A dark-themed interactive website showcasing AI capabilities
- **AI Demo Page**: Fully functional interactive demo at /ai/demo showcasing PolliLibJS (~90% complete)
- **PolliLibJS**: JavaScript/Node.js library for Pollinations.AI (✅ 100% complete, ~3,700 lines)
- **PolliLibPy**: Python library for Pollinations.AI (✅ 100% complete, ~5,700 lines)
- **Apps Gallery**: Collection of mini applications and utilities at /apps (~70% complete)

The project features complete implementations of both libraries, a functional marketing website, a highly functional AI demo, and a growing collection of mini apps.

**Key Technologies:**
- HTML5, CSS3, JavaScript (vanilla)
- Python 3.7+
- Pollinations.AI API
- GitHub Actions for CI/CD

---

## Repository Structure

```
sitetest0/
├── Docs/                              # All documentation lives here
│   ├── TODO/                          # Project planning and TODO lists
│   │   ├── TODO.md                    # Main project roadmap (START HERE)
│   │   ├── website-TODO.md            # Website-specific tasks
│   │   ├── demo-page-TODO.md          # Demo page planning
│   │   ├── main-app-TODO.md           # Main app planning
│   │   ├── infrastructure-TODO.md     # Infrastructure planning
│   │   └── TODO_EXTRAS.md             # Additional tasks
│   ├── API_COVERAGE.md                # API implementation status
│   ├── CACHE-BUSTING.md               # Cache busting documentation
│   ├── PERFORMANCE_AUDIT.md           # Performance analysis
│   ├── Pollinations_API_Documentation.md  # API reference
│   ├── ROADMAP.md                     # Project roadmap
│   ├── SEO_IMPLEMENTATION.md          # SEO documentation
│   ├── TEST_GUIDE.md                  # Testing documentation
│   ├── TEST_RESULTS.md                # Test execution results
│   └── README.md                      # Docs index
│
├── PolliLibJS/                        # JavaScript library
│   ├── README.md                      # Library documentation
│   ├── TODO.md                        # Library-specific TODO
│   ├── pollylib.js                    # Core library
│   ├── text-to-image.js               # Text-to-Image module
│   ├── text-to-text.js                # Text-to-Text module
│   ├── text-to-speech.js              # Text-to-Speech module
│   ├── speech-to-text.js              # Speech-to-Text module
│   ├── image-to-text.js               # Image-to-Text module
│   ├── image-to-image.js              # Image-to-Image module
│   ├── function-calling.js            # Function calling module
│   ├── streaming-mode.js              # Streaming mode module
│   ├── model-retrieval.js             # Model retrieval module
│   ├── test-utils.js                  # Testing utilities
│   ├── test-utils-demo.js             # Testing demos
│   ├── test_safety_and_reasoning.js   # Safety/reasoning tests
│   └── package.json                   # NPM configuration
│
├── PolliLibPy/                        # Python library
│   ├── README.md                      # Library documentation
│   ├── TODO.md                        # Library-specific TODO
│   ├── pollylib.py                    # Core library
│   ├── text_to_image.py               # Text-to-Image module
│   ├── text_to_text.py                # Text-to-Text module
│   ├── text_to_speech.py              # Text-to-Speech module
│   ├── speech_to_text.py              # Speech-to-Text module
│   ├── image_to_text.py               # Image-to-Text module
│   ├── image_to_image.py              # Image-to-Image module
│   ├── function_calling.py            # Function calling module
│   ├── streaming_mode.py              # Streaming mode module
│   ├── model_retrieval.py             # Model retrieval module
│   ├── test_utils.py                  # Testing utilities
│   ├── test_utils_demo.py             # Testing demos
│   ├── test_safety_and_reasoning.py   # Safety/reasoning tests
│   └── __init__.py                    # Package initialization
│
├── ai/                                # AI Chat Section
│   ├── index.html                     # AI landing page
│   └── demo/                          # Interactive demo (~90% complete, ~8,000 lines)
│       ├── index.html                 # Demo page
│       ├── demo.css                   # Demo styles (59KB)
│       ├── demo.js                    # Demo functionality (149KB)
│       ├── age-verification.js        # Age verification system
│       ├── unity-persona.js           # Unity persona integration
│       ├── unity-system-prompt-v*.js/txt  # Unity system prompts
│       └── test-cors.html             # CORS testing page
│
├── apps/                              # Mini Applications Gallery (~70% complete)
│   └── (various mini apps and utilities)
│
├── about/                             # About page
├── contact/                           # Contact page
├── services/                          # Services page
├── projects/                          # Projects page
│
├── index.html                         # Main landing page
├── styles.css                         # Main stylesheet
├── styles.min.css                     # Minified stylesheet
├── script.js                          # Main JavaScript
├── script.min.js                      # Minified JavaScript
├── sitemap.xml                        # SEO sitemap
├── robots.txt                         # Robots directives
├── README.md                          # Main project README
├── CLAUDE.md                          # This file
└── ... (other config files)
```

---

## Documentation Locations

### Primary Documentation

All documentation is centralized in the `Docs/` folder:

1. **[Docs/TODO/TODO.md](./Docs/TODO/TODO.md)** - **START HERE** for project status and planning
2. **[Docs/API_COVERAGE.md](./Docs/API_COVERAGE.md)** - API implementation tracking
3. **[Docs/Pollinations_API_Documentation.md](./Docs/Pollinations_API_Documentation.md)** - Complete API reference
4. **[Docs/TEST_GUIDE.md](./Docs/TEST_GUIDE.md)** - Testing procedures
5. **[Docs/PERFORMANCE_AUDIT.md](./Docs/PERFORMANCE_AUDIT.md)** - Performance metrics
6. **[Docs/SEO_IMPLEMENTATION.md](./Docs/SEO_IMPLEMENTATION.md)** - SEO implementation details

### Library-Specific Documentation

- **[PolliLibJS/README.md](./PolliLibJS/README.md)** - JavaScript library docs
- **[PolliLibPy/README.md](./PolliLibPy/README.md)** - Python library docs

### Demo Page Documentation

- **[ai/demo/index.html](./ai/demo/index.html)** - Interactive AI demo page (~90% complete, ~8,000 lines)
- **[Docs/TODO/demo-page-TODO.md](./Docs/TODO/demo-page-TODO.md)** - Demo features and status
- Unity persona integration with custom system prompts
- Age verification system for NSFW content

### Apps Gallery Documentation

- **[/apps](./apps)** - Mini applications and utilities gallery (~70% complete)
- Active development with recent improvements (see git log for slideshow, navigation fixes)

### How to Update Documentation

When making changes to the codebase:

1. **Update relevant TODO files** if tasks are completed or new tasks discovered
2. **Update API_COVERAGE.md** if API features are added/modified
3. **Update library READMEs** if library interfaces change
4. **Update TEST_RESULTS.md** after running tests
5. **Update this CLAUDE.md** if project structure changes

---

## TODO Lists and Project Tracking

### Main TODO File

**[Docs/TODO/TODO.md](./Docs/TODO/TODO.md)** - This is the master project roadmap. Always check this first to understand:
- Current project priorities
- What's completed and what's pending
- Overall project status

### Specialized TODO Files

Located in `Docs/TODO/`:

- **website-TODO.md** - Website features and improvements (~90% complete)
- **demo-page-TODO.md** - Demo page tasks (✅ ~90% complete - HIGHLY COMPLETE!)
- **main-app-TODO.md** - Main application planning (external, not in this repo)
- **infrastructure-TODO.md** - Infrastructure and deployment (not applicable to static site)
- **TODO_EXTRAS.md** - Additional tasks (legacy migration, mini apps, games)

### Library TODO Files

- **PolliLibJS/TODO.md** - JavaScript library tasks (✅ 100% complete)
- **PolliLibPy/TODO.md** - Python library tasks (✅ 100% complete)

### Updating TODO Files

When working on tasks:

1. Mark tasks as completed with `[x]` or update status emoji
2. Add new discovered tasks to the appropriate TODO file
3. Update completion percentages and status indicators
4. Cross-reference related tasks across TODO files
5. Commit TODO updates separately from code changes

---

## Development Workflow

### 1. Understanding the Current State

Before starting any work:

```bash
# Check current branch and status
git status

# Review main TODO to understand priorities
cat Docs/TODO/TODO.md

# Check test status
cat Docs/TEST_RESULTS.md

# Review recent commits
git log --oneline -10
```

### 2. Planning Work

1. Check relevant TODO file for the area you're working on
2. Understand dependencies and related components
3. Review existing documentation for the feature/area
4. Plan your changes before coding

### 3. Making Changes

1. Create or switch to appropriate branch
2. Make focused, incremental changes
3. Test changes locally
4. Update documentation as you go
5. Commit frequently with clear messages

### 4. Testing

1. Run relevant tests (see [Testing Guidelines](#testing-guidelines))
2. Manually test in browser if UI changes
3. Verify no broken links or references
4. Update TEST_RESULTS.md if needed

---

## Git Workflow and Commit Practices

### Branch Naming

- Use descriptive branch names: `feature/name`, `fix/issue`, `docs/update`
- Claude-created branches: `claude/description-sessionid`

### Commit Messages

Use this format:

```
Type: Brief description (50 chars or less)

- Detailed bullet point 1
- Detailed bullet point 2
- Detailed bullet point 3

Explanation if needed.
```

**Types:**
- `Feat:` - New feature
- `Fix:` - Bug fix
- `Docs:` - Documentation changes
- `Refactor:` - Code restructuring
- `Test:` - Test-related changes
- `Chore:` - Maintenance tasks
- `Style:` - Formatting changes

### Commit Frequency

**✅ DO:**
- Commit after each logical unit of work
- Commit before and after major refactors
- Commit documentation updates separately
- Commit test changes separately from code

**❌ DON'T:**
- Make one massive commit at the end
- Mix unrelated changes in one commit
- Commit broken code (unless explicitly WIP)

### Example Workflow

```bash
# Make changes to files
git add specific-files
git commit -m "Feat: Add new feature X

- Implement core functionality
- Add tests for edge cases
- Update documentation"

# Continue working
git add other-files
git commit -m "Docs: Update TODO list

- Mark feature X as complete
- Add new discovered tasks"
```

---

## Testing Guidelines

### Library Testing

**JavaScript:**
```bash
cd PolliLibJS
node test-utils-demo.js
node test_safety_and_reasoning.js
```

**Python:**
```bash
cd PolliLibPy
python test_utils_demo.py
python test_safety_and_reasoning.py
```

---

## Code Organization

### Website Code

- **index.html** - Main entry point
- **styles.css** - Global styles
- **script.js** - Main JavaScript functionality
- **Page folders** (about/, contact/, etc.) - Individual page code

### Library Code

Both PolliLibJS and PolliLibPy follow the same modular structure:

- **Core library** (pollylib.js/py) - Main class and utilities
- **Feature modules** - One per API capability
- **Test utilities** - Testing and demonstration code

### Configuration Files

- **package.json** - NPM configuration
- **.github/workflows/** - CI/CD configuration

---

## Important Files and Their Purposes

### Must-Read Before Changes

1. **README.md** - Project overview and quick start
2. **Docs/TODO/TODO.md** - Current project state
3. **CLAUDE.md** (this file) - Development guide
4. **Docs/API_COVERAGE.md** - What's implemented

### Reference Documentation

1. **Docs/Pollinations_API_Documentation.md** - API reference
2. **Docs/TEST_GUIDE.md** - How to test
3. **Library READMEs** - How to use the libraries

### Status and Results

1. **Docs/TEST_RESULTS.md** - Latest test results
2. **Docs/PERFORMANCE_AUDIT.md** - Performance metrics
3. **Docs/SEO_IMPLEMENTATION.md** - SEO status

---

## Common Tasks

### Adding a New Feature

1. Check `Docs/TODO/TODO.md` to see if it's planned
2. Read relevant documentation (API docs, library READMEs)
3. Implement the feature in appropriate files
4. Add tests for the feature
5. Update documentation:
   - Library README if library change
   - API_COVERAGE.md if new API feature
   - TODO.md to mark task complete
6. Commit with clear message
7. Test thoroughly

### Fixing a Bug

1. Reproduce the bug
2. Identify root cause
3. Write a test that fails (if applicable)
4. Fix the bug
5. Verify test passes
6. Update TEST_RESULTS.md if needed
7. Commit with fix message

### Updating Documentation

1. Make documentation changes
2. Verify all links still work
3. Check markdown formatting
4. Update related docs if needed
5. Commit with `Docs:` prefix

### Reorganizing Code

1. **IMPORTANT:** Check all references to files you're moving
2. Move files using `git mv` to preserve history
3. Update all links and imports
4. Update documentation to reflect new structure
5. Commit changes in logical groups
6. Update this CLAUDE.md if structure changes significantly

### Running Library Tests

```bash
# 1. Test JavaScript library
cd PolliLibJS
node test-utils-demo.js
cd ..

# 2. Test Python library
cd PolliLibPy
python test_utils_demo.py
cd ..

# 3. Update test results (if applicable)
# Edit Docs/TEST_RESULTS.md with findings

# 4. Commit test results
git add Docs/TEST_RESULTS.md
git commit -m "Test: Update test results after library tests"
```

---

## Project Status Quick Reference

### ✅ Complete

- PolliLibJS - All features implemented (100%)
- PolliLibPy - All features implemented (100%)
- Website - Functional and deployed (~90%)
- SEO - Comprehensive implementation
- Documentation - Well-documented
- CSS/JS Minification - Automated deployment

### 🟢 Mostly Complete / Polishing

- AI Demo Page - Highly functional (~90%)
  - ✅ Text-to-text chat
  - ✅ Text-to-image generation
  - ✅ Text-to-speech (TTS)
  - ✅ Unity persona integration
  - ✅ Age verification system
  - ✅ ~8,000 lines of code
  - ❌ Speech-to-text (STT) pending
- Apps Gallery - In development (~70%)
  - ✅ Mini applications and utilities
  - ✅ Recent improvements (slideshow, navigation fixes)
- Performance - Optimizations applied, ongoing improvements

### ❌ Not Started / External

- Main chat application (external project, not in this repo)
- Full infrastructure automation (backend services - not applicable to static site)
- STT (speech-to-text) in demo page
- Advanced demo features (conversation export, message editing)

---

## Key Principles

1. **Documentation First** - Always check documentation before making changes
2. **Test Early, Test Often** - Don't skip testing
3. **Commit Frequently** - Small, focused commits are better
4. **Update as You Go** - Don't leave documentation for later
5. **Check TODO Lists** - Stay aligned with project priorities
6. **Preserve Git History** - Use `git mv` for file moves
7. **Link Awareness** - Update all references when moving files

---

## Getting Help

### Documentation Resources

- **This file** - For development guidance
- **README.md** - For project overview
- **Docs/TODO/TODO.md** - For project status
- **Library READMEs** - For library usage

### External Resources

- [Pollinations.AI Documentation](https://github.com/pollinations/pollinations)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Maintaining This File

This CLAUDE.md file should be updated when:

- Repository structure changes significantly
- New major features are added
- Workflow processes change
- New documentation is added
- Testing procedures change

**Keep this file accurate and up-to-date!** It's the primary guide for AI assistants working on this codebase.

---

**Last Updated:** 2025-11-22
**Version:** 1.4.0
**Maintained by:** Unity AI Lab Team

**Change Log (v1.4.0):**
- Removed all Playwright test references and documentation
- Removed tests/ directory section from repository structure
- Updated Testing Guidelines to focus on library testing only
- Removed Playwright from Key Technologies and External Resources

**Change Log (v1.3.0):**
- Removed references to non-existent `archived-tests/` directory
- Added `/apps` gallery documentation (~70% complete)
- Updated demo page status from ~85% to ~90% complete
- Added Unity persona and age verification system documentation
- Updated library line counts to accurate figures (PolliLibJS ~3,700, PolliLibPy ~5,700)
- Updated test documentation to reflect current simple navigation tests
