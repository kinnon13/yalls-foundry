# `/public` - Static Assets

This directory contains static assets that are served directly without processing.

## 📁 Structure

```
public/
├── favicon.ico           Site favicon
├── placeholder.svg       Placeholder image
├── _headers             Cloudflare CDN cache headers
│
├── images/              (optional) Image assets
├── fonts/               (optional) Font files
└── assets/              (optional) Other static files
```

## 🎯 Purpose

Files in `/public` are:
- Served directly at the root URL
- NOT processed by Vite/bundler
- Cached by CDN with long cache times
- Accessible via absolute paths

## 📦 What Belongs Here

### ✅ Put Here
- **Favicons** - favicon.ico, apple-touch-icon.png
- **Static images** - Logos, brand assets that never change
- **Fonts** - Custom web fonts (if not using CDN)
- **robots.txt** - Search engine directives
- **sitemap.xml** - Site structure for SEO
- **manifest.json** - PWA manifest
- **_headers** - CDN cache configuration

### ❌ Don't Put Here
- Images referenced in components (use `/src/assets` instead)
- Files that need processing (use `/src`)
- Dynamic content
- Source code
- Configuration files
- Secrets or credentials

## 🔗 Referencing Public Files

### In HTML
```html
<!-- Favicon -->
<link rel="icon" href="/favicon.ico">

<!-- Image -->
<img src="/placeholder.svg" alt="Placeholder">

<!-- Manifest -->
<link rel="manifest" href="/manifest.json">
```

### In CSS
```css
/* Background image */
.hero {
  background-image: url('/images/hero-bg.jpg');
}
```

### In React
```tsx
// ❌ Wrong - don't import public files
import logo from '../public/logo.svg';

// ✅ Correct - use absolute path
<img src="/logo.svg" alt="Logo" />
```

## 📊 Cache Configuration

`_headers` file configures CDN caching:

```
# Static assets - 1 year cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Images - long cache
/*.png
  Cache-Control: public, max-age=31536000, immutable

# HTML - no cache
/*.html
  Cache-Control: no-store
```

**Benefits**:
- Faster page loads
- Reduced bandwidth
- Better performance scores
- Lower hosting costs

## 🖼️ Image Optimization

Before adding images to `/public`:

1. **Compress** - Use tools like ImageOptim, TinyPNG
2. **Resize** - Don't upload 4K images for 100px display
3. **Format** - Use WebP for better compression (with fallback)
4. **Naming** - Use descriptive names: `company-logo.svg` not `img1.svg`

### Optimal Sizes
- **Favicons**: 32x32, 180x180 (Apple touch)
- **Logos**: SVG preferred (scalable)
- **Icons**: 24x24, 48x48 (PNG or SVG)
- **Images**: Max 2000px width for web display

## 📏 File Organization

Keep it organized:
```
public/
├── images/
│   ├── logos/
│   │   ├── company-logo.svg
│   │   └── company-logo-white.svg
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   └── icon-180.png
│   └── og/
│       └── og-image.jpg
├── fonts/
│   ├── custom-font.woff2
│   └── custom-font.woff
└── favicon.ico
```

## 🔐 Security

- ❌ Never put credentials, API keys, or secrets here
- ❌ Files here are PUBLIC - anyone can access them
- ✅ Only files safe for public viewing

## 🚀 Performance Tips

1. **Use CDN** - Cloudflare automatically caches based on `_headers`
2. **Lazy Load** - Use `loading="lazy"` for images
3. **Modern Formats** - WebP, AVIF for better compression
4. **Responsive Images** - Use `srcset` for different screen sizes

Example:
```html
<img 
  src="/images/hero.jpg" 
  srcset="/images/hero-480w.jpg 480w,
          /images/hero-800w.jpg 800w,
          /images/hero-1200w.jpg 1200w"
  sizes="(max-width: 600px) 480px,
         (max-width: 900px) 800px,
         1200px"
  alt="Hero image"
  loading="lazy"
/>
```

## 🧹 Maintenance

### Monthly Review
- [ ] Remove unused files
- [ ] Check file sizes (optimize large files)
- [ ] Verify all images are optimized
- [ ] Update cache headers if needed

### Before Production Deploy
- [ ] All images optimized
- [ ] Favicon present
- [ ] robots.txt configured
- [ ] sitemap.xml up to date (if applicable)

## 🔗 Related Docs

- [PROJECT_RULES.md](../PROJECT_RULES.md) - Project organization
- [src/assets vs public/](https://vitejs.dev/guide/assets.html) - When to use which

---

**Last Updated**: 2025-10-22  
**Total Size**: Keep under 5MB for fast initial loads
