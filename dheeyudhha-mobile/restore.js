const fs = require('fs');
const path = require('path');

const srcApp = path.join(__dirname, '..', 'app');
const destWebApp = path.join(__dirname, 'web-app');

const srcComp = path.join(__dirname, '..', 'components');
const destComp = path.join(__dirname, 'components');

function copyDir(src, dest, renamePage = false) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destName = entry.name;
    
    if (renamePage && entry.name === 'page.tsx') destName = 'index.tsx';
    if (renamePage && entry.name === 'layout.tsx') continue; // Don't overwrite layouts
    if (renamePage && entry.name === 'globals.css') continue;
    
    const destPath = path.join(dest, destName);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, renamePage);
    } else {
      // Overwrite the file to restore it
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Restoring components...');
copyDir(srcComp, destComp, false);

console.log('Restoring web-app...');
copyDir(srcApp, destWebApp, true);

console.log('Restore complete!');
