#!/usr/bin/env node
/**
 * App Scaffold Generator
 * Creates contract.ts, Entry.tsx, Panel.tsx for each app
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const apps = [
  'crm','marketplace','calendar','discover','listings','events','earnings',
  'incentives','farm-ops','activity','analytics','favorites','cart','orders',
  'notifications','profile','entities','mlm','business','producer','settings','overview'
];

function titleCase(id) {
  return id.split(/[-_]/g).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✔ wrote', filePath);
}

for (const id of apps) {
  const Title = titleCase(id);
  const ComponentName = Title.replace(/\s/g, '');
  const dir = path.join(rootDir, 'src', 'apps', id);

  write(
    path.join(dir, 'contract.ts'),
`import type { AppContract } from '@/apps/types';

const contract: AppContract = {
  id: '${id}',
  title: '${Title}',
  routes: [], // fill in real deep links later (e.g., ['/cart'])
  role: 'user',
  testIds: { entryRoot: 'app-${id}', panelRoot: 'panel-${id}' },
};

export default contract;
`
  );

  write(
    path.join(dir, 'Entry.tsx'),
`import type { AppUnitProps } from '@/apps/types';

export default function ${ComponentName}Entry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-${id}" aria-label="${Title}">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>${Title}</h2>
        <small>{contextType}</small>
      </header>
      <div role="region" aria-label="${Title} Content">
        Coming soon
      </div>
    </section>
  );
}
`
  );

  write(
    path.join(dir, 'Panel.tsx'),
`import type { AppUnitProps } from '@/apps/types';

export default function ${ComponentName}Panel({}: AppUnitProps) {
  return (
    <div data-testid="panel-${id}" aria-label="${Title} Panel">
      —
    </div>
  );
}
`
  );
}

console.log('\nScaffold complete for:', apps.join(', '));
console.log(`Generated ${apps.length * 3} files across ${apps.length} apps`);
