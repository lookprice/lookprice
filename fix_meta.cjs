const fs = require('fs');

let f = 'src/pages/StoreDashboard/MetaIntegrationTab.tsx';
let content = fs.readFileSync(f, 'utf8');

content = content.replace("const MetaIntegration = ({ storeId }: { storeId: number }) => {", "const MetaIntegration = ({ storeId }: { storeId: number }) => {\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");

fs.writeFileSync(f, content);
