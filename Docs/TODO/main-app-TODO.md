# Main AI Chat App TODO

> **Status:** ❌ **NOT IN THIS REPO** (External)
> Full-featured Unity AI Chat application - currently hosted externally at https://unity.unityailab.com

---

## Overview

This TODO tracks the requirements and features for a full-featured AI chat application. The production Unity AI Chat is currently **hosted externally** and not part of this repository. These tasks represent what would be needed if/when implementing a version in this repo.

**Current Status:** Production app lives at https://unity.unityailab.com (separate deployment)
**This Repository:** Static landing site + client libraries only

---

## Note on Scope

⚠️ **Most features below require backend infrastructure** which is not currently part of this static site repository. Implementing these features would require:
- Backend server (Node.js, Python, etc.)
- Database for session/user storage
- Authentication system
- File upload handling
- Session management

This TODO is kept for **reference and future planning** if/when the application is ported to this repository.

---

## Core Chat Features

### P0 Parity with Demo Features
- [ ] All features from /demo page
  - [ ] Text input and sending
  - [ ] User/AI message display
  - [ ] Voice recognition
  - [ ] Voice-to-voice mode
  - [ ] Image generation panel
  - [ ] Markdown rendering
  - [ ] Code highlighting
  - [ ] Model selector
  - [ ] Stop generation
  - [ ] Reset functionality

---

## Session Management

### P0 Session Handling
- [ ] Automatic session saving
  - [ ] Save to backend database
  - [ ] Auto-save on each message
  - [ ] Periodic backup
  - [ ] Conflict resolution
- [ ] Session loading by ID
  - [ ] Load from database
  - [ ] URL-based session linking
  - [ ] Quick load recent sessions
  - [ ] Search sessions
- [ ] Left panel for sessions
  - [ ] Session list sidebar
  - [ ] Sorted by recent activity
  - [ ] Session preview (first message)
  - [ ] Pin important sessions
  - [ ] Archive old sessions
- [ ] New chat button
  - [ ] Create new session
  - [ ] Prompt to save current
  - [ ] Session naming
  - [ ] Template selection

---

## Content Moderation

### P0 SFW/NSFW Modes
- [ ] SFW mode
  - [ ] Strict content filtering
  - [ ] Safe for work interface
  - [ ] Default mode
- [ ] NSFW mode
  - [ ] Relaxed filtering
  - [ ] Age verification required
  - [ ] Warning indicators
- [ ] Mode cookies
  - [ ] Remember user preference
  - [ ] Persist across sessions
  - [ ] Clear on logout
- [ ] Age gate for NSFW
  - [ ] 18+ verification
  - [ ] Legal compliance
  - [ ] Terms acceptance
  - [ ] One-time verification
- [ ] Safe mode flag in request
  - [ ] Pass to API
  - [ ] Backend validation
  - [ ] Audit logging
- [ ] Not-safe mode flag
  - [ ] Explicit opt-in
  - [ ] Disclaimer display
  - [ ] Separate UI indicators

---

## AI Agents System

### P1 Custom Agents
- [ ] Create new custom agents
  - [ ] Agent configuration UI
  - [ ] System prompt customization
  - [ ] Personality settings
  - [ ] Behavior parameters
  - [ ] Temperature, top-p, etc.
- [ ] Attach custom tooling
  - [ ] Function/tool definition
  - [ ] Tool library
  - [ ] Enable/disable tools per agent
  - [ ] Custom function creation
  - [ ] Tool testing interface
- [ ] Agent templates
  - [ ] Preset agent configurations
  - [ ] Community shared agents
  - [ ] Import/export agents
  - [ ] Agent marketplace

---

## Search Functionality

### P1 Cross-Session Search
- [ ] Search across all sessions
  - [ ] Full-text search
  - [ ] Date range filtering
  - [ ] Model filtering
  - [ ] Agent filtering
- [ ] Search within session
  - [ ] Quick find in chat
  - [ ] Jump to message
  - [ ] Highlight matches
- [ ] Advanced filters
  - [ ] By message type (text, image, etc.)
  - [ ] By sender (user, AI)
  - [ ] By token usage
  - [ ] By timestamp

---

## File Upload

### P1 File Handling
- [ ] File upload support
  - [ ] Drag and drop
  - [ ] Click to browse
  - [ ] Multiple file selection
  - [ ] Upload progress indicator
- [ ] File validation
  - [ ] Max file size check
  - [ ] File type validation
  - [ ] Virus scanning
  - [ ] Size limits per tier
- [ ] Supported file types
  - [ ] Text files (.txt, .md, .csv)
  - [ ] Source code (.py, .js, .java, etc.)
  - [ ] Documents (.pdf, .docx)
  - [ ] Images (.png, .jpg, .webp)
  - [ ] Audio (.mp3, .wav)
- [ ] UTF-8 validation
  - [ ] Text encoding detection
  - [ ] Conversion if needed
  - [ ] Error handling for binary files

---

## Session Organization

### P1 Folder System
- [ ] Session folders
  - [ ] Create folder hierarchy
  - [ ] Nested folders support
  - [ ] Folder navigation
  - [ ] Breadcrumb trail
- [ ] Move chats into folders
  - [ ] Drag and drop
  - [ ] Multi-select move
  - [ ] Keyboard shortcuts
- [ ] Rename folders
  - [ ] In-place editing
  - [ ] Duplicate name detection
  - [ ] Emoji support
- [ ] Create folders
  - [ ] New folder button
  - [ ] Quick create from chat
  - [ ] Folder templates
- [ ] Folder customization
  - [ ] Color selection
  - [ ] Emoji selection
  - [ ] Icon library
  - [ ] Custom icons upload
- [ ] Visual styling
  - [ ] Icon color matches text
  - [ ] Preset color swatches
  - [ ] Custom color picker
  - [ ] Gradient support
  - [ ] Folder icons

---

## Themes

### P1 Theme Support
- [ ] Dark theme (default)
  - [ ] Current gothic dark theme
  - [ ] High contrast option
  - [ ] OLED black mode
- [ ] Light theme
  - [ ] Clean light design
  - [ ] Reduced eye strain
  - [ ] System auto-switch
- [ ] Additional themes
  - [ ] Dracula
  - [ ] Nord
  - [ ] Solarized
  - [ ] Monokai
  - [ ] Custom theme creator
- [ ] Theme persistence
  - [ ] Save preference
  - [ ] Sync across devices
  - [ ] Per-session themes

---

## Settings Modal

### P1 User Settings
- [ ] Theme selection dropdown
- [ ] Delete all chats button
  - [ ] Confirmation dialog
  - [ ] Backup before delete
  - [ ] Cannot be undone warning
- [ ] Confirm destructive actions
  - [ ] Two-step confirmation
  - [ ] Type-to-confirm for major actions
  - [ ] Undo period
- [ ] Clear cookies option
  - [ ] Reset preferences
  - [ ] Log out
  - [ ] Clear local storage
- [ ] Model selector (default model)
- [ ] Voice settings
  - [ ] Voice selection (alloy, echo, fable, onyx, nova, shimmer)
  - [ ] Auto playback toggle
  - [ ] Voice volume slider
  - [ ] Speech rate control
  - [ ] Pitch adjustment
- [ ] Context management
  - [ ] Max history selector
  - [ ] Max tokens per message
  - [ ] Context window size
- [ ] Memory settings
  - [ ] Max memory entries selector
  - [ ] Memory enable/disable toggle
  - [ ] Delete memories action
  - [ ] Memory export
  - [ ] Memory import

---

## Advanced Features

### P2 Code & Technical
- [ ] Code highlighting
  - [ ] Support many languages (50+)
  - [ ] Auto-detect language
  - [ ] Theme-aware syntax colors
  - [ ] Copy code button
  - [ ] Line numbers
  - [ ] Word wrap toggle

### P2 Storage Optimization
- [ ] Local storage compact representations
  - [ ] Compress old messages
  - [ ] Binary data handling
  - [ ] IndexedDB for large data
  - [ ] Storage quota management
- [ ] Boolean settings as toggles
  - [ ] Visual toggle switches
  - [ ] Keyboard accessible
  - [ ] Clear on/off states

---

## Memory System

### P2 Memory Functionality
- [ ] Save memory entry
  - [ ] Important facts
  - [ ] User preferences
  - [ ] Context clues
  - [ ] Relationship data
- [ ] Retrieve memory entry
  - [ ] Semantic search
  - [ ] Keyword matching
  - [ ] Relevance scoring
  - [ ] Context injection
- [ ] Memory placement rules
  - [ ] When to inject memories
  - [ ] Priority ordering
  - [ ] Token budget for memories
  - [ ] Staleness detection
- [ ] Delete memory entry
  - [ ] Individual deletion
  - [ ] Bulk delete
  - [ ] Category filtering
  - [ ] Confirmation
- [ ] Memory management
  - [ ] Export memories (JSON, CSV)
  - [ ] Import memories
  - [ ] Share memory sets
  - [ ] Memory templates
  - [ ] Memory visualization

---

## Data & Privacy

### P1 Data Management
- [ ] Session export
  - [ ] JSON format
  - [ ] Markdown format
  - [ ] PDF export
  - [ ] HTML export
- [ ] Session import
  - [ ] From JSON
  - [ ] From other platforms
  - [ ] Migration tools
- [ ] Data portability
  - [ ] GDPR compliance
  - [ ] Right to erasure
  - [ ] Data download
  - [ ] Account deletion

---

## User Experience

### P1 Polish & Usability
- [ ] Keyboard shortcuts
  - [ ] Shortcut reference modal
  - [ ] Customizable shortcuts
  - [ ] Vim-style navigation option
- [ ] Notifications
  - [ ] Browser notifications
  - [ ] In-app toasts
  - [ ] Error alerts
  - [ ] Success confirmations
- [ ] Onboarding
  - [ ] First-time tutorial
  - [ ] Feature highlights
  - [ ] Example conversations
  - [ ] Tips & tricks
- [ ] Help & Documentation
  - [ ] In-app help
  - [ ] FAQ section
  - [ ] Video tutorials
  - [ ] Community forum link

---

## Performance

### P2 Optimization
- [ ] Lazy loading
  - [ ] Load sessions on demand
  - [ ] Infinite scroll
  - [ ] Image lazy load
- [ ] Caching
  - [ ] Cache model list
  - [ ] Cache user settings
  - [ ] Cache recent sessions
  - [ ] Cache common responses
- [ ] Pagination
  - [ ] Message pagination
  - [ ] Session list pagination
  - [ ] Search results pagination

---

## Mobile Experience

### P1 Mobile Optimization
- [ ] Mobile-responsive layout
- [ ] Touch gestures
  - [ ] Swipe to delete
  - [ ] Pull to refresh
  - [ ] Pinch to zoom images
- [ ] Mobile menu
  - [ ] Bottom navigation
  - [ ] Hamburger menu
  - [ ] Quick actions
- [ ] PWA support
  - [ ] Install prompt
  - [ ] Offline mode
  - [ ] Push notifications
  - [ ] App-like experience

---

## Integration Features

### P2 External Integrations
- [ ] Discord integration
- [ ] Slack integration
- [ ] API webhooks
- [ ] Third-party plugins
- [ ] Browser extensions

---

## Analytics (Optional)

### P2 Usage Analytics
- [ ] Session analytics
  - [ ] Message count
  - [ ] Token usage over time
  - [ ] Model usage stats
  - [ ] Popular features
- [ ] Privacy-respecting
  - [ ] Anonymous analytics
  - [ ] Opt-out option
  - [ ] No PII tracking
  - [ ] Local analytics only

---

## Technical Requirements

### Backend Infrastructure Needed
- [ ] Backend server (Node.js/Python/Go)
- [ ] Database (PostgreSQL/MongoDB)
- [ ] Authentication system
- [ ] File storage (S3/CDN)
- [ ] Session management
- [ ] Rate limiting
- [ ] API gateway
- [ ] Load balancing
- [ ] Monitoring & logging
- [ ] Backup system

---

## Priority Summary

**P0 - Critical for MVP:**
- Demo feature parity
- Session management
- SFW/NSFW modes
- Basic settings

**P1 - Important:**
- Agents system
- File upload
- Folder organization
- Themes
- Settings modal
- Mobile optimization

**P2 - Nice to Have:**
- Memory system
- Advanced analytics
- External integrations
- Performance optimizations

---

## Estimated Effort

- **P0 Features:** 200-300 hours
- **P1 Features:** 300-400 hours
- **P2 Features:** 200-300 hours
- **Total:** 700-1000 hours (4-6 months for 1 developer)

**Note:** This assumes backend infrastructure is already in place.

---

## Related Documentation

- **Master TODO:** [TODO.md](TODO.md)
- **Demo Page:** [demo-page-TODO.md](demo-page-TODO.md)
- **Infrastructure:** [infrastructure-TODO.md](infrastructure-TODO.md)
- **Production App:** https://unity.unityailab.com

---

**Status:** ❌ Not in this repo - external deployment
**Implementation:** Future consideration
**Last Updated:** 2025-11-18
