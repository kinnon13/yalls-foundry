import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'cart',
  title: 'Cart',
  routes: ['/cart'],
  role: 'user',
  testIds: { entryRoot: 'app-cart', panelRoot: 'panel-cart' },
};

export default contract;
