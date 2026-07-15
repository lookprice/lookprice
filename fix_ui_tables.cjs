const fs = require('fs');
let content = fs.readFileSync('src/components/FastPosTab.tsx', 'utf8');

content = content.replace(
    '<p className="text-2xl font-black text-slate-800">{pendingSales.length} / 24</p>',
    '<p className="text-2xl font-black text-slate-800">{pendingSales.length} / {allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)}</p>'
);

content = content.replace(
    '<p className="text-2xl font-black text-slate-800">{24 - pendingSales.length} / 24</p>',
    '<p className="text-2xl font-black text-slate-800">{(allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)) - pendingSales.length} / {allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12)}</p>'
);

fs.writeFileSync('src/components/FastPosTab.tsx', content);
