const fs = require('fs');

let f = 'src/pages/StoreDashboard/settings/SettingsIntegrationsTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("export const SettingsIntegrationsTab = ({ lang }: SettingsIntegrationsTabProps) => {", "export const SettingsIntegrationsTab = ({ lang }: SettingsIntegrationsTabProps) => {\n  const t = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");

fs.writeFileSync(f, content);
