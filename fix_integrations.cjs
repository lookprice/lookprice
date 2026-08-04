const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsIntegrationsTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("import { Database, Download, ExternalLink } from 'lucide-react';", "import { Database, Download, ExternalLink } from 'lucide-react';\nimport { useLanguage } from '../../../contexts/LanguageContext';");
content = content.replace("export const SettingsIntegrationsTab = ({ storeId }: { storeId: number }) => {", "export const SettingsIntegrationsTab = ({ storeId }: { storeId: number }) => {\n  const { t } = useLanguage();");

// Replacements
content = content.replace(/Google Drive Yedekleme Sistemi/g, "{t('Google Drive Yedekleme Sistemi', 'Google Drive Backup System', 'Σύστημα Δημιουργίας Αντιγράφων Google Drive')}");
content = content.replace(/Bulut sürücünüzü bağlayıp verilerinizi otomatik\/manuel yedekleyin./g, "{t('Bulut sürücünüzü bağlayıp verilerinizi otomatik/manuel yedekleyin.', 'Connect your cloud drive to backup data automatically/manually.', 'Συνδέστε το cloud drive σας για αυτόματη/χειροκίνητη δημιουργία αντιγράφων.')}");
content = content.replace(/Drive Bağlı/g, "{t('Drive Bağlı', 'Drive Connected', 'Συνδέθηκε')}");
content = content.replace(/Bağlı Değil/g, "{t('Bağlı Değil', 'Not Connected', 'Μη Συνδεδεμένο')}");
content = content.replace(/Ürünler<br\/>\(Excel\)/g, "{t('Ürünler', 'Products', 'Προϊόντα')}<br/>(Excel)");
content = content.replace(/Ürünler<br\/>\(PDF\)/g, "{t('Ürünler', 'Products', 'Προϊόντα')}<br/>(PDF)");
content = content.replace(/Emlak Portföy<br\/>\(Excel\)/g, "{t('Emlak Portföy', 'Real Estate', 'Ακίνητα')}<br/>(Excel)");
content = content.replace(/Emlak Portföy<br\/>\(PDF\)/g, "{t('Emlak Portföy', 'Real Estate', 'Ακίνητα')}<br/>(PDF)");
content = content.replace(/Bağlantıyı Kes/g, "{t('Bağlantıyı Kes', 'Disconnect', 'Αποσύνδεση')}");
content = content.replace(/Google Drive Hesabı Bağla/g, "{t('Google Drive Hesabı Bağla', 'Connect Google Drive', 'Σύνδεση Google Drive')}");

fs.writeFileSync(f, content);
