/**
 * Role: App contract for Yallbrary - defines isolation boundaries
 * Path: yalls-inc/yallbrary/src/contract.ts
 */

import { AppContract } from '@/apps/types';

export const yallbraryContract: AppContract = {
  id: 'yallbrary',
  title: 'Yallbrary App Store',
  routes: ['/apps', '/apps/:appId', '/pin'],
  role: 'user',
  testIds: {
    entryRoot: 'yallbrary-root',
    panelRoot: 'yallbrary-panel'
  }
};
