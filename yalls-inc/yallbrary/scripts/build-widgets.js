/**
 * Role: Build script to bundle and deploy widgets to rocker dashboard
 * Path: yalls-inc/yallbrary/scripts/build-widgets.js
 * Usage: node yalls-inc/yallbrary/scripts/build-widgets.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const WIDGETS_DIR = 'yalls-inc/yallbrary/src/components';
const BUILD_DIR = 'dist/widgets';

console.log('🏗️  Building Yallbrary widgets...');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Stub: Future - bundle with Vite/Rollup for module federation
console.log(`📦 Bundling components from ${WIDGETS_DIR}`);

try {
  // For now, just copy source files (replace with real bundler)
  execSync(`cp -r ${WIDGETS_DIR}/* ${BUILD_DIR}/`, { stdio: 'inherit' });
  
  console.log(`✅ Widgets built successfully in ${BUILD_DIR}`);
  console.log('📝 Next: Deploy to rocker with ops/deploy.sh');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
