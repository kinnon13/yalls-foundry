/**
 * SEO Helmet Component
 * 
 * Wrapper for react-helmet-async with default meta tags.
 * 
 * Usage:
 *   import { SEOHelmet } from '@/lib/seo/helmet';
 *   <SEOHelmet title="Page Title" description="..." />
 */

import { Helmet } from 'react-helmet-async';
import { config } from '@/lib/config';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

export function SEOHelmet({
  title,
  description = 'yalls.ai - Connecting communities through events',
  keywords = ['events', 'community', 'social'],
  image = '/og-image.png',
  url,
  type = 'website',
}: SEOHelmetProps) {
  const fullTitle = title ? `${title} | ${config.VITE_APP_NAME}` : config.VITE_APP_NAME;
  const siteUrl = config.VITE_SITE_URL || 'https://yalls.ai';
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      {/* Basic meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:site_name" content={config.VITE_APP_NAME} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${image}`} />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      
      {/* Theme color */}
      <meta name="theme-color" content="#000000" />
    </Helmet>
  );
}