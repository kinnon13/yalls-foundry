import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: 'yallbrary', // Note: Using 'yallbrary' as placeholder - update to 'yalls-social' when added to AppId type
  title: 'Yalls Social',
  routes: ['/feed'],
  role: 'user',
  testIds: { entryRoot: 'app-yalls-social', panelRoot: 'panel-yalls-social' },
};

export default contract;
