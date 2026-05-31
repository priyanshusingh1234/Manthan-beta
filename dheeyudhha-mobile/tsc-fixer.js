const fs = require('fs');
const { execSync } = require('child_process');

console.log('Running tsc...');
let tscOutput = '';
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('No errors!');
  process.exit(0);
} catch (e) {
  tscOutput = e.stdout.toString();
}

console.log('Parsing errors...');
const errors = [];
const regex = /([a-zA-Z0-9_\-\.\/]+)\((\d+),(\d+)\): error (TS\d+):/g;
let match;
while ((match = regex.exec(tscOutput)) !== null) {
  const file = match[1];
  const line = parseInt(match[2], 10) - 1;
  const col = parseInt(match[3], 10) - 1;
  const code = match[4];
  
  if (code === 'TS1005' || code === 'TS1382' || code === 'TS1381' || code === 'TS17015' || code === 'TS1109' || code === 'TS1003') {
    errors.push({ file, line, col, code });
  }
}

// Group by file
const byFile = {};
for (const err of errors) {
  if (!byFile[err.file]) byFile[err.file] = [];
  byFile[err.file].push(err);
}

for (const file in byFile) {
  try {
    let lines = fs.readFileSync(file, 'utf8').split('\n');
    const fileErrs = byFile[file];
    
    // Sort descending by line, then col
    fileErrs.sort((a, b) => b.line !== a.line ? b.line - a.line : b.col - a.col);
    
    // To prevent duplicate insertions at the same spot
    let lastLine = -1;
    let lastCol = -1;

    for (const err of fileErrs) {
      if (err.line === lastLine && Math.abs(err.col - lastCol) <= 1) continue;
      
      const l = lines[err.line];
      if (l !== undefined) {
        // Insert '}'
        lines[err.line] = l.substring(0, err.col) + '}' + l.substring(err.col);
        lastLine = err.line;
        lastCol = err.col;
      }
    }
    
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Fixed', file, 'with', fileErrs.length, 'insertions');
  } catch (e) {
    console.error('Failed to read/write', file);
  }
}

console.log('Done!');
