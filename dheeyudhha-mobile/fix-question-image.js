const fs = require('fs');

const p = 'c:\\Users\\priyanshu\\Desktop\\dheeyudhha\\dheeyudhha-mobile\\components\\QuestionCard.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<Image\s+src=\{resolvedSrc\}/g, '<Image source={{ uri: resolvedSrc }}');
c = c.replace(/width=\{44\}\s+height=\{44\}\s+/g, '');

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed QuestionCard image');
