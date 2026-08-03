// Robust auto-translator and translation dictionary for TR, EN, and EL (Greek)

export type Language = 'tr' | 'en' | 'el';

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
};

export const translateText = (text: string, lang: Language): string => {
  if (!text || typeof text !== 'string') return text;
  if (lang === 'tr') return text;
  
  const trimmed = text.trim();
  if (lang === 'en') {
    if (EN_DICTIONARY[trimmed]) return EN_DICTIONARY[trimmed];
    // Fallback prefix simulation for custom titles
    return trimmed;
  }
  if (lang === 'el') {
    if (EL_DICTIONARY[trimmed]) return EL_DICTIONARY[trimmed];
    return trimmed;
  }
  return text;
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
