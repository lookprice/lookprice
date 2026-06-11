const fs = require('fs');
const file = 'src/pages/StoreDashboard/SettingsTab.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  // Line numbers are 1-indexed, i is 0-indexed
  const lineNum = i + 1;
  const oldLength = lines.length;
  if (lineNum >= 631 && lineNum <= 1303) {
    // skip
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('Removed lines 631-1303');
