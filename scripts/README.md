# Rocker Testing Scripts

## Quick Start

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "check:rocker": "tsx scripts/rocker-doctor.ts",
    "check:voice": "echo 'Voice check: Run voice greeting test'",
    "check:upload": "echo 'Upload check: Run media upload test'",
    "check:event": "echo 'Event check: Run event builder test'"
  }
}
```

## Running the Doctor

```bash
# Make sure you have environment variables set
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Run the audit
npm run check:rocker
```

## CI Integration

Add to your `.github/workflows/ci.yml`:

```yaml
- name: Run Rocker Doctor
  run: npm run check:rocker
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

## What Gets Checked

- ✅ All edge functions are deployed and responding
- ✅ All required database tables exist and have RLS enabled
- ✅ Tools and prompts are registered
- ✅ No missing dependencies

## Golden Path Tests

Run with Playwright:

```bash
npm run test:e2e -- tests/e2e/rocker-golden-paths.spec.ts
```
