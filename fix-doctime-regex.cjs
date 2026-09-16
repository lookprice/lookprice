const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

code = code.replace(/formattedTime = \`\$\{formattedDate\} \$\{timePart\}\`;/g, 'formattedTime = timePart;');
code = code.replace(/formattedTime = \`\$\{formattedDate\} 12:00:00\`;/g, 'formattedTime = "12:00:00";');
code = code.replace(/formattedTime = \`\$\{formattedDate\} \$\{userTime\}\`;/g, 'formattedTime = userTime;');

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Regex replacement for formattedTime applied.");
