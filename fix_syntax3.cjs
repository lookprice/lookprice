const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsWebTab.tsx';
let content = fs.readFileSync(f, 'utf8');

// There's a problem at 171 and 453. Let's look at lines around 171 and 453.
