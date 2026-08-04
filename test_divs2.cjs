const fs = require('fs');
const content = fs.readFileSync('src/pages/StoreDashboard/settings/SettingsWebTab.tsx', 'utf8');
let open = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let opens = (line.match(/<div/g) || []).length;
    let closes = (line.match(/<\/div>/g) || []).length;
    open += opens - closes;
    if (open < 0) {
        console.log(`Negative at line ${i+1}: ${line.trim()}`);
        // don't break, see if it recovers
        open = 0; // reset to see how many negative we get
    }
}
