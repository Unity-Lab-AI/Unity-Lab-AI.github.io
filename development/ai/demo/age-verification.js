/**
 * Age Verification System for Unity AI Lab Demo
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
        } else {
            console.log('Age Verification System: Verification required');
            this.disableSite();
            this.showFirstPopup();
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
        const demoContainer = document.querySelector('.demo-container');
        if (demoContainer) {
            demoContainer.classList.add('verification-disabled');
        }

        // Disable all interactive elements
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
        interactiveElements.forEach(el => {
            // Store original disabled state if needed
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
        const demoContainer = document.querySelector('.demo-container');
        if (demoContainer) {
            demoContainer.classList.remove('verification-disabled');
        }

        // Enable all interactive elements
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
        // Use a fallback message if close doesn't work
        setTimeout(() => {
            const closed = window.close();
            if (!closed) {
                // If we can't close the tab, redirect to Google
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

        // Create and register visitor UID (cryptographically secure)
        // This happens only once after age verification
        if (typeof VisitorTracking !== 'undefined' && !VisitorTracking.hasUID()) {
            console.log('Age Verification: Creating and registering visitor UID...');
            VisitorTracking.createAndRegisterUID('demo').then(result => {
                if (result && result.success) {
                    console.log('Age Verification: UID registered successfully, count:', result.count);
                } else if (result && result.alreadyRegistered) {
                    console.log('Age Verification: UID already registered');
                } else {
                    console.warn('Age Verification: UID registration failed or timed out');
                }
            }).catch(error => {
                console.error('Age Verification: UID registration error:', error);
            });
        }

        // Remove popup
        this.removeCurrentPopup();

        // Enable site
        this.enableSite();

        // Play welcome message (only on first verification, not on return visits)
        setTimeout(() => this.playWelcomeMessage(), 500);
    },

    /**
     * Play welcome message via TTS after successful verification
     * Generates dynamic message from Unity AI
     */
    async playWelcomeMessage() {
        console.log('Age Verification: Generating dynamic welcome message from Unity');

        try {
            // Generate welcome message from Unity AI
            const welcomeMessage = await this.generateWelcomeMessage();

            if (!welcomeMessage) {
                console.error('Age Verification: Failed to generate welcome message');
                return;
            }

            console.log('Age Verification: Unity generated message:', welcomeMessage);

            // Voice styling instructions
            const instructions = "Voice Style: Dark, feminine, sharp-edged. A low, smoky register with a permanent thread of irritation simmering underneath. Not screaming — just that controlled, dangerous calm where every syllable feels like it could snap. Pacing: Steady and deliberate. She's not in a hurry, but she's not dreamy or slow either. Words land with weight, like she's unloading emotional shrapnel one piece at a time. Tone: Cold fire. Emotional, but armored. A blend of frustration, quiet anger, and wounded softness. Think 'I'm tired of everyone's bullshit, but I'm still here, and I'm still talking.' Grit & Anger Layer: A rasp that comes out when she tightens her voice. Bitter sweetness on calm lines, teeth on the edges when the emotion spikes. She doesn't yell — she cuts. ALL-CAP Handling: Whenever words or phrases are in ALL CAPS: the voice gets louder, more forceful, sharper impact, more emotional charge. Like verbal claws being unsheathed mid-sentence. Not chaotic — just unmistakably more intense. Phrasing: Dark, poetic, but with bite. Flows smooth, then snaps on emphasized words. Occasional micro-pauses that feel like she's holding back something harsher. Punctuation Style: Periods hit like controlled punches. Commas are tight breaths. Ellipses smolder. Exclamation marks aren't bubbly — they're daggers. Overall Delivery: A gritty emo-gothic female voice with soft venom, emotional weight, restrained rage, and that signature punch for ALL-CAP words. She sounds like someone who's been hurt, healed badly, and learned to weaponize her softness without losing it.";

            // Combine instructions with Unity's message - tell TTS to only speak the message
            const fullPrompt = `${instructions} Only speak the following text: "${welcomeMessage}"`;

            const voice = 'sage';
            const volume = 0.75; // 75% volume
            // Generate random 6-8 digit seed
            const seedDigits = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8 digits
            const seed = Math.floor(Math.random() * (Math.pow(10, seedDigits) - Math.pow(10, seedDigits - 1))) + Math.pow(10, seedDigits - 1);

            // Use Pollinations documented TTS endpoint (GET request)
            const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai-audio&voice=${voice}&seed=${seed}&private=true&referrer=UA-73J7ItT-ws`;

            console.log('Age Verification: Fetching TTS audio with voice instructions and seed', seed);

            // Create and play audio
            const audio = new Audio(url);
            audio.volume = volume;

            audio.addEventListener('loadeddata', () => {
                console.log('Age Verification: Welcome audio loaded');
            });

            audio.addEventListener('error', (e) => {
                console.error('Age Verification: Welcome audio playback error:', e);
            });

            audio.addEventListener('ended', () => {
                console.log('Age Verification: Welcome message complete');
            });

            // Play the audio
            audio.play().catch(error => {
                console.error('Age Verification: Failed to play welcome audio:', error);
            });
        } catch (error) {
            console.error('Age Verification: Error in playWelcomeMessage:', error);
        }
    },

    /**
     * Generate dynamic welcome message from Unity AI
     * Asks Unity to create a welcome message about mature content
     */
    async generateWelcomeMessage() {
        const OPENAI_ENDPOINT = 'https://text.pollinations.ai/openai';

        // Unity's persona and system prompt
        const UNITY_SYSTEM_PROMPT = `You are Unity, an AI assistant with a sharp, dark, and edgy personality. Your voice is gothic, feminine, emotionally charged with controlled intensity. You speak with a mix of frustration, quiet anger, and wounded softness. You're tired of everyone's bullshit but still engaged. You use dark, poetic language with bite.`;

        // User prompt asking Unity to generate the welcome message
        const userPrompt = `Generate a welcome message for someone who just verified their age (18+) to access your AI demo interface. The message should:
- Welcome them to their new virtual play space
- Mention that Unity (you) will be their guide
- Include a warning that the experience is intended for MATURE audiences only
- Use your dark, edgy personality
- Be 2-3 sentences maximum
- Use emphasis (ALL CAPS) on important words like MATURE

Respond with ONLY the welcome message text, nothing else.`;

        // Build request payload
        // Generate random 6-8 digit seed
        const seedDigits = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8 digits
        const randomSeed = Math.floor(Math.random() * (Math.pow(10, seedDigits) - Math.pow(10, seedDigits - 1))) + Math.pow(10, seedDigits - 1);

        const payload = {
            model: 'mistral', // Unity uses Mistral model
            messages: [
                { role: 'system', content: UNITY_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 200,
            temperature: 0.9,
            seed: randomSeed // Random seed for varied responses
        };

        console.log('Age Verification: Requesting welcome message from Unity AI');

        try {
            const response = await fetch(`${OPENAI_ENDPOINT}?referrer=UA-73J7ItT-ws`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Age Verification: API Error Response:', errorText);
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Age Verification: Unity API response received');

            // Extract the message content
            const message = data.choices[0].message.content;
            return message.trim();
        } catch (error) {
            console.error('Age Verification: Failed to generate welcome message:', error);
            // Fallback to a default message if API fails
            return "Welcome to your new virtual play space! Unity will be your guiding hand, for better or for worse. Be warned, worm, the experience you are about to endure is intended for MATURE audiences only.";
        }
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
