/**
 * Marketing Personalization Engine
 * A/B/C/D variant assignment and dynamic copy generation
 */

export type VariantKey = 'A' | 'B' | 'C' | 'D';

export interface VariantConfig {
  theme: string;
  cta: string;
  heroStyle: string;
}

export interface HeroCopy {
  headline: string;
  sub: string;
}

/**
 * Assign stable A/B/C/D variant based on seed (invite code or session ID)
 */
export function assignVariant(seed: string): VariantKey {
  // Stable hash to bucket assignment
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
  }
  
  const keys: VariantKey[] = ['A', 'B', 'C', 'D'];
  return keys[hash % keys.length];
}

/**
 * Get variant configuration
 */
export function getVariantConfig(variant: VariantKey): VariantConfig {
  const configs: Record<VariantKey, VariantConfig> = {
    A: { theme: 'default', cta: 'primary-top', heroStyle: 'split' },
    B: { theme: 'warm', cta: 'primary-center', heroStyle: 'stack' },
    C: { theme: 'cool', cta: 'primary-top', heroStyle: 'image-left' },
    D: { theme: 'contrast', cta: 'primary-bottom', heroStyle: 'big-headline' },
  };
  return configs[variant];
}

/**
 * Generate personalized hero copy based on inviter's interests
 */
export function heroCopy(opts: {
  inviterInterests?: string[];
}): HeroCopy {
  const interests = opts.inviterInterests || [];
  const primaryInterest = interests[0]?.toLowerCase() || null;

  // Equestrian/horses personalization
  if (primaryInterest === 'horses' || primaryInterest === 'equestrian') {
    return {
      headline: 'AI that actually helps you run the barn (and the business).',
      sub: 'Scheduling, sales, entries, payroll, CRM—plug in only what you need. No ads. No shadow bans. Just results.',
    };
  }

  // Fitness personalization
  if (primaryInterest === 'fitness') {
    return {
      headline: 'Build your brand and business—AI that spots the next move.',
      sub: 'From coaching flows to merch drops—connect audience → conversions with zero ad waste.',
    };
  }

  // Default copy
  return {
    headline: 'Own your audience. Build your business. AI that works for you.',
    sub: 'Curated feed, app library, and proactive assistants—no lock-in, no nonsense.',
  };
}
