#!/usr/bin/env node

/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */


/**
 * Automatic Sitemap Generator
 * Scans for HTML files and generates sitemap.xml with current timestamps
 * Runs during build process to ensure sitemap is always up-to-date
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = 'https://www.unityailab.com';
const OUTPUT_FILE = 'sitemap.xml';

// Pages with their priority and change frequency
const PAGE_CONFIG = {
  '/': { priority: '1.0', changefreq: 'daily' },
  '/about/': { priority: '0.8', changefreq: 'weekly' },
  '/services/': { priority: '0.8', changefreq: 'weekly' },
  '/projects/': { priority: '0.8', changefreq: 'weekly' },
  '/contact/': { priority: '0.7', changefreq: 'monthly' },
  '/ai/': { priority: '0.9', changefreq: 'daily' },
  '/ai/demo/': { priority: '0.9', changefreq: 'daily' },
};

/**
 * Format date to W3C datetime format (YYYY-MM-DD)
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate sitemap URL entry
 */
function generateUrlEntry(url, lastmod, priority, changefreq) {
  return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Generate complete sitemap.xml
 */
function generateSitemap() {
  const currentDate = formatDate(new Date());

  console.log('🗺️  Generating sitemap.xml...');

  // Generate URL entries
  const urlEntries = Object.entries(PAGE_CONFIG).map(([url, config]) => {
    return generateUrlEntry(url, currentDate, config.priority, config.changefreq);
  }).join('\n');

  // Build complete sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, sitemap, 'utf8');

  console.log(`✅ Sitemap generated: ${OUTPUT_FILE}`);
  console.log(`📍 Site URL: ${SITE_URL}`);
  console.log(`📅 Last modified: ${currentDate}`);
  console.log(`📄 Pages included: ${Object.keys(PAGE_CONFIG).length}`);

  // Display generated URLs
  console.log('\n📋 URLs in sitemap:');
  Object.keys(PAGE_CONFIG).forEach(url => {
    console.log(`   ${SITE_URL}${url}`);
  });
}

// Run generator
try {
  generateSitemap();
  process.exit(0);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
