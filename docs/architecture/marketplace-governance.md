# LookPrice / Otomotiv / Emlak / Horeca / Shop Ecosystem
## Marketplace Integration & Architectural Governance Playbook

Bu döküman, sistem genelinde yaşanan hata, tespit, çözüm süreçlerini (özellikle pazar yeri entegrasyonları, ASIN/SKU doğrulama, operatör karar koruması ve sektörel izolasyon) gelecekteki tüm geliştirici ajanlar ve kod revizyonları için **bağlayıcı bir anayasa ve mimari standart** olarak belirlemek üzere oluşturulmuştur.

---

## 1. Pazar Yeri Entegrasyonları Altın Kuralları (Marketplace Invariants)

### A. Amazon TR Entegrasyon Kuralları
1. **ASIN Olmadan Satış İmkansızlığı (Zero ASIN-less Live Amazon Products)**:
   - Amazon pazar yerinde bir ürünün **10 haneli ASIN (Amazon Standard Identification Number)** (`B0...`) olmadan canlı satışta (`is_amazon_active = true`) olması mimari olarak kesinlikle **YASAKTIR ve İMKANSIZDIR**.
   - Ürün düzenleme formlarında, arka plan senkronizasyonlarında (`amazonService.ts`) ve pazar yeri modalında (`MarketplaceListingsModal.tsx`), `amazon_asin` alanı boş, `null`, `'null'` veya 9 karakterden kısa ise `is_amazon_active` asla `true` olamaz.
   - `/api/integrations/amazon/publish` uç noktası, geçerli bir ASIN doğrulaması yapmadan ilanı aktif edemez; eksik ASIN durumunda HTTP 400 hatası döndürür.

2. **Operatör Kararı Koruma Protokolü (Manually Unpublished Protocol)**:
   - Operatör bir ürün için **"Satışa Kapat"** (unpublish) komutu verdiğinde, veritabanında `marketplace_data->'amazon'` nesnesine şu imza işlenir:
     ```json
     { "status": "INACTIVE", "manuallyUnpublished": true, "unpublishedAt": "..." }
     ```
   - Arka plan cron job'ları (`syncAmazonOrdersCron`, vb.) veya ilan eşleştirme motorları (`matchListingsWithStoreProducts`), barkod/SKU eşleşmesi bulsa bile **operatörün manuel olarak kapattığı (`manuallyUnpublished === true`) hiçbir ürünü otomatik olarak tekrar canlıya alamaz (`is_amazon_active = false` kalır)**.

### B. Hepsiburada Entegrasyon Kuralları
1. **Katalog ve SKU Doğrulaması**:
   - Hepsiburada'da canlı satış (`is_hepsiburada_active = true`) için ürünün geçerli bir `hepsiburada_sku` veya master katalog ID'sine (`HBCV...`, `HBC0...`, `HB00...`, `BS...`) sahip olması ve `PENDING_APPROVAL` (Onay Bekliyor) durumunda olmaması gerekir.
2. **Manuel Kapatma Eşgüdümü**:
   - `/api/integrations/hepsiburada/unpublish` ve toplu yayından kaldırma işlemlerinde `marketplace_data->'hepsiburada'` içerisine `{"status": "INACTIVE", "manuallyUnpublished": true}` işlenir. Hepsiburada 15 dakikalık cron eşleştirmesi bu bayrağa saygı duyar.

---

## 2. Sektörel İzolasyon Kuralları (Sectoral Isolation Invariants)

- **shopLP (Perakende / E-Mağaza / Pazaryerleri)**: Hepsiburada, Amazon TR, Trendyol, N11, Pazarama e-mağaza entegrasyonları SADECE `shopLP` mağazaları için aktiftir.
- **horecaLP (Restoran, Kafe, Otel)**: Hepsiburada, Trendyol Pazaryeri, N11, Amazon gibi perakende e-mağaza modülleri bu sistemlerde kesinlikle yer alamaz.
- **Gayrimenkul (Emlak) & Otomotiv**: İlan odaklı portföy mağazalarıdır; e-mağaza ve e-fatura modülleri bu sistemlerde bulunmaz.

---

## 3. Yeni E-Market Entegrasyonları İçin Geliştirme Rehberi (Örn: n11.com)

Gelecekte sisteme eklenecek yeni e-market entegrasyonlarında (n11.com, Trendyol, vb.) şu adımlar sırasıyla takip edilmelidir:
1. **Zorunlu Pazar Yeri Benzersiz Kimliği (ID/SKU/ASIN)**: Entegrasyon modülü, pazar yerinin zorunlu kıldığı benzersiz tanımlayıcı (örn. n11 ürün kodu/kategori eşlemesi) olmadan ürünün aktif (`is_active = true`) duruma geçmesini engellemelidir.
2. **Manuel Kapatma Desteği (`manuallyUnpublished`)**: Unpublish uç noktaları, pazar yeri API çağrısının yanı sıra veritabanındaki `marketplace_data` JSON alanına `manuallyUnpublished: true` bayrağını mutlaka kaydetmelidir.
3. **Cron / Eşleştirme Koruması**: Periyodik senkronizasyon cron'ları eşleşme yaparken operatörün manuel kapatma kararlarını ezmemelidir.
