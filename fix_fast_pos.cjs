const fs = require('fs');

let f = 'src/components/FastPosTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("setSelectedTable({ id: -999, table_number: t('Garson Masası', 'Waiter Table', 'Τραπέζι Σερβιτόρου'), status: 'empty', isGarsonTable: true });", "setSelectedTable(lang === 'tr' ? 'Garson Masası' : (lang === 'el' ? 'Τραπέζι Σερβιτόρου' : 'Waiter Table'));");

fs.writeFileSync(f, content);
