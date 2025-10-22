import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'producer',
  title: 'Producer',
  routes: ['/producer', '/producer/:id'],
  role: 'user',
  testIds: { entryRoot: 'app-producer', panelRoot: 'panel-producer' },
};

export default contract;
