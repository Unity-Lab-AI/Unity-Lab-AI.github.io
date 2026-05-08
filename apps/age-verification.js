/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Age Verification + Legal Acceptance System for Unity AI Lab Apps
 * 18+ verification + Terms of Service + Privacy Policy acceptance, all in localStorage.
 *
 * Flow:
 *   - First-time visitor (no flags) → "Are you 18+?" → birthdate → legal acceptance → enabled
 *   - Returning user with age flags but no legal flag → only the legal-acceptance popup
 *   - Returning user with age + legal (matching version) → enabled, no popup
 *   - User declines age OR closes legal popup → kicked to google.com
 *   - ToS/Privacy version bump → mismatch on legalAcceptedVersion → re-prompt for legal only
 *
 * Universal localStorage flags (propagate across all gate paths — passing once on
 * /apps/, /ai/demo/, or any individual app unlocks every other path):
 *   button18, birthdate, husdh-f978dyh-sdf  → age verification
 *   legalAccepted, legalAcceptedVersion, legalAcceptedDate → ToS+Privacy acceptance
 */

const AgeVerification = {
    // storage keys we're using
    KEYS: {
        BUTTON_18: 'button18',
        BIRTHDATE: 'birthdate',
        VERIFICATION_KEY: 'husdh-f978dyh-sdf',
        LEGAL_ACCEPTED: 'legalAccepted',
        LEGAL_VERSION: 'legalAcceptedVersion',
        LEGAL_DATE: 'legalAcceptedDate'
    },

    // the magic verification string
    VERIFICATION_VALUE: 'ijdfjgdfo-38d9sf-sdf',

    // gotta be this old to enter
    MIN_AGE: 18,

    // current Terms of Service + Privacy Policy version. Must match the version
    // stamp in redesign/terms-v1.jsx and redesign/privacy-v1.jsx. Bump this when
    // either legal document is materially revised — users with a stale version
    // will be re-prompted to accept the revised text on their next visit.
    CURRENT_LEGAL_VERSION: 'v1.0',

    // resolve the relative path to /terms and /privacy from whichever directory
    // the host page lives in (root pages: ./terms ./privacy ; nested apps:
    // ../../terms ../../privacy). Computed once at runtime so the same script
    // works whether it's loaded from /apps.html or /apps/oldSiteProject/index.html
    // or /ai/demo/index.html.
    getLegalUrls() {
        const path = window.location.pathname;
        // count the directory depth — every '/' between the leading slash and
        // the filename means one '../' worth of climbing
        const segments = path.replace(/^\//, '').split('/').filter(Boolean);
        // last segment is the filename (or empty for trailing-slash dirs); subtract 1
        const depth = path.endsWith('/') ? segments.length : Math.max(0, segments.length - 1);
        const prefix = depth === 0 ? './' : '../'.repeat(depth);
        return {
            terms: prefix + 'terms.html',
            privacy: prefix + 'privacy.html'
        };
    },

    /**
     * inject the verification CSS so the gate is self-contained — drop the
     * script tag into any HTML and it works without requiring apps.css.
     * Verification flag prevents double-injection if init runs twice.
     */
    injectStyles() {
        if (document.getElementById('age-verification-styles')) return;
        const css = `
.verification-backdrop {
    position: fixed; top: 0; left: 0;
    width: 100vw; height: 100vh; height: 100dvh;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    z-index: 2147483647;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; animation: avFadeInBackdrop 0.3s ease forwards;
    transition: opacity 0.3s ease;
}
@keyframes avFadeInBackdrop { to { opacity: 1; } }
.verification-popup {
    position: relative;
    background: rgba(26, 26, 26, 0.98);
    border: 2px solid var(--crimson-red, #dc143c);
    border-radius: 12px; padding: 40px;
    max-width: 500px; width: 90%;
    max-height: 90vh; max-height: 90dvh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(220, 20, 60, 0.6);
    text-align: center; animation: avPopupSlideIn 0.4s ease;
    z-index: 2147483647;
}
.verification-popup.legal-popup {
    max-width: 580px;
    text-align: left;
}
@keyframes avPopupSlideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.verification-popup h2 {
    font-family: 'Trajan Pro', 'Cormorant Garamond', serif;
    font-size: 1.8rem; color: #fff; margin-bottom: 20px;
    text-transform: uppercase; letter-spacing: 2px;
}
.verification-popup.legal-popup h2 { text-align: center; }
.verification-popup p { font-size: 1.1rem; color: #cccccc; margin-bottom: 30px; line-height: 1.6; }
.verification-buttons { display: flex; gap: 15px; justify-content: center; align-items: center; }
.verification-btn {
    padding: 15px 40px;
    font-family: 'Trajan Pro', 'Cormorant Garamond', serif;
    font-size: 1rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.5px;
    border: 2px solid; border-radius: 8px; cursor: pointer;
    transition: all 0.3s ease; background: transparent;
}
.verification-btn.yes { border-color: var(--crimson-red, #dc143c); color: #fff; background: linear-gradient(135deg, rgba(139, 0, 0, 0.6) 0%, rgba(220, 20, 60, 0.6) 100%); }
.verification-btn.yes:hover { background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%); box-shadow: 0 5px 20px rgba(220, 20, 60, 0.6); transform: translateY(-2px); }
.verification-btn.no { border-color: rgba(204, 204, 204, 0.5); color: #cccccc; }
.verification-btn.no:hover { border-color: #cccccc; background: rgba(204, 204, 204, 0.1); transform: translateY(-2px); }
.age-input-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 25px; }
.age-input-row { display: flex; gap: 12px; justify-content: center; align-items: center; flex-wrap: wrap; }
.age-select-wrapper { flex: 1; min-width: 100px; display: flex; flex-direction: column; gap: 8px; }
.age-select-label { font-size: 0.85rem; color: #cccccc; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.age-select {
    width: 100%; background: rgba(42, 42, 42, 0.9);
    border: 1px solid rgba(220, 20, 60, 0.3); color: #cccccc;
    padding: 12px; border-radius: 6px;
    font-family: 'Trajan Pro', 'Cormorant Garamond', serif; font-size: 0.95rem;
    cursor: pointer; transition: all 0.3s ease; outline: none;
    -moz-appearance: none; -webkit-appearance: none; appearance: none;
}
.age-select:hover { border-color: var(--crimson-red, #dc143c); }
.age-select:focus { border-color: var(--crimson-red, #dc143c); box-shadow: 0 0 10px rgba(220, 20, 60, 0.4); }
.age-select option { background: rgba(42, 42, 42, 0.95); color: #cccccc; }
.verification-btn.submit { width: 100%; border-color: var(--crimson-red, #dc143c); color: #fff; background: linear-gradient(135deg, rgba(139, 0, 0, 0.6) 0%, rgba(220, 20, 60, 0.6) 100%); }
.verification-btn.submit:hover { background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%); box-shadow: 0 5px 20px rgba(220, 20, 60, 0.6); transform: translateY(-2px); }
.verification-btn.submit:disabled,
.verification-btn.submit[disabled] {
    opacity: 0.45; cursor: not-allowed;
    background: rgba(60, 60, 60, 0.4); box-shadow: none; transform: none;
    border-color: rgba(220, 20, 60, 0.3);
}

/* legal-acceptance popup */
.verification-legal-intro {
    font-size: 0.95rem; color: #cccccc; line-height: 1.55;
    margin-bottom: 18px; text-align: left;
}
.verification-legal-intro strong { color: #fff; }
.verification-legal-links {
    display: flex; gap: 10px; flex-wrap: wrap;
    margin: 0 0 20px;
    padding: 14px 16px;
    background: rgba(20, 20, 20, 0.55);
    border: 1px solid rgba(220, 20, 60, 0.25);
    border-radius: 6px;
}
.verification-legal-link {
    color: var(--crimson-red, #dc143c);
    text-decoration: none;
    font-family: 'Trajan Pro', 'Cormorant Garamond', serif;
    text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.85rem;
    padding: 6px 14px;
    border: 1px solid rgba(220, 20, 60, 0.5);
    border-radius: 4px;
    transition: all 0.3s ease;
}
.verification-legal-link:hover,
.verification-legal-link:focus {
    background: rgba(220, 20, 60, 0.15);
    color: #fff;
    border-color: var(--crimson-red, #dc143c);
}
.verification-legal-checkbox-row {
    display: flex; align-items: flex-start; gap: 12px;
    margin-bottom: 20px; padding: 14px 16px;
    background: rgba(42, 42, 42, 0.5);
    border: 1px solid rgba(220, 20, 60, 0.25);
    border-radius: 6px;
    text-align: left;
    cursor: pointer;
}
.verification-legal-checkbox-row:hover {
    border-color: rgba(220, 20, 60, 0.55);
}
.verification-legal-checkbox {
    flex-shrink: 0;
    width: 22px; height: 22px;
    margin-top: 2px;
    accent-color: var(--crimson-red, #dc143c);
    cursor: pointer;
}
.verification-legal-checkbox-label {
    font-size: 0.95rem; color: #cccccc; line-height: 1.55;
    cursor: pointer;
}
.verification-legal-checkbox-label strong { color: #fff; }
.verification-legal-checkbox-label .verification-legal-inline-link {
    color: var(--crimson-red, #dc143c);
    text-decoration: underline;
    text-decoration-color: rgba(220, 20, 60, 0.5);
    text-underline-offset: 2px;
}
.verification-legal-checkbox-label .verification-legal-inline-link:hover {
    color: #ff5a3c;
    text-decoration-color: currentColor;
}
.verification-legal-meta {
    margin-top: 14px;
    font-size: 0.78rem; color: rgba(204, 204, 204, 0.7);
    text-align: center; letter-spacing: 0.04em;
}
.verification-legal-decline {
    margin-top: 12px;
    width: 100%;
    padding: 10px 18px;
    background: transparent;
    border: 1px solid rgba(204, 204, 204, 0.3);
    color: #cccccc;
    font-family: 'Trajan Pro', 'Cormorant Garamond', serif;
    font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase;
    border-radius: 6px; cursor: pointer;
    transition: all 0.3s ease;
}
.verification-legal-decline:hover {
    border-color: #cccccc; background: rgba(204, 204, 204, 0.08);
}

.verification-disabled { pointer-events: none; filter: blur(5px); opacity: 0.6; }
@media (max-width: 768px) {
    .verification-popup { padding: 30px 20px; max-width: 90%; }
    .verification-popup.legal-popup { max-width: 92%; }
    .verification-popup h2 { font-size: 1.4rem; }
    .verification-popup p { font-size: 1rem; }
    .verification-btn { padding: 12px 28px; font-size: 0.9rem; }
    .verification-legal-links { padding: 10px 12px; }
    .verification-legal-checkbox-row { padding: 12px; }
}`;
        const style = document.createElement('style');
        style.id = 'age-verification-styles';
        style.textContent = css;
        document.head.appendChild(style);
    },

    /**
     * fire up the age check + legal acceptance system. Routes to whichever
     * modal phase the user still owes us:
     *   - both age + legal accepted (with current version) → unlock site
     *   - age accepted but legal not (or stale version) → legal popup only
     *   - age not accepted → start at the are-you-18 popup (legal will follow)
     */
    init() {
        console.log('Age Verification System: Initializing...');
        this.injectStyles();

        const ageOk = this.isVerified();
        const legalOk = this.isLegalAccepted();

        if (ageOk && legalOk) {
            console.log('Age Verification System: Both age + legal previously accepted');
            this.enableSite();
            this.trackVisitor();
            return;
        }

        if (ageOk && !legalOk) {
            console.log('Age Verification System: Age verified previously, legal acceptance still required');
            this.disableSite();
            this.showLegalPopup();
            return;
        }

        // age not yet verified — start the full flow at the are-you-18 popup
        console.log('Age Verification System: Full verification required (age + legal)');
        this.disableSite();
        this.showFirstPopup();
    },

    /**
     * log visitor for the apps page
     */
    trackVisitor() {
        if (typeof VisitorTracking !== 'undefined') {
            VisitorTracking.trackVisitor('apps').then(data => {
                if (data) {
                    console.log('Age Verification: Tracked visitor for apps page');
                }
            }).catch(err => {
                console.error('Age Verification: Failed to track visitor:', err);
            });
        }
    },

    /**
     * check if user's verified properly
     */
    isVerified() {
        try {
            // need all three of these bad boys
            const button18 = localStorage.getItem(this.KEYS.BUTTON_18);
            const birthdate = localStorage.getItem(this.KEYS.BIRTHDATE);
            const verificationKey = localStorage.getItem(this.KEYS.VERIFICATION_KEY);

            // all three better be here
            if (!button18 || !birthdate || !verificationKey) {
                console.log('Age Verification: Missing values');
                return false;
            }

            // button18 needs to be true
            if (button18 !== 'true') {
                console.log('Age Verification: Invalid button18 value');
                return false;
            }

            // verification key has to match our secret sauce
            if (verificationKey !== this.VERIFICATION_VALUE) {
                console.log('Age Verification: Invalid verification key');
                return false;
            }

            // make sure they're actually 18+
            const isOldEnough = this.validateAge(birthdate);
            if (!isOldEnough) {
                console.log('Age Verification: User is under 18');
                return false;
            }

            console.log('Age Verification: All checks passed');
            return true;
        } catch (error) {
            console.error('Age Verification Error:', error);
            return false;
        }
    },

    /**
     * check whether the user has accepted the current Terms of Service +
     * Privacy Policy. Acceptance is bound to a version string so that bumping
     * CURRENT_LEGAL_VERSION re-prompts everyone with a stale version.
     */
    isLegalAccepted() {
        try {
            const accepted = localStorage.getItem(this.KEYS.LEGAL_ACCEPTED);
            const version = localStorage.getItem(this.KEYS.LEGAL_VERSION);
            const date = localStorage.getItem(this.KEYS.LEGAL_DATE);

            if (accepted !== 'true' || !version || !date) {
                console.log('Age Verification: Legal acceptance missing or incomplete');
                return false;
            }

            if (version !== this.CURRENT_LEGAL_VERSION) {
                console.log('Age Verification: Legal acceptance is for an older version (' + version + ' vs current ' + this.CURRENT_LEGAL_VERSION + ') — re-prompt required');
                return false;
            }

            console.log('Age Verification: Legal acceptance current (version ' + version + ', accepted ' + date + ')');
            return true;
        } catch (error) {
            console.error('Age Verification Legal Error:', error);
            return false;
        }
    },

    /**
     * make sure they're old enough to be here
     */
    validateAge(birthdateString) {
        try {
            const birthdate = new Date(birthdateString);
            const today = new Date();

            // do the age math
            let age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();

            // subtract a year if birthday hasn't hit yet this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
                age--;
            }

            console.log('Age Verification: Calculated age =', age);
            return age >= this.MIN_AGE;
        } catch (error) {
            console.error('Age Verification: Date validation error:', error);
            return false;
        }
    },

    /**
     * resolve whichever container element this host page wires the disable
     * effect to. Apps + apps.html use `#main-content`; the AI demo uses
     * `.demo-container`. Returns null if neither is present (rare; gate still
     * works via the interactive-element disable below).
     */
    resolveDisableTarget() {
        return document.getElementById('main-content')
            || document.querySelector('.demo-container')
            || null;
    },

    /**
     * lock down the site
     */
    disableSite() {
        const target = this.resolveDisableTarget();
        if (target) {
            target.classList.add('verification-disabled');
        }

        // disable everything except navbar — covers both `<main>` apps and
        // `.demo-container` host layouts
        const interactiveElements = document.querySelectorAll(
            'main button, main input, main select, main textarea, main a.app-link, ' +
            '.demo-container button, .demo-container input, .demo-container select, .demo-container textarea, .demo-container a.app-link'
        );
        interactiveElements.forEach(el => {
            if (!el.hasAttribute('data-originally-disabled')) {
                el.setAttribute('data-originally-disabled', el.disabled || 'false');
            }
            el.disabled = true;
            el.style.pointerEvents = 'none';
        });

        console.log('Age Verification: Site disabled');
    },

    /**
     * unlock the site
     */
    enableSite() {
        const target = this.resolveDisableTarget();
        if (target) {
            target.classList.remove('verification-disabled');
        }

        // re-enable everything — same selector union as disableSite
        const interactiveElements = document.querySelectorAll(
            'main button, main input, main select, main textarea, main a.app-link, ' +
            '.demo-container button, .demo-container input, .demo-container select, .demo-container textarea, .demo-container a.app-link'
        );
        interactiveElements.forEach(el => {
            const wasDisabled = el.getAttribute('data-originally-disabled') === 'true';
            if (!wasDisabled) {
                el.disabled = false;
            }
            el.style.pointerEvents = '';
            el.removeAttribute('data-originally-disabled');
        });

        console.log('Age Verification: Site enabled');
    },

    /**
     * show the "are you 18?" popup
     */
    showFirstPopup() {
        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.id = 'verificationBackdrop';

        const popup = document.createElement('div');
        popup.className = 'verification-popup';
        popup.id = 'verificationPopup';

        popup.innerHTML = `
            <h2>Age Verification</h2>
            <p>Are you over the age of 18?</p>
            <div class="verification-buttons">
                <button class="verification-btn yes" id="verifyYes">Yes</button>
                <button class="verification-btn no" id="verifyNo">No</button>
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        // make buttons work (override the disable shit)
        const yesBtn = document.getElementById('verifyYes');
        const noBtn = document.getElementById('verifyNo');

        yesBtn.disabled = false;
        noBtn.disabled = false;
        yesBtn.style.pointerEvents = 'auto';
        noBtn.style.pointerEvents = 'auto';

        yesBtn.addEventListener('click', () => this.handleFirstYes());
        noBtn.addEventListener('click', () => this.handleNo());

        console.log('Age Verification: First popup shown');
    },

    /**
     * they clicked "yes" on first popup
     */
    handleFirstYes() {
        // save that they confirmed 18+
        localStorage.setItem(this.KEYS.BUTTON_18, 'true');
        console.log('Age Verification: User confirmed 18+');

        // remove first popup
        this.removeCurrentPopup();

        // show birthdate popup
        setTimeout(() => this.showSecondPopup(), 300);
    },

    /**
     * they clicked "no" or failed age check - kick em out
     */
    handleNo() {
        console.log('Age Verification: User declined or under 18');

        // wipe their verification data (age AND legal — we treat them as a unit)
        this.clearVerification();

        // send them to google
        window.open('https://www.google.com', '_blank');

        // try to close tab (browser might block this)
        setTimeout(() => {
            const closed = window.close();
            if (!closed) {
                window.location.href = 'https://www.google.com';
            }
        }, 100);
    },

    /**
     * show birthdate entry popup
     */
    showSecondPopup() {
        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.id = 'verificationBackdrop';

        const popup = document.createElement('div');
        popup.className = 'verification-popup';
        popup.id = 'verificationPopup';

        // build month dropdown options
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthOptions = months.map((month, index) =>
            `<option value="${index}">${month}</option>`
        ).join('');

        // build day dropdown (1-31)
        const dayOptions = Array.from({length: 31}, (_, i) => i + 1)
            .map(day => `<option value="${day}">${day}</option>`)
            .join('');

        // build year dropdown (1900 to now)
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from({length: currentYear - 1900 + 1}, (_, i) => currentYear - i)
            .map(year => `<option value="${year}">${year}</option>`)
            .join('');

        popup.innerHTML = `
            <h2>Hold on, one more</h2>
            <p>Enter your birth date</p>
            <div class="age-input-form">
                <div class="age-input-row">
                    <div class="age-select-wrapper">
                        <label class="age-select-label">Month</label>
                        <select class="age-select" id="birthMonth">
                            <option value="">Month</option>
                            ${monthOptions}
                        </select>
                    </div>
                    <div class="age-select-wrapper">
                        <label class="age-select-label">Day</label>
                        <select class="age-select" id="birthDay">
                            <option value="">Day</option>
                            ${dayOptions}
                        </select>
                    </div>
                    <div class="age-select-wrapper">
                        <label class="age-select-label">Year</label>
                        <select class="age-select" id="birthYear">
                            <option value="">Year</option>
                            ${yearOptions}
                        </select>
                    </div>
                </div>
            </div>
            <button class="verification-btn submit" id="submitBirthdate">Submit</button>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        // make selects and button work (override disable shit)
        const monthSelect = document.getElementById('birthMonth');
        const daySelect = document.getElementById('birthDay');
        const yearSelect = document.getElementById('birthYear');
        const submitBtn = document.getElementById('submitBirthdate');

        [monthSelect, daySelect, yearSelect, submitBtn].forEach(el => {
            el.disabled = false;
            el.style.pointerEvents = 'auto';
        });

        submitBtn.addEventListener('click', () => this.handleBirthdateSubmit());

        console.log('Age Verification: Second popup shown');
    },

    /**
     * process their birthdate submission
     */
    handleBirthdateSubmit() {
        const month = document.getElementById('birthMonth').value;
        const day = document.getElementById('birthDay').value;
        const year = document.getElementById('birthYear').value;

        // make sure they filled everything out
        if (!month || !day || !year) {
            alert('Please fill in all fields');
            return;
        }

        // convert to UTC date string
        const birthdate = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));
        const birthdateString = birthdate.toISOString();

        console.log('Age Verification: Birthdate submitted:', birthdateString);

        // verify they're 18+
        if (!this.validateAge(birthdateString)) {
            console.log('Age Verification: User is under 18');
            this.handleNo();
            return;
        }

        // they're old enough — save the age verification flags. Legal acceptance
        // is captured by the next popup; we don't enable the site or track the
        // visitor until BOTH gates are cleared.
        localStorage.setItem(this.KEYS.BIRTHDATE, birthdateString);
        localStorage.setItem(this.KEYS.VERIFICATION_KEY, this.VERIFICATION_VALUE);

        console.log('Age Verification: Age verified — proceeding to legal acceptance');

        // close birthdate popup, then show legal popup
        this.removeCurrentPopup();
        setTimeout(() => this.showLegalPopup(), 300);
    },

    /**
     * show the Terms of Service + Privacy Policy acceptance popup. Used in two
     * scenarios:
     *   - first-time visitor immediately after passing the birthdate gate
     *   - returning user with valid age flags but no (or stale) legal flag
     * The submit button stays disabled until the checkbox is ticked.
     */
    showLegalPopup() {
        const urls = this.getLegalUrls();

        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.id = 'verificationBackdrop';

        const popup = document.createElement('div');
        popup.className = 'verification-popup legal-popup';
        popup.id = 'verificationPopup';

        popup.innerHTML = `
            <h2>One last thing</h2>
            <p class="verification-legal-intro">
                Before you continue, please review and accept our
                <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
                Both pages open in a new tab so you can read them without losing your place here.
            </p>
            <div class="verification-legal-links">
                <a class="verification-legal-link" href="${urls.terms}" target="_blank" rel="noopener noreferrer">Terms of Service ↗</a>
                <a class="verification-legal-link" href="${urls.privacy}" target="_blank" rel="noopener noreferrer">Privacy Policy ↗</a>
            </div>
            <label class="verification-legal-checkbox-row" for="legalAcceptCheckbox">
                <input type="checkbox" class="verification-legal-checkbox" id="legalAcceptCheckbox" />
                <span class="verification-legal-checkbox-label">
                    I am at least 18 years old (or the age of majority in my jurisdiction) and I have read, understood, and agree to be bound by the
                    <a class="verification-legal-inline-link" href="${urls.terms}" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                    and the
                    <a class="verification-legal-inline-link" href="${urls.privacy}" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </span>
            </label>
            <button class="verification-btn submit" id="legalAcceptSubmit" disabled>Accept &amp; Continue</button>
            <button class="verification-legal-decline" id="legalAcceptDecline">Decline &amp; Leave</button>
            <div class="verification-legal-meta">
                Acceptance is recorded locally in your browser only · Version ${this.CURRENT_LEGAL_VERSION}
            </div>
        `;

        backdrop.appendChild(popup);
        document.body.appendChild(backdrop);

        const checkbox = document.getElementById('legalAcceptCheckbox');
        const submitBtn = document.getElementById('legalAcceptSubmit');
        const declineBtn = document.getElementById('legalAcceptDecline');

        // override the disable-everything CSS so the modal controls are reachable
        [checkbox, submitBtn, declineBtn].forEach(el => {
            el.style.pointerEvents = 'auto';
        });
        // submit stays disabled at the form-control level until the box is ticked,
        // but we have to make sure pointerEvents is still auto so the click works
        // the moment the user ticks the checkbox
        submitBtn.disabled = true;

        // also let the inline links click through the disable layer
        document.querySelectorAll('#verificationPopup a').forEach(a => {
            a.style.pointerEvents = 'auto';
        });

        checkbox.addEventListener('change', () => {
            submitBtn.disabled = !checkbox.checked;
        });

        submitBtn.addEventListener('click', () => {
            if (!checkbox.checked) {
                // belt-and-suspenders — disabled state should already prevent this
                return;
            }
            this.handleLegalAccept();
        });

        declineBtn.addEventListener('click', () => this.handleNo());

        console.log('Age Verification: Legal acceptance popup shown');
    },

    /**
     * persist the legal acceptance flags, track the visitor, and unlock the site.
     * Mirrors the post-birthdate flow but routes through the legal flags instead.
     */
    handleLegalAccept() {
        const now = new Date().toISOString();
        localStorage.setItem(this.KEYS.LEGAL_ACCEPTED, 'true');
        localStorage.setItem(this.KEYS.LEGAL_VERSION, this.CURRENT_LEGAL_VERSION);
        localStorage.setItem(this.KEYS.LEGAL_DATE, now);
        console.log('Age Verification: Legal acceptance recorded (version ' + this.CURRENT_LEGAL_VERSION + ', at ' + now + ')');

        // track visitor now that BOTH gates are cleared
        if (typeof VisitorTracking !== 'undefined') {
            console.log('Age Verification: Tracking visitor for apps page...');
            VisitorTracking.createAndRegisterUID('apps').then(result => {
                if (result && result.success) {
                    console.log('Age Verification: Visitor tracked successfully, count:', result.count);
                }
            }).catch(error => {
                console.error('Age Verification: Visitor tracking error:', error);
            });
        }

        // close popup
        this.removeCurrentPopup();

        // unlock the site
        this.enableSite();
    },

    /**
     * remove whatever popup is showing
     */
    removeCurrentPopup() {
        const backdrop = document.getElementById('verificationBackdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => backdrop.remove(), 300);
        }
    },

    /**
     * wipe all verification data from storage — both age + legal flags. Called
     * when the user declines either gate (we treat the gates as a unit so a
     * decline anywhere means the user has to re-do the whole flow).
     */
    clearVerification() {
        localStorage.removeItem(this.KEYS.BUTTON_18);
        localStorage.removeItem(this.KEYS.BIRTHDATE);
        localStorage.removeItem(this.KEYS.VERIFICATION_KEY);
        localStorage.removeItem(this.KEYS.LEGAL_ACCEPTED);
        localStorage.removeItem(this.KEYS.LEGAL_VERSION);
        localStorage.removeItem(this.KEYS.LEGAL_DATE);
        console.log('Age Verification: All verification data cleared (age + legal)');
    }
};

// fire it up when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AgeVerification.init();
});
