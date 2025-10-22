import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'yallbrary',
  title: 'Yallbrary',
  routes: ['/listings'], // browse catalog; adjust if you move routes
  role: 'user',
  testIds: { entryRoot: 'app-yallbrary', panelRoot: 'panel-yallbrary' },
};

export default contract;
