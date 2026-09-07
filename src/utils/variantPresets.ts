export interface AttributePreset {
  id: string;
  name: string;
  sectorLabel: string;
  icon?: string;
  attributes: {
    name: string;
    display_type: 'swatch' | 'button' | 'dropdown';
    suggestedValues: string[];
  }[];
}

export const COLOR_HEX_MAP: Record<string, string> = {
  'siyah': '#111827',
  'black': '#111827',
  'beyaz': '#FFFFFF',
  'white': '#FFFFFF',
  'kırmızı': '#EF4444',
  'kirmizi': '#EF4444',
  'red': '#EF4444',
  'mavi': '#3B82F6',
  'blue': '#3B82F6',
  'lacivert': '#1E3A8A',
  'navy': '#1E3A8A',
  'yeşil': '#22C55E',
  'yesil': '#22C55E',
  'green': '#22C55E',
  'sarı': '#EAB308',
  'sari': '#EAB308',
  'yellow': '#EAB308',
  'turuncu': '#F97316',
  'orange': '#F97316',
  'pembe': '#EC4899',
  'pink': '#EC4899',
  'mor': '#A855F7',
  'purple': '#A855F7',
  'gri': '#6B7280',
  'grey': '#6B7280',
  'gray': '#6B7280',
  'antrasit': '#374151',
  'anthracite': '#374151',
  'bej': '#D2B48C',
  'beige': '#D2B48C',
  'ekru': '#F5F5DC',
  'haki': '#556B2F',
  'khaki': '#556B2F',
  'kahverengi': '#78350F',
  'brown': '#78350F',
  'taba': '#A0522D',
  'bordo': '#831843',
  'burgundy': '#831843',
  'gold': '#CA8A04',
  'altın': '#CA8A04',
  'altin': '#CA8A04',
  'gümüş': '#94A3B8',
  'gumus': '#94A3B8',
  'silver': '#94A3B8',
  'bronz': '#CD7F32',
  'titanyum': '#64748B',
  'rose gold': '#B76E79',
  'turkuaz': '#06B6D4',
  'lila': '#C084FC',
  'mint': '#6EE7B7',
  'ceviz': '#5c381c',
  'meşe': '#c2a67e',
};

export const getColorHex = (colorName: string): string | undefined => {
  if (!colorName) return undefined;
  const clean = colorName.trim().toLowerCase();
  if (COLOR_HEX_MAP[clean]) return COLOR_HEX_MAP[clean];
  for (const [key, val] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return val;
  }
  return undefined;
};

export const SECTOR_VARIANT_PRESETS: AttributePreset[] = [
  {
    id: 'fashion_clothing',
    name: 'Tekstil & Giyim (Renk + Beden)',
    sectorLabel: 'Tekstil / Moda',
    attributes: [
      {
        name: 'Renk',
        display_type: 'swatch',
        suggestedValues: ['Siyah', 'Beyaz', 'Kırmızı', 'Mavi', 'Lacivert', 'Bej', 'Haki', 'Gri', 'Antrasit', 'Bordo']
      },
      {
        name: 'Beden',
        display_type: 'button',
        suggestedValues: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
      }
    ]
  },
  {
    id: 'footwear_shoes',
    name: 'Ayakkabı & Terlik (Renk + Numara)',
    sectorLabel: 'Ayakkabı / Terlik',
    attributes: [
      {
        name: 'Renk',
        display_type: 'swatch',
        suggestedValues: ['Siyah', 'Beyaz', 'Kahverengi', 'Taba', 'Lacivert', 'Gri']
      },
      {
        name: 'Numara',
        display_type: 'button',
        suggestedValues: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
      }
    ]
  },
  {
    id: 'electronics_tech',
    name: 'Elektronik & Telefon (Hafıza + RAM + Renk)',
    sectorLabel: 'Bilişim / Elektronik',
    attributes: [
      {
        name: 'Dahili Hafıza',
        display_type: 'button',
        suggestedValues: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB']
      },
      {
        name: 'RAM',
        display_type: 'button',
        suggestedValues: ['4 GB', '8 GB', '12 GB', '16 GB', '32 GB']
      },
      {
        name: 'Renk',
        display_type: 'swatch',
        suggestedValues: ['Gece Siyahı', 'Gümüş', 'Titanyum Gri', 'Gece Mavisi', 'Altın']
      }
    ]
  },
  {
    id: 'furniture_decor',
    name: 'Mobilya & Dekorasyon (Kumaş + Renk + Ayak)',
    sectorLabel: 'Mobilya / Ev Dekor',
    attributes: [
      {
        name: 'Kumaş Türü',
        display_type: 'button',
        suggestedValues: ['Keten', 'Kadife', 'Deri', 'Nubuk', 'Bukle']
      },
      {
        name: 'Renk / Ahşap Kaplama',
        display_type: 'swatch',
        suggestedValues: ['Doğal Meşe', 'Ceviz', 'Antrasit', 'Beyaz', 'Siyah', 'Gri']
      },
      {
        name: 'Ayak Malzemesi',
        display_type: 'button',
        suggestedValues: ['Siyah Metal', 'Meşe Ahşap', 'Krom', 'Gold Pirinç']
      }
    ]
  },
  {
    id: 'horeca_food',
    name: 'HoReCa & Restoran (Porsiyon + Hamur / Pişme + Sos)',
    sectorLabel: 'Yiyecek & İçecek',
    attributes: [
      {
        name: 'Porsiyon / Ebat',
        display_type: 'button',
        suggestedValues: ['Küçük Boy', 'Orta Boy', 'Büyük Boy', '1.5 Porsiyon', 'Duble (XL)']
      },
      {
        name: 'Hamur / Pişme Seçimi',
        display_type: 'button',
        suggestedValues: ['İnce Hamur', 'Klasik Hamur', 'Az Pişmiş', 'Orta Pişmiş', 'İyi Pişmiş']
      },
      {
        name: 'Ekstra / Sos Seçimi',
        display_type: 'dropdown',
        suggestedValues: ['Sossuz', 'Acılı Sos', 'Sarımsaklı Mayonez', 'Barbekü', 'Truffle Mayo', 'Ekstra Peynir']
      }
    ]
  },
  {
    id: 'fmcg_cosmetics',
    name: 'Gıda & Kozmetik (Gramaj / Hacim + Paket Tipi)',
    sectorLabel: 'Market & Kozmetik',
    attributes: [
      {
        name: 'Gramaj / Hacim',
        display_type: 'button',
        suggestedValues: ['50 ml', '100 ml', '250 ml', '500 ml', '1 L', '250 g', '500 g', '1 kg', '5 kg']
      },
      {
        name: 'Paket Tipi',
        display_type: 'button',
        suggestedValues: ['Tekli Paket', '2\'li Set', '3\'lü Avantaj Paketi', 'Koli (12 Adet)']
      }
    ]
  },
  {
    id: 'auto_spare_parts',
    name: 'Oto Yedek Parça & Aksesuar (Parça Yönü + Uyum + Ölçü)',
    sectorLabel: 'Otomotiv / Yedek Parça',
    attributes: [
      {
        name: 'Yön / Konum',
        display_type: 'button',
        suggestedValues: ['Ön Sol', 'Ön Sağ', 'Arka Sol', 'Arka Sağ', 'Takım (Sol+Sağ)']
      },
      {
        name: 'Ölçü / Jant Ebatı',
        display_type: 'button',
        suggestedValues: ['15 inç', '16 inç', '17 inç', '18 inç', '19 inç', '20 inç']
      }
    ]
  }
];

// Helper to sanitize slug for SKU generation
export const sanitizeSlugCode = (text: string): string => {
  if (!text) return '';
  const trMap: Record<string, string> = {
    'ç': 'C', 'Ç': 'C',
    'ğ': 'G', 'Ğ': 'G',
    'ı': 'I', 'İ': 'I',
    'ö': 'O', 'Ö': 'O',
    'ş': 'S', 'Ş': 'S',
    'ü': 'U', 'Ü': 'U'
  };
  return text
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m] || m)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
};

// Cartesian product generator for variant combinations
export const generateCartesianMatrix = (
  attributes: { name: string; values: string[] }[],
  baseProduct: {
    name?: string;
    price?: number;
    cost_price?: number;
    barcode?: string;
    sku?: string;
    stock_quantity?: number;
  }
) => {
  const validAttributes = attributes.filter(a => a.name.trim() && a.values.length > 0);
  if (validAttributes.length === 0) return [];

  // Generate Cartesian Product arrays
  const cartesian = (arrays: string[][]): string[][] => {
    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])),
      [[]]
    );
  };

  const attrValuesList = validAttributes.map(a => a.values.map(v => v.trim()).filter(Boolean));
  const combinations = cartesian(attrValuesList);

  const baseSku = (baseProduct.sku || baseProduct.barcode || sanitizeSlugCode(baseProduct.name || 'PRD')).toUpperCase();
  const basePrice = Number(baseProduct.price) || 0;
  const baseStock = baseProduct.stock_quantity !== undefined ? Number(baseProduct.stock_quantity) : 10;

  return combinations.map((combo, index) => {
    const attrMap: Record<string, string> = {};
    let colorName: string | undefined;
    let sizeName: string | undefined;

    combo.forEach((val, i) => {
      const attrName = validAttributes[i].name;
      attrMap[attrName] = val;

      const lowerName = attrName.toLowerCase();
      if (lowerName.includes('renk') || lowerName.includes('color')) {
        colorName = val;
      }
      if (lowerName.includes('beden') || lowerName.includes('size') || lowerName.includes('numara') || lowerName.includes('ölçü')) {
        sizeName = val;
      }
    });

    const comboName = combo.join(' / ');
    const codeSuffix = combo.map(c => sanitizeSlugCode(c)).join('-');
    const generatedSku = `${baseSku}-${codeSuffix}`;
    const generatedBarcode = `${Date.now().toString().slice(-6)}${index + 1}`.padStart(12, '869000');

    return {
      id: `var_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
      name: comboName,
      price: basePrice,
      cost_price: baseProduct.cost_price || 0,
      stock_quantity: baseStock,
      sku: generatedSku,
      barcode: generatedBarcode,
      attributes: attrMap,
      color_name: colorName,
      color_code: colorName ? getColorHex(colorName) : undefined,
      size: sizeName,
      variant_type: 'standard' as const,
      is_active: true
    };
  });
};
