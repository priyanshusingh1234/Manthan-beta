const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove framer-motion import
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]framer-motion['"];?\s*/g, '');
  content = content.replace(/import\s+['"]framer-motion['"];?\s*/g, '');

  // 2. Replace AnimatePresence
  content = content.replace(/<AnimatePresence[^>]*>/g, '<>');
  content = content.replace(/<\/AnimatePresence>/g, '</>');

  // 3. Replace motion.div with View
  content = content.replace(/<motion\.div/g, '<View');
  content = content.replace(/<\/motion\.div>/g, '</View>');

  // 4. Replace motion.span with Text
  content = content.replace(/<motion\.span/g, '<Text');
  content = content.replace(/<\/motion\.span>/g, '</Text>');

  // 5. Replace motion.p, motion.h1, etc. with Text
  content = content.replace(/<motion\.[a-z0-9]+/g, '<View');
  content = content.replace(/<\/motion\.[a-z0-9]+>/g, '</View>');

  // 6. Remove Framer Motion specific props: initial={...}, animate={...}, exit={...}, transition={...}, whileHover={...}, whileTap={...}, whileInView={...}, viewport={...}, layout, layoutId={...}
  content = content.replace(/\s(initial|animate|exit|transition|whileHover|whileTap|whileInView|viewport|layoutId|variants|custom)=\{([^}]*({[^}]*})*[^}]*)\}/g, '');
  content = content.replace(/\slayout\s/g, ' ');
  content = content.replace(/\slayout>/g, '>');

  // Some props might be passed as variables, like {...float} or {...floatDelay(1.5)}
  content = content.replace(/\s\{\.\.\.([a-zA-Z0-9_]+(\([^)]*\))?)\}/g, '');

  // Quick HTML tag replacement to View/Text for React Native safety
  // (Since we are touching these files anyway)
  content = content.replace(/<nav/g, '<View');
  content = content.replace(/<\/nav>/g, '</View>');
  content = content.replace(/<section/g, '<View');
  content = content.replace(/<\/section>/g, '</View>');
  content = content.replace(/<main/g, '<View');
  content = content.replace(/<\/main>/g, '</View>');
  content = content.replace(/<header/g, '<View');
  content = content.replace(/<\/header>/g, '</View>');
  content = content.replace(/<footer/g, '<View');
  content = content.replace(/<\/footer>/g, '</View>');
  content = content.replace(/<article/g, '<View');
  content = content.replace(/<\/article>/g, '</View>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
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
console.log('Done!');
