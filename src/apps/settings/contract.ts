import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'settings',
  title: 'Settings',
  routes: ['/settings'],
  role: 'user',
  testIds: { entryRoot: 'app-settings', panelRoot: 'panel-settings' },
};

export default contract;
