#!/usr/bin/env node
/**
 * Validate Rocker Footprint
 * Ensures each of the 10 sections has Rocker integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// The 10 required sections mapped to their primary route files
const SECTION_ROUTES = {
  discovery: ['src/routes/search.tsx', 'src/routes/feed/index.tsx'],
  marketplace: ['src/routes/listings/index.tsx', 'src/routes/cart/index.tsx'],
  profiles: ['src/routes/entities/[id].tsx'],
  equinestats: ['src/routes/equinestats/index.tsx'],
  events: ['src/routes/events/index.tsx'],
  entries: ['src/routes/events/entrant/my-entries.tsx'],
  workspace_home: ['src/routes/dashboard/overview.tsx'],
  producer_events: ['src/routes/events/[id].tsx'],
  programs: ['src/routes/incentives/dashboard.tsx'],
  messaging: ['src/routes/messages/index.tsx'],
};

const errors = [];
const warnings = [];

console.log('🔍 Validating Rocker footprint across 10 sections...\n');

// Check each section
for (const [section, files] of Object.entries(SECTION_ROUTES)) {
  console.log(`Checking ${section}...`);
  
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      warnings.push(`⚠️  ${section}: File not found: ${file}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for useRocker import
    const hasUseRocker = /import.*useRocker.*from/.test(content);
    
    // Check for log call (page_view)
    const hasPageView = /log\s*\(['"]page_view['"]/.test(content) || 
                        /\.log\(['"]page_view['"]/.test(content);
    
    if (!hasUseRocker) {
      errors.push(`❌ ${section} (${file}): Missing useRocker import`);
    }
    
    if (!hasPageView) {
      warnings.push(`⚠️  ${section} (${file}): No page_view log call found`);
    }
    
    if (hasUseRocker && hasPageView) {
      console.log(`  ✅ ${file}`);
    }
  }
}

console.log('\n📊 Summary:');
console.log(`  Sections checked: ${Object.keys(SECTION_ROUTES).length}`);
console.log(`  Errors: ${errors.length}`);
console.log(`  Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(e => console.log(e));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log(w));
}

if (errors.length > 0) {
  console.log('\n❌ Validation failed: Rocker footprint incomplete');
  process.exit(1);
}

console.log('\n✅ Validation passed: All sections have Rocker integration');
process.exit(0);
