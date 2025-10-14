/**
 * JSON-LD Schema Generator
 * 
 * Generate structured data for rich results in search engines.
 * 
 * Usage:
 *   import { generateOrganizationSchema } from '@/lib/seo/jsonld';
 *   <script type="application/ld+json">{JSON.stringify(schema)}</script>
 */

import { config } from '@/lib/config';

/**
 * Organization schema
 */
export function generateOrganizationSchema() {
  const siteUrl = config.VITE_SITE_URL || 'https://yalls.ai';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.VITE_APP_NAME,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      // Add social media URLs here
    ],
  };
}

/**
 * Event schema
 */
export function generateEventSchema(event: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  image?: string;
}) {
  const siteUrl = config.VITE_SITE_URL || 'https://yalls.ai';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      '@type': 'Place',
      name: event.location,
    },
    image: event.image ? `${siteUrl}${event.image}` : undefined,
  };
}

/**
 * Breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const siteUrl = config.VITE_SITE_URL || 'https://yalls.ai';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}