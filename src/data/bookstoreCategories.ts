export interface BookstoreCategoryNode {
  mainCategory: string;
  icon?: string;
  description?: string;
  subCategories: string[];
}

export const BOOKSTORE_CATEGORIES: BookstoreCategoryNode[] = [
  {
    mainCategory: "Edebiyat / Roman-Öykü",
    icon: "BookOpen",
    description: "Roman, öykü, klasik ve çağdaş edebiyat eserleri",
    subCategories: [
      "Aşk / Romantik",
      "Bilimkurgu & Fantastik",
      "Polisiye, Gerilim & Gizem",
      "Dünya & Türk klasikleri",
      "Tarihi Roman"
    ]
  },
  {
    mainCategory: "Araştırma, İnceleme, Bilim",
    icon: "Compass",
    description: "Tarih, felsefe, bilimsel araştırmalar ve sosyoloji",
    subCategories: [
      "Tarih",
      "Felsefe & Düşünce",
      "Bilim & Teknoloji",
      "Siyaset / Politika",
      "Sosyoloji & Toplum Bilimi"
    ]
  },
  {
    mainCategory: "Kişisel Gelişim & Psikoloji",
    icon: "Sparkles",
    description: "Psikoloji, motivasyon, liderlik ve iş dünyası rehberleri",
    subCategories: [
      "Popüler Psikoloji",
      "Klinik Psikoloji & Teori",
      "İş Dünyası & Liderlik"
    ]
  },
  {
    mainCategory: "Çocuk & Gençlik",
    icon: "Baby",
    description: "Bebeklikten genç yetişkinliğe eğitici ve eğlenceli kitaplar",
    subCategories: [
      "0-3 Yaş",
      "4-6 Yaş / İlk Okuma",
      "7-12 Yaş / Çocuk Edebiyatı",
      "Genç Yetişkin"
    ]
  },
  {
    mainCategory: "Sanat, Tasarım & Mimari",
    icon: "Palette",
    description: "Resim, heykel, mimari, sinema, tiyatro ve müzik",
    subCategories: [
      "Resim & Heykel",
      "Mimari",
      "Sinema, Tiyatro & Müzik",
      "Fotoğraf"
    ]
  },
  {
    mainCategory: "Hobi & Pratik Bilgiler",
    icon: "Coffee",
    description: "Yemek, gezi, sağlık, spor ve yaşam rehberleri",
    subCategories: [
      "Yemek Kitapları",
      "Sağlık & Spor",
      "Gezi & Seyahat",
      "Ev & Bahçe"
    ]
  },
  {
    mainCategory: "Din & Mitoloji",
    icon: "Moon",
    description: "İslamiyet, semavi dinler, kadim inançlar ve mitoloji",
    subCategories: [
      "İslamiyet",
      "Dinler",
      "Mitoloji"
    ]
  },
  {
    mainCategory: "Akademik, Sınav & Eğitim",
    icon: "GraduationCap",
    description: "Sınav hazırlık, yabancı dil eğitimi ve üniversite ders kitapları",
    subCategories: [
      "Sınav Hazırlık",
      "Dil Eğitimi",
      "Ders Kitapları"
    ]
  }
];

export const getBookstoreMainCategories = (): string[] => {
  return BOOKSTORE_CATEGORIES.map((c) => c.mainCategory);
};

export const getBookstoreSubcategories = (mainCat: string): string[] => {
  if (!mainCat || mainCat === "all") {
    return Array.from(new Set(BOOKSTORE_CATEGORIES.flatMap((c) => c.subCategories)));
  }
  const found = BOOKSTORE_CATEGORIES.find(
    (c) => c.mainCategory.trim().toLowerCase() === mainCat.trim().toLowerCase()
  );
  return found ? found.subCategories : [];
};

export const getAllBookstoreSubcategories = (): string[] => {
  return Array.from(new Set(BOOKSTORE_CATEGORIES.flatMap((c) => c.subCategories)));
};

export const findMainCategoryBySubcategory = (subCat: string): string | null => {
  if (!subCat) return null;
  const target = subCat.trim().toLowerCase();
  for (const cat of BOOKSTORE_CATEGORIES) {
    if (cat.subCategories.some((s) => s.trim().toLowerCase() === target)) {
      return cat.mainCategory;
    }
  }
  return null;
};
