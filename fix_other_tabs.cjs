const fs = require('fs');

function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes("const txt =")) {
        content = content.replace("export const ", "export const ");
        content = content.replace(/=> {\n/, "=> {\n  const txt = (tr: string, en: string, el: string) => {\n    if (lang === 'tr') return tr;\n    if (lang === 'el') return el;\n    return en;\n  };\n");
    }
    fs.writeFileSync(file, content);
}

// Just add txt, we'll manually replace if they are important. But the user specifically complained about headers/buttons. The small placeholders might be okay.
