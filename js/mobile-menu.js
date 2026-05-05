/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// ===================================
// mobile menu handler
// ===================================

export function initMobileMenu() {
    try {
        var navbarToggler = document.querySelector('.navbar-toggler');
        var navbarCollapse = document.querySelector('.navbar-collapse');

        if (navbarToggler && navbarCollapse) {
            // close menu when clicking outside
            document.addEventListener('click', function(e) {
                try {
                    var isClickInside = navbarToggler.contains(e.target) || navbarCollapse.contains(e.target);

                    if (!isClickInside && navbarCollapse.classList.contains('show')) {
                        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                            var bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                            if (bsCollapse) {
                                bsCollapse.hide();
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Error handling menu click:', error);
                }
            });

            // lock body scroll when menu open - nobody needs double scrolling
            navbarToggler.addEventListener('click', function() {
                try {
                    setTimeout(function() {
                        if (navbarCollapse.classList.contains('show')) {
                            document.body.style.overflow = 'hidden';
                        } else {
                            document.body.style.overflow = '';
                        }
                    }, 350);
                } catch (error) {
                    console.warn('Error toggling body scroll:', error);
                }
            });
        }
    } catch (error) {
        console.warn('Mobile menu initialization failed:', error);
    }
}
