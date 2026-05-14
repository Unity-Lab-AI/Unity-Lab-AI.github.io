// DUNGEON MASTER: THE HUNT -- 18+ Age verification + Legal acceptance gate.
//
// Ported from the canonical Unity AI Lab implementation. Same localStorage keys
// (button18, birthdate, husdh-f978dyh-sdf, legalAccepted, legalAcceptedVersion,
// legalAcceptedDate) so a user who already accepted on the main UAL site does
// NOT get re-prompted here. Same version stamp (v1.0) so version bumps trigger
// re-prompt across the whole UAL surface area.
//
// Flow:
//   - First-time visitor (no flags) -> "Are you 18+?" -> birthdate -> legal acceptance -> enabled
//   - Returning user with age flags but no legal flag -> only the legal-acceptance popup
//   - Returning user with age + legal (matching version) -> enabled, no popup
//   - User declines age OR closes legal popup -> kicked to google.com
//   - ToS/Privacy version bump -> mismatch on legalAcceptedVersion -> re-prompt for legal only

(function () {
    'use strict';

    const DMTHAgeGate = {
        KEYS: {
            BUTTON_18: 'button18',
            BIRTHDATE: 'birthdate',
            VERIFICATION_KEY: 'husdh-f978dyh-sdf',
            LEGAL_ACCEPTED: 'legalAccepted',
            LEGAL_VERSION: 'legalAcceptedVersion',
            LEGAL_DATE: 'legalAcceptedDate'
        },

        VERIFICATION_VALUE: 'ijdfjgdfo-38d9sf-sdf',
        MIN_AGE: 18,

        // Must match the version stamp in the canonical Unity AI Lab terms/privacy
        // docs. Bump this here AND on the main site when materially revising legal
        // text. Users with a stale version are re-prompted to accept on next visit.
        CURRENT_LEGAL_VERSION: 'v1.0',

        // Resolve relative URLs for the in-game terms + privacy anchor sections.
        // On index.html the routes are bare anchors (#terms / #privacy); on
        // game.html we must point back to index.html since the policy text lives
        // only there.
        getLegalUrls() {
            const path = (window.location.pathname || '').toLowerCase();
            const onIndex = path.endsWith('/index.html') || path.endsWith('/') || path === '';
            if (onIndex) {
                return { terms: '#terms', privacy: '#privacy' };
            }
            // Climb back to index.html from any other page (game.html or future routes).
            return { terms: 'index.html#terms', privacy: 'index.html#privacy' };
        },

        injectStyles() {
            if (document.getElementById('age-gate-styles')) return;
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
    border: 2px solid #dc143c;
    border-radius: 12px; padding: 40px;
    max-width: 500px; width: 90%;
    max-height: 90vh; max-height: 90dvh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(220, 20, 60, 0.6);
    text-align: center; animation: avPopupSlideIn 0.4s ease;
    z-index: 2147483647;
    font-family: inherit;
}
.verification-popup.legal-popup {
    max-width: 580px;
    text-align: left;
}
@keyframes avPopupSlideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.verification-popup h2 {
    font-size: 1.8rem; color: #fff; margin: 0 0 20px;
    text-transform: uppercase; letter-spacing: 2px;
    font-family: inherit;
}
.verification-popup.legal-popup h2 { text-align: center; }
.verification-popup p { font-size: 1.05rem; color: #cccccc; margin-bottom: 24px; line-height: 1.6; }
.verification-buttons { display: flex; gap: 15px; justify-content: center; align-items: center; }
.verification-btn {
    padding: 14px 36px;
    font-size: 1rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.5px;
    border: 2px solid; border-radius: 8px; cursor: pointer;
    transition: all 0.3s ease; background: transparent;
    font-family: inherit;
}
.verification-btn.yes { border-color: #dc143c; color: #fff; background: linear-gradient(135deg, rgba(139, 0, 0, 0.6) 0%, rgba(220, 20, 60, 0.6) 100%); }
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
    font-size: 0.95rem; font-family: inherit;
    cursor: pointer; transition: all 0.3s ease; outline: none;
    -moz-appearance: none; -webkit-appearance: none; appearance: none;
}
.age-select:hover { border-color: #dc143c; }
.age-select:focus { border-color: #dc143c; box-shadow: 0 0 10px rgba(220, 20, 60, 0.4); }
.age-select option { background: rgba(42, 42, 42, 0.95); color: #cccccc; }
.verification-btn.submit { width: 100%; border-color: #dc143c; color: #fff; background: linear-gradient(135deg, rgba(139, 0, 0, 0.6) 0%, rgba(220, 20, 60, 0.6) 100%); }
.verification-btn.submit:hover { background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%); box-shadow: 0 5px 20px rgba(220, 20, 60, 0.6); transform: translateY(-2px); }
.verification-btn.submit:disabled,
.verification-btn.submit[disabled] {
    opacity: 0.45; cursor: not-allowed;
    background: rgba(60, 60, 60, 0.4); box-shadow: none; transform: none;
    border-color: rgba(220, 20, 60, 0.3);
}
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
    color: #dc143c;
    text-decoration: none;
    text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.85rem;
    padding: 6px 14px;
    border: 1px solid rgba(220, 20, 60, 0.5);
    border-radius: 4px;
    transition: all 0.3s ease;
    font-family: inherit;
}
.verification-legal-link:hover,
.verification-legal-link:focus {
    background: rgba(220, 20, 60, 0.15);
    color: #fff;
    border-color: #dc143c;
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
    accent-color: #dc143c;
    cursor: pointer;
}
.verification-legal-checkbox-label {
    font-size: 0.95rem; color: #cccccc; line-height: 1.55;
    cursor: pointer;
}
.verification-legal-checkbox-label strong { color: #fff; }
.verification-legal-checkbox-label .verification-legal-inline-link {
    color: #dc143c;
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
    font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase;
    border-radius: 6px; cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
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
            style.id = 'age-gate-styles';
            style.textContent = css;
            document.head.appendChild(style);
        },

        init() {
            this.injectStyles();
            const ageOk = this.isVerified();
            const legalOk = this.isLegalAccepted();

            if (ageOk && legalOk) {
                this.enableSite();
                return;
            }
            if (ageOk && !legalOk) {
                this.disableSite();
                this.showLegalPopup();
                return;
            }
            this.disableSite();
            this.showFirstPopup();
        },

        isVerified() {
            try {
                const button18 = localStorage.getItem(this.KEYS.BUTTON_18);
                const birthdate = localStorage.getItem(this.KEYS.BIRTHDATE);
                const verificationKey = localStorage.getItem(this.KEYS.VERIFICATION_KEY);
                if (!button18 || !birthdate || !verificationKey) return false;
                if (button18 !== 'true') return false;
                if (verificationKey !== this.VERIFICATION_VALUE) return false;
                return this.validateAge(birthdate);
            } catch (e) {
                return false;
            }
        },

        isLegalAccepted() {
            try {
                const accepted = localStorage.getItem(this.KEYS.LEGAL_ACCEPTED);
                const version = localStorage.getItem(this.KEYS.LEGAL_VERSION);
                const date = localStorage.getItem(this.KEYS.LEGAL_DATE);
                if (accepted !== 'true' || !version || !date) return false;
                if (version !== this.CURRENT_LEGAL_VERSION) return false;
                return true;
            } catch (e) {
                return false;
            }
        },

        validateAge(birthdateString) {
            try {
                const birthdate = new Date(birthdateString);
                const today = new Date();
                let age = today.getFullYear() - birthdate.getFullYear();
                const monthDiff = today.getMonth() - birthdate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
                    age--;
                }
                return age >= this.MIN_AGE;
            } catch (e) {
                return false;
            }
        },

        resolveDisableTarget() {
            return document.querySelector('main')
                || document.getElementById('main-content')
                || document.querySelector('.container')
                || document.body;
        },

        disableSite() {
            const target = this.resolveDisableTarget();
            if (target) target.classList.add('verification-disabled');
            const interactiveElements = document.querySelectorAll(
                'main button, main input, main select, main textarea, main a, ' +
                '.container button, .container input, .container select, .container textarea, .container a'
            );
            interactiveElements.forEach(el => {
                if (!el.hasAttribute('data-originally-disabled')) {
                    el.setAttribute('data-originally-disabled', el.disabled ? 'true' : 'false');
                }
                el.disabled = true;
                el.style.pointerEvents = 'none';
            });
        },

        enableSite() {
            const target = this.resolveDisableTarget();
            if (target) target.classList.remove('verification-disabled');
            const interactiveElements = document.querySelectorAll(
                'main button, main input, main select, main textarea, main a, ' +
                '.container button, .container input, .container select, .container textarea, .container a'
            );
            interactiveElements.forEach(el => {
                const wasDisabled = el.getAttribute('data-originally-disabled') === 'true';
                if (!wasDisabled) el.disabled = false;
                el.style.pointerEvents = '';
                el.removeAttribute('data-originally-disabled');
            });
        },

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
            const yesBtn = document.getElementById('verifyYes');
            const noBtn = document.getElementById('verifyNo');
            [yesBtn, noBtn].forEach(b => { b.disabled = false; b.style.pointerEvents = 'auto'; });
            yesBtn.addEventListener('click', () => this.handleFirstYes());
            noBtn.addEventListener('click', () => this.handleNo());
        },

        handleFirstYes() {
            localStorage.setItem(this.KEYS.BUTTON_18, 'true');
            this.removeCurrentPopup();
            setTimeout(() => this.showSecondPopup(), 300);
        },

        handleNo() {
            this.clearVerification();
            window.open('https://www.google.com', '_blank');
            setTimeout(() => {
                const closed = window.close();
                if (!closed) {
                    window.location.href = 'https://www.google.com';
                }
            }, 100);
        },

        showSecondPopup() {
            const backdrop = document.createElement('div');
            backdrop.className = 'verification-backdrop';
            backdrop.id = 'verificationBackdrop';
            const popup = document.createElement('div');
            popup.className = 'verification-popup';
            popup.id = 'verificationPopup';

            const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const monthOptions = months.map((m, i) => `<option value="${i}">${m}</option>`).join('');
            const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1).map(d => `<option value="${d}">${d}</option>`).join('');
            const currentYear = new Date().getFullYear();
            const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i).map(y => `<option value="${y}">${y}</option>`).join('');

            popup.innerHTML = `
                <h2>Hold on, one more</h2>
                <p>Enter your birth date</p>
                <div class="age-input-form">
                    <div class="age-input-row">
                        <div class="age-select-wrapper">
                            <label class="age-select-label">Month</label>
                            <select class="age-select" id="birthMonth"><option value="">Month</option>${monthOptions}</select>
                        </div>
                        <div class="age-select-wrapper">
                            <label class="age-select-label">Day</label>
                            <select class="age-select" id="birthDay"><option value="">Day</option>${dayOptions}</select>
                        </div>
                        <div class="age-select-wrapper">
                            <label class="age-select-label">Year</label>
                            <select class="age-select" id="birthYear"><option value="">Year</option>${yearOptions}</select>
                        </div>
                    </div>
                </div>
                <button class="verification-btn submit" id="submitBirthdate">Submit</button>
            `;

            backdrop.appendChild(popup);
            document.body.appendChild(backdrop);

            const monthSelect = document.getElementById('birthMonth');
            const daySelect = document.getElementById('birthDay');
            const yearSelect = document.getElementById('birthYear');
            const submitBtn = document.getElementById('submitBirthdate');
            [monthSelect, daySelect, yearSelect, submitBtn].forEach(el => { el.disabled = false; el.style.pointerEvents = 'auto'; });
            submitBtn.addEventListener('click', () => this.handleBirthdateSubmit());
        },

        handleBirthdateSubmit() {
            const month = document.getElementById('birthMonth').value;
            const day = document.getElementById('birthDay').value;
            const year = document.getElementById('birthYear').value;
            if (!month || !day || !year) {
                alert('Please fill in all fields');
                return;
            }
            const birthdate = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10)));
            const birthdateString = birthdate.toISOString();
            if (!this.validateAge(birthdateString)) {
                this.handleNo();
                return;
            }
            localStorage.setItem(this.KEYS.BIRTHDATE, birthdateString);
            localStorage.setItem(this.KEYS.VERIFICATION_KEY, this.VERIFICATION_VALUE);
            this.removeCurrentPopup();
            setTimeout(() => this.showLegalPopup(), 300);
        },

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
            [checkbox, submitBtn, declineBtn].forEach(el => { el.style.pointerEvents = 'auto'; });
            submitBtn.disabled = true;
            document.querySelectorAll('#verificationPopup a').forEach(a => { a.style.pointerEvents = 'auto'; });

            checkbox.addEventListener('change', () => {
                submitBtn.disabled = !checkbox.checked;
            });
            submitBtn.addEventListener('click', () => {
                if (!checkbox.checked) return;
                this.handleLegalAccept();
            });
            declineBtn.addEventListener('click', () => this.handleNo());
        },

        handleLegalAccept() {
            const now = new Date().toISOString();
            localStorage.setItem(this.KEYS.LEGAL_ACCEPTED, 'true');
            localStorage.setItem(this.KEYS.LEGAL_VERSION, this.CURRENT_LEGAL_VERSION);
            localStorage.setItem(this.KEYS.LEGAL_DATE, now);
            this.removeCurrentPopup();
            this.enableSite();
        },

        removeCurrentPopup() {
            const backdrop = document.getElementById('verificationBackdrop');
            if (backdrop) {
                backdrop.style.opacity = '0';
                setTimeout(() => backdrop.remove(), 300);
            }
        },

        clearVerification() {
            localStorage.removeItem(this.KEYS.BUTTON_18);
            localStorage.removeItem(this.KEYS.BIRTHDATE);
            localStorage.removeItem(this.KEYS.VERIFICATION_KEY);
            localStorage.removeItem(this.KEYS.LEGAL_ACCEPTED);
            localStorage.removeItem(this.KEYS.LEGAL_VERSION);
            localStorage.removeItem(this.KEYS.LEGAL_DATE);
        }
    };

    window.DMTHAgeGate = DMTHAgeGate;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DMTHAgeGate.init());
    } else {
        DMTHAgeGate.init();
    }
})();
