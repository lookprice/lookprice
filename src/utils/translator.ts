// Robust auto-translator and translation dictionary for TR, EN, and EL (Greek)

export type Language = 'tr' | 'en' | 'el';

// Normalize Turkish characters and unicode combining marks safely
export const normalizeKey = (str: string): string => {
  if (!str) return "";
  return str.trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o");
};

const EN_DICTIONARY: Record<string, string> = {
  // Common / Navbar / General
  "Giriş Yap": "Sign In",
  "Kayıt Ol": "Register",
  "Çıkış Yap": "Sign Out",
  "Yönetim Paneli": "Admin Dashboard",
  "Ürünler": "Products",
  "Kategoriler": "Categories",
  "Stok Yönetimi": "Inventory",
  "Alış Faturaları": "Purchase Invoices",
  "Satış Faturaları": "Sales Invoices",
  "Cari Hesaplar": "Current Accounts",
  "Müşteriler": "Customers",
  "Personel & CRM": "Staff & CRM",
  "Ayarlar": "Settings",
  "Dijital Menü": "Digital Menu",
  "QR Kod": "QR Code",
  "Sepet": "Cart",
  "Sepetim": "My Cart",
  "Ödeme Yap": "Checkout",
  "Toplam": "Total",
  "Ara Toplam": "Subtotal",
  "KDV": "VAT",
  "İndirim": "Discount",
  "Not Ekleyin": "Add a Note",
  "Sipariş Ver": "Place Order",
  "Siparişiniz Alındı": "Order Received",
  "Masa": "Table",
  "Garson Çağır": "Call Waiter",
  "Hesap İste": "Request Bill",
  "Favoriler": "Favorites",
  "Arama yapın...": "Search...",
  "Tümü": "All",
  "Kahveler": "Coffees",
  "Kokteyller": "Cocktails",
  "Tatlılar": "Desserts",
  "İçecekler": "Beverages",
  "Yiyecekler": "Food",
  "Ara Sıcaklar": "Starters",
  "Ana Yemekler": "Main Courses",
  "Bira & Alkollü": "Beers & Alcohol",
  "Firma Adı": "Company Name",
  "Telefon": "Phone",
  "Adres": "Address",
  "Kaydet": "Save",
  "Güncelle": "Update",
  "Sil": "Delete",
  "İptal": "Cancel",
  "Ekle": "Add",
  "Düzenle": "Edit",
  "Detay": "Detail",
  "Yükleniyor...": "Loading...",
  "Görsel Yok": "No Image",
  "Stokta Var": "In Stock",
  "Tükendi": "Out of Stock",
  "Fiyat": "Price",
  "Birim": "Unit",
  "Miktar": "Quantity",
  "Açıklama": "Description",
  "Hızlı Satış": "Fast POS",
  "Raporlar": "Reports",
  "Gelir Gider": "Income & Expense",
  "Personel": "Staff",
  "Sektör": "Sector",
  "Otomotiv & Galeri": "Automotive & Dealership",
  "Emlak & Gayrimenkul": "Real Estate",
  "Genel Mağaza": "General Retail",
  "Restoran & Kafe": "Restaurant & Café",
  // Direct Option & Variant Terms
  "DEMLİ": "Strong",
  "ŞEKERLİ": "Sweet",
  "Demli": "Strong",
  "Şekerli": "Sweet",
  "AÇIK": "Light",
  "Açık": "Light",
  "SADE": "Plain",
  "Sade": "Plain",
  "ORTA": "Medium",
  "Orta": "Medium",
  "SÜTLÜ": "With Milk",
  "Sütlü": "With Milk",
  "AZ ŞEKERLİ": "Low Sugar",
  "Az Şekerli": "Low Sugar",
  "ORTA ŞEKERLİ": "Medium Sugar",
  "Orta Şekerli": "Medium Sugar",
  "ÇOK ŞEKERLİ": "Very Sweet",
  "Çok Şekerli": "Very Sweet",
  "ŞEKERSİZ": "Sugar-Free",
  "Şekersiz": "Sugar-Free",
  "KAFEİNSİZ": "Decaf",
  "Kafeinsiz": "Decaf",
  "BUZLU": "Iced",
  "Buzlu": "Iced",
};

const EL_DICTIONARY: Record<string, string> = {
  // Common / Navbar / General in Greek
  "Giriş Yap": "Σύνδεση",
  "Kayıt Ol": "Εγγραφή",
  "Çıkış Yap": "Αποσύνδεση",
  "Yönetim Paneli": "Πίνακας Ελέγχου",
  "Ürünler": "Προϊόντα",
  "Kategoriler": "Κατηγορίες",
  "Stok Yönetimi": "Διαχείριση Αποθέματος",
  "Alış Faturaları": "Τιμολόγια Αγοράς",
  "Satış Faturaları": "Τιμολόγια Πώλησης",
  "Cari Hesaplar": "Λογαριασμοί Πελατών",
  "Müşteriler": "Πελάτες",
  "Personel & CRM": "Προσωπικό & CRM",
  "Ayarlar": "Ρυθμίσεις",
  "Dijital Menü": "Ψηφιακό Μενού",
  "QR Kod": "Κωδικός QR",
  "Sepet": "Καλάθι",
  "Sepetim": "Το Καλάθι μου",
  "Ödeme Yap": "Ολοκλήρωση",
  "Toplam": "Σύνολο",
  "Ara Toplam": "Μερικό Σύνολο",
  "KDV": "ΦΠΑ",
  "İndirim": "Έκπτωση",
  "Not Ekleyin": "Προσθήκη Σημείωσης",
  "Sipariş Ver": "Παραγγελία",
  "Siparişiniz Alındı": "Η παραγγελία ελήφθη",
  "Masa": "Τραπέζι",
  "Garson Çağır": "Κλήση Σερβιτόρου",
  "Hesap İste": "Αίτημα Λογαριασμού",
  "Favoriler": "Αγαπημένα",
  "Arama yapın...": "Αναζήτηση...",
  "Tümü": "Όλα",
  "Kahveler": "Καφέδες",
  "Kokteyller": "Κοκτέιλ",
  "Tatlılar": "Γλυκά",
  "İçecekler": "Ροφήματα",
  "Yiyecekler": "Φαγητά",
  "Ara Sıcaklar": "Ορεκτικά",
  "Ana Yemekler": "Κυρίως Πιάτα",
  "Bira & Alkollü": "Μπύρες & Ποτά",
  "Firma Adı": "Όνομα Εταιρείας",
  "Telefon": "Τηλέφωνο",
  "Adres": "Διεύθυνση",
  "Kaydet": "Αποθήκευση",
  "Güncelle": "Ενημέρωση",
  "Sil": "Διαγραφή",
  "İptal": "Ακύρωση",
  "Ekle": "Προσθήκη",
  "Düzenle": "Επεξεργασία",
  "Detay": "Λεπτομέρειες",
  "Yükleniyor...": "Фόρτωση...",
  "Görsel Yok": "Χωρίς Εικόνα",
  "Stokta Var": "Σε Απόθεμα",
  "Tükendi": "Εξαντλήθηκε",
  "Fiyat": "Τιμή",
  "Birim": "Μονάδα",
  "Miktar": "Ποσότητα",
  "Açıklama": "Περιγραφή",
  "Hızlı Satış": "Γρήγορο POS",
  "Raporlar": "Αναφορές",
  "Gelir Gider": "Έσοδα - Έξοδα",
  "Personel": "Προσωπικό",
  "Sektör": "Τομέας",
  "Otomotiv & Galeri": "Αυτοκίνητα & Αντιπροσωπεία",
  "Emlak & Gayrimenkul": "Ακίνητα",
  "Genel Mağaza": "Γενικό Κατάστημα",
  "Restoran & Kafe": "Εστιατόριο & Καφέ",
  // Direct Option & Variant Terms in Greek
  "DEMLİ": "Δυνατό",
  "ŞEKERLİ": "Γλυκό",
  "Demli": "Δυνατό",
  "Şekerli": "Γλυκό",
  "AÇIK": "Ελαφρύ",
  "Açık": "Ελαφρύ",
  "SADE": "Σκέτο",
  "Sade": "Σκέτο",
  "ORTA": "Μέτριο",
  "Orta": "Μέτριο",
  "SÜTLÜ": "Με Γάλα",
  "Sütlü": "Με Γάλα",
  "AZ ŞEKERLİ": "Λίγο Γλυκό",
  "Az Şekerli": "Λίγο Γλυκό",
  "ORTA ŞEKERLİ": "Μέτριο Γλυκό",
  "Orta Şekerli": "Μέτριο Γλυκό",
  "ÇOK ŞEKERLİ": "Πολύ Γλυκό",
  "Çok Şekerli": "Πολύ Γλυκό",
  "ŞEKERSİZ": "Χωρίς Ζάχαρη",
  "Şekersiz": "Χωρίς Ζάχαρη",
  "KAFEİNSİZ": "Χωρίς Καφεΐνη",
  "Kafeinsiz": "Χωρίς Καφεΐνη",
  "BUZLU": "Με Πάγο",
  "Buzlu": "Με Πάγο",
};

const HORECA_EN: Record<string, string> = {
  "icecekler": "Beverages",
  "icecek": "Beverage",
  "sicak": "Hot Drinks",
  "sicaklar": "Hot Drinks",
  "soguk": "Cold Drinks",
  "soguklar": "Cold Drinks",
  "yiyecekler": "Food",
  "yiyecek": "Food",
  "tatlilar": "Desserts",
  "tatli": "Dessert",
  "cocuk menu": "Kids Menu",
  "cocuk menusu": "Kids Menu",
  "kahveler": "Coffees",
  "kahve": "Coffee",
  "kokteyller": "Cocktails",
  "kokteyl": "Cocktail",
  "biralar": "Beers",
  "bira": "Beer",
  "saraplar": "Wines",
  "sarap": "Wine",
  "mesrubatlar": "Soft Drinks",
  "mesrubat": "Soft Drink",
  "atistirmaliklar": "Snacks",
  "atistirmalik": "Snack",
  "salatalar": "Salads",
  "salata": "Salad",
  "corbalar": "Soups",
  "corba": "Soup",
  "ana yemekler": "Main Courses",
  "ana yemek": "Main Course",
  "ara sicaklar": "Starters",
  "ara sicak": "Starter",
  "makarnalar": "Pasta",
  "makarna": "Pasta",
  "pizzalar": "Pizzas",
  "pizza": "Pizza",
  "soslar": "Sauces",
  "sos": "Sauce",
  "meze": "Appetizer",
  "mezeler": "Appetizers",
  "izgara": "Grill",
  "izgaralar": "Grills",
  "kahvalti": "Breakfast",
  "trendler": "Trending",
  "tum menu": "Full Menu",
  // Options & Variants
  "acik": "Light",
  "demli": "Strong",
  "normal": "Normal",
  "sade": "Plain",
  "orta": "Medium",
  "sekerli": "Sweet",
  "sutlu": "With Milk",
  "az sekerli": "Low Sugar",
  "orta sekerli": "Medium Sugar",
  "cok sekerli": "Very Sweet",
  "sekersiz": "Sugar-Free",
  "kafeinsiz": "Decaf",
  "buzlu": "Iced",
  "bol soslu": "Extra Sauce",
  "sossuz": "No Sauce",
  "bol malzemeli": "Extra Toppings",
  "extra": "Extra",
  "ekstra": "Extra",
  "milkshake banana": "Banana Milkshake",
  "milkshake chocolate": "Chocolate Milkshake",
  "milkshake strawberry": "Strawberry Milkshake",
  "milkshake vanilla": "Vanilla Milkshake",
  // Common Horeca Products
  "cay (fincan)": "Tea (Cup)",
  "cay (ince belli)": "Traditional Tea",
  "cay": "Tea",
  "su": "Water",
  "simit": "Simit (Turkish Bagel)",
};

const HORECA_EL: Record<string, string> = {
  "icecekler": "Ροφήματα",
  "icecek": "Ρόφημα",
  "sicak": "Ζεστά Ροφήματα",
  "sicaklar": "Ζεστά Ροφήματα",
  "soguk": "Κρύα Ροφήματα",
  "soguklar": "Κρύα Ροφήματα",
  "yiyecekler": "Φαγητά",
  "yiyecek": "Φαγητό",
  "tatlilar": "Γλυκά",
  "tatli": "Γλυκό",
  "cocuk menu": "Παιδικό Μενού",
  "cocuk menusu": "Παιδικό Μενού",
  "kahveler": "Καφέδες",
  "kahve": "Καφές",
  "kokteyller": "Κοκτέιλ",
  "kokteyl": "Κοκτέιλ",
  "biralar": "Μπύρες",
  "bira": "Μπύρα",
  "saraplar": "Κρασιά",
  "sarap": "Κρασί",
  "mesrubatlar": "Αναψυκτικά",
  "mesrubat": "Αναψυκτικό",
  "atistirmaliklar": "Σνακ",
  "atistirmalik": "Σνακ",
  "salatalar": "Σαλάτες",
  "salata": "Σαλάτα",
  "corbalar": "Σούπες",
  "corba": "Σούπα",
  "ana yemekler": "Κυρίως Πιάτα",
  "ana yemek": "Κυρίως Πιάτο",
  "ara sicaklar": "Ορεκτικά",
  "ara sicak": "Ορεκτικό",
  "makarnalar": "Ζυμαρικά",
  "makarna": "Ζυμαρικά",
  "pizzalar": "Πίτσες",
  "pizza": "Πίτσα",
  "soslar": "Σάλτσες",
  "sos": "Σάλτσα",
  "meze": "Μεζέδες",
  "mezeler": "Μεζέδες",
  "izgara": "Σχάρα",
  "izgaralar": "Σχάρα",
  "kahvalti": "Πρωινό",
  "trendler": "Τάσεις",
  "tum menu": "Πλήρες Μενού",
  // Options & Variants in Greek
  "acik": "Ελαφρύ",
  "demli": "Δυνατό",
  "normal": "Κανονικό",
  "sade": "Σκέτο",
  "orta": "Μέτριο",
  "sekerli": "Γλυκό",
  "sutlu": "Με Γάλα",
  "az sekerli": "Λίγο Γλυκό",
  "orta sekerli": "Μέτριο Γλυκό",
  "cok sekerli": "Πολύ Γλυκό",
  "sekersiz": "Χωρίς Ζάχαρη",
  "kafeinsiz": "Χωρίς Καφεΐνη",
  "buzlu": "Με Πάγο",
  "bol soslu": "Επιπλέον Σάλτσα",
  "sossuz": "Χωρίς Σάλτσα",
  "bol malzemeli": "Επιπλέον Υλικά",
  "extra": "Έξτρα",
  "ekstra": "Έξτρα",
  "milkshake banana": "Μιλκσέικ Μπανάνα",
  "milkshake chocolate": "Μιλκσέικ Σοκολάτα",
  "milkshake strawberry": "Μιλκσέικ Φράουλα",
  "milkshake vanilla": "Μιλκσέικ Βανίλια",
  // Common Horeca Products in Greek
  "cay (fincan)": "Τσάι (Φλιτζάνι)",
  "cay (ince belli)": "Παραδοσιακό Τσάι",
  "cay": "Τσάι",
  "su": "Νερό",
  "simit": "Κουλούρι",
};

const translateSingle = (text: string, lang: Language): string => {
  if (!text || typeof text !== 'string') return text;
  if (lang === 'tr') return text;
  
  const trimmed = text.trim();
  const normalized = normalizeKey(trimmed);

  if (lang === 'en') {
    if (HORECA_EN[normalized]) return HORECA_EN[normalized];
    if (EN_DICTIONARY[trimmed]) return EN_DICTIONARY[trimmed];
    for (const key of Object.keys(EN_DICTIONARY)) {
      if (normalizeKey(key) === normalized) {
        return EN_DICTIONARY[key];
      }
    }
    return trimmed;
  }
  if (lang === 'el') {
    if (HORECA_EL[normalized]) return HORECA_EL[normalized];
    if (EL_DICTIONARY[trimmed]) return EL_DICTIONARY[trimmed];
    for (const key of Object.keys(EL_DICTIONARY)) {
      if (normalizeKey(key) === normalized) {
        return EL_DICTIONARY[key];
      }
    }
    return trimmed;
  }
  return text;
};

export const translateText = (text: string, lang: Language): string => {
  if (!text || typeof text !== 'string') return text;
  if (lang === 'tr') return text;

  // Decompose parenthetical strings like "Çay (DEMLİ)" or "Türk Kahvesi (ŞEKERLİ)"
  const match = text.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    const mainPart = translateSingle(match[1], lang);
    const subPart = translateSingle(match[2], lang);
    return `${mainPart} (${subPart})`;
  }

  return translateSingle(text, lang);
};

// Dynamic translator for product names, descriptions, categories in Digital Menu and POS
export const getLocalizedContent = (item: { name?: string; description?: string; category?: string; title?: string }, lang: Language) => {
  const name = item.name || item.title || '';
  const desc = item.description || '';
  const cat = item.category || '';

  if (lang === 'tr') {
    return { name, description: desc, category: cat };
  }

  // Auto-translate common terms or dictionary
  const translatedName = translateText(name, lang);
  const translatedDesc = translateText(desc, lang);
  const translatedCat = translateText(cat, lang);

  // If dictionary didn't change it and lang is EN/EL, append or adapt for realism if needed
  return {
    name: translatedName,
    description: translatedDesc,
    category: translatedCat
  };
};
