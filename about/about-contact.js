/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * about-contact.js - About page contact form handler
 */

document.getElementById('aboutContactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('contactName').value;
    var email = document.getElementById('contactEmail').value;
    var reason = document.getElementById('contactReason').value;
    var source = document.getElementById('contactSource').value;
    var subject = document.getElementById('contactSubject').value;
    var message = document.getElementById('contactMessage').value;

    // Build mailto URL
    var recipient = 'unityailabcontact@gmail.com';
    var mailtoSubject = '[' + reason + '] ' + subject;
    var mailtoBody = 'Name: ' + name + '\nEmail: ' + email + '\nReason for Contact: ' + reason + '\nHow they heard about us: ' + source + '\n\nMessage:\n' + message;

    var mailtoURL = 'mailto:' + recipient + '?subject=' + encodeURIComponent(mailtoSubject) + '&body=' + encodeURIComponent(mailtoBody);

    // Open mailto link
    window.location.href = mailtoURL;
});
