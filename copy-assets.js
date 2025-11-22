#!/usr/bin/env node

/**
 * Copy Additional Assets to Dist
 * Copies files that Vite doesn't process but are needed for the site
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = 'dist';

// Files and directories to copy
const ASSETS_TO_COPY = [
  { src: 'vendor', dest: 'vendor', type: 'dir' },
  { src: 'fonts', dest: 'fonts', type: 'dir' },
  { src: 'PolliLibJS', dest: 'PolliLibJS', type: 'dir' },
  { src: 'robots.txt', dest: 'robots.txt', type: 'file' },
  { src: 'sitemap.xml', dest: 'sitemap.xml', type: 'file' },
  { src: 'BingSiteAuth.xml', dest: 'BingSiteAuth.xml', type: 'file' },
  { src: 'script.js', dest: 'script.js', type: 'file' },
  { src: 'visitor-tracking.js', dest: 'visitor-tracking.js', type: 'file' },
  { src: 'about/about.js', dest: 'about/about.js', type: 'file' },
  { src: 'ai/demo/age-verification.js', dest: 'ai/demo/age-verification.js', type: 'file' },
  { src: 'ai/demo/js/main.js', dest: 'ai/demo/js/main.js', type: 'file' },
  // Apps subdirectories (apps/index.html is handled by Vite)
  { src: 'apps/helperInterfaceDemo', dest: 'apps/helperInterfaceDemo', type: 'dir' },
  { src: 'apps/oldSiteProject', dest: 'apps/oldSiteProject', type: 'dir' },
  { src: 'apps/personaDemo', dest: 'apps/personaDemo', type: 'dir' },
  { src: 'apps/screensaverDemo', dest: 'apps/screensaverDemo', type: 'dir' },
  { src: 'apps/slideshowDemo', dest: 'apps/slideshowDemo', type: 'dir' },
  { src: 'apps/talkingWithUnity', dest: 'apps/talkingWithUnity', type: 'dir' },
  { src: 'apps/textDemo', dest: 'apps/textDemo', type: 'dir' },
  { src: 'apps/unityDemo', dest: 'apps/unityDemo', type: 'dir' },
  { src: 'apps/shared-nav.html', dest: 'apps/shared-nav.html', type: 'file' },
  { src: 'apps/shared-nav.js', dest: 'apps/shared-nav.js', type: 'file' },
  { src: 'apps/shared-theme.css', dest: 'apps/shared-theme.css', type: 'file' },
  { src: 'apps/update-apps.sh', dest: 'apps/update-apps.sh', type: 'file' },
];

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠️  Skipping ${src} (not found)`);
    return false;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

/**
 * Copy file
 */
function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠️  Skipping ${src} (not found)`);
    return false;
  }

  const destDir = path.dirname(dest);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Copying additional assets to dist...');
  console.log('');

  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Error: ${DIST_DIR} directory not found!`);
    console.error('   Run this script after Vite build.');
    process.exit(1);
  }

  let copiedCount = 0;
  let skippedCount = 0;

  // Copy each asset
  for (const asset of ASSETS_TO_COPY) {
    const srcPath = asset.src;
    const destPath = path.join(DIST_DIR, asset.dest);

    console.log(`  📁 ${asset.src} → ${asset.dest}`);

    let success;
    if (asset.type === 'dir') {
      success = copyDir(srcPath, destPath);
    } else {
      success = copyFile(srcPath, destPath);
    }

    if (success) {
      copiedCount++;
      console.log(`     ✅ Copied`);
    } else {
      skippedCount++;
    }
  }

  console.log('');
  console.log(`✅ Asset copying complete!`);
  console.log(`   Copied: ${copiedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
}

// Run
try {
  main();
  process.exit(0);
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
