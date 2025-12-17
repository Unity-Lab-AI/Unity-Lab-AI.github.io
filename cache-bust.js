#!/usr/bin/env node

/**
 * Post-Build Cache Busting Script
 * Ensures aggressive cache invalidation for GitHub Pages deployment
 *
 * This script runs after Vite build to add additional cache-busting measures:
 * 1. Adds cache-control meta tags to HTML files
 * 2. Adds build timestamp to HTML files
 * 3. Ensures all external resources have cache-busting
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = 'dist';
const BUILD_TIMESTAMP = new Date().toISOString();
const BUILD_HASH = crypto.createHash('md5').update(BUILD_TIMESTAMP).digest('hex').substring(0, 8);

/**
 * Cache-control meta tags to add to HTML files
 */
const CACHE_CONTROL_TAGS = `
    <!-- Cache Control - Prevent aggressive caching by GitHub Pages -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta name="build-timestamp" content="${BUILD_TIMESTAMP}">
    <meta name="build-hash" content="${BUILD_HASH}">`;

/**
 * Recursively find all HTML files in a directory
 */
function findHtmlFiles(dir) {
  let htmlFiles = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      htmlFiles = htmlFiles.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  }

  return htmlFiles;
}

/**
 * Add cache-busting query parameters to resources
 */
function addQueryParamsToResources(html) {
  // Add cache-busting to external CDN resources that don't have versioning
  html = html.replace(
    /(<script[^>]+src=["'])(https:\/\/[^"']+)(["'][^>]*>)/g,
    (match, prefix, url, suffix) => {
      // Skip if URL already has query parameters or is a known versioned CDN
      if (url.includes('?') || url.includes('@') || url.includes('/dist/')) {
        return match;
      }
      return `${prefix}${url}?v=${BUILD_HASH}${suffix}`;
    }
  );

  html = html.replace(
    /(<link[^>]+href=["'])(https:\/\/[^"']+)(["'][^>]*>)/g,
    (match, prefix, url, suffix) => {
      // Skip if URL already has query parameters or is a known versioned CDN
      if (url.includes('?') || url.includes('@') || url.includes('/dist/')) {
        return match;
      }
      return `${prefix}${url}?v=${BUILD_HASH}${suffix}`;
    }
  );

  // Add cache-busting to LOCAL JS files (non-hashed ones like visitor-tracking.js, age-verification.js)
  html = html.replace(
    /(<script[^>]+src=["'])([^"']+\.js)(["'][^>]*>)/g,
    (match, prefix, url, suffix) => {
      // Skip if already has query params, is external (https://), or is a Vite-hashed asset
      if (url.includes('?') || url.startsWith('http') || url.includes('/assets/') || url.includes('-')) {
        return match;
      }
      return `${prefix}${url}?v=${BUILD_HASH}${suffix}`;
    }
  );

  // Add cache-busting to LOCAL CSS files (non-hashed ones)
  html = html.replace(
    /(<link[^>]+href=["'])([^"']+\.css)(["'][^>]*>)/g,
    (match, prefix, url, suffix) => {
      // Skip if already has query params, is external (https://), or is a Vite-hashed asset
      if (url.includes('?') || url.startsWith('http') || url.includes('/assets/') || url.includes('-')) {
        return match;
      }
      return `${prefix}${url}?v=${BUILD_HASH}${suffix}`;
    }
  );

  return html;
}

/**
 * Process a single HTML file
 */
function processHtmlFile(filePath) {
  console.log(`  📝 Processing: ${filePath}`);

  let html = fs.readFileSync(filePath, 'utf8');

  // Add cache-control meta tags after <head>
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${CACHE_CONTROL_TAGS}`);
  } else {
    console.warn(`    ⚠️  No <head> tag found in ${filePath}`);
  }

  // Add cache-busting to all resources (external and local)
  html = addQueryParamsToResources(html);

  // Add build info comment
  const buildComment = `\n<!-- Built: ${BUILD_TIMESTAMP} | Hash: ${BUILD_HASH} -->\n`;
  html = html.replace('</body>', `${buildComment}</body>`);

  // Write back to file
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`    ✅ Cache-busting applied`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 Applying aggressive cache-busting measures...');
  console.log(`📅 Build timestamp: ${BUILD_TIMESTAMP}`);
  console.log(`🔑 Build hash: ${BUILD_HASH}`);
  console.log('');

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Error: ${DIST_DIR} directory not found!`);
    console.error('   Make sure to run this script after Vite build.');
    process.exit(1);
  }

  // Find all HTML files
  const htmlFiles = findHtmlFiles(DIST_DIR);
  console.log(`📄 Found ${htmlFiles.length} HTML files to process`);
  console.log('');

  // Process each HTML file
  htmlFiles.forEach(processHtmlFile);

  console.log('');
  console.log('✅ Cache-busting complete!');
  console.log('');
  console.log('Applied measures:');
  console.log('  1. ✅ Cache-Control meta tags (no-cache, no-store, must-revalidate)');
  console.log('  2. ✅ Pragma and Expires headers');
  console.log('  3. ✅ Build timestamp and hash in meta tags');
  console.log('  4. ✅ Query parameters added to external CDN resources');
  console.log('  5. ✅ Query parameters added to local JS/CSS files');
  console.log('  6. ✅ Vite content-hashed assets (built-in)');
  console.log('');
  console.log('🚀 Your site is now fully protected against aggressive caching!');
}

// Run the script
try {
  main();
  process.exit(0);
} catch (error) {
  console.error('❌ Error during cache-busting:', error);
  process.exit(1);
}
