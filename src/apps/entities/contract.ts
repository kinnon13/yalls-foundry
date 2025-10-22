import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'entities',
  title: 'Entities',
  routes: ['/entities', '/entities/:id'],
  role: 'user',
  testIds: { entryRoot: 'app-entities', panelRoot: 'panel-entities' },
};

export default contract;
