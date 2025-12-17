# JavaScript Modules - Main Site

This directory contains the refactored, modular JavaScript code for the Unity AI Lab main website.

## Overview

The original monolithic `script.js` (1,441 lines) has been refactored into clean, maintainable ES6 modules. This improves code organization, maintainability, and makes it easier to test and debug individual features.

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

- Smoke effect is disabled in headless browsers (test environments) to prevent crashes
- Parallax effects only enabled on desktop devices (>992px) without touch
- Scroll handlers are throttled using `requestAnimationFrame`
- Particle system uses object pooling for optimal performance

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

Potential enhancements:
- Add build process to bundle modules for production
- Add TypeScript definitions
- Create unit tests for individual modules
- Add source maps for debugging
- Implement tree-shaking for unused code elimination
