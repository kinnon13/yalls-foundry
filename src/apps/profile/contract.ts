import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'profile',
  title: 'Profile',
  routes: ['/profile/:id'],
  role: 'user',
  testIds: { entryRoot: 'app-profile', panelRoot: 'panel-profile' },
};

export default contract;
