/**
 * Age Verification System for Unity AI Lab Apps
 * 18+ verification with localStorage
 */

const AgeVerification = {
    // LocalStorage keys
    KEYS: {
        BUTTON_18: 'button18',
        BIRTHDATE: 'birthdate',
        VERIFICATION_KEY: 'husdh-f978dyh-sdf'
    },

    // Verification value
    VERIFICATION_VALUE: 'ijdfjgdfo-38d9sf-sdf',

    // Minimum age requirement
    MIN_AGE: 18,

    /**
     * Initialize the age verification system
     */
    init() {
        console.log('Age Verification System: Initializing...');

        // Check if user is already verified
        if (this.isVerified()) {
            console.log('Age Verification System: User already verified');
            this.enableSite();
            // Track visitor after verification confirmed
            this.trackVisitor();
        } else {
            console.log('Age Verification System: Verification required');
            this.disableSite();
            this.showFirstPopup();
        }
    },

    /**
     * Track visitor for apps page
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
     * Check if user has valid verification
     */
    isVerified() {
        try {
            // Check all three required values
            const button18 = localStorage.getItem(this.KEYS.BUTTON_18);
            const birthdate = localStorage.getItem(this.KEYS.BIRTHDATE);
            const verificationKey = localStorage.getItem(this.KEYS.VERIFICATION_KEY);

            // All three must exist
            if (!button18 || !birthdate || !verificationKey) {
                console.log('Age Verification: Missing values');
                return false;
            }

            // Button 18 must be truthy
            if (button18 !== 'true') {
                console.log('Age Verification: Invalid button18 value');
                return false;
            }

            // Verification key must match
            if (verificationKey !== this.VERIFICATION_VALUE) {
                console.log('Age Verification: Invalid verification key');
                return false;
            }

            // Check if birthdate is valid and age >= 18
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
     * Validate that the user is 18 or older
     */
    validateAge(birthdateString) {
        try {
            const birthdate = new Date(birthdateString);
            const today = new Date();

            // Calculate age
            let age = today.getFullYear() - birthdate.getFullYear();
            const monthDiff = today.getMonth() - birthdate.getMonth();

            // Adjust age if birthday hasn't occurred this year yet
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
     * Disable site interactions
     */
    disableSite() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.add('verification-disabled');
        }

        // Disable all interactive elements except navbar
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
     * Enable site interactions
     */
    enableSite() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('verification-disabled');
        }

        // Enable all interactive elements
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
     * Show first popup: "Are you over 18?"
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

        // Make buttons interactable (override disable)
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
     * Handle "Yes" on first popup
     */
    handleFirstYes() {
        // Store button18 confirmation
        localStorage.setItem(this.KEYS.BUTTON_18, 'true');
        console.log('Age Verification: User confirmed 18+');

        // Remove first popup
        this.removeCurrentPopup();

        // Show second popup (birthdate entry)
        setTimeout(() => this.showSecondPopup(), 300);
    },

    /**
     * Handle "No" on either popup or failed age check
     */
    handleNo() {
        console.log('Age Verification: User declined or under 18');

        // Clear all localStorage for this site
        this.clearVerification();

        // Open Google in new tab
        window.open('https://www.google.com', '_blank');

        // Close current tab (may be blocked by browser security)
        setTimeout(() => {
            const closed = window.close();
            if (!closed) {
                window.location.href = 'https://www.google.com';
            }
        }, 100);
    },

    /**
     * Show second popup: Birthdate entry
     */
    showSecondPopup() {
        const backdrop = document.createElement('div');
        backdrop.className = 'verification-backdrop';
        backdrop.id = 'verificationBackdrop';

        const popup = document.createElement('div');
        popup.className = 'verification-popup';
        popup.id = 'verificationPopup';

        // Generate month options
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

        // Track visitor after successful verification
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

        // Remove popup
        this.removeCurrentPopup();

        // Enable site
        this.enableSite();
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
