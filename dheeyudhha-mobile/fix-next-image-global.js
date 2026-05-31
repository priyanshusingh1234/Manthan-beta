const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes("from 'next/image'") || content.includes('from "next/image"')) {
    content = content.replace(/import\s+Image\s+from\s+['"]next\/image['"];?/g, "import { Image } from 'react-native';");
    
    // Replace <Image src={xxx} with <Image source={{ uri: xxx }}
    content = content.replace(/<Image([^>]*?)\s+src=\{([^}]+)\}/g, "<Image$1 source={{ uri: $2 }}");
    
    // Replace <Image src="xxx" with <Image source={{ uri: "xxx" }}
    content = content.replace(/<Image([^>]*?)\s+src=(['"][^'"]+['"])/g, "<Image$1 source={{ uri: $2 }}");
    
    // Remove width={...} and height={...}
    content = content.replace(/<Image([^>]*?)\s+width=\{[^}]+\}/g, "<Image$1");
    content = content.replace(/<Image([^>]*?)\s+height=\{[^}]+\}/g, "<Image$1");
    
    // Also remove priority and unoptimized if present
    content = content.replace(/<Image([^>]*?)\s+priority/g, "<Image$1");
    content = content.replace(/<Image([^>]*?)\s+unoptimized/g, "<Image$1");
    
    // Some tags might have multiple attributes matching width/height, run multiple times
    let prev;
    do {
      prev = content;
      content = content.replace(/<Image([^>]*?)\s+width=\{[^}]+\}/g, "<Image$1");
      content = content.replace(/<Image([^>]*?)\s+height=\{[^}]+\}/g, "<Image$1");
      content = content.replace(/<Image([^>]*?)\s+width=\d+/g, "<Image$1");
      content = content.replace(/<Image([^>]*?)\s+height=\d+/g, "<Image$1");
    } while (content !== prev);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed next/image in:', filePath);
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
console.log('Done fixing next/image!');
