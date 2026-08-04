const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("  return (\n    <DashboardLayout", "  const currentMenuItem: any = navItems.flatMap(c => c.type === 'category' ? c.items : [c]).find(i => i.id === activeTab);\n\n  return (\n    <DashboardLayout");

fs.writeFileSync(f, content);
