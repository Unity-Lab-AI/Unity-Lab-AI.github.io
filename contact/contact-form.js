/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * contact-form.js - Main contact page form handler
 * Includes CSRF protection via session tokens and custom headers
 */

/**
 * Generate or retrieve session-based CSRF token
 * Token persists for the browser session only
 * @returns {string} CSRF token
 */
function getCSRFToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
        token = 'csrf_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
        sessionStorage.setItem('csrf_token', token);
    }
    return token;
}

document.getElementById('mainContactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var submitBtn = document.querySelector('#mainContactForm button[type="submit"]');
    var originalBtnText = submitBtn.textContent;

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    var formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        type: document.getElementById('contactType').value,
        service: document.getElementById('contactService').value,
        source: document.getElementById('contactSource').value,
        urgency: document.getElementById('contactUrgency').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value,
        _csrf: getCSRFToken()
    };

    try {
        var response = await fetch('https://contact.unityailab.com/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': getCSRFToken()
            },
            body: JSON.stringify(formData)
        });

        var result = await response.json();

        if (response.ok && result.success) {
            // Success - show message and reset form
            alert('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
            document.getElementById('mainContactForm').reset();
        } else {
            // API error
            alert(result.error || 'Failed to send message. Please try again.');
        }
    } catch (error) {
        console.error('Contact form error:', error);
        // Network error - fall back to mailto
        var recipient = 'unityailabcontact@gmail.com';
        var mailtoSubject = '[' + formData.type + '] ' + formData.subject;
        var mailtoBody = 'Name: ' + formData.name + '\nEmail: ' + formData.email + '\nType of Inquiry: ' + formData.type + '\n';
        if (formData.service && formData.service !== 'Not Applicable') {
            mailtoBody += 'Service of Interest: ' + formData.service + '\n';
        }
        mailtoBody += 'How they heard about us: ' + formData.source + '\nPriority Level: ' + formData.urgency + '\n\nMessage:\n' + formData.message;
        var mailtoURL = 'mailto:' + recipient + '?subject=' + encodeURIComponent(mailtoSubject) + '&body=' + encodeURIComponent(mailtoBody);

        if (confirm('Could not connect to server. Would you like to send via email instead?')) {
            window.location.href = mailtoURL;
        }
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
