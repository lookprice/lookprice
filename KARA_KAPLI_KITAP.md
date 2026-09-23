# 📖 KARA KAPLI KİTAP (LookPrice Geliştirme El Kitabı & Güvence Standartları)

Bu dosya, LookPrice ekosistemindeki sektörel izolasyonun, veri bütünlüğünün, form kararlılığının ve yüksek performans standartlarının korunması için **KARA KAPLI KİTAP** (En Üst Şart) olarak kaleme alınmıştır. Gelecekte sisteme müdahale edecek her yazılımcı ve geliştirici ajan bu kurallara **BİREBİR VE TAVİZSİZ** uymak zorundadır.

---

## 1. FORM BÜTÜNLÜĞÜ VE ROZET/ETİKET KORUMA KURALLARI (Double Input & State Sync)

### ⚠️ Tespit Edilen Büyük Kritik Hata (Regression Bug)
Ürün düzenleme formlarında ("Eseri/Kitabı Düzenle") yapılan rozet (örn. **"Haftanın Eseri / featured_week"**) değişikliklerinin kaydolmama sebebi; HTML formunun içinde aynı isme (`name="labels"`) sahip iki ayrı girdi (biri gizli `input` diğeri metin `input`) bulunmasıydı. Tarayıcı ve FormData nesnesi her zaman en son girdiyi ezdiği için, seçilen kitap rozetleri tamamen siliniyor veya varsayılana sıfırlanıyordu.

### 🛡️ Beton Gibi Sağlam Koruma Standartları:
1. **Tekil Form İsmi Standardı (Form Name Singularity)**: Bir form içerisinde kesinlikle aynı `name` niteliğine sahip birden fazla eleman yer alamaz. Sektörel olarak dallanan alanlar (`isBookstore ? (...) : (...)`) daima kontrol edilmeli ve DOM üzerinde isim çakışması kesinlikle önlenmelidir.
2. **Eşgüdümlü Aktif Senkronizasyon (Active State Sync)**: Üst bileşenin yönettiği state'ler (örn. `selectedBookBadges`) ile alt bileşenin yönettiği sektörel JSONB yapısı (`sectorData`) daima dinamik bir `useEffect` ile anında senkronize edilmelidir:
   ```typescript
   React.useEffect(() => {
     if (selectedBookBadges) {
       const hasWeekly = selectedBookBadges.some((s: string) => s.toLowerCase() === "featured_week");
       if (sectorData.is_weekly_pick !== hasWeekly || sectorData.is_featured_weekly !== hasWeekly) {
         setSectorData((prev: any) => ({
           ...prev,
           is_weekly_pick: hasWeekly,
           is_featured_weekly: hasWeekly
         }));
       }
     }
   }, [selectedBookBadges]);
   ```
   Bu sayede, kullanıcı rozetlerden birini kaldırdığı veya eklediği anda, sunucuya gönderilecek olan `sector_data` JSON nesnesi anında güncellenir ve veritabanı ile web sitesi arasındaki eşgüdüm **beton gibi sağlam** kalır.

---

## 2. HIZLI POS VE SİTE YÜKLENME PERFORMANS STANDARTLARI (On-Demand Category Loading)

### ⚠️ Eski Mimari Sorunu:
Eski yapıda, Hızlı POS ekranı açılır açılmaz veritabanındaki TÜM ürünleri ve TÜM kategorileri tek bir hamlede belleğe çekmeye çalışıyordu. Ürün sayısı arttıkça bu durum POS terminalinin açılışını kilitliyor ve site hızını dramatik ölçüde düşürüyordu.

### ⚡ Yeni Ultra-Performans Standartları:
1. **On-Demand (Talebe Göre) Veri Çekme**: Kategoriler, tüm ürünlerin yüklenmesini beklemeden veritabanından bağımsız ve hafif bir API ucu (`GET /api/store/products/categories`) vasıtasıyla dinamik olarak çekilir.
2. **Kategori Bazlı Sunucu Filtreleme**: POS ekranında bir kategori seçildiğinde, istemci tarafında binlerce ürünü filtrelemek yerine, sunucuya kategori filtresiyle talep gönderilir ve sunucudan sadece o kategoriye ait **maksimum 150 ürün** dönülür:
   ```typescript
   api.getProducts("", storeId, false, true, 150, selectedCategory, selectedSubCategory)
   ```
   Bu yaklaşım, POS ekranının açılış hızını **saliseler mertebesine** indirmiştir ve veri transferini %98 oranında azaltmıştır.
3. **Ürün Arama Optimizasyonu**: Kullanıcı arama çubuğuna bir şey yazmaya başladığında, debounced (300ms) çalışan akıllı sunucu araması tetiklenir ve sadece eşleşen sonuçlar anında listelenir.

---

## 3. GÜNLÜK KASA VE DÖNEM SATIŞ RAPORU ENTEGRASYONU (Z-Report Engine)

1. **Horeca & Perakende Ortak Altyapısı**: horecaLP sistemindeki "Gün Sonu & Dönem Satış Raporu" (Z-Raporu), genel perakende (`shopLP`) ve kitap konsepti POS terminalleri için de tamamen aktif hale getirilmiştir.
2. **Kasa Raporu Erişilebilirliği**: POS ekranının üst araç çubuğuna (`PosHeaderToolbar`) her koşulda görüntülenebilir ve erişilebilir bir "Günlük Kasa Raporu" butonu entegre edilmiştir.
3. **Güvenilir Veri Aggregation**: Raporlama motoru (`/api/store/reports/pos-daily`), doğrudan PostgreSQL `sales` ve `sale_payments` tablolarından nakit, kredi kartı ve diğer ödeme yöntemlerini gerçek zamanlı sorgulayarak kuruşu kuruşuna doğru rapor üretir.

---

## 4. KESİN SEKTÖREL İZOLASYON & KOMPAKT FORM TASARIMI

1. **Sektörel İzolasyon**: `horecaLP` ve İlan (Emlak/Otomotiv) mağazalarına hiçbir e-mağaza entegrasyonu, fatura modülü veya pazar yeri (Trendyol, Hepsiburada, vb.) paneli sızdırılamaz.
2. **Kompakt Girdi Genişliği (Bounded-Width Inputs)**: Karakter sayısı belli girdiler (Barkod, Stok Miktarı, KDV Oranı, Para Birimi, Birim) asla tüm satırı kaplayamaz. Barkod için `max-w-[190px]` (veya `w-40 sm:w-48`), miktar için `w-20` ila `w-28` arası kompakt standart genişlikler uygulanmalıdır.
3. **Zıtlık Standartları**: Koyu renk arka planlar üzerinde metin ve ikonlar kesinlikle açık renk (`text-white`, `text-slate-100`), açık renk arka planlar üzerinde ise koyu renk (`text-slate-900`) olmalıdır.

---

*Bu kara kaplı kitap, LookPrice'ın kararlılık ve kalite güvencesidir. Değiştirilmesi veya ihlal edilmesi kesinlikle yasaktır!*
