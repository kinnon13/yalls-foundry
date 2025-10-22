import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'overview',
  title: 'Overview',
  routes: ['/dashboard', '/owner'],
  role: 'user',
  testIds: { entryRoot: 'app-overview', panelRoot: 'panel-overview' },
};

export default contract;
