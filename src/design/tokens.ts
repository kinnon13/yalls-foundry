/**
 * Design Tokens - Single Source of Truth
 * Mac-clean aesthetic with TikTok/IG interaction feel
 */

export const tokens = {
  color: {
    // Background & Surfaces
    bg: {
      dark: 'hsl(220 10% 5%)',      // #0B0C0E
      light: 'hsl(220 30% 98%)',    // #F8F9FB
    },
    surface: {
      1: 'hsl(220 12% 7%)',
      2: 'hsl(220 12% 10%)',
      3: 'hsl(220 12% 13%)',
    },
    
    // Text
    text: {
      primary: 'hsl(220 20% 98%)',   // #FAFAFB
      secondary: 'hsl(220 10% 70%)', // #A9AFB8
      muted: 'hsl(220 10% 50%)',
    },
    
    // Brand & Semantic
    brand: 'hsl(225 95% 68%)',       // #5C7CFF electric blue
    accent: 'hsl(85 85% 70%)',       // #B6F36B lime
    danger: 'hsl(355 100% 68%)',     // #FF5C74
    success: 'hsl(162 65% 48%)',     // #27C193
    warning: 'hsl(35 100% 68%)',     // #FFB357
  },
  
  radius: {
    s: 4,
    m: 8,
    l: 12,
    xl: 16,
    pill: 999,
  },
  
  space: {
    xxs: 4,
    xs: 8,
    s: 12,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  typography: {
    size: {
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 22,
      xxl: 28,
      xxxl: 36,
      display: 48,
    },
    weight: {
      regular: 450,
      medium: 550,
      semibold: 600,
      bold: 650,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  zIndex: {
    base: 0,
    dropdown: 50,
    header: 100,
    overlay: 500,
    sheet: 600,
    modal: 900,
    toast: 1000,
  },
  
  motion: {
    duration: {
      fast: 150,
      normal: 220,
      slow: 360,
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
    },
  },
  
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536,
  },
} as const;

export type Tokens = typeof tokens;
