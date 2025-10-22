// scripts/ai-health.mjs
const { AI_PROVIDER, AI_API_KEY } = process.env;
if (!AI_PROVIDER || !AI_API_KEY) {
  console.log('ℹ️ AI health: no secrets in CI; skipping.');
  process.exit(0);
}
console.log(`ℹ️ AI health: provider=${AI_PROVIDER} (key present)`);
process.exit(0);
