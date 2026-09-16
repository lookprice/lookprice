const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

// Replace formattedTime logic to be time-only (HH:mm:ss) instead of YYYY-MM-DD HH:mm:ss
const oldBlock = `    let formattedTime = "12:00:00";
    try {
      // Create a date string in YYYY-MM-DD HH:mm:ss format which MySoft often expects for docTime
      const now = new Date(docDate.getTime() + (3 * 60 * 60 * 1000));
      const timePart = now.toISOString().split('T')[1].substring(0, 8);
      formattedTime = \`\${formattedDate} \${timePart}\`;
    } catch (e) {
      console.warn("Could not format time from docDate, using default");
      formattedTime = \`\${formattedDate} 12:00:00\`;
    }

    if (invoice.invoice_time) {
        // user provided time, ensure it's in HH:mm:ss format and combine with date
        let userTime = "12:00:00";
        if (invoice.invoice_time.length === 5) {
            userTime = invoice.invoice_time + ":00";
        } else if (invoice.invoice_time.length >= 8) {
            userTime = invoice.invoice_time.substring(0, 8);
        }
        formattedTime = \`\${formattedDate} \${userTime}\`;
    }`;

const newBlock = `    let formattedTime = "12:00:00";
    try {
      const now = new Date(docDate.getTime() + (3 * 60 * 60 * 1000));
      formattedTime = now.toISOString().split('T')[1].substring(0, 8);
    } catch (e) {
      console.warn("Could not format time from docDate, using default");
      formattedTime = "12:00:00";
    }

    if (invoice.invoice_time) {
        let userTime = "12:00:00";
        if (invoice.invoice_time.length === 5) {
            userTime = invoice.invoice_time + ":00";
        } else if (invoice.invoice_time.length >= 8) {
            userTime = invoice.invoice_time.substring(0, 8);
        }
        formattedTime = userTime;
    }`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('routes/einvoice.ts', code);
  console.log("Successfully updated formattedTime to time-only!");
} else {
  console.log("Could not find exact oldBlock, trying alternative replacement...");
}
