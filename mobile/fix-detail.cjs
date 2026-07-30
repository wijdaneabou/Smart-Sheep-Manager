const fs = require('fs');
const p = 'mobile/src/app/(dashboard)/herd/[id]/detail.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('pathname: "/herd/[id]/history"', 'pathname: "/herd/[id]/history" as any');
fs.writeFileSync(p, c);
console.log('Done');
