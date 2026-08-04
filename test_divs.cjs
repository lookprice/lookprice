const fs = require('fs');
const content = fs.readFileSync('src/pages/StoreDashboard/settings/SettingsWebTab.tsx', 'utf8');
let open = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let opens = (line.match(/<div/g) || []).length;
    let closes = (line.match(/<\/div>/g) || []).length;
    open += opens - closes;
    if (opens > 0 || closes > 0) {
        // console.log(`Line ${i+1}: open=${open}, opens=${opens}, closes=${closes}`);
    }
}
console.log(`Total open unclosed divs: ${open}`);
