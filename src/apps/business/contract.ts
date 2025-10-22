import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'business',
  title: 'Business',
  routes: ['/business', '/business/:id'],
  role: 'user',
  testIds: { entryRoot: 'app-business', panelRoot: 'panel-business' },
};

export default contract;
