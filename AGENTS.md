# System & Branding Guidelines

This file outlines strict engineering, performance, and naming directives that must be followed by all development agents modifying the **LookPrice/Otomotiv/Emlak** workspace ecosystem.

---

## 1. Strict Naming & Corporate Mapping Rules

- **Display Names Over Slugs ("Firma Adı" over "Slug")**:
  - Always resolve and display the human-readable company/store name (e.g., `branding?.store_name` or `branding?.name` or fallback titles like `"Seçkin Emlak"`, `"Seçkin Otomotiv"`, `"Seçkin Mağaza"`) rather than printing raw technical slugs (e.g., `urlSlug`, `activeSlug`, `branding?.slug`).
  - Raw strings containing the term `"lookprice"` should have high-confidence fallback mappings to Turkish equivalents of premium service agencies (e.g. `"Premium VIP Emlak"`, `"Seçkin Mağaza"`, `"Seçkin Emlak"`) unless specifically requested.

- **Dynamic Contract Templates & Legal Documents**:
  - All contracts generated under `/src/components/AutoContractModal.tsx`, `/src/components/LegalContractModal.tsx` must accurately inherit settings-level objects:
    - **Firma Adı**: Dynamically bind to `branding?.store_name` or `branding?.name`. Fallbacks must reflect premium names (`"Seçkin Emlak"` or `"Seçkin Otomotiv"`), never hardcoded platform indicators.
    - **Detaylı İletişim & Telefon**: Strictly use `branding?.phone`, `branding?.whatsapp_number`, or other sectoral profile options configures in settings.
    - **Suites & Services Footer**: Standardized to dynamically computed store identifiers.

- **Zero Manual Post-Copy Correction ("Kopyala-Yapıştır Hazır")**:
  - Social media share modals (Real Estate, Automotive, and Product variants) must generate fully complete and accurate caption texts.
  - Clipboard copy operations (`getCaptionText`) must never output generic, static mockup data or dummy phone numbers (such as `+90 (548) 000 0000`) if any valid phone parameters exist in `branding`.
  - All hashtags and brand labels should dynamically sanitize special characters from the exact customer store's name.

---

## 2. Startup & Performance Optimization Rules

- **Bypass Flash Loadings & Blocking Splashes**:
  - Never default initial check states (e.g. `isCheckingDomain`) to `true` if they can be evaluated synchronously based on initial client-side metadata (e.g., matching known local or system hostnames synchronously).
  - Keeps initial loading visual transitions elegant and free of unnecessary layout shifts.

- **Asset Chunks and Lazy Loading (code split)**:
  - All lazy-loaded components in `/src/App.tsx` must be retained to maintain minimal initial asset sizes.
  - Large external bundles (utility worksheets, PDF generators, charts) must be designated inside the Vite config under target vendor chunks to avoid bundle bloat.

---

## 5. Sektörel İzolasyon ve Ortak Yönetim Koruma Kuralları

- **Sektörel İzolasyon (İlan Odaklı Portföy Mağazaları)**: Oto Galeri (Motorlu Araçlar) ve Emlak Portföy mağazalarında 'Alış/Satış Faturaları' ve 'e-İrsaliye' modülleri tamamen gizlenmelidir. Bu özellikler sadece genel perakende mağazaları için aktif tutulmalıdır. Bu kural tüm geliştiriciler için zorunludur.
  - **Gayrimenkul (Emlak)**, **Otomotiv (Motorlu Araçlar)** ve **Genel Ürün Yönetimi** modülleri kod düzeyinde tamamen izole kalmalıdır.
  - Bir sektörel modüle veya genel ürün alt yapısına yapılan müdahaleler, diğer modüllerin veri yapılarını, API uçlarını, ilan/form şablonlarını veya durum yönetimlerini kesinlikle etkilememelidir.
  - Emlak ve Otomotiv modüllerine ait özel bileşenler (`SectorSpecs`, `RealEstateModal`, vb.) bağımsız yapıdadır ve ortak ürün tablolarına geçildiğinde bu sectoral alanlar bozulmadan korunmalıdır.
  - **Mağaza Oluşturma Kuralı**: Yeni mağaza oluşturulurken veya başlatılırken, seçilen sektör (Emlak, Otomotiv, Genel Ürün) sistem tarafından belirlenen şablonlara ve tema ayarlarına (branding.store_type, branding.page_layout_settings.sector) hatasız bir şekilde işlenmelidir. Hiçbir koşulda varsayılan "genel ürün" şablonu sektörel bir mağazaya atanmamalıdır.

- **Ortak Özelliklerin/Hataların Korunması**:
  - Ürün Yönetimi, Alış/Satış Faturaları, Cari Hesaplar ve Stok sistemleri üzerinde hata giderilirken ortak arayüzlerin veya statik doğrulamaların (örneğin fatura durumları, ödeme yöntemleri) sektörel filtrelerle (Emlak/Oto) çakışmaması sağlanmalıdır.
  - Tüm geliştirici ajanlar, her turn öncesinde bu izolasyon kurallarını okumak ve modül sınırlarına harfiyen uymakla yükümlüdür.

---

## 4. E-Fatura, E-Arşiv ve Alış/Satış Görsel Kuralları

- **Alış (Gelen/Purchase) Faturaları HTML Görüntüleme**:
  - Alınan e-faturaların HTML görsellerine kesinlikle hiçbir ek açıklama, döviz kur bilgisi, TL cinsinden hesaplama tablosu ("Döviz Karşılıkları") ya da harici müdahale eklenmemelidir.
  - Alış faturaları entegratörden geldiği orijinal formatta ve bilgilerle, "geldiği gibi" ham HTML olarak temiz bir şekilde ekrana yansıtılmalıdır.

- **Satış (Giden/Sales) Faturaları ve Döviz/Kur Bilgileri**:
  - Sadece dövizli satış faturalarında, açıklama kısmında döviz kuru bilgisi ile TL cinsinden hesaplama tablosu ("Döviz Karşılıkları (TRY)" başlığı altında Mal Hizmet Toplam Tutarı, Hesaplanan KDV ve Vergiler Dahil Toplam Tutar) HTML görseline entegre edilmelidir.

- **Satış Faturalarında KDV Oran Gruplama Kuralı**:
  - Çok kalemli (örn. 100 satır) satış faturalarında her kalem için ayrı ayrı KDV satırı oluşturulmamalıdır.
  - Faturadaki tüm ürünlerin KDV oranları aynı ise, bu KDV tutarlarının toplamı tek bir "Hesaplanan Katma Değer Vergisi (%X)" satırında gösterilmelidir.
  - Eğer faturada farklı yüzdelere sahip KDV oranları mevcut ise (örn. hem %10 hem %20), her bir benzersiz KDV oranı kendi içinde gruplanarak alt alta ayrı satırlar halinde (örn. biri %10, diğeri %20 toplamı olarak) gösterilmelidir.

