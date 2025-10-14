/**
 * Postbuild Script
 * 
 * Generates sitemap.xml and robots.txt after build completes.
 */

import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.VITE_SITE_URL || 'http://localhost:5173';
const DIST_DIR = path.join(process.cwd(), 'dist');

// Routes to include in sitemap
const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/search', priority: '0.8', changefreq: 'weekly' },
  { path: '/admin/control-room', priority: '0.3', changefreq: 'monthly' },
];

// Generate sitemap.xml
function generateSitemap(): string {
  const now = new Date().toISOString().split('T')[0];
  
  const urls = routes.map(route => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// Generate robots.txt
function generateRobots(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// Main execution
try {
  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist directory not found. Run build first.');
    process.exit(1);
  }
  
  // Write sitemap.xml
  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, generateSitemap());
  console.log(`✓ Generated sitemap.xml at ${sitemapPath}`);
  
  // Write robots.txt
  const robotsPath = path.join(DIST_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, generateRobots());
  console.log(`✓ Generated robots.txt at ${robotsPath}`);
  
  console.log(`\nSite URL: ${SITE_URL}`);
} catch (error) {
  console.error('Error generating postbuild files:', error);
  process.exit(1);
}
