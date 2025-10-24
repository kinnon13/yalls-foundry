/**
 * Role: App contract for Yalls Social - defines isolation boundaries
 * Path: yalls-inc/yalls-social/src/contract.ts
 */

import { AppContract } from '@/apps/types';

export const yallsSocialContract: AppContract = {
  id: 'yalls-social',
  title: 'Yalls Social Feed',
  routes: ['/feed', '/post/:postId', '/profile/:userId'],
  role: 'user',
  testIds: {
    entryRoot: 'yalls-social-root',
    panelRoot: 'yalls-social-panel'
  }
};
