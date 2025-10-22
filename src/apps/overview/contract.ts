import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'overview',
  title: 'Owner HQ',
  routes: [], // overlay-only (/?app=overview)
  role: 'user', // promote to admin/super later if needed
  testIds: { entryRoot: 'app-overview', panelRoot: 'panel-overview' },
};

export default contract;
