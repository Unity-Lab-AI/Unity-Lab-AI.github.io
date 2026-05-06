/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// ===================================
// nav scroll behavior
// ===================================

export function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    // bail if no navbar
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

        // track which section you're looking at
        updateActiveNavLink();
    });

    // highlight the active nav link
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
// smooth scroll for anchor links
// ===================================
export function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');

            // only intercept real section links
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                var target = document.querySelector(href);

                if (target) {
                    var offsetTop = target.offsetTop - 80;

                    // smooth scroll with polyfill
                    window.scrollTo({
                        top: offsetTop,
                        left: 0,
                        behavior: 'smooth'
                    });

                    // close mobile menu if it's open
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
