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
     * fire up the age check system
     */
    init() {
        console.log('Age Verification System: Initializing...');

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
