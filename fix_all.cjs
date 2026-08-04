const fs = require('fs');

function defineT(file) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("const { lang } = useLanguage();")) {
        // Already has lang, just define t
    } else {
        content = content.replace("const { t } = useLanguage();", "const { lang } = useLanguage();\n  const t = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");
    }
    fs.writeFileSync(file, content);
}

defineT('src/components/TableGrid.tsx');
defineT('src/pages/StoreDashboard/settings/SettingsIntegrationsTab.tsx');

let meta = fs.readFileSync('src/pages/StoreDashboard/MetaIntegrationTab.tsx', 'utf8');
meta = meta.replace("const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };", "");
meta = meta.replace("const { lang } = useLanguage();", "const { lang } = useLanguage();\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };");
fs.writeFileSync('src/pages/StoreDashboard/MetaIntegrationTab.tsx', meta);


let index = fs.readFileSync('src/pages/StoreDashboard/index.tsx', 'utf8');
index = index.replace("const currentMenuItem = navItems", "const currentMenuItem: any = navItems");
fs.writeFileSync('src/pages/StoreDashboard/index.tsx', index);
