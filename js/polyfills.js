/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// ===================================
// polyfills for dinosaur browsers
// ===================================

// NodeList forEach for IE11
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Element.closest polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// scrollTo with smooth behavior
(function() {
    if (!('scrollBehavior' in document.documentElement.style)) {
        var Element = window.HTMLElement || window.Element;

        var originalScrollTo = window.scrollTo;

        window.scrollTo = function() {
            if (arguments.length === 1 && typeof arguments[0] === 'object') {
                var options = arguments[0];
                if (options.behavior === 'smooth') {
                    smoothScrollTo(options.top || 0, options.left || 0);
                } else {
                    originalScrollTo.call(window, options.left || 0, options.top || 0);
                }
            } else {
                originalScrollTo.apply(window, arguments);
            }
        };

        function smoothScrollTo(endY, endX) {
            var startY = window.pageYOffset || document.documentElement.scrollTop;
            var startX = window.pageXOffset || document.documentElement.scrollLeft;
            var distanceY = endY - startY;
            var distanceX = endX - startX;
            var startTime = new Date().getTime();
            var duration = 400;

            var timer = setInterval(function() {
                var time = new Date().getTime() - startTime;
                var newY = easeInOutQuad(time, startY, distanceY, duration);
                var newX = easeInOutQuad(time, startX, distanceX, duration);
                if (time >= duration) {
                    clearInterval(timer);
                }
                window.scroll(newX, newY);
            }, 1000 / 60);
        }

        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
    }
})();

// requestAnimationFrame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                                       window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
})();

export function initPolyfills() {
    // polyfills auto-load when module imports
    console.log('Polyfills loaded');
}
