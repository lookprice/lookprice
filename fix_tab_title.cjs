const fs = require('fs');

let f = 'src/pages/StoreDashboard/index.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("h2 className=\"text-2xl font-black text-slate-900 tracking-tight uppercase\">\n                  {activeTab.replace(/_/g, ' ')}\n                </h2", "h2 className=\"text-2xl font-black text-slate-900 tracking-tight uppercase\">\n                  {currentMenuItem?.label || activeTab.replace(/_/g, ' ')}\n                </h2");
content = content.replace("Control_Center / {activeTab}", "Control_Center / {currentMenuItem?.label || activeTab}");

// We need to define currentMenuItem
content = content.replace("const handleLogout = () => {", "const currentMenuItem = menuItems.flatMap(c => c.items || []).find(i => i.id === activeTab);\n\n  const handleLogout = () => {");

fs.writeFileSync(f, content);
