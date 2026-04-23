const fs = require('fs');
let file = fs.readFileSync('app/chat/[roomId]/page.tsx', 'utf8');

// Find the index of "// ─── Agora Call Overlay"
const overlayStart = file.indexOf('// ─── Agora Call Overlay');
if (overlayStart !== -1) {
  // Find the index of "// ─── Header ──"
  const headerStart = file.indexOf('// ─── Header', overlayStart);
  if (headerStart !== -1) {
    // Find the immediately preceding 'return (' before the header
    const returnIdx = file.lastIndexOf('return (', headerStart);
    if (returnIdx !== -1 && returnIdx > overlayStart) {
       file = file.substring(0, overlayStart) + file.substring(returnIdx);
       fs.writeFileSync('app/chat/[roomId]/page.tsx', file);
       console.log('Fixed overlay usage perfectly');
    }
  }
}
