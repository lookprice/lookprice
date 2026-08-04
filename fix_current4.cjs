const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("  const currentMenuItem: any = navItems.flatMap(c => c.type === 'category' ? c.items : [c]).find(i => i.id === activeTab);", "  const currentMenuItem: any = (navItems as any[]).flatMap(c => c.type === 'category' ? c.items : [c]).find(i => i && i.id === activeTab);");

fs.writeFileSync(f, content);
