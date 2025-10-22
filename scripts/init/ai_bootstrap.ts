/**
 * AI System Bootstrap & Validation
 * Ensures brain manifest is valid and system structure is intact
 */

import { readFileSync, existsSync } from 'fs';
import { z } from 'zod';

const CapabilitySchema = z.object({
  planning: z.boolean(),
  memory: z.boolean(),
  tools: z.array(z.string()),
  admin_access: z.boolean(),
  meta_cognitive: z.boolean().optional(),
  self_modification: z.boolean().optional()
});

const BrainManifestSchema = z.object({
  version: z.string(),
  roles: z.array(z.string()),
  modules: z.array(z.string()),
  workers: z.array(z.string()),
  governance: z.string(),
  structure_lock: z.string(),
  capabilities: z.record(CapabilitySchema),
  shared_modules: z.record(z.array(z.string())),
  database_tables: z.array(z.string()),
  edge_functions: z.array(z.string())
});

export type BrainManifest = z.infer<typeof BrainManifestSchema>;

/**
 * Load and validate brain manifest
 */
export function loadBrainManifest(): BrainManifest {
  const manifestPath = 'src/ai/brain.manifest.json';
  
  if (!existsSync(manifestPath)) {
    throw new Error(`Brain manifest not found at ${manifestPath}`);
  }

  const rawData = readFileSync(manifestPath, 'utf8');
  const data = JSON.parse(rawData);
  
  return BrainManifestSchema.parse(data);
}

/**
 * Verify required folders exist
 */
export function verifyStructure(manifest: BrainManifest): boolean {
  const requiredPaths = [
    'src/ai/shared',
    'src/ai/user',
    'src/ai/admin',
    'src/ai/super',
    'src/ai/super/meta_cortex',
    'src/workers',
    'docs/ai',
    'ops/monitoring'
  ];

  for (const path of requiredPaths) {
    if (!existsSync(path)) {
      console.error(`❌ Missing required folder: ${path}`);
      return false;
    }
  }

  return true;
}

/**
 * Bootstrap AI system
 */
export async function bootstrap() {
  console.log('🧠 Bootstrapping AI system...');
  
  try {
    const manifest = loadBrainManifest();
    console.log(`✅ Brain manifest v${manifest.version} loaded`);
    console.log(`   Roles: ${manifest.roles.join(', ')}`);
    console.log(`   Workers: ${manifest.workers.length}`);
    console.log(`   Database tables: ${manifest.database_tables.length}`);
    
    if (verifyStructure(manifest)) {
      console.log('✅ Folder structure verified');
    } else {
      throw new Error('Structure verification failed');
    }
    
    console.log('🎉 AI system bootstrap complete');
    return manifest;
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    throw error;
  }
}

// Run bootstrap if executed directly
if (import.meta.main) {
  bootstrap();
}
