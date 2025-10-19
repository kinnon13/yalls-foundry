/**
 * Rocker AI Kernels
 * Self-learning systems that observe, decide, and act
 */

import { runAdPredictor } from './ad-predictor';
import { runAffiliateRouter } from './affiliate-router';
import { runClaimHunter } from './claim-hunter';
import { runCartNudge } from './cart-nudge';
import { runEventConflictDetector } from './event-conflict-detector';

export { generateNextBestActions } from './nba-generator';
export type { NextBestAction } from './nba-generator';

export const kernels = [
  runAdPredictor,
  runAffiliateRouter,
  runClaimHunter,
  runCartNudge,
  runEventConflictDetector
];

export async function runKernels(ctx: any) {
  for (const kernel of kernels) {
    try {
      await kernel(ctx);
    } catch (e) {
      console.error('[Kernel Error]', kernel.name, e);
    }
  }
}

export {
  runAdPredictor,
  runAffiliateRouter,
  runClaimHunter,
  runCartNudge,
  runEventConflictDetector
};
