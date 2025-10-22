import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'overview',
  title: 'Owner HQ',
  routes: [], // overlay-only (/?app=overview)
  role: 'admin',
  testIds: { entryRoot: 'app-overview', panelRoot: 'panel-overview' },
};

export default contract;
