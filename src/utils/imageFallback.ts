/**
 * imageFallback.ts
 * Generates an elegant, high-contrast book cover placeholder SVG when a book cover image fails to load or 404s.
 */

export function getProductFallbackSvg(title: string, category?: string): string {
  const cleanTitle = (title || "Ürün").replace(/[<>&"']/g, "").slice(0, 32);
  const cleanCategory = (category || "Genel Ürün").replace(/[<>&"']/g, "").slice(0, 24);

  let hash = 0;
  for (let i = 0; i < cleanTitle.length; i++) {
    hash = cleanTitle.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [
    { bg: "#f8fafc", stroke: "#cbd5e1", text: "#475569", badge: "#e2e8f0" },
    { bg: "#f1f5f9", stroke: "#94a3b8", text: "#334155", badge: "#cbd5e1" },
    { bg: "#fafaf9", stroke: "#d6d3d1", text: "#44403c", badge: "#e7e5e4" }
  ];
  const palette = hues[Math.abs(hash) % hues.length];

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" width="100%" height="100%">
  <rect width="300" height="360" rx="16" fill="${palette.bg}"/>
  <rect x="12" y="12" width="276" height="336" rx="12" fill="none" stroke="${palette.stroke}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6"/>
  
  <!-- Product Package Box Icon -->
  <g transform="translate(118, 100)" stroke="${palette.text}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v18.42a1.78 1.78 0 0 0 .95 1.55l8.5 4.9a1.78 1.78 0 0 0 1.8 0l8.5-4.9a1.78 1.78 0 0 0 .95-1.55V5.79a1.78 1.78 0 0 0-2.5-1.55L16.5 9.4Z" />
    <polyline points="3.29 7 16.5 14.5 29.71 7" />
    <line x1="16.5" y1="14.5" x2="16.5" y2="30.5" />
  </g>
  
  <text x="150" y="210" fill="${palette.text}" font-size="14" font-weight="700" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">
    ${cleanTitle.length > 22 ? cleanTitle.slice(0, 20) + '...' : cleanTitle}
  </text>
  
  <rect x="90" y="235" width="120" height="24" rx="12" fill="${palette.badge}"/>
  <text x="150" y="251" fill="${palette.text}" font-size="10" font-weight="600" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">
    ${cleanCategory}
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getBookCoverFallbackSvg(title: string, author?: string): string {
  const cleanTitle = (title || "Kitap").replace(/[<>&"']/g, "").slice(0, 32);
  const cleanAuthor = (author || "Seçkin Yazar").replace(/[<>&"']/g, "").slice(0, 24);

  // Derive stable hue from title
  let hash = 0;
  for (let i = 0; i < cleanTitle.length; i++) {
    hash = cleanTitle.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [
    { bg1: "#1e1b4b", bg2: "#312e81", accent: "#818cf8" }, // Indigo
    { bg1: "#141e28", bg2: "#1e293b", accent: "#38bdf8" }, // Slate Sky
    { bg1: "#450a0a", bg2: "#7f1d1d", accent: "#f87171" }, // Crimson
    { bg1: "#064e3b", bg2: "#065f46", accent: "#34d399" }, // Emerald
    { bg1: "#2e1065", bg2: "#581c87", accent: "#c084fc" }, // Purple
    { bg1: "#451a03", bg2: "#78350f", accent: "#fbbf24" }, // Amber
  ];
  const palette = hues[Math.abs(hash) % hues.length];

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg1}"/>
      <stop offset="100%" stop-color="${palette.bg2}"/>
    </linearGradient>
    <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.4)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.2)"/>
    </linearGradient>
  </defs>
  
  <!-- Book Cover Background -->
  <rect width="300" height="450" rx="6" fill="url(#grad_${Math.abs(hash)})"/>
  
  <!-- Spine Shadow Left -->
  <rect x="0" y="0" width="22" height="450" rx="3" fill="url(#spine)"/>
  
  <!-- Border Ribbon Frame -->
  <rect x="26" y="24" width="248" height="402" rx="4" fill="none" stroke="${palette.accent}" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.4"/>
  
  <!-- Book Icon Badge -->
  <g transform="translate(130, 80)">
    <circle cx="20" cy="20" r="28" fill="${palette.bg1}" stroke="${palette.accent}" stroke-width="2"/>
    <path d="M12 14v14c2-1 5-1 8 0V14c-3-1-6-1-8 0zm16 0v14c-3-1-6-1-8 0V14c2-1 5-1 8 0z" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <!-- Title -->
  <text x="150" y="220" fill="#ffffff" font-size="17" font-weight="900" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.5">
    ${cleanTitle.length > 20 ? cleanTitle.slice(0, 18) + '...' : cleanTitle}
  </text>
  
  <!-- Divider -->
  <line x1="80" y1="250" x2="220" y2="250" stroke="${palette.accent}" stroke-width="2" opacity="0.7"/>
  
  <!-- Author -->
  <text x="150" y="280" fill="#cbd5e1" font-size="13" font-weight="700" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">
    ${cleanAuthor}
  </text>
  
  <!-- Publisher Label -->
  <text x="150" y="390" fill="${palette.accent}" font-size="10" font-weight="900" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="2" opacity="0.8">
    SEÇKİN KİTAP
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
