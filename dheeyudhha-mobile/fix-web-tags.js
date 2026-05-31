const fs = require('fs');
const path = require('path');

const webTags = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
  'main', 'section', 'article', 'header', 'footer', 'nav', 'aside',
  'ul', 'ol', 'li', 'button', 'form', 'label', 'strong', 'em', 'b', 'i'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add import if View or Text used but not imported
  const needsImport = /<(?:View|Text|ScrollView|TouchableOpacity|TextInput)[\s>]/g.test(content);
  if (needsImport && !content.includes("from 'react-native'") && !content.includes('from "react-native"')) {
    content = "import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';\n" + content;
  } else if (needsImport) {
    // If react-native import exists, ensure View and Text are in it. 
    // This is hard to regex perfectly, so we just append a new import that might be duplicate, but TS allows duplicate imports.
    // Actually, Babel allows it too.
    content = "import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';\n" + content;
  }

  // Replace web tags
  webTags.forEach(tag => {
    // Opening tags
    const openRegex = new RegExp(`<${tag}(\\s+|>)`, 'g');
    const closeRegex = new RegExp(`</${tag}\\s*>`, 'g');
    
    // We replace text-level tags with Text, block-level with View
    const rnTag = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'label'].includes(tag) ? 'Text' : 'View';
    
    content = content.replace(openRegex, `<${rnTag}$1`);
    content = content.replace(closeRegex, `</${rnTag}>`);
  });

  // Fix the specific mismatched </main > left from previous migration
  content = content.replace(/<\/main\s*>/g, '</View>');
  content = content.replace(/<\/section\s*>/g, '</View>');
  content = content.replace(/<\/nav\s*>/g, '</View>');
  content = content.replace(/<\/header\s*>/g, '</View>');
  content = content.replace(/<\/footer\s*>/g, '</View>');
  content = content.replace(/<\/article\s*>/g, '</View>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Replaced web tags in:', filePath);
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
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

traverseDir(__dirname);

// Update tsconfig.json to allowJs
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
let tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
tsconfig.compilerOptions.allowJs = true;
if (!tsconfig.include.includes('**/*.jsx')) {
  tsconfig.include.push('**/*.jsx');
}
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
console.log('Updated tsconfig.json to support .jsx files (like the ticks folder)');
