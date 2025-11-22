// ===================================
// Navbar Scroll Effect
// ===================================

export function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    // Check if navbar exists before initializing
    if (!navbar) {
        console.warn('Navbar not found, skipping navbar initialization');
        return;
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        updateActiveNavLink();
    });

    // Highlight active nav link
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// ===================================
// Smooth Scrolling (Cross-browser)
// ===================================
export function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');

            // Only prevent default if it's an actual section link
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                var target = document.querySelector(href);

                if (target) {
                    var offsetTop = target.offsetTop - 80;

                    // Use polyfilled scrollTo
                    window.scrollTo({
                        top: offsetTop,
                        left: 0,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    try {
                        var navbarCollapse = document.querySelector('.navbar-collapse');
                        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                            if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                                var bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                                if (bsCollapse) {
                                    bsCollapse.hide();
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Error closing mobile menu:', error);
                    }
                }
            }
        });
    });
}
