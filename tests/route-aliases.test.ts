import { describe, test, expect } from 'vitest';
import fs from 'node:fs';

const areaConfig = JSON.parse(fs.readFileSync('configs/area-discovery.json','utf8'));

const cases: Array<[string,string]> = [
  ['/organizer', '/workspace'],
  ['/organizer/foo', '/workspace/:entityId/events/foo'],
  ['/incentives/dashboard', '/workspace/:entityId/programs'],
  ['/entrant', '/entries'],
  ['/equistats/horse/123', '/equinestats/horse/123'],
  ['/crm', '/workspace/:entityId/crm'],
];

describe('route alias mapping', () => {
  test.each(cases)('alias %s → %s', (from, to) => {
    const map: Record<string,string> = areaConfig.routeAliases || {};

    // exact match first
    const exact = map[from];
    if (exact) {
      expect(exact).toBe(to);
      return;
    }

    // wildcard support: entries ending with /*
    let matched: string | null = null;
    for (const [alias, target] of Object.entries(map)) {
      if (!alias.endsWith('/*')) continue;
      const prefix = alias.slice(0, -2);
      if (from.startsWith(prefix)) {
        matched = target.replace('/*', from.slice(prefix.length));
        break;
      }
    }
    expect(matched).toBe(to);
  });
});
