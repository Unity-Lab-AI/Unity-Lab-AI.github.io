# Playwright Test Suite

## Overview

Automated test suite for the UnityAILab website with two main test suites:

1. **Navigation Tests** - Basic page navigation and loading
2. **Browser Compatibility Tests** - HTML/JS element loading across all browsers

**Test Coverage:**
- Page navigation and loading
- Browser compatibility (Chromium, Firefox, WebKit)
- HTML element presence verification
- JavaScript execution verification
- CSS and resource loading
- Mobile responsiveness
- Footer and navigation consistency

---

## Installation

```bash
npm install
npx playwright install  # Installs Chromium, Firefox, and WebKit
```

---

## Running Tests

### Run All Tests
```bash
npm test
```

### View HTML Report
```bash
npm run test:report
```

---

## Test Suite

### Navigation Tests (`tests/navigation.spec.js`)

**Tests core navigation functionality:**

#### 1. Complete User Flow Through All Pages

Simulates a real user journey:
- Loads home page and verifies h1 visibility
- Checks JavaScript loaded (verifies feature cards present)
- Tests scrolling functionality
- Navigates to About page via navbar
- Navigates to Services page and verifies service cards
- Navigates to Projects page
- Navigates to Contact page
- Tests contact form interactivity (filling name input)
- Verifies footer with GitHub link

**Purpose:** Ensures the basic flow through the site works without JavaScript errors or navigation issues.

---

#### 2. Mobile Navigation Works

Tests mobile-specific functionality:
- Sets mobile viewport (375x667)
- Verifies navbar toggle button visible
- Clicks toggle to open menu
- Navigates to About page from mobile menu
- Verifies page loads correctly

**Purpose:** Ensures mobile navigation (hamburger menu) functions properly.

---

#### 3. All Pages Return 200 Status

Tests all pages for successful loading:
- `/` (Home)
- `/about/`
- `/services/`
- `/projects/`
- `/contact/`

**Purpose:** Verifies server is serving all pages correctly without 404s or errors.

---

#### 4. JavaScript Loads Correctly

Verifies JavaScript execution:
- Checks navbar exists (Bootstrap loaded)
- Waits for network idle
- Verifies body has `.loaded` class added by JavaScript

**Purpose:** Ensures script.js executes successfully and applies expected DOM modifications.

---

#### 5. Footer Appears on All Pages

Tests footer consistency:
- Loads each page
- Verifies footer is visible
- Checks copyright text contains "UnityAILab"

**Purpose:** Ensures footer component is present across all pages.

---

### Browser Compatibility Tests (`tests/browser-compatibility.spec.js`)

**Tests HTML and JavaScript loading across all browsers:**

This test suite verifies that all expected HTML elements and JavaScript functionality load correctly across Chromium, Firefox, and WebKit browsers.

#### Test Categories

**1. Chromium Browser Compatibility (4 tests)**
- Verifies all critical HTML elements load
- Tests JavaScript execution (loaded class, AOS library, Bootstrap)
- Checks all pages load without errors
- Validates CSS and JavaScript resource loading

**2. Firefox Browser Compatibility (5 tests)**
- Same HTML element verification as Chromium
- JavaScript execution tests
- Page loading verification
- Resource loading checks
- Animation and transition rendering tests

**3. WebKit Browser Compatibility (6 tests)**
- HTML element verification
- JavaScript execution validation
- Page error checking
- Resource loading verification
- Animation rendering tests
- WebKit-specific CSS property handling

**4. Cross-Browser Consistency (5 tests)**
- Nav link count consistency (should be 6)
- Feature card count (should be 3)
- Service card count (should be 2)
- Footer social links (should be 3)
- JavaScript 'loaded' class execution

**5. AI Demo Page Tests (3 tests)**
- One test per browser (Chromium, Firefox, WebKit)
- Verifies demo container loads
- Checks page renders correctly

#### Elements Tested

**HTML Elements:**
- Navigation (navbar, brand, toggle, nav links)
- Hero section (title, subtitle, buttons, scroll indicator)
- Feature cards (3 cards)
- Service cards (2 cards)
- Footer (social links, quick links, copyright)
- Background elements (overlay, red streaks)

**JavaScript Functionality:**
- Body 'loaded' class added
- AOS (Animate On Scroll) library initialization
- Bootstrap JavaScript loaded
- Navbar scroll events
- Data-AOS attributes present and functional

**Resources:**
- Stylesheets loaded
- JavaScript files loaded
- Bootstrap framework availability

#### Running Browser-Specific Tests

```bash
# Run only browser compatibility tests
npx playwright test browser-compatibility

# Run only Chromium tests
npx playwright test browser-compatibility --project=chromium

# Run only Firefox tests
npx playwright test browser-compatibility --project=firefox

# Run only WebKit tests
npx playwright test browser-compatibility --project=webkit
```

**Purpose:** Ensures the site works consistently across all major browser engines and that all expected HTML/JS elements are present and functional.

---

## Note on Animation Performance Limits

To prevent performance degradation, the smoke throwing animation has built-in limits:

### Limits Implemented (script.js)

**Smoke Puffs:**
- Preferred maximum: 6 puffs on screen
- Hard limit: 10 puffs
- Behavior: When over 6 puffs, dissipation speed increases automatically
- At 10 puffs: Oldest puff is deleted when new one spawns

**Smoke Balls:**
- Preferred maximum: 6 balls
- Hard limit: 10 balls
- Behavior: When limit reached, oldest ball is removed

### Performance Constants

```javascript
var MAX_SMOKE_PUFFS = 6;        // Preferred max
var HARD_LIMIT_PUFFS = 10;      // Hard limit
var MAX_SMOKE_BALLS = 6;        // Preferred max
var HARD_LIMIT_BALLS = 10;      // Hard limit
```

When puff count exceeds the preferred max, dissipation rate increases:
- Base decay rate: 0.006
- Multiplier when over max: 1 + (count - MAX) * 0.5
- Maximum multiplier: 3.0

**Note:** These navigation tests do NOT test the smoke animations themselves - they're purely for navigation and page loading verification.

---

## Configuration

### Test Settings (playwright.config.js)

- **Test directory:** `./tests`
- **Ignored directories:** `**/backup/**`
- **Workers:** 1 (sequential execution for stability)
- **Retries:** 2 in CI, 0 locally
- **Timeout:** 30 seconds per test
- **Expect timeout:** 10 seconds
- **Base URL:** http://localhost:8080

### Reporters

Tests generate three types of reports:
1. **HTML Report:** Interactive report in `playwright-report/`
2. **JSON Report:** Machine-readable results in `test-results/results.json`
3. **List:** Console output during test execution

---

## CI/CD Integration

Tests automatically run in GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
- name: Run Playwright tests
  run: npx playwright test
  env:
    CI: true
```

The workflow:
1. Installs dependencies
2. Installs Playwright browsers (Chromium only)
3. Starts local server on port 8080
4. Runs all tests
5. Uploads test results as artifacts (retained 30 days)

---

## Test Results Interpretation

### Passing Tests ✅
- Indicates core functionality working
- Feature accessible and interactive
- No action needed

### Failing Tests ❌
- Identifies specific issue
- Provides error messages and stack traces
- Screenshots available for failures

### Example Output
```
✓ Complete user flow through all pages (2.3s)
✓ Mobile navigation works (1.1s)
✓ All pages return 200 status (892ms)
✓ JavaScript loads correctly (445ms)
✓ Footer appears on all pages (1.2s)

  5 passed (6.0s)
```

---

## Local Development Workflow

1. **Make Changes:** Update HTML/CSS/JS
2. **Run Tests:** `npm test`
3. **Review Failures:** Check console output
4. **Fix Issues:** Address any failing tests
5. **Re-run:** Verify fixes work
6. **Commit:** Push changes to git

---

## Troubleshooting

### Browser Crashes ("Page crashed" errors)

If you see "Page crashed" errors when running tests locally:

**Cause:** Missing system dependencies or headless browser issues

**Solutions:**
1. Install Playwright with system dependencies:
   ```bash
   npx playwright install --with-deps
   ```

2. Run only Chromium tests (best local compatibility):
   ```bash
   npx playwright test --project=chromium
   ```

3. Use GitHub Actions (CI) where all dependencies are installed

### Firefox Permission Issues

If Firefox fails with HOME folder ownership errors:

```bash
# Set HOME environment variable
HOME=/root npx playwright test --project=firefox
```

### WebKit Missing Dependencies

If WebKit fails due to missing system libraries:

```bash
# Install WebKit dependencies
sudo npx playwright install-deps webkit
```

### Tests Pass in CI but Fail Locally

This is **normal**! CI environments have all system dependencies properly installed.

To match CI locally:
```bash
npx playwright install --with-deps
```

### Tests Timing Out

If tests timeout (exceed 30s), check:
- Local server is running on port 8080
- JavaScript has no infinite loops or errors
- Network requests to CDNs are succeeding
- Browser console for JavaScript errors
- Run in headed mode to see what's happening: `npx playwright test --headed`

### Tests Failing to Find Elements

If selectors don't match:
- Verify HTML structure hasn't changed
- Check class names and IDs are correct
- Ensure JavaScript has finished loading before tests run
- Wait for network idle before assertions
- Run in UI mode to debug: `npx playwright test --ui`

### Server Not Starting

If web server fails to start:
```bash
# Kill any existing server
pkill -f "python3 -m http.server"

# Start fresh
python3 -m http.server 8080
```

---

## Backup Tests

Previous comprehensive test suites have been moved to `tests/backup/`:
- `accessibility.spec.js` - WCAG 2.1 AA compliance tests
- `keyboard-navigation.spec.js` - Keyboard accessibility tests
- `performance.spec.js` - Performance metric tests
- `responsive.spec.js` - Multi-viewport responsive tests
- `seo.spec.js` - SEO and meta tag tests
- `functional.spec.js` - Detailed page functionality tests

These can be re-enabled by moving them back to `tests/` if more thorough testing is needed.

---

## Tools Used

- **@playwright/test**: Modern browser automation framework
- **Chromium**: Headless browser for testing

---

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)

---

**Created:** 2025-11-19
**Last Updated:** 2025-11-21
**Test Suite Version:** 4.0 (Navigation + Browser Compatibility)
**Total Tests:**
- 10 navigation tests
- 23 browser compatibility tests (Chromium: 4, Firefox: 5, WebKit: 6, Cross-browser: 5, AI Demo: 3)
**Test Focus:** Site navigation, browser compatibility, HTML/JS element loading verification
