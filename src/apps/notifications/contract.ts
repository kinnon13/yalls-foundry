import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'notifications',
  title: 'Notifications',
  routes: ['/notifications'], // if you keep a direct route; overlay is preferred
  role: 'user',
  testIds: { entryRoot: 'app-notifications', panelRoot: 'panel-notifications' },
};

export default contract;
