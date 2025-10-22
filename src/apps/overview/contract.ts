import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'overview',
  title: 'Owner HQ',
  routes: ['/dashboard', '/owner'],
  role: 'admin',
  testIds: { entryRoot: 'app-overview', panelRoot: 'panel-overview' },
};

export default contract;
