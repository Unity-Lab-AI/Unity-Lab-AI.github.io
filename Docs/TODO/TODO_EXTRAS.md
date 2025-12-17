# TODO Extras - Legacy Content Migration & New Features

> Additional features, legacy content migration, and experimental functionality to enhance the new UnityAILab site.

---

## Migration from Legacy Projects

**Context:** The new site is replacing older project sites. We need to migrate and remaster content from previous repos while maintaining the new site's theme and design consistency.

### Mini Apps Migration

**Goal:** Convert Mini apps from old repositories into integrated pages on the new site

- [ ] P1 **Identify and catalog all Mini apps from legacy repos**
  - [ ] List all mini apps and their functionality
  - [ ] Document dependencies and requirements
  - [ ] Assess which apps are worth migrating
  - [ ] Determine migration priority

- [ ] P1 **Convert Mini apps to new site pages**
  - [ ] Create `/apps` directory structure for mini apps
  - [ ] Migrate first mini app (TBD which one)
  - [ ] Migrate second mini app
  - [ ] Migrate third mini app
  - [ ] (Add more as identified)

- [ ] P1 **Update Mini apps with new theme**
  - [ ] Apply Trajan Pro font and gothic styling
  - [ ] Match color scheme (dark backgrounds, red accents)
  - [ ] Ensure responsive design across all screen sizes
  - [ ] Update navigation to integrate with main site
  - [ ] Test cross-browser compatibility

- [ ] P1 **Create Mini apps index/gallery page**
  - [ ] `/apps` or `/tools` landing page
  - [ ] Grid layout of available mini apps
  - [ ] Preview cards with descriptions
  - [ ] Filter/search functionality
  - [ ] Link from main navigation

### "Talking To Unity" Feature

**Goal:** Convert the "Talking To Unity" functionality into a dedicated page on the new site

- [ ] P1 **Create "Talking To Unity" page**
  - [ ] Create `/talk-to-unity` or `/chat-with-unity` page
  - [ ] Migrate core functionality from old repo
  - [ ] Update UI to match new site theme
  - [ ] Integrate PolliLibJS for API calls
  - [ ] Implement voice chat features (TTS/STT)

- [ ] P1 **Implement Unity Model with Custom System Prompt**
  - [ ] Research current Unity system prompt from old implementation
  - [ ] Write updated "Unrestricted Unity Model" system prompt
  - [ ] Implement system prompt injection when Unity model is selected
  - [ ] Test Unity persona responses for consistency
  - [ ] Document system prompt in code comments

- [ ] P1 **Features for Talking To Unity page**
  - [ ] Text chat with Unity persona
  - [ ] Voice chat option (speak and listen)
  - [ ] Chat history (local storage)
  - [ ] Personality indicator/badge
  - [ ] Unity-specific features (if any from old repo)

### Floating Chat Box - "Talk to the Site"

**Goal:** Add a floating chat box on the landing page for interactive site assistance

- [ ] P0 **Design and implement floating chat widget**
  - [ ] Create floating button (bottom right corner)
  - [ ] Expandable chat interface
  - [ ] Minimizable/closable
  - [ ] Position persistence (stays in corner on scroll)
  - [ ] Mobile-friendly design

- [ ] P0 **Implement "Talk to the Site" functionality**
  - [ ] Connect to Pollinations API (text-to-text)
  - [ ] System prompt: Site assistant/guide
  - [ ] Answer questions about the site
  - [ ] Navigate users to appropriate pages
  - [ ] Provide info about UnityAILab services

- [ ] P1 **Advanced chat widget features**
  - [ ] Voice input/output option
  - [ ] Chat history retention
  - [ ] Typing indicators
  - [ ] Suggested questions/prompts
  - [ ] Handoff to full /ai app option
  - [ ] Keyboard shortcuts (e.g., Ctrl+K to open)

- [ ] P1 **Widget customization**
  - [ ] Match site theme (gothic style)
  - [ ] Smooth animations (expand/collapse)
  - [ ] Notification badge for new messages
  - [ ] Sound effects toggle
  - [ ] Widget position preference (save in localStorage)

### Media Gallery Features

**Goal:** Recreate thumbnails, image slider/carousel, and screen saver functionality from old repos

- [ ] P1 **Thumbnails System**
  - [ ] Identify thumbnail functionality from legacy repos
  - [ ] Create thumbnail generation/display system
  - [ ] Lazy loading for performance
  - [ ] Lightbox/modal view on click
  - [ ] Integration with Gallery section

- [ ] P1 **Image Slider / Carousel**
  - [ ] Implement responsive image carousel
  - [ ] Auto-advance with pause on hover
  - [ ] Swipe gestures for mobile
  - [ ] Navigation dots/arrows
  - [ ] Thumbnail preview strip
  - [ ] Integrate with project showcases

- [ ] P1 **Screen Saver Mode**
  - [ ] Identify screen saver functionality from old repos
  - [ ] Implement idle detection
  - [ ] Full-screen image/animation display
  - [ ] Exit on mouse move/key press
  - [ ] Configurable timeout
  - [ ] Option to enable/disable

- [ ] P1 **Media gallery integration**
  - [ ] Connect to Pollinations image generation
  - [ ] Display generated images in gallery
  - [ ] Save favorites to gallery
  - [ ] Gallery management (organize, delete, export)

### Theme Consistency

**Goal:** Ensure all migrated content maintains the new site's theme and design language

- [ ] P0 **Establish theme checklist for migrated content**
  - [ ] Trajan Pro font usage
  - [ ] Gothic/dark aesthetic with red accents
  - [ ] Consistent navigation structure
  - [ ] Responsive design (xs to xl breakpoints)
  - [ ] Cross-browser compatibility
  - [ ] Accessibility standards (WCAG AA)

- [ ] P0 **Create reusable components for legacy content**
  - [ ] Header/navigation component
  - [ ] Footer component
  - [ ] Page wrapper with theme styles
  - [ ] Card/panel components
  - [ ] Button styles
  - [ ] Form input styles

- [ ] P0 **Review and update all migrated pages**
  - [ ] Visual design review
  - [ ] Code quality review
  - [ ] Performance testing
  - [ ] Accessibility testing
  - [ ] Mobile responsiveness testing

---

## Branding & Attribution

### "Powered by Pollinations.ai" Section

**Goal:** Add proper attribution and showcase the Pollinations API that powers the site

- [ ] P1 **Create "Powered by Pollinations.ai" section**
  - [ ] Design badge/logo section
  - [ ] Add to landing page footer area
  - [ ] Link to pollinations.ai website
  - [ ] Brief description of Pollinations
  - [ ] Visual design matching site theme

- [ ] P1 **Add Pollinations attribution to AI pages**
  - [ ] Footer attribution on /demo page
  - [ ] Footer attribution on /ai page
  - [ ] Model attribution in model selectors
  - [ ] API documentation references
  - [ ] "Learn more about Pollinations" links

- [ ] P2 **Showcase Pollinations capabilities**
  - [ ] Dedicated section explaining Pollinations features
  - [ ] Example generations/outputs
  - [ ] Comparison with other AI platforms
  - [ ] Why we chose Pollinations

---

## Unity Model System Prompt

**Goal:** Implement custom system prompt for unrestricted Unity model when using Pollinations

- [ ] P0 **Write Unity Model System Prompt**
  - [ ] Define Unity persona characteristics
  - [ ] Set tone and communication style
  - [ ] Establish boundaries (or lack thereof for unrestricted)
  - [ ] Add personality traits
  - [ ] Include context about UnityAILab
  - [ ] Test and refine based on responses

- [ ] P0 **Implement system prompt injection**
  - [ ] Detect when Unity model is selected
  - [ ] Inject custom system prompt in API calls
  - [ ] Override default Pollinations system prompt
  - [ ] Handle system prompt for streaming mode
  - [ ] Test across different contexts (demo, ai, chat widget)

- [ ] P1 **Unity Model Features**
  - [ ] Personality badge/indicator when Unity is active
  - [ ] Unity-specific UI customization
  - [ ] Special greeting message when Unity model loads
  - [ ] Unity mode toggle (restricted/unrestricted)
  - [ ] Document Unity persona for users

- [ ] P1 **System Prompt Management**
  - [ ] Create system prompt configuration file
  - [ ] Support for multiple persona prompts
  - [ ] Prompt versioning
  - [ ] A/B testing different prompts
  - [ ] User feedback on persona quality

---

## AI-Powered Browser Games

**Goal:** Plan and develop AI-powered games that run in the browser using Pollinations

**Vision:** Create engaging, interactive games that leverage AI capabilities (text generation, image generation, chat) to provide unique gaming experiences.

### Planning & Concepts

- [ ] P2 **Brainstorm AI game concepts**
  - [ ] AI Dungeon Master (text adventure game)
  - [ ] AI Art Challenge (prompt vs AI generation)
  - [ ] Conversation games (guess the AI, Turing test)
  - [ ] Story collaboration games
  - [ ] Image puzzle generator
  - [ ] AI-powered trivia/quiz games
  - [ ] Code challenge games with AI hints
  - [ ] Creative writing prompts with AI

- [ ] P2 **Define game requirements**
  - [ ] Browser-based (no installation required)
  - [ ] Powered by Pollinations API (PolliLibJS)
  - [ ] Single-player and/or multiplayer
  - [ ] Save progress locally (localStorage)
  - [ ] Mobile-friendly controls
  - [ ] Accessibility considerations
  - [ ] Match site theme

- [ ] P2 **Game architecture planning**
  - [ ] Game engine selection (or custom)
  - [ ] State management for game logic
  - [ ] AI integration points
  - [ ] Scoring/progression systems
  - [ ] Leaderboards (local or server-based)
  - [ ] Share results functionality

### Game Development Roadmap

- [ ] P2 **Prototype first AI game**
  - [ ] Select simplest concept for MVP
  - [ ] Build core gameplay loop
  - [ ] Integrate Pollinations AI
  - [ ] Basic UI/UX
  - [ ] Playtesting
  - [ ] Iterate based on feedback

- [ ] P2 **Create games section on site**
  - [ ] `/games` landing page
  - [ ] Grid of available games
  - [ ] Game categories/tags
  - [ ] Recent activity/scores
  - [ ] Featured game spotlight

- [ ] P3 **Develop additional games**
  - [ ] Second game concept
  - [ ] Third game concept
  - [ ] Fourth game concept
  - [ ] (Continue as resources allow)

### Game-Specific Features

- [ ] P2 **AI Dungeon Master / Text Adventure**
  - [ ] AI-generated story paths
  - [ ] Player choices influence narrative
  - [ ] Character creation with AI
  - [ ] Inventory system
  - [ ] Save/load game states
  - [ ] Shareable story outcomes

- [ ] P2 **AI Art Challenge**
  - [ ] Timed prompt challenges
  - [ ] AI generates competing images
  - [ ] Player votes on best generation
  - [ ] Difficulty levels (prompt complexity)
  - [ ] Leaderboard for best prompts
  - [ ] Gallery of best generations

- [ ] P2 **Guess the AI Game**
  - [ ] Chat with mixture of AI and human responses
  - [ ] Player identifies which is AI
  - [ ] Scoring based on accuracy
  - [ ] Different AI models/personalities
  - [ ] Increasing difficulty levels

- [ ] P3 **Multiplayer game features**
  - [ ] Real-time websocket connections
  - [ ] Turn-based gameplay
  - [ ] Player lobbies
  - [ ] Friend invites
  - [ ] Chat during gameplay
  - [ ] Spectator mode

### Integration & Polish

- [ ] P2 **Games integration with main site**
  - [ ] Link from navigation
  - [ ] Games widget on landing page
  - [ ] Share game results to social
  - [ ] Achievements/badges system
  - [ ] Cross-game progression tracking

- [ ] P3 **Advanced game features**
  - [ ] AI difficulty adjustment
  - [ ] Procedural generation using AI
  - [ ] Voice control for games
  - [ ] VR/AR experiments (future)
  - [ ] Mobile apps for games

---

## Technical Debt & Migration Notes

- [ ] P1 **Document legacy code dependencies**
  - [ ] List libraries used in old repos
  - [ ] Identify deprecated dependencies
  - [ ] Plan upgrade paths
  - [ ] Security audit of legacy code

- [ ] P1 **Create migration guide**
  - [ ] Document migration process
  - [ ] Theme conversion guidelines
  - [ ] Testing checklist
  - [ ] Rollback procedures

- [ ] P2 **Archive old repositories**
  - [ ] Mark old repos as archived on GitHub
  - [ ] Add README redirects to new site
  - [ ] Preserve git history
  - [ ] Document what was migrated

---

## Future Enhancements

- [ ] P3 **Community features**
  - [ ] User-submitted mini apps
  - [ ] Game mod support
  - [ ] Prompt sharing community
  - [ ] User galleries

- [ ] P3 **Analytics for migrated content**
  - [ ] Track usage of mini apps
  - [ ] Game play metrics
  - [ ] Chat widget engagement
  - [ ] Popular features dashboard

- [ ] P3 **Monetization options**
  - [ ] Premium games tier
  - [ ] Ad-free option
  - [ ] Supporter badges
  - [ ] Custom persona creation service

---

## Notes & Reminders

- All migrated content must match new site theme (Trajan Pro, gothic dark with red accents)
- Maintain responsive design across all new pages
- Ensure cross-browser compatibility
- Use PolliLibJS for all Pollinations API calls
- Keep code modular and reusable
- Document system prompts and configurations
- Test on mobile devices throughout development
- Accessibility is not optional - WCAG AA minimum
- Performance matters - optimize images, lazy load, minimize JS
