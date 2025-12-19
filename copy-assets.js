#!/usr/bin/env node

/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Copy Additional Assets to Dist
 * Uses BLACKLIST approach - copies everything EXCEPT excluded items
 * Vite handles HTML files, this copies all other assets
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = 'dist';

// BLACKLIST: Files and directories to EXCLUDE from copying
const EXCLUDE = [
  // Build/Dev folders
  'node_modules',
  'dist',
  '.git',
  '.github',
  '.vscode',

  // Config files (not needed in production)
  'vite.config.js',
  'package.json',
  'package-lock.json',
  'copy-assets.js',
  'cache-bust.js',
  'generate-sitemap.js',
  '.gitignore',
  '.gitattributes',
  '.eslintrc.js',
  '.prettierrc',
  'tsconfig.json',
  'jsconfig.json',

  // Documentation (not needed in production)
  'CLAUDE.md',
  'README.md',
  'Docs',

  // Archived/legacy content (not needed in production)
  'Archived',
  'playwright-report',

  // Python library (not needed for web)
  'PolliLibPy',

  // Minified versions (originals are fine, Vite handles optimization)
  'styles.min.css',
  'script.min.js',

  // Test files
  'tests',
  'test',
  '*.test.js',
  '*.spec.js',

  // Temp/cache files
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.tmp',
];

// File extensions to always exclude
const EXCLUDE_EXTENSIONS = [
  '.md',   // Markdown docs (except in specific folders we want)
  '.log',
  '.tmp',
];

/**
 * Check if a path should be excluded
 */
function shouldExclude(itemPath, itemName) {
  // Check exact matches in exclude list
  if (EXCLUDE.includes(itemName)) {
    return true;
  }

  // Check if it's a hidden file/folder (starts with .)
  if (itemName.startsWith('.') && itemName !== '.htaccess' && itemName !== '_headers') {
    return true;
  }

  // Check excluded extensions
  const ext = path.extname(itemName).toLowerCase();
  if (EXCLUDE_EXTENSIONS.includes(ext)) {
    return true;
  }

  // Check glob patterns in exclude list
  for (const pattern of EXCLUDE) {
    if (pattern.startsWith('*') && itemName.endsWith(pattern.slice(1))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if file already exists in dist (Vite already processed it)
 */
function alreadyInDist(relativePath) {
  const distPath = path.join(DIST_DIR, relativePath);
  return fs.existsSync(distPath);
}

/**
 * Copy directory recursively with exclusions
 */
function copyDirRecursive(src, dest, relativePath = '') {
  let copiedCount = 0;

  if (!fs.existsSync(src)) {
    return copiedCount;
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relPath = path.join(relativePath, entry.name);

    // Check exclusions
    if (shouldExclude(srcPath, entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Create directory and recurse
      fs.mkdirSync(destPath, { recursive: true });
      copiedCount += copyDirRecursive(srcPath, destPath, relPath);
    } else {
      // Skip if already exists in dist (Vite handled it)
      if (!alreadyInDist(relPath)) {
        fs.mkdirSync(dest, { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      }
    }
  }

  return copiedCount;
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Copying assets to dist (blacklist mode)...');
  console.log('');

  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Error: ${DIST_DIR} directory not found!`);
    console.error('   Run this script after Vite build.');
    process.exit(1);
  }

  console.log('  🚫 Excluded patterns:');
  EXCLUDE.slice(0, 10).forEach(item => console.log(`     - ${item}`));
  if (EXCLUDE.length > 10) {
    console.log(`     ... and ${EXCLUDE.length - 10} more`);
  }
  console.log('');

  // Copy everything from root, respecting exclusions
  const copiedCount = copyDirRecursive('.', DIST_DIR);

  console.log('');
  console.log(`✅ Asset copying complete!`);
  console.log(`   Files copied: ${copiedCount}`);
}

// Run
try {
  main();
  process.exit(0);
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
