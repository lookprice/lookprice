const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.esm.js'),
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.js')
];

let patchedCount = 0;

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-html2canvas] File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Search for the throw statement
  const targetPattern = 'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");';
  
  if (content.includes(targetPattern)) {
    const replacement = `
                try {
                    if (typeof document !== 'undefined') {
                        var rawArgs = (value.values || []).map(function (v) {
                            return (v && typeof v.value !== 'undefined') ? v.value : ((v && typeof v.number !== 'undefined') ? v.number : '');
                        }).join(' ').replace(/\\s+/g, ' ');
                        var testColor = value.name + '(' + rawArgs + ')';
                        var cvs = document.createElement('canvas');
                        cvs.width = 1;
                        cvs.height = 1;
                        var ctx = cvs.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = 'rgba(0,0,0,0)';
                            ctx.fillStyle = testColor;
                            ctx.fillRect(0, 0, 1, 1);
                            var p = ctx.getImageData(0, 0, 1, 1).data;
                            if (p[3] > 0 || ctx.fillStyle !== 'rgba(0,0,0,0)') {
                                return pack(p[0], p[1], p[2], p[3] / 255);
                            }
                        }
                    }
                } catch (errColor) {}
                return 0; // Safe fallback: transparent instead of throwing fatal exception
    `.trim();

    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-html2canvas] Successfully patched ${path.basename(filePath)}`);
    patchedCount++;
  } else {
    console.log(`[patch-html2canvas] Already patched or pattern not found in ${path.basename(filePath)}`);
  }
}

console.log(`[patch-html2canvas] Completed. Patched ${patchedCount} files.`);
