import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'settings',
  title: 'Settings',
  routes: [], // overlay-only (/?app=settings)
  role: 'user',
  testIds: { entryRoot: 'app-settings', panelRoot: 'panel-settings' },
};

export default contract;
