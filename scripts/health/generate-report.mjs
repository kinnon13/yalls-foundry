#!/usr/bin/env node
import { checkRepo } from './check-repo.mjs';
import { checkDb } from './check-db.mjs';
import fs from 'node:fs';

const repo = checkRepo();
const hasDb = !!process.env.DATABASE_URL;
const db = hasDb ? await checkDb() : [{ ok:false, severity:'warning', msg:'DATABASE_URL not set; DB checks skipped' }];

const all = [...repo, ...db];
const critical = all.filter(x=>!x.ok && x.severity==='critical');
const warning = all.filter(x=>!x.ok && x.severity==='warning');

const report = {
  generated_at: new Date().toISOString(),
  summary: {
    total: all.length,
    critical: critical.length,
    warnings: warning.length,
    ok: all.filter(x=>x.ok).length
  },
  items: all
};

fs.writeFileSync('health-report.json', JSON.stringify(report,null,2));
console.log('—— HEALTH REPORT ——————————————————————');
console.log(`OK: ${report.summary.ok}  WARN: ${report.summary.warnings}  CRIT: ${report.summary.critical}`);
for (const i of [...critical, ...warning]) console.log(`${i.severity.toUpperCase()}: ${i.msg}`);

if (critical.length) process.exit(2);
if (warning.length) process.exit(0);
