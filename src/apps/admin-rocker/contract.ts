import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'admin-rocker',
  title: 'Admin Rocker',
  routes: ['/admin-rocker'],
  role: 'admin',
  testIds: { entryRoot: 'app-admin-rocker', panelRoot: 'panel-admin-rocker' },
};

export default contract;
