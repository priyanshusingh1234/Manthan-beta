const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes("from 'lucide-react'") || content.includes('from "lucide-react"')) {
    content = content.replace(/from\s+['"]lucide-react['"];?/g, "from 'lucide-react-native';");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed lucide-react in:', filePath);
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
console.log('Done fixing lucide-react!');
