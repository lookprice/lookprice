const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("const currentMenuItem = menuItems.flatMap", "const currentMenuItem = navItems.flatMap");
content = content.replace("const currentMenuItem = navItems.flatMap(c => c.items || []).find(i => i.id === activeTab);\n\n  const handleLogout = () => {", "");

// put currentMenuItem AFTER navItems is defined
content = content.replace("const sidebarContextValue", "const currentMenuItem = navItems.flatMap(c => c.type === 'category' ? c.items : [c]).find(i => i.id === activeTab);\n\n  const sidebarContextValue");

fs.writeFileSync(f, content);
