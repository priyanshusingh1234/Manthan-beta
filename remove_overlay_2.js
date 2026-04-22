const fs = require('fs');
let file = fs.readFileSync('app/chat/[roomId]/page.tsx', 'utf8');

file = file.replace(/\/\/ ─── Agora Call Overlay ───────────────────────────────────────────────────[\s\S]*?\/\/ ─── Header ───────────────────────────────────────────────────────────/m, '// ─── Header ───────────────────────────────────────────────────────────');

fs.writeFileSync('app/chat/[roomId]/page.tsx', file);
console.log('overlay fully removed');
