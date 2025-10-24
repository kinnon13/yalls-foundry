/**
 * Role: App contract for Yallmart - defines isolation boundaries
 * Path: yalls-inc/yallmart/src/contract.ts
 */

import { AppContract } from '@/apps/types';

export const yallmartContract: AppContract = {
  id: 'yallmart',
  title: 'Yall Mart Shopping',
  routes: ['/cart', '/checkout', '/orders', '/orders/:orderId'],
  role: 'user',
  testIds: {
    entryRoot: 'yallmart-root',
    panelRoot: 'yallmart-panel'
  }
};
