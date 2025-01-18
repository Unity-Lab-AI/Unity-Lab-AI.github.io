class VisitorTracker {
    constructor() {
        this.storageKey = 'unityChat_visitorCount';
        this.userKey = 'unityChat_visitorId';
        this.count = 0;
        this.initialize();
    }

    initialize() {
        // Get existing count
        this.count = parseInt(localStorage.getItem(this.storageKey)) || 0;
        
        // Check if this is a new visitor
        if (!localStorage.getItem(this.userKey)) {
            // Generate unique ID for visitor
            const visitorId = this.generateVisitorId();
            localStorage.setItem(this.userKey, visitorId);
            
            // Increment count
            this.count++;
            localStorage.setItem(this.storageKey, this.count.toString());
        }

        // Update display
        this.updateDisplay();

        // Set up auto-refresh
        setInterval(() => this.updateDisplay(), 30000);
    }

    generateVisitorId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateDisplay() {
        const countElement = document.querySelector('.visitor-count');
        if (countElement) {
            this.animateCount(parseInt(countElement.textContent) || 0, this.count, countElement);
        }
    }

    animateCount(start, end, element) {
        if (start === end) return;
        
        const duration = 1000;
        const steps = 20;
        const stepValue = (end - start) / steps;
        const stepDuration = duration / steps;
        
        let current = start;
        const timer = setInterval(() => {
            current += stepValue;
            if ((stepValue > 0 && current >= end) || (stepValue < 0 && current <= end)) {
                clearInterval(timer);
                element.textContent = end;
            } else {
                element.textContent = Math.round(current);
            }
        }, stepDuration);
    }

    incrementCount() {
        this.count++;
        localStorage.setItem(this.storageKey, this.count.toString());
        this.updateDisplay();
    }

    resetCount() {
        this.count = 0;
        localStorage.setItem(this.storageKey, '0');
        this.updateDisplay();
    }
}