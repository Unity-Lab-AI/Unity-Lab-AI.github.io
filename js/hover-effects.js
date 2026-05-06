/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// ===================================
// mouse hover interactions
// ===================================

export function initHoverEffects() {
    // tilt effect on cards
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });

        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
        });
    });

    // red glow on gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 10px 60px rgba(220, 20, 60, 0.7)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });
}
