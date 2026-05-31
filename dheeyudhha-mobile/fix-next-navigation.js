const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes("from 'next/navigation'") || content.includes('from "next/navigation"')) {
    content = content.replace(/from\s+['"]next\/navigation['"]/g, "from '@/lib/next-navigation'");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed next/navigation in:', filePath);
  }
  
  if (content.includes("await import('next/navigation')") || content.includes('await import("next/navigation")')) {
    content = content.replace(/await\s+import\(['"]next\/navigation['"]\)/g, "await import('@/lib/next-navigation')");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed dynamic next/navigation in:', filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.expo' && file !== '.git') {
        traverseDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

traverseDir(__dirname);
console.log('Done fixing next/navigation!');
