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
 *
 * Emits sitemap.xml with the post-redesign canonical URL set (P1-07 decision).
 * Canonical resource form is `.html` extension for the 7 redesign pages — directs
 * crawlers to the actual served file (single 200) instead of the trailing-slash
 * redirect stub at `/about/` etc. (which 302/JS-refreshes back to `/about.html`,
 * costing a hop of crawl budget). `/ai/demo/` and `/downloads/` keep trailing-slash
 * form because they ARE genuine directory roots, not redirect stubs.
 *
 * Decision rationale + URL set audit: docs/redesign/notes-p1-sitemap.md
 *
 * Each `<lastmod>` is stamped with the current build date so search engines see
 * fresh-content signals on every deploy. The URL set, priorities, changefreqs,
 * inline comments, and the `/downloads/` image entry are all defined in
 * PAGE_CONFIG below — single source of truth, edit there to add/remove URLs
 * or shift weights.
 */

const fs = require('fs');

const SITE_URL = 'https://www.unityailab.com';
const OUTPUT_FILE = 'sitemap.xml';

// Canonical post-redesign URL set. Order is intentional — homepage first,
// then content tier by priority. Each entry carries an inline comment that
// renders as `<!-- ... -->` in the emitted XML to preserve the human-readable
// rationale from the hand-curated source.
const PAGE_CONFIG = [
  {
    url: '/',
    priority: '1.0',
    changefreq: 'daily',
    comment: 'Homepage — gothic V-D landing',
  },
  {
    url: '/ai.html',
    priority: '0.9',
    changefreq: 'daily',
    comment: 'AI hub',
  },
  {
    url: '/ai/demo/',
    priority: '0.9',
    changefreq: 'daily',
    comment: 'AI Demo — interactive chatbot (preserved standalone, not redesigned)',
  },
  {
    url: '/about.html',
    priority: '0.8',
    changefreq: 'weekly',
    comment: 'About — gothic V2 cathedral fusion',
  },
  {
    url: '/services.html',
    priority: '0.8',
    changefreq: 'weekly',
    comment: 'Services',
  },
  {
    url: '/projects.html',
    priority: '0.8',
    changefreq: 'weekly',
    comment: 'Projects',
  },
  {
    url: '/apps.html',
    priority: '0.8',
    changefreq: 'weekly',
    comment: 'Apps gallery',
  },
  {
    url: '/contact.html',
    priority: '0.7',
    changefreq: 'monthly',
    comment: 'Contact',
  },
  {
    url: '/downloads/',
    priority: '0.5',
    changefreq: 'weekly',
    comment: 'Downloads — accessible by direct URL, navbar link restored 2026-05-13',
    image: {
      loc: 'https://www.unityailab.com/downloads/moana/image.png',
      title: 'Moana Miner — AI-Optimized Mining Software',
      caption: 'Moana cryptocurrency mining application by Unity AI Lab',
    },
  },
  {
    url: '/downloads/weird/',
    priority: '0.4',
    changefreq: 'monthly',
    comment: 'The Weird Project (SEX SLAVE DUNGEON) — adult game deep download page',
  },
  {
    url: '/terms.html',
    priority: '0.3',
    changefreq: 'yearly',
    comment: 'Terms of Service — legal page, footer-linked from every page',
  },
  {
    url: '/privacy.html',
    priority: '0.3',
    changefreq: 'yearly',
    comment: 'Privacy Policy — legal page, footer-linked from every page',
  },
];

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function renderUrlEntry(entry, lastmod) {
  const lines = [
    `  <!-- ${entry.comment} -->`,
    '  <url>',
    `    <loc>${SITE_URL}${entry.url}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
  ];
  if (entry.image) {
    lines.push(
      '    <image:image>',
      `      <image:loc>${entry.image.loc}</image:loc>`,
      `      <image:title>${entry.image.title}</image:title>`,
      `      <image:caption>${entry.image.caption}</image:caption>`,
      '    </image:image>'
    );
  }
  lines.push('  </url>');
  return lines.join('\n');
}

function generateSitemap() {
  const currentDate = formatDate(new Date());

  console.log('🗺️  Generating sitemap.xml...');

  const urlBlocks = PAGE_CONFIG
    .map(entry => renderUrlEntry(entry, currentDate))
    .join('\n\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>
<!--
  Unity AI Lab Sitemap
  https://www.unityailab.com/

  Post-redesign URL set (gothic V-D). Canonical resource form is \`.html\` extension
  for the 7 redesign pages — directs crawlers to the actual served file (single 200)
  instead of the trailing-slash redirect stub (302 chain). \`/ai/demo/\` and \`/downloads/\`
  remain trailing-slash since they are genuine directory roots, not redirect stubs.
  Decision rationale: docs/redesign/notes-p1-sitemap.md
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
                            http://www.google.com/schemas/sitemap-image/1.1
                            http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">

${urlBlocks}

</urlset>
`;

  fs.writeFileSync(OUTPUT_FILE, sitemap, 'utf8');

  console.log(`✅ Sitemap generated: ${OUTPUT_FILE}`);
  console.log(`📍 Site URL: ${SITE_URL}`);
  console.log(`📅 Last modified: ${currentDate}`);
  console.log(`📄 URLs included: ${PAGE_CONFIG.length}`);

  console.log('\n📋 URLs in sitemap:');
  PAGE_CONFIG.forEach(entry => {
    console.log(`   ${SITE_URL}${entry.url}  (priority ${entry.priority}, ${entry.changefreq})`);
  });
}

try {
  generateSitemap();
  process.exit(0);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
