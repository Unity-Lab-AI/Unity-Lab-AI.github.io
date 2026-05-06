/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Age Verification System for Unity AI Lab Apps
 * 18+ verification with localStorage
 */

const AgeVerification = {
    // storage keys we're using
    KEYS: {
        BUTTON_18: 'button18',
        BIRTHDATE: 'birthdate',
        VERIFICATION_KEY: 'husdh-f978dyh-sdf'
    },

    // the magic verification string
    VERIFICATION_VALUE: 'ijdfjgdfo-38d9sf-sdf',

    // gotta be this old to enter
    MIN_AGE: 18,

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
@keyframes avPopupSlideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.verification-popup h2 {
    font-family: 'Trajan Pro', 'Cormorant Garamond', serif;
    font-size: 1.8rem; color: #fff; margin-bottom: 20px;
    text-transform: uppercase; letter-spacing: 2px;
}
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
#main-content.verification-disabled { pointer-events: none; filter: blur(5px); opacity: 0.6; }
@media (max-width: 768px) {
    .verification-popup { padding: 30px 20px; max-width: 90%; }
    .verification-popup h2 { font-size: 1.4rem; }
    .verification-popup p { font-size: 1rem; }
    .verification-btn { padding: 12px 28px; font-size: 0.9rem; }
}`;
        const style = document.createElement('style');
        style.id = 'age-verification-styles';
        style.textContent = css;
        document.head.appendChild(style);
    },

    /**
     * fire up the age check system
     */
    init() {
        console.log('Age Verification System: Initializing...');
        this.injectStyles();

        // see if they're already good to go
        if (this.isVerified()) {
            console.log('Age Verification System: User already verified');
            this.enableSite();
            // log visitor after verification confirmed
            this.trackVisitor();
        } else {
            console.log('Age Verification System: Verification required');
            this.disableSite();
            this.showFirstPopup();
        }
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
     * lock down the site
     */
    disableSite() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.add('verification-disabled');
        }

        // disable everything except navbar
        const interactiveElements = document.querySelectorAll('main button, main input, main select, main textarea, main a.app-link');
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
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('verification-disabled');
        }

        // re-enable everything
        const interactiveElements = document.querySelectorAll('main button, main input, main select, main textarea, main a.app-link');
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

        // wipe their verification data
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

        // they're good - save their info and verification key
        localStorage.setItem(this.KEYS.BIRTHDATE, birthdateString);
        localStorage.setItem(this.KEYS.VERIFICATION_KEY, this.VERIFICATION_VALUE);

        console.log('Age Verification: Verification complete');

        // track visitor now that they're verified
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
     * wipe all verification data from storage
     */
    clearVerification() {
        localStorage.removeItem(this.KEYS.BUTTON_18);
        localStorage.removeItem(this.KEYS.BIRTHDATE);
        localStorage.removeItem(this.KEYS.VERIFICATION_KEY);
        console.log('Age Verification: Verification data cleared');
    }
};

// fire it up when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AgeVerification.init();
});
