import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'rocker',
  title: 'Rocker',
  routes: ['/rocker'],
  role: 'user',
  testIds: { entryRoot: 'app-rocker', panelRoot: 'panel-rocker' },
};

export default contract;
