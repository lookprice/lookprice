const fs = require('fs');

let content = fs.readFileSync('src/translations.ts', 'utf8');

// We will use a regex to find duplicate keys in the dashboard object.
// Actually, it's easier to just remove the specific lines reported by esbuild.

const linesToRemove = [
  370, 371, 372, 374, 378, 379, 383, 405, 406, 407, 409, 418, 464, 465, 466, 480, 481, 482, 487, 488, 490, 491, 492, 493, 503, 508, 525, 526, 546, 541, 552, 562, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580,
  // Let's just use the esbuild output to find the exact line numbers.
];

// Instead of hardcoding, let's read the esbuild error output if possible, or just parse the file and remove duplicates.
// A simple parser for the object literal:

function removeDuplicates(text) {
  const lines = text.split('\n');
  const seenKeys = new Set();
  const newLines = [];
  
  let inDashboard = false;
  let dashboardDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('dashboard: {')) {
      inDashboard = true;
      dashboardDepth = 1;
      seenKeys.clear();
      newLines.push(line);
      continue;
    }
    
    if (inDashboard) {
      if (line.includes('{')) dashboardDepth++;
      if (line.includes('}')) dashboardDepth--;
      
      if (dashboardDepth === 0) {
        inDashboard = false;
        newLines.push(line);
        continue;
      }
      
      if (dashboardDepth === 1) {
        const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
        if (match) {
          const key = match[1];
          if (seenKeys.has(key)) {
            console.log(`Removing duplicate key: ${key} at line ${i + 1}`);
            // skip this line
            // Wait, what if it's a multi-line value?
            // In translations.ts, most values are single line strings.
            // If it's an object, we need to skip the whole object.
            if (line.includes('{')) {
               let depth = 1;
               let j = i + 1;
               while (depth > 0 && j < lines.length) {
                 if (lines[j].includes('{')) depth++;
                 if (lines[j].includes('}')) depth--;
                 j++;
               }
               i = j - 1;
            }
            continue;
          } else {
            seenKeys.add(key);
          }
        }
      }
    }
    
    newLines.push(line);
  }
  
  return newLines.join('\n');
}

const newContent = removeDuplicates(content);
fs.writeFileSync('src/translations.ts', newContent, 'utf8');
console.log('Done');
