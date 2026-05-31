const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove next/dynamic
  content = content.replace(/import\s+dynamic\s+from\s+['"]next\/dynamic['"];?\s*/g, '');
  content = content.replace(/const\s+\w+\s*=\s*dynamic\([^)]*\);?/g, ''); // We might need to replace it with normal imports, but let's just strip dynamic wrapper if simple
  // Actually simpler for Next.js dynamic imports is to not strip them blindly if they are assigned.
  // The user previously just stripped dynamic because they were web-only components maybe? Let's just do manual string replaces for next/dynamic if needed.

  // 2. Replace next/link with expo-router
  content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"];?/g, "import { Link } from 'expo-router';");

  // 3. Replace next/image with react-native Image
  content = content.replace(/import\s+NextImage\s+from\s+['"]next\/image['"];?/g, "import { Image as NextImage } from 'react-native';");

  // 4. SAFER Framer Motion Removal
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]framer-motion['"];?\s*/g, '');
  content = content.replace(/import\s+['"]framer-motion['"];?\s*/g, '');

  content = content.replace(/<AnimatePresence[^>]*>/g, '<>');
  content = content.replace(/<\/AnimatePresence>/g, '</>');

  // Strip framer motion props safely using a parser or safer regex?
  // Since we only need to stop the bundler from crashing, we don't EVEN need to strip `initial={{}}`.
  // React Native's `<View>` ignores `initial` and `animate` props! It will just warn "unknown prop".
  // So WE DO NOT NEED TO STRIP THE PROPS! This was the biggest mistake!
  // We ONLY need to replace `<motion.div>` with `<View>`!
  content = content.replace(/<motion\.div/g, '<View');
  content = content.replace(/<\/motion\.div>/g, '</View>');
  
  content = content.replace(/<motion\.span/g, '<Text');
  content = content.replace(/<\/motion\.span>/g, '</Text>');

  content = content.replace(/<motion\.[a-z0-9]+/g, '<View');
  content = content.replace(/<\/motion\.[a-z0-9]+>/g, '</View>');

  // 5. Replace Web HTML tags with React Native tags
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
    console.log('Migrated:', filePath);
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
console.log('Migration complete!');
