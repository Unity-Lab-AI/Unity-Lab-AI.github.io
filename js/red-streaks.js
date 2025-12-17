// ===================================
// Red Streaks Animation Enhancement
// ===================================

export function enhanceRedStreaks() {
    const streaks = document.querySelector('.red-streaks');

    if (streaks) {
        let intensity = 0.02;

        window.addEventListener('scroll', function() {
            const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            intensity = 0.02 + (scrollPercent * 0.05);

            streaks.style.opacity = Math.min(1, 0.5 + scrollPercent);
        });
    }
}
