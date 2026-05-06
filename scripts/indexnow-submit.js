#!/usr/bin/env node
/**
 * IndexNow URL Submission Script
 * 
 * Submits all site URLs to IndexNow API for instant indexing by:
 * - Bing
 * - Yandex
 * - Seznam
 * - Naver
 * - And other participating search engines
 * 
 * Usage:
 *   node scripts/indexnow-submit.js [--dry-run]
 * 
 * The script reads URLs from sitemap.xml and submits them to IndexNow.
 * All participating search engines share submitted URLs automatically.
 */

const https = require('https');

// Configuration
const CONFIG = {
    host: 'www.unityailab.com',
    key: 'a743d8b18b9b4efeb89378e9a803f956',
    // IndexNow API endpoint (Bing's endpoint, shared with all participants)
    endpoint: 'api.indexnow.org',
    // All URLs to submit
    urls: [
        // Main pages
        'https://www.unityailab.com/',
        'https://www.unityailab.com/about/',
        'https://www.unityailab.com/services/',
        'https://www.unityailab.com/projects/',
        'https://www.unityailab.com/contact/',
        
        // AI section
        'https://www.unityailab.com/ai/',
        'https://www.unityailab.com/ai/demo/',
        
        // Apps section
        'https://www.unityailab.com/apps/',
        'https://www.unityailab.com/apps/unityDemo/unity.html',
        'https://www.unityailab.com/apps/textDemo/text.html',
        'https://www.unityailab.com/apps/personaDemo/persona.html',
        'https://www.unityailab.com/apps/slideshowDemo/slideshow.html',
        'https://www.unityailab.com/apps/screensaverDemo/screensaver.html',
        'https://www.unityailab.com/apps/helperInterfaceDemo/helperInterface.html',
        'https://www.unityailab.com/apps/talkingWithUnity/',
        'https://www.unityailab.com/apps/talkingWithUnity/indexAI.html',
        'https://www.unityailab.com/apps/oldSiteProject/',
        'https://www.unityailab.com/apps/oldSiteProject/screensaver.html',
        
        // Downloads section
        'https://www.unityailab.com/downloads/',
        'https://www.unityailab.com/downloads/moana/'
    ]
};

/**
 * Submit URLs to IndexNow API
 */
async function submitToIndexNow(dryRun = false) {
    const payload = {
        host: CONFIG.host,
        key: CONFIG.key,
        urlList: CONFIG.urls
    };

    console.log('IndexNow URL Submission');
    console.log('==========================');
    console.log(`Host: ${CONFIG.host}`);
    console.log(`Key: ${CONFIG.key}`);
    console.log(`URLs to submit: ${CONFIG.urls.length}`);
    console.log('');
    
    CONFIG.urls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
    });
    console.log('');

    if (dryRun) {
        console.log('DRY RUN - No actual submission');
        console.log('');
        console.log('Would POST to: https://api.indexnow.org/indexnow');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        return { success: true, dryRun: true };
    }

    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);

        const options = {
            hostname: CONFIG.endpoint,
            port: 443,
            path: '/indexnow',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        console.log(`Submitting to https://${CONFIG.endpoint}/indexnow ...`);

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const statusCode = res.statusCode;
                
                console.log('');
                console.log(`Response: HTTP ${statusCode}`);
                
                if (statusCode === 200) {
                    console.log('SUCCESS - URLs submitted successfully');
                    console.log('   All participating search engines will be notified.');
                    resolve({ success: true, statusCode, response: responseData });
                } else if (statusCode === 202) {
                    console.log('ACCEPTED - URLs received, key validation pending');
                    console.log('   Search engines will validate the key file.');
                    resolve({ success: true, statusCode, response: responseData });
                } else if (statusCode === 400) {
                    console.log('BAD REQUEST - Invalid format');
                    reject(new Error(`HTTP 400: Invalid format. Response: ${responseData}`));
                } else if (statusCode === 403) {
                    console.log('FORBIDDEN - Key not valid');
                    console.log('   Make sure the key file exists at:');
                    console.log(`   https://${CONFIG.host}/${CONFIG.key}.txt`);
                    reject(new Error(`HTTP 403: Key not valid. Response: ${responseData}`));
                } else if (statusCode === 422) {
                    console.log('UNPROCESSABLE - URLs don\'t belong to host or key mismatch');
                    reject(new Error(`HTTP 422: URL/Key mismatch. Response: ${responseData}`));
                } else if (statusCode === 429) {
                    console.log('TOO MANY REQUESTS - Rate limited');
                    console.log('   Wait before submitting again.');
                    reject(new Error(`HTTP 429: Rate limited. Response: ${responseData}`));
                } else {
                    console.log(`UNEXPECTED RESPONSE: ${statusCode}`);
                    if (responseData) console.log(`   Response: ${responseData}`);
                    resolve({ success: false, statusCode, response: responseData });
                }
            });
        });

        req.on('error', (error) => {
            console.log('REQUEST ERROR:', error.message);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

submitToIndexNow(dryRun)
    .then((result) => {
        console.log('');
        console.log('==========================');
        console.log('IndexNow submission complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('');
        console.error('==========================');
        console.error('IndexNow submission failed:', error.message);
        process.exit(1);
    });
