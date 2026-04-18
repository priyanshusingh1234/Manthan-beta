const fs = require('fs');
const { execSync } = require('child_process');

try {
  const filesOutput = execSync('git grep -l "custom_avatar_url"').toString().trim();
  if (!filesOutput) {
    console.log("No files with custom_avatar_url found.");
    process.exit(0);
  }
  const files = filesOutput.split('\n');

  for (const file of files) {
    if (!file || file === 'clean_avatar.js') continue;
    let content = fs.readFileSync(file, 'utf8');

    // Replace `custom_avatar_url || `
    content = content.replace(/[\w\.\?]+custom_avatar_url(?: \|\| | \?\? )/g, '');
    
    // Replace remaining `custom_avatar_url` with `avatar_url`
    content = content.replace(/custom_avatar_url/g, 'avatar_url');
    
    // Cleanup duplicates like `meta.avatar_url || meta.avatar_url`
    content = content.replace(/([\w\.\?]+avatar_url) \|\| \1/g, '$1');
    content = content.replace(/([\w\.\?]+avatar_url) \|\| \1/g, '$1'); 
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned ${file}`);
  }
} catch (e) {
  console.error("Error:", e.message);
}
