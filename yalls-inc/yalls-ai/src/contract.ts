/**
 * Role: Yalls AI section contract - tiered oracle system
 * Path: yalls-inc/yalls-ai/src/contract.ts
 */

export const YallsAIContract = {
  id: 'yalls-ai',
  name: 'Yalls AI',
  version: '1.0.0',
  role: 'user', // Default role, escalates to creator/business
  capabilities: {
    user: ['suggest.follow', 'discover.content'],
    creator: ['monetize.ideas', 'audience.insights'],
    business: ['forecast.revenue', 'optimize.inventory'],
  },
  dependencies: ['@/lib/shared'],
  exports: {
    Entry: './app/tiered/page.tsx',
    Panel: './components/AINudge.tsx',
  },
} as const;
