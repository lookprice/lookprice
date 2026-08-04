const fs = require('fs');

const files = [
  'src/pages/AutoLanding.tsx',
  'src/pages/REstateLanding.tsx',
  'src/pages/ShopLanding.tsx',
  'src/pages/HoReCaLanding.tsx'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log(`\n--- ${f} ---`);
  
  // Try to find FAQ array
  const faqMatch = content.match(/(?:const faqData = \[|const faq = \[)([\s\S]*?)\];/);
  if (faqMatch) {
    const faqContent = faqMatch[1];
    const lines = faqContent.split('\n');
    lines.forEach(line => {
      if (line.includes('q: ') || line.includes('a: ') || line.includes('question: ') || line.includes('answer: ')) {
        if (!line.includes('txt(')) {
          console.log(line.trim());
        }
      }
    });
  } else {
    console.log("FAQ data not found");
  }
});
