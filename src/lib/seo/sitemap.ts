/**
 * Sitemap Utilities
 * 
 * Client-side utilities for sitemap generation.
 * Actual sitemap.xml served by edge function.
 * 
 * Usage:
 *   // Edge function generates sitemap by calling getSitemapUrls()
 */

import { config } from '@/lib/config';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Get static URLs for sitemap
 */
export function getStaticSitemapUrls(): SitemapUrl[] {
  const siteUrl = config.VITE_SITE_URL || 'https://yalls.ai';
  
  return [
    {
      loc: siteUrl,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${siteUrl}/search`,
      changefreq: 'daily',
      priority: 0.8,
    },
  ];
}

/**
 * Generate sitemap XML
 * Called by edge function
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
}