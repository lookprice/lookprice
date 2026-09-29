# LookPrice / Ecosystem Technical Standards & Product X-Ray Architecture

## 1. Sektörel İzolasyon ve Konsept Ayrımı Kuralları
- **shopLP (Perakende / Genel Ürün Mağazaları)**: Fiziksel ürün, giyim, elektronik vb. E-pazaryeri entegrasyonları (Hepsiburada, Trendyol, N11, Amazon, Pazarama) ve Google Merchant sadece bu mağazalarda aktiftir.
- **horecaLP (Cafe / Restoran / Otel / Horeca)**: Yiyecek, içecek, menü, adisyon ve masa yönetimi. **Pazaryeri entegrasyon panelleri bu modülde kesinlikle bulunamaz**. Otel konsepti pasif olan horecaLP mağazalarında hızlı POS raporlarında oda satışları gizlenir.
- **Gayrimenkul (Emlak) & Otomotiv (Motorlu Araçlar)**: İlan odaklı portföy mağazalarıdır. E-pazaryeri entegrasyonları ve e-fatura modülleri bu sistemlerde bulunmaz. Sektörel filtreler (imar, tapu, KAKS, trafo, v.b.) izole tutulur.

## 2. E-Pazaryeri Entegrasyon ve Doğruluk Standartları
- **Amazon TR & Hepsiburada ASIN / SKU Kuralları**: Amazon TR üzerinde ASIN olmadan ürün satışta (aktif) gösterilemez (Minimum 10 karakterli geçerli ASIN şartı).
- **Manuel Yayından Kaldırma (`manuallyUnpublished`)**: Operatörün "Yayından Kaldır" komutu kalıcıdır; arka plan cron senkronizasyonları bu kararı ezemez. `marketplace_data` içinde `INACTIVE` statüsü ve `manuallyUnpublished: true` mühürlenir.

## 3. Çok Kanallı Ürün Röntgeni (X-Ray Audit Report)
- Ürün yönetimi ekranında sunulan **"Çok Kanallı Ürün Röntgeni & Kanal Senaryo Raporu"**, tüm satış kanallarının (Web, Hepsiburada, Amazon TR, Trendyol, N11, Pazarama) röntgenini çeker.
- **Kapsam**:
  - Ürün adı, barkod ve SKU
  - Reel stok miktarı ve birimi
  - Alış maliyeti (ortalama)
  - Web satış bedeli ve aktiflik durumu
  - E-marketlerdeki gerçek satış fiyatları (TL cinsinden) ve kanal bazlı stok/yayında olma durumu
  - Tek tıkla Excel (`.xlsx`) formatında dışa aktarma (`handleExportExcel`).
