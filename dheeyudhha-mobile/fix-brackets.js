const fs = require('fs');
const path = require('path');

let found = false;
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Let's replace instances of `}\n` or `} ` that are hanging inside a tag.
  // A good heuristic: `}\n\s+className=` -> `\n      className=`
  content = content.replace(/\}\s+(className=)/g, ' $1');
  content = content.replace(/\}\s+(style=)/g, ' $1');
  content = content.replace(/\}\s+(onPress=)/g, ' $1');
  content = content.replace(/\}\s+(key=)/g, ' $1');
  content = content.replace(/\}\s+(>)/g, '$1');
  
  // repeatedly remove floating `}`
  let prev;
  do {
    prev = content;
    content = content.replace(/\}\s+\}/g, '}');
  } while (content !== prev);
  
  // After merging floating `}`, we might still have `}\n className=`.
  content = content.replace(/\}\s+(className=)/g, ' $1');
  content = content.replace(/\}\s+(style=)/g, ' $1');
  content = content.replace(/\}\s+(onPress=)/g, ' $1');
  content = content.replace(/\}\s+(key=)/g, ' $1');
  content = content.replace(/\}\s+(>)/g, '$1');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed floating brackets in:', filePath);
    found = true;
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
if (!found) console.log('No floating brackets found.');
