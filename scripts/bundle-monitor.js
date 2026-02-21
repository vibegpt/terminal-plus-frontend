#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Bundle size limits (in bytes)
const LIMITS = {
  'index-*.js': 50 * 1024,       // 50 KB
  'react-vendor-*.js': 200 * 1024, // 200 KB
  'analytics-*.js': 300 * 1024,   // 300 KB
  'animation-*.js': 150 * 1024,   // 150 KB
  'supabase-*.js': 150 * 1024,    // 150 KB
  'total-js': 1024 * 1024,        // 1 MB
  'total-css': 250 * 1024         // 250 KB
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function findFiles(pattern, directory) {
  const files = [];
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  
  function searchDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (regex.test(item) && !item.includes('.map') && !item.includes('.br') && !item.includes('.gz')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }
  
  searchDir(directory);
  return files;
}

function analyzeBundleSizes() {
  console.log(`${colors.bold}${colors.blue}📊 Bundle Size Analysis${colors.reset}\n`);
  
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    console.log(`${colors.red}❌ dist/ directory not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }
  
  let totalJsSize = 0;
  let totalCssSize = 0;
  let allPassed = true;
  
  // Check individual bundle limits
  for (const [pattern, limit] of Object.entries(LIMITS)) {
    if (pattern === 'total-js' || pattern === 'total-css') continue;
    
    const files = findFiles(pattern, distDir);
    let totalSize = 0;
    
    for (const file of files) {
      totalSize += getFileSize(file);
    }
    
    const percentage = (totalSize / limit) * 100;
    const status = totalSize <= limit ? '✅' : '❌';
    const color = totalSize <= limit ? colors.green : colors.red;
    
    if (totalSize > limit) allPassed = false;
    
    console.log(`${status} ${color}${pattern}${colors.reset}`);
    console.log(`   Size: ${formatBytes(totalSize)} / ${formatBytes(limit)} (${percentage.toFixed(1)}%)`);
    console.log(`   Files: ${files.length}`);
    console.log('');
  }
  
  // Calculate total sizes
  const jsFiles = findFiles('*.js', distDir);
  const cssFiles = findFiles('*.css', distDir);
  
  for (const file of jsFiles) {
    totalJsSize += getFileSize(file);
  }
  
  for (const file of cssFiles) {
    totalCssSize += getFileSize(file);
  }
  
  // Check total limits
  const jsPercentage = (totalJsSize / LIMITS['total-js']) * 100;
  const cssPercentage = (totalCssSize / LIMITS['total-css']) * 100;
  
  const jsStatus = totalJsSize <= LIMITS['total-js'] ? '✅' : '❌';
  const cssStatus = totalCssSize <= LIMITS['total-css'] ? '✅' : '❌';
  
  if (totalJsSize > LIMITS['total-js'] || totalCssSize > LIMITS['total-css']) {
    allPassed = false;
  }
  
  console.log(`${jsStatus} ${colors.blue}Total JavaScript${colors.reset}`);
  console.log(`   Size: ${formatBytes(totalJsSize)} / ${formatBytes(LIMITS['total-js'])} (${jsPercentage.toFixed(1)}%)`);
  console.log(`   Files: ${jsFiles.length}`);
  console.log('');
  
  console.log(`${cssStatus} ${colors.blue}Total CSS${colors.reset}`);
  console.log(`   Size: ${formatBytes(totalCssSize)} / ${formatBytes(LIMITS['total-css'])} (${cssPercentage.toFixed(1)}%)`);
  console.log(`   Files: ${cssFiles.length}`);
  console.log('');
  
  // Summary
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}🎉 All bundle size limits passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  Some bundle size limits exceeded!${colors.reset}`);
    process.exit(1);
  }
  
  // Performance recommendations
  console.log(`\n${colors.yellow}${colors.bold}💡 Performance Recommendations:${colors.reset}`);
  
  if (totalJsSize > LIMITS['total-js'] * 0.8) {
    console.log(`${colors.yellow}• Consider further code splitting for JavaScript bundles${colors.reset}`);
  }
  
  if (totalCssSize > LIMITS['total-css'] * 0.8) {
    console.log(`${colors.yellow}• Consider CSS optimization or critical CSS extraction${colors.reset}`);
  }
  
  if (jsFiles.length > 20) {
    console.log(`${colors.yellow}• High number of JS files - consider consolidating chunks${colors.reset}`);
  }
  
  console.log(`${colors.green}• Current bundle is well-optimized!${colors.reset}`);
}

// Run the analysis
analyzeBundleSizes();
