const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("return (\n    <div className=\"flex h-screen overflow-hidden bg-slate-50 font-sans\">\n      {/* Sidebar */}", "const currentMenuItem: any = navItems.flatMap(c => c.type === 'category' ? c.items : [c]).find(i => i.id === activeTab);\n\n  return (\n    <div className=\"flex h-screen overflow-hidden bg-slate-50 font-sans\">\n      {/* Sidebar */}");

fs.writeFileSync(f, content);
