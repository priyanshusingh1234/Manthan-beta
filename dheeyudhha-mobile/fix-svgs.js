const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes('<svg') || content.includes('<Svg')) {
    // Check if it already imports Svg
    if (!content.includes("from 'react-native-svg'")) {
      content = "import { Svg, Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';\n" + content;
    }
    
    content = content.replace(/<svg/g, '<Svg');
    content = content.replace(/<\/svg>/g, '</Svg>');
    content = content.replace(/<path/g, '<Path');
    content = content.replace(/<\/path>/g, '</Path>');
    content = content.replace(/<circle/g, '<Circle');
    content = content.replace(/<\/circle>/g, '</Circle>');
    content = content.replace(/<rect/g, '<Rect');
    content = content.replace(/<\/rect>/g, '</Rect>');
    content = content.replace(/<g\s/g, '<G ');
    content = content.replace(/<g>/g, '<G>');
    content = content.replace(/<\/g>/g, '</G>');
    content = content.replace(/<defs/g, '<Defs');
    content = content.replace(/<\/defs>/g, '</Defs>');
    content = content.replace(/<linearGradient/g, '<LinearGradient');
    content = content.replace(/<\/linearGradient>/g, '</LinearGradient>');
    content = content.replace(/<stop/g, '<Stop');
    content = content.replace(/<\/stop>/g, '</Stop>');
    content = content.replace(/<ellipse/g, '<Ellipse');
    content = content.replace(/<\/ellipse>/g, '</Ellipse>');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed SVG in:', filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

traverseDir(__dirname);
console.log('Done fixing SVGs!');
