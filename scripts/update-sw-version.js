#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

try {
  // Read the service worker file
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Extract current version number
  const versionMatch = swContent.match(/const CACHE_NAME = 'poker-notes-v(\d+)'/);
  
  if (versionMatch) {
    const currentVersion = parseInt(versionMatch[1]);
    const newVersion = currentVersion + 1;
    
    // Replace with new version
    swContent = swContent.replace(
      /const CACHE_NAME = 'poker-notes-v\d+'/,
      `const CACHE_NAME = 'poker-notes-v${newVersion}'`
    );
    
    // Write back to file
    fs.writeFileSync(swPath, swContent);
    
    console.log(`✅ Updated service worker cache version: v${currentVersion} → v${newVersion}`);
    console.log('PWA users will receive an update notification within 30 seconds.');
  } else {
    console.error('❌ Could not find cache version in service worker file');
  }
} catch (error) {
  console.error('❌ Error updating service worker version:', error.message);
}