const fs = require('fs');

let f = 'src/components/TableGrid.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("import { api } from '../services/api';", "import { api } from '../services/api';\nimport { useLanguage } from '../contexts/LanguageContext';");
content = content.replace("export const TableGrid = ({ storeId, onTableSelect, refreshTrigger, pendingSales = [] }: TableGridProps) => {", "export const TableGrid = ({ storeId, onTableSelect, refreshTrigger, pendingSales = [] }: TableGridProps) => {\n  const { t } = useLanguage();");

content = content.replace("Masalar yükleniyor...", "{t('Masalar yükleniyor...', 'Loading tables...', 'Φόρτωση τραπεζιών...')}");
content = content.replace("table_number: 'Garson Masası'", "table_number: t('Garson Masası', 'Waiter Table', 'Τραπέζι Σερβιτόρου')");
content = content.replace("{table.orderCount} Sipariş ({table.totalAmount?.toFixed(2)} ₺)", "{table.orderCount} {t('Sipariş', 'Orders', 'Παραγγελίες')} ({table.totalAmount?.toFixed(2)} ₺)");
content = content.replace("Adisyonu İncele", "{t('Adisyonu İncele', 'View Bill', 'Προβολή Λογαριασμού')}");
content = content.replace("Ayakta / Masa Seçilmemiş", "{t('Ayakta / Masa Seçilmemiş', 'Walk-up / No Table', 'Όρθιοι / Χωρίς Τραπέζι')}");
content = content.replace("Adisyon Aç", "{t('Adisyon Aç', 'Open Bill', 'Άνοιγμα Λογαριασμού')}");
content = content.replace(">Dolu / İncele<", ">{t('Dolu / İncele', 'Occupied / View', 'Κατειλημμένο / Προβολή')}<");

fs.writeFileSync(f, content);
