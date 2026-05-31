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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = [];
DIRS.forEach(dir => getAllFiles(dir, files));

let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Find empty awaits like `await \n }` or `await\n  }`
  content = content.replace(/await\s*\n\s*\}/g, ' \n }');
  content = content.replace(/await\s+catch/g, 'catch');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixed++;
  }
});

console.log('Fixed empty awaits in ' + fixed + ' files.');
