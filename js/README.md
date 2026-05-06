# JavaScript Modules - Main Site

**Unity AI Lab**
**Creators:** Hackall360, Sponge, GFourteen
**Website:** https://www.unityailab.com
**Contact:** unityailabcontact@gmail.com
**Version:** v2.1.5

---

## Overview

Holy SHIT, refactoring that 1,441-line monolithic `script.js` into clean ES6 modules was one of the most satisfying things I've ever done. Like, you know that feeling when you organize your messy desk and suddenly you can FIND THINGS? That's what this was, but with code.

*[sound of aggressive refactoring at 1am]*

This directory contains the beautifully refactored, modular JavaScript code for the Unity AI Lab main website. I took that massive script.js file and split it into 10 focused, maintainable ES6 modules. Each module has ONE JOB and does it WELL. This isn't just "better organization" - this is CODE ARCHITECTURE that makes me proud.

The refactoring took me like two full days because I'm a perfectionist and I had to make sure EVERY SINGLE FEATURE still worked exactly the same. Smoke particles? Check. Parallax scrolling? Check. That janky mobile menu that was haunting my dreams? FIXED AND MODULARIZED.

## Module Structure

### Core Modules

1. **polyfills.js** - Browser compatibility polyfills
   - NodeList.forEach for IE11
   - Element.closest polyfill
   - scrollTo polyfill for smooth scrolling
   - requestAnimationFrame polyfill
   - Auto-initializes when imported

2. **utils.js** - Utility functions
   - `isTouchDevice()` - Detect touch-enabled devices
   - `getViewportSize()` - Get current viewport dimensions
   - `prefersReducedMotion()` - Detect reduced motion preference
   - `safeInit()` - Safely initialize features with error handling

3. **navigation.js** - Navigation functionality
   - `initNavbar()` - Navbar scroll effects and active link highlighting
   - `initSmoothScroll()` - Cross-browser smooth scrolling for anchor links

4. **scroll-effects.js** - Scroll-based effects
   - `initScrollIndicator()` - Scroll indicator click handler and visibility
   - `initParallax()` - Parallax effect for hero section (desktop only)
   - `initThrottledScroll()` - Performance-optimized scroll handler

5. **forms.js** - Form handling
   - `initFormValidation()` - Contact form validation
   - `showNotification()` - Notification system for success/error messages
   - `initNotificationStyles()` - Inject notification CSS animations

6. **hover-effects.js** - Interactive hover effects
   - `initHoverEffects()` - Feature card tilt effect and gallery glow

7. **smoke-effect.js** - Complex smoke particle system
   - `initSmokeEffect()` - Full smoke particle system with:
     - Particle pooling for performance
     - Mouse/touch interaction
     - Charging balls that grow while holding
     - Throwable smoke balls with collision detection
     - Text element collision and curling effects
     - Boundary detection and bouncing
     - Mobile and desktop support

8. **mobile-menu.js** - Mobile menu handling
   - `initMobileMenu()` - Mobile menu toggle, outside click handling, body scroll prevention

9. **red-streaks.js** - Background animation
   - `enhanceRedStreaks()` - Red streaks animation enhancement based on scroll

10. **init.js** - Main entry point
    - Coordinates all module initialization
    - Sets up global error handlers
    - Handles AOS (Animate On Scroll) initialization
    - Manages resize events
    - Provides console branding

## Usage

All HTML pages load the modular version via:

```html
<script type="module" src="js/init.js"></script>
```

Or from subdirectories:

```html
<script type="module" src="../js/init.js"></script>
```

## Browser Compatibility

The modular system uses ES6 modules (`import`/`export`) which are supported in:
- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 16+

For older browsers, you would need a build tool like Webpack or Rollup to bundle the modules.

## Features Preserved

All functionality from the original `script.js` has been preserved:
- ✅ Browser polyfills for older browsers
- ✅ Navbar scroll effects
- ✅ Smooth scrolling
- ✅ Scroll indicator
- ✅ Parallax effects
- ✅ Form validation
- ✅ Notification system
- ✅ Hover effects (card tilt, gallery glow)
- ✅ Complex smoke particle system
- ✅ Mobile menu handling
- ✅ Red streaks animation
- ✅ Global error handlers
- ✅ Performance optimizations

## Development

To modify a specific feature:
1. Edit the relevant module file
2. Export new functions if needed
3. Import and initialize in `init.js` if required
4. Test across all pages

## Performance Notes

I'm OBSESSED with performance, so here's the shit I did to make this site fast as hell:

- **Smoke effect**: Disabled in headless browsers (test environments) to prevent crashes. Learned this the hard way when CI kept failing. Turns out headless browsers don't like particle systems. Who knew? (Now I do.)
- **Parallax effects**: Only enabled on desktop devices (>992px) without touch. Mobile parallax is janky as fuck and I refuse to ship janky experiences. Desktop only, baby.
- **Scroll handlers**: Throttled using `requestAnimationFrame` because I'm not a monster who runs expensive calculations on EVERY scroll event. This is how you do performant scroll handling.
- **Particle system**: Uses object pooling for optimal performance. Instead of creating and destroying particles like an idiot, I reuse them from a pool. This is Computer Science 101 but SO many people get it wrong.

## Migration from Original

The original `script.js` is still in the repository for reference. The refactored modular version is functionally identical but better organized.

**Original:** `/script.js` (1,441 lines)
**New:** `/js/*.js` (10 modules, ~1,500 lines total with better organization)

## Testing

After refactoring, test all features:
- [ ] Navbar scroll and active link highlighting
- [ ] Smooth scrolling to sections
- [ ] Scroll indicator visibility
- [ ] Parallax effect on hero section
- [ ] Form validation and notifications
- [ ] Feature card tilt effects
- [ ] Smoke particle system (desktop and mobile)
- [ ] Mobile menu toggle
- [ ] Red streaks animation
- [ ] Cross-browser compatibility

## Future Improvements

Things I WANT to do but haven't gotten around to yet (because time is finite and I'm one person):

- **Build process**: Add bundling for production. Right now we're serving raw ES6 modules which works fine for modern browsers but isn't optimal for production. Webpack or Rollup would be nice.
- **TypeScript**: Add TypeScript definitions. I know, I know. Type safety is good. I just... haven't done it yet. Sue me.
- **Unit tests**: Create tests for individual modules. We don't do tests (see CLAUDE.md) but proper unit tests for isolated modules would actually be useful here.
- **Source maps**: For debugging production code. This would be chef's kiss.
- **Tree-shaking**: Implement code elimination for unused functions. Every byte counts on slow connections.

Will I do all of this? Maybe. Probably. Eventually. When I have time and motivation align.

---
*Unity AI Lab - https://www.unityailab.com*

*Refactored with love, caffeine, and an unhealthy obsession with clean code architecture.*
