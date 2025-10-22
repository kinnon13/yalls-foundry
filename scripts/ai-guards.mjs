// scripts/ai-guards.mjs
// Fail CI if the AI "brain" pieces are missing or unhooked.

import fs from 'node:fs';

function must(file, rx) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing file: ${file}`);
    process.exit(1);
  }
  const s = fs.readFileSync(file, 'utf8');
  if (!rx.test(s)) {
    console.error(`❌ Pattern not found in ${file}: ${rx}`);
    process.exit(1);
  }
  console.log(`✅ ${file} OK`);
}

// 1) Core chat entrypoint must export chat(...)
must('src/lib/ai/index.ts', /export\s+async\s+function\s+chat\s*\(/);

// 2) RAG hooks must exist (embed / upsertDocs / searchRag)
must('src/lib/ai/rag.ts', /(export\s+async\s+function\s+embed\s*\()|(export\s+async\s+function\s+upsertDocs\s*\()|(export\s+async\s+function\s+searchRag\s*\()/);

// 3) Action broker so AI can "do" things
must('src/lib/ai/actions.ts', /export\s+async\s+function\s+invokeAction\s*\(/);

// 4) Optional hint: pgvector/embedding migrations (warn only)
try {
  const ents = fs.readdirSync('supabase/migrations', { withFileTypes: true });
  const hasVector = ents
    .filter(d => d.isFile())
    .some(f => {
      const p = `supabase/migrations/${f.name}`;
      const txt = fs.readFileSync(p, 'utf8');
      return /create\s+extension\s+if\s+not\s+exists\s+vector/i.test(txt) ||
             /embedding|pgvector/i.test(txt);
    });
  if (!hasVector) console.log('🟡 Tip: no pgvector/embedding migration found. Not failing.');
} catch {
  console.log('ℹ️ No supabase/migrations folder; skipping pgvector hint.');
}

console.log('✅ AI guards passed');
