const fs = require('fs');

const path = 'src/pages/StoreShowcase.tsx';
let content = fs.readFileSync(path, 'utf8');

// Global design replacements for a cleaner, more minimalist aesthetic (Troyestore concept)
content = content.replace(/rounded-\[3rem\]/g, 'rounded-2xl');
content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-xl');
content = content.replace(/rounded-full/g, 'rounded-lg'); // Use rounded-lg instead of rounded-full for buttons/inputs
content = content.replace(/font-black/g, 'font-semibold');
content = content.replace(/font-display font-semibold/g, 'font-bold');
content = content.replace(/text-6xl/g, 'text-4xl md:text-5xl');
content = content.replace(/text-5xl/g, 'text-4xl');
content = content.replace(/text-[10px]/g, 'text-xs');
// Keep marquee uppercase but make buttons standard cased
content = content.replace(/uppercase tracking-\[0\.2em\]/g, 'tracking-wide');
content = content.replace(/uppercase tracking-widest/g, 'tracking-wide');
content = content.replace(/uppercase tracking-wider/g, 'tracking-normal');

// Modify the top announcement bar to be smaller
content = content.replace(/py-2/g, 'py-1.5');
content = content.replace(/py-4 px-6/g, 'py-2.5 px-4');

// Navbar adjustments
content = content.replace(/py-6/g, 'py-4');
content = content.replace(/h-24 md:h-32/g, 'h-16 md:h-20');

// Fix buttons that might have been broken by rounded-full removal
content = content.replace(/rounded-lg w-14 h-14/g, 'rounded-full w-14 h-14'); // Specific exception for badges/icons
content = content.replace(/rounded-lg w-12 h-12/g, 'rounded-full w-12 h-12');
content = content.replace(/rounded-lg w-3 h-3/g, 'rounded-full w-3 h-3');
content = content.replace(/rounded-lg w-2 h-2/g, 'rounded-full w-2 h-2');
content = content.replace(/rounded-lg w-1\.5 h-1\.5/g, 'rounded-full w-1.5 h-1.5');

// Fix border radius for inputs
content = content.replace(/rounded-3xl/g, 'rounded-lg');

// Categories scroll style
content = content.replace(/px-8 py-4/g, 'px-5 py-2.5');
content = content.replace(/px-6 py-3/g, 'px-4 py-2');
content = content.replace(/shadow-2xl/g, 'shadow-lg');

// Specific layout elements
content = content.replace(/aspect-\[3\/4\]/g, 'aspect-[1/1] object-contain p-4'); // Tech products look better in square container with padding
content = content.replace(/p-12/g, 'p-8');
content = content.replace(/p-10/g, 'p-6');

fs.writeFileSync(path, content, 'utf8');
console.log('Styles updated.');
