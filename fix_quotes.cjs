const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace(/"\{txt\((.*?)\)\}"/g, "txt($1)");

fs.writeFileSync(f, content);
