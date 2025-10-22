import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'orders',
  title: 'Orders',
  routes: ['/orders', '/orders/:id'],
  role: 'user',
  testIds: { entryRoot: 'app-orders', panelRoot: 'panel-orders' },
};

export default contract;
