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

  // The bad injection caused things like: "} , TouchableOpacity } , ScrollView } from 'react-native'"
  // We'll replace "} , " with ", " iteratively until there are no more matches
  while (content.match(/}\s*,\s*([A-Za-z]+)\s*}/)) {
    content = content.replace(/}\s*,\s*([A-Za-z]+)\s*}/g, ", $1 }");
  }
  
  // Also clean up any double commas just in case
  content = content.replace(/,\s*,/g, ",");
  content = content.replace(/{\s*,/g, "{");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixed++;
  }
});

console.log('Fixed broken react-native imports in ' + fixed + ' files.');
