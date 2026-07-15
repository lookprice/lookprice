const fs = require('fs');
let content = fs.readFileSync('routes/public.ts', 'utf8');

// Find the export default router
content = content.replace("export default router;", "");
content += "\nexport default router;\n";
fs.writeFileSync('routes/public.ts', content);
