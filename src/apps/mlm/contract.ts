import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'mlm',
  title: 'Affiliate Network',
  routes: ['/mlm'], // if you keep a route; overlay is canonical
  role: 'user',
  testIds: { entryRoot: 'app-mlm', panelRoot: 'panel-mlm' },
};

export default contract;
