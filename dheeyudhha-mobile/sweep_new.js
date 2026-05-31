const fs = require('fs');
const path = require('path');

const DIRS = ['web-app', 'components'];

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = [];
DIRS.forEach(dir => getAllFiles(dir, files));

let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  let needsRNImports = false;
  let needsLucide = false;

  const domReplacements = [
    { regex: /<div/g, replace: '<View' },
    { regex: /<\/div>/g, replace: '</View>' },
    { regex: /<span/g, replace: '<Text' },
    { regex: /<\/span>/g, replace: '</Text>' },
    { regex: /<p(?=[\s>])/g, replace: '<Text' },
    { regex: /<\/p>/g, replace: '</Text>' },
    { regex: /<h[1-6](?=[\s>])/g, replace: '<Text' },
    { regex: /<\/h[1-6]>/g, replace: '</Text>' },
    { regex: /<button/g, replace: '<TouchableOpacity' },
    { regex: /<\/button>/g, replace: '</TouchableOpacity>' },
    { regex: /<input/g, replace: '<TextInput' },
    { regex: /<img/g, replace: '<Image' },
  ];

  domReplacements.forEach(({ regex, replace }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replace);
      needsRNImports = true;
    }
  });

  if (/<svg[\s\S]*?<\/svg>/g.test(content)) {
    content = content.replace(/<svg[\s\S]*?<\/svg>/g, '<Check className="w-5 h-5 text-gray-500" />');
    needsLucide = true;
  }

  content = content.replace(/onClick=/g, 'onPress=');
  content = content.replace(/onSubmit=/g, 'onPress=');
  content = content.replace(/htmlFor=/g, 'id=');
  content = content.replace(/className="([^"]*\bflex\b[^"]*)"/g, (match, classes) => {
    if (!classes.includes('flex-col') && !classes.includes('flex-row')) {
      return `className="${classes} flex-row"`; 
    }
    return match;
  });

  if (needsRNImports && !content.includes("from 'react-native'")) {
    content = `import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';\n` + content;
  } else if (needsRNImports) {
    ['View', 'Text', 'TouchableOpacity', 'TextInput', 'Image', 'ScrollView'].forEach(comp => {
      if (!content.includes(comp) && content.includes(`from 'react-native'`)) {
        content = content.replace(/from 'react-native'/, `, ${comp} } from 'react-native'`);
        content = content.replace(/import { , /, "import { ");
      }
    });
  }

  if (needsLucide && !content.includes('Check') && !content.includes('lucide-react-native')) {
    content = `import { Check } from 'lucide-react-native';\n` + content;
  } else if (needsLucide && !content.includes('Check')) {
    if (content.includes("from 'lucide-react-native'")) {
      content = content.replace(/import { /, "import { Check, ");
    } else {
      content = `import { Check } from 'lucide-react-native';\n` + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
});

console.log(`Swept and converted ${filesModified} files.`);
