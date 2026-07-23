import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="50%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>
  
  <!-- Rounded Square Canvas -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" />
  <rect x="24" y="24" width="464" height="464" rx="100" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8" />

  <!-- Crown Emblem at Top -->
  <path d="M 186 160 L 226 195 L 256 140 L 286 195 L 326 160 L 312 215 L 200 215 Z" fill="url(#goldGrad)" filter="url(#shadow)" />
  
  <!-- Stylized Monogram E + Rocket Arrow -->
  <g filter="url(#shadow)">
    <!-- Main E Vertical Bar -->
    <rect x="160" y="235" width="48" height="180" rx="12" fill="#ffffff" />
    
    <!-- Top Horizontal Bar -->
    <rect x="160" y="235" width="165" height="42" rx="10" fill="#ffffff" />
    
    <!-- Middle Horizontal Bar (Golden Accent) -->
    <rect x="160" y="304" width="135" height="38" rx="8" fill="url(#goldGrad)" />
    
    <!-- Bottom Horizontal Bar -->
    <rect x="160" y="373" width="175" height="42" rx="10" fill="#ffffff" />

    <!-- Upward Rocket Arrow / Diamond Accent on Right -->
    <path d="M 360 305 L 395 340 L 375 340 L 375 385 L 345 385 L 345 340 L 325 340 Z" fill="url(#goldGrad)" />
  </g>
</svg>`;

async function generateFavicons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('Saved favicon.svg');

  const sizes = [
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'favicon-192x192.png', size: 192 },
    { name: 'favicon-512x512.png', size: 512 },
    { name: 'favicon.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }
  ];

  for (const item of sizes) {
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(item.size, item.size)
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(publicDir, item.name), pngBuffer);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Generate favicon.ico from 48x48 png
  const icoBuffer = await sharp(Buffer.from(svgContent))
    .resize(48, 48)
    .toFormat('png')
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico');

  // Web manifest
  const manifest = {
    name: "EnRakipsiz Portal",
    short_name: "EnRakipsiz",
    description: "KKTC'nin En Büyük Portföy Portalı",
    start_url: "/",
    display: "standalone",
    background_color: "#111827",
    theme_color: "#ea580c",
    icons: [
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('Generated site.webmanifest');
}

generateFavicons().catch(console.error);
