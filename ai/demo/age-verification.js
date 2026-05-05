/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Age Verification System for Unity AI Lab Demo
 * 18+ verification with localStorage
 */

const AgeVerification = {
    // where we hide the verification data
    KEYS: {
        BUTTON_18: 'button18',
        BIRTHDATE: 'birthdate',
        VERIFICATION_KEY: 'husdh-f978dyh-sdf'
    },

    // the secret handshake for verification
    VERIFICATION_VALUE: 'ijdfjgdfo-38d9sf-sdf',

    // you better be 18 or fuck off
    MIN_AGE: 18,

    // fire up the age gate and keep the kiddies out
    init() {
        console.log('Age Verification System: Initializing...');

        // see if this user already proved they're old enough
        if (this.isVerified()) {
            console.log('Age Verification System: User already verified');
            this.enableSite();
        } else {
            console.log('Age Verification System: Verification required');
            this.disableSite();
            this.showFirstPopup();
        }
    },

    // check if this person's legit or just trying to sneak in
    isVerified() {
        try {
            // grab all three pieces of the verification puzzle
            const button18 = localStorage.getItem(this.KEYS.BUTTON_18);
            const birthdate = localStorage.getItem(this.KEYS.BIRTHDATE);
            const verificationKey = localStorage.getItem(this.KEYS.VERIFICATION_KEY);

            // if any piece is missing, get the hell out
            if (!button18 || !birthdate || !verificationKey) {
                console.log('Age Verification: Missing values');
                return false;
            }

            // make sure they actually clicked the 18+ button
            if (button18 !== 'true') {
                console.log('Age Verification: Invalid button18 value');
                return false;
            }

            // verify the secret handshake matches
            if (verificationKey !== this.VERIFICATION_VALUE) {
                console.log('Age Verification: Invalid verification key');
                return false;
            }

            // check if they're actually old enough to be here
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

    // do the math to see if they're old enough for this shit
    validateAge(birthdateString) {
        try {
            const birthdate = new Date(birthdateString);
            const today = new Date();

            // basic fucking math to figure out their age
            let age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();

            // adjust for people who haven't had their birthday yet this year
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

    // lock down everything until they prove they're legal
    disableSite() {
        const demoContainer = document.querySelector('.demo-container');
        if (demoContainer) {
            demoContainer.classList.add('verification-disabled');
        }

        // disable every damn button and input on the page
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
        interactiveElements.forEach(el => {
            // remember the original state so we don't break shit later
            if (!el.hasAttribute('data-originally-disabled')) {
                el.setAttribute('data-originally-disabled', el.disabled || 'false');
            }
            el.disabled = true;
            el.style.pointerEvents = 'none';
        });

        console.log('Age Verification: Site disabled');
    },

    // unlock everything and let them in
    enableSite() {
        const demoContainer = document.querySelector('.demo-container');
        if (demoContainer) {
            demoContainer.classList.remove('verification-disabled');
        }

        // turn all the buttons and inputs back on
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
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

    // throw up the first popup asking if they're old enough
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

        // make these buttons actually work even though everything else is disabled
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

    // they said yes to being 18+ so let's proceed
    handleFirstYes() {
        // store their confirmation for later
        localStorage.setItem(this.KEYS.BUTTON_18, 'true');
        console.log('Age Verification: User confirmed 18+');

        // get rid of this popup
        this.removeCurrentPopup();

        // now show the birthdate entry form
        setTimeout(() => this.showSecondPopup(), 300);
    },

    // they either said no or they're too young - kick them out
    handleNo() {
        console.log('Age Verification: User declined or under 18');

        // wipe all their verification data
        this.clearVerification();

        // send them to google and close this tab
        window.open('https://www.google.com', '_blank');

        // try to close this tab but browsers are bitches about this
        setTimeout(() => {
            const closed = window.close();
            if (!closed) {
                // can't close the tab so just redirect them out
                window.location.href = 'https://www.google.com';
            }
        }, 100);
    },

    // show the birthdate form so they can prove their age
    showSecondPopup() {
        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.id = 'verificationBackdrop';

        const popup = document.createElement('div');
        popup.className = 'verification-popup';
        popup.id = 'verificationPopup';

        // build the month dropdown options
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthOptions = months.map((month, index) =>
            `<option value="${index}">${month}</option>`
        ).join('');

        // Generate day options (1-31)
        const dayOptions = Array.from({length: 31}, (_, i) => i + 1)
            .map(day => `<option value="${day}">${day}</option>`)
            .join('');

        // Generate year options (1900 - current year)
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

        // Make interactive elements work (override disable)
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
     * Handle birthdate submission
     */
    handleBirthdateSubmit() {
        const month = document.getElementById('birthMonth').value;
        const day = document.getElementById('birthDay').value;
        const year = document.getElementById('birthYear').value;

        // Validate all fields are filled
        if (!month || !day || !year) {
            alert('Please fill in all fields');
            return;
        }

        // Create UTC date string
        const birthdate = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));
        const birthdateString = birthdate.toISOString();

        console.log('Age Verification: Birthdate submitted:', birthdateString);

        // Check if user is 18 or older
        if (!this.validateAge(birthdateString)) {
            console.log('Age Verification: User is under 18');
            this.handleNo();
            return;
        }

        // User is 18+, store birthdate and verification key
        localStorage.setItem(this.KEYS.BIRTHDATE, birthdateString);
        localStorage.setItem(this.KEYS.VERIFICATION_KEY, this.VERIFICATION_VALUE);

        console.log('Age Verification: Verification complete');

        // Create and register visitor UID (cryptographically secure)
        // This happens only once after age verification
        if (typeof VisitorTracking !== 'undefined' && !VisitorTracking.hasUID()) {
            // Try to register visitor UID (optional - may fail if no backend server)
            VisitorTracking.createAndRegisterUID('demo').then(result => {
                if (result && result.success) {
                    console.log('Age Verification: UID registered, count:', result.count);
                } else if (result && result.alreadyRegistered) {
                    console.log('Age Verification: UID already registered');
                }
                // Silently ignore failures - tracking is optional
            }).catch(() => {
                // Silently ignore - tracking server may not be available
            });
        }

        // Remove popup
        this.removeCurrentPopup();

        // Enable site
        this.enableSite();

        // DISABLED: Welcome message TTS - uses API quota
        // this.playWelcomeMessage();
    },

    /**
     * Remove current popup
     */
    removeCurrentPopup() {
        const backdrop = document.getElementById('verificationBackdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => backdrop.remove(), 300);
        }
    },

    /**
     * Clear all verification data
     */
    clearVerification() {
        localStorage.removeItem(this.KEYS.BUTTON_18);
        localStorage.removeItem(this.KEYS.BIRTHDATE);
        localStorage.removeItem(this.KEYS.VERIFICATION_KEY);
        console.log('Age Verification: Verification data cleared');
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    AgeVerification.init();
});
