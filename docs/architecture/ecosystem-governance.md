# LookPrice / Otomotiv / Emlak / Horeca / Shop / Book / Hotel Ecosystem
## Comprehensive Architecture & Sectoral Governance Constitution

Bu döküman, LookPrice ekosistemindeki tüm sektörel modüllerin (`shopLP`, `horecaLP`, `hotelLP`, `bookLP`, `autoLP`, `restateLP`) mimari sınırlarını, veri bütünlüğü kurallarını, sektörel izolasyon şartlarını ve kalite kontrol standartlarını belirleyen **bağlayıcı CTO Anayasasıdır**.

---

## 1. Sektörel İzolasyon ve Konsept Matrisi (Strict Sectoral Isolation)

Ekosistemimizdeki her mağaza, seçilen sektöre (`branding.store_type` veya `branding.page_layout_settings.sector`) göre izole edilmiş şablonlar ve veri yapıları üzerinde çalışır. Bir sektöre ait özellikler başka bir sektöre asla sızdırılamaz:

| Sektör Kodu | Konsept Adı | Temel Operasyonel Modüller | Yasaklı / İzole Modüller |
| :--- | :--- | :--- | :--- |
| **shopLP** | Perakende / E-Mağaza | Ürün yönetimi, stok, e-Fatura/e-Arşiv, Pazar Yeri Entegrasyonları (Trendyol, Hepsiburada, Amazon, N11, Pazarama), Google Merchant. | Otel oda adisyonları, gayrimenkul tapu/imar filtreleri, araç şasi bilgileri. |
| **horecaLP** | Kafe & Restoran | Dijital Menü, Masa Adisyonları, Mutfak Ekranı (KDS), Hızlı POS (Fast POS), Reçete yönetimi. | **Hepsiburada, Trendyol, N11, Amazon, Pazarama veya e-Mağaza pazaryeri entegrasyon panelleri KESİNLİKLE BULUNAMAZ.** |
| **hotelLP** | Otel & Konaklama (Hibrit) | Oda Rezervasyonları, Oda Servisi, Gün Sonu & Dönem Satış Raporu (Oda + Restoran POS birleşik görünümü). | *Not: Otel konsepti pasif olan horecaLP mağazalarında oda satış raporları ve sekmeleri tamamen gizlenir.* |
| **bookLP** | Kitabevi & Yayınevi | Yazar yönetimi, ISBN barkod eşleme, yayınevi siparişleri, e-Ticaret entegrasyonu. | Araç şasi numaraları, gayrimenkul imar durumu. |
| **autoLP** | Motorlu Araçlar (Oto Galeri) | Araç İlanları, Şasi No, Plaka, Model/Yıl/Kilometre, Hasar Durumu, Oto Sözleşmeleri. | **Alış/Satış e-Faturaları ve e-İrsaliye modülleri bu sistemde tamamen gizlidir.** |
| **restateLP** | Gayrimenkul (Emlak Portföyü) | Konut/Arsa/İşyeri İlanları, A4 Portföy Poster Baskı (210mm x 297mm), Tapu Türü, İmar Durumu, KAKS, Harita Modu. | **Alış/Satış e-Faturaları ve e-İrsaliye modülleri bu sistemde tamamen gizlidir.** |

---

## 2. Modül Bazlı Kalite Kontrol ve Stabilite Protokolleri

### A. shopLP & Pazaryeri Modülleri (`shopLP`)
- **ASIN / SKU Invariant**: Amazon ürünlerinde geçerli 10 haneli ASIN (`B0...`) olmadan `is_amazon_active = true` olamaz.
- **Manually Unpublished Protocol**: Operatörün "Satışa Kapat" komutu (`manuallyUnpublished: true`, `status: 'INACTIVE'`) arka plan cron job'ları veya eşleştirme motorları tarafından asla ezilemez.

### B. horecaLP & Hızlı POS Modülleri (`horecaLP`)
- **Otel Pasif İzolasyonu**: Otel modülü pasif olan (`hotel_module_enabled: false`) restoran/kafe işletmelerinde, Gün Sonu & Dönem Satış Raporu içerisinde otel oda satışları, birleşik rapor sekmeleri KESİNLİKLE GÖRÜNMEZ. Sadece saf Restoran/POS satış raporu sunulur.
- **Kompakt Operatör Paneli**: POS ve masa yönetim ekranları, operatörün kaydırma yapmadan yüksek bilgi yoğunluğuyla (`%80 zoom` eşdeğeri) çalışmasını sağlayacak kompakt tasarım standardına uyar.

### C. restatelp & autoLP (İlan Odaklı Portföy Mağazaları)
- **Fatura Gizliliği**: İlan odaklı portföy mağazalarında e-Fatura, e-Arşiv ve e-İrsaliye modülleri menülerden tamamen gizlenir.
- **A4 Poster Standartları**: RealEstateTab altındaki A4 portföy posterleri 210mm x 297mm standartlarına ve çift kenar sınırlamalarına tam uygun basılır.
- **Fiyat Formatlama**: Binlik ayraç (`850.000` / `1.250.000`) gösterimi zorunludur.

---

## 3. Geliştirici ve Ajan Kalite Güvence Kuralları

1. **Öncesi ve Sonrası Doğrulama (Pre-Post Verification)**:
   - Herhangi bir modüle dokunulmadan önce ilgili test yolu çalıştırılır; değişiklik sonrası aynı test yolu tekrar doğrulanır.
2. **Çapraz Modül Proaktif Tarama**:
   - Benzer yapıdaki kardeş modüller (örn. bir pazaryeri düzeltmesi yapıldığında tüm diğer pazaryerleri) proaktif olarak taranır.
3. **Regresyon Raporlama**:
   - Her turn özetinde ilgili modül için regresyon kontrolünün geçtiği açıkça beyan edilir.
