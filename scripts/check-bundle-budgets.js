#!/usr/bin/env node
/**
 * Task 15: Bundle Budget Checker
 * Fails CI if route bundles exceed budget
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const budgets = require('../bundle-budgets.json');

function getGzipSize(file) {
  const content = fs.readFileSync(file);
  const gzipped = zlib.gzipSync(content);
  return gzipped.length;
}

function checkBudgets() {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist/ directory not found. Run build first.');
    process.exit(1);
  }
  
  let failed = false;
  
  console.log('\n📦 Checking bundle budgets...\n');
  
  // Get all JS files in dist
  const jsFiles = [];
  function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    });
  }
  walk(distPath);
  
  // Check each file
  jsFiles.forEach(file => {
    const size = getGzipSize(file);
    const sizeKb = Math.round(size / 1024);
    const relativePath = path.relative(distPath, file);
    
    // Find matching budget
    const budget = budgets.budgets.find(b => 
      relativePath.includes(b.route.replace('/', ''))
    );
    
    if (budget && sizeKb > budget.gzip) {
      console.error(`❌ ${relativePath}: ${sizeKb}KB (budget: ${budget.gzip}KB) +${sizeKb - budget.gzip}KB`);
      failed = true;
    } else if (budget) {
      console.log(`✅ ${relativePath}: ${sizeKb}KB (budget: ${budget.gzip}KB)`);
    } else {
      console.log(`ℹ️  ${relativePath}: ${sizeKb}KB (no budget)`);
    }
  });
  
  if (failed) {
    console.error('\n❌ Bundle budget exceeded! Optimize before merging.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All bundles within budget.\n');
  }
}

checkBudgets();
