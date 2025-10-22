/**
 * Crisper Pathways - Structured Action Plan Formatter
 * Transforms raw plan data into crisp 5-7 step format
 */

export type Profile = {
  verbosity?: 'low' | 'medium' | 'high';
  format_pref?: 'bullets' | 'paragraphs' | 'tables';
  approval_mode?: 'ask' | 'auto' | 'never';
  tone?: string;
};

export type PathwayStep = {
  title: string;
  detail?: string;
  action?: string;
  how?: string;
};

export type PathwayRisk = {
  risk: string;
  mitig: string;
  name?: string;
  mitigation?: string;
  fix?: string;
};

export type PathwayInput = {
  objective: string;
  metric?: string;
  kpi?: string;
  prep?: string[];
  requirements?: string[];
  steps: PathwayStep[];
  risks?: PathwayRisk[];
  verify?: string[];
  tests?: string[];
};

/**
 * Format a plan into Pathway Template v1 structure
 */
export function formatPathway(p: PathwayInput, prof: Profile): string {
  const low = prof.verbosity === 'low';
  const maxSteps = low ? 3 : Math.min(7, Math.max(3, p.steps.length));
  const steps = p.steps.slice(0, maxSteps);
  
  const lines: string[] = [];
  
  // 1. Objective + Metric
  lines.push(`**Objective:** ${p.objective}`);
  const metric = p.metric || p.kpi;
  if (metric) {
    lines.push(`**Metric:** ${metric}`);
  }
  
  // 2. Prep
  const prep = p.prep || p.requirements;
  if (prep?.length) {
    lines.push(`**Prep:** ${prep.join(', ')}`);
  }
  
  // 3. Steps
  lines.push(`\n**Steps:**`);
  steps.forEach((s, i) => {
    const title = s.title || s.action || 'Step';
    const detail = s.detail || s.how || '';
    lines.push(`${i + 1}. ${title}${detail ? ` — ${detail}` : ''}`);
  });
  
  // 4. Risks
  if (p.risks?.length) {
    const risks = p.risks.slice(0, 2).map(r => {
      const riskText = r.risk || r.name || 'Unknown risk';
      const mitigText = r.mitig || r.mitigation || r.fix || 'Unknown mitigation';
      return `• ${riskText} → ${mitigText}`;
    });
    lines.push(`\n**Risks & Mitigations:**`);
    lines.push(...risks);
  }
  
  // 5. Verify
  const verify = p.verify || p.tests;
  if (verify?.length) {
    lines.push(`\n**Verify & Next:**`);
    verify.forEach(v => lines.push(`• ${v}`));
  }
  
  // Approval prompt
  if (prof.approval_mode === 'ask') {
    lines.push(`\n**Confirm to proceed?**`);
  }
  
  return lines.join('\n');
}

/**
 * Detect objective from user message if not explicit
 */
export function detectObjective(message: string): string {
  const patterns = [
    /(?:need to|want to|let's|please) (.+?)(?:\.|$)/i,
    /^(.+?) (?:for me|please)$/i,
    /^(.{20,}?)$/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  
  return 'Complete the requested task';
}

/**
 * Resolve pathway mode from user profile and global flags
 */
export function resolvePathwayMode(
  prof: { pathway_mode?: 'auto' | 'heavy' | 'light' },
  flags: { pathway_heavy_default?: boolean }
): boolean {
  if (prof?.pathway_mode === 'heavy') return true;
  if (prof?.pathway_mode === 'light') return false;
  // auto → use global default
  return !!flags?.pathway_heavy_default;
}

/**
 * Hash user ID for A/B bucketing (deterministic)
 */
export function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Determine if user should get heavy pathway (with A/B option)
 */
export function shouldUseHeavyPathway(
  userId: string,
  prof: { pathway_mode?: 'auto' | 'heavy' | 'light' },
  flags: { pathway_heavy_default?: boolean },
  abTestPercent: number = 0 // 0 = off, 10 = 10% rollout
): boolean {
  if (prof?.pathway_mode === 'heavy') return true;
  if (prof?.pathway_mode === 'light') return false;
  
  // auto mode
  if (abTestPercent > 0 && abTestPercent < 100) {
    const bucket = hashUserId(userId) % 100;
    if (bucket < abTestPercent) return true;
  }
  
  return !!flags?.pathway_heavy_default;
}
