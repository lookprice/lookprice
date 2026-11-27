# LookPrice Personel & İK Yönetimi (PDKS, Bordro, İzin ve Özlük Sistemi)

LookPrice ekosistemindeki tüm işletmeler için mağaza ve depo bazlı personel kadrosunu, QR + GPS doğrulamalı mobil giriş-çıkış (PDKS) takibini, Gelir & Gider / Kasa modülüyle çift yönlü çalışan maaş-avans-SGK bordrosunu, yıllık izinleri ve dijital özlük/zimmet dosyalarını tek bir yalın modülde birleştiren uçtan uca İK altyapısı.

---

## Kullanıcı Onayı & Kritik Kararlar

> [!IMPORTANT]
> Aşağıdaki 4 temel tasarım kararı ilk aşamada onaylandı; ek varsayılan davranışlar onayınızla birlikte uygulamaya alınacaktır.

- **Onaylanan Karar 1 — QR + GPS Doğrulamalı Puantaj**: Her mağaza, şube ve depo için yazdırılabilir benzersiz kapı QR afişi üretilecek; personel okuttuğunda telefonun GPS koordinatı işletme yarıçapı (varsayılan 150 m, şube bazlı ayarlanabilir) ile doğrulanacak.
- **Onaylanan Karar 2 — Çift Yönlü Finans & Gider Senkronizasyonu**: Bordro/Avans ekranından yapılan ödemeler otomatik olarak **Gelir & Gider / Kasa** modülüne `Personel Maaş, SGK & Prim` gideri olarak işlenecek; aynı şekilde Giderler ekranından personel seçilerek girilen ödemeler personelin avans/maaş hesabına otomatik yansıyacak.
- **Onaylanan Karar 3 — Tüm Sektörlerde Aktif, Sektörel İzolasyon Korumalı**: Modül **shopLP, horecaLP, Gayrimenkul ve Otomotiv** mağazalarının tamamında yer alacak; sektör kuralları korunarak (ör. pazaryeri/e-fatura sızması olmadan) her sektöre uygun özlük belge şablonları sunulacak (Horeca için Hijyen/Portör Raporu, Emlak için MYK Yetki Belgesi, Otomotiv için Ehliyet/SRC vb.).
- **Onaylanan Karar 4 — Mobil Self-Servis Portalı (Telefon + 4 Haneli PIN)**: Personel, mevcut LookPrice ERP hesabına ihtiyaç duymadan işletmenin özel mobil bağlantısından telefon numarası ve 4 haneli PIN ile giriş yapıp QR okutabilecek, mesai/izin/avans özetini görüp talep iletebilecek.
- **Varsayılan Davranış — GPS Olmayan veya Konum Tanımlanmamış Şubeler**: Bir şube/deponun henüz harita koordinatı girilmemişse giriş-çıkış akışı kilitlenmez; kayıt **"Konum Tanımsız (QR Doğrulandı)"** etiketiyle alınır ve yöneticiye konum tanımlama uyarısı gösterilir. Koordinat tanımlı şubelerde yarıçap dışı denemeler engellenir (veya yönetici tercihine göre "Saha / Mesafe Dışı Onay Bekliyor" bayrağıyla işaretlenir).

---

## 1. Genel Bakış & Temel Konsept

- **Ne Yapar?**
  İşletme sahiplerinin ve mağaza/depo yöneticilerinin dağınık Excel tabloları, kağıt puantaj defterleri ve takipsiz avans notları olmadan tüm ekip operasyonunu tek ekrandan yönetmesini sağlar. Şube/depo kadrosundan günlük giriş-çıkış saatlerine, ay sonu net hakedişten resmi özlük belge süre uyarılarına kadar tüm yaşam döngüsünü kapsar.
- **Hedef Kitle & Kullanım Bağlamı**
  - **İşletme Sahibi / Yönetici (Masaüstü & Mobil Panel)**: Şubelerde o an kimin çalıştığını canlı görür, geç kalmaları/fazla mesaileri izler, izin ve avans taleplerini onaylar, tek tıkla bordro kapatıp kasa/banka giderine işler.
  - **Saha / Mağaza / Depo / Mutfak Personeli (Cep Telefonu)**: Uygulama indirmeden mobil tarayıcıdan kapıdaki QR’ı okutarak giriş-çıkış yapar, kendi aylık çalışma saatini, kalan yıllık iznini ve avans durumunu şeffaf biçimde takip eder.
- **Temel Değer**
  Giderler tablosundaki anonim `"Personel Maaş, SGK & Prim"` kalemini canlı insan kaynağı verisine bağlar; mükerrer veri girişini sıfırlar, avans/mesai hesaplama hatalarını ortadan kaldırır ve süresi dolan sağlık/yetki belgelerini önceden yakalar.

---

## 2. Kullanıcı Deneyimi & Görsel Tasarım

### Temel Kullanıcı Akışları

1. **Yönetici — Personel Ekleme & Lokasyon QR Kurulumu**
   - Yönetici sol menüden **Personel & İK** sekmesine girer (tekil, sade başlık — çift başlık yok).
   - **Kadro** alt sekmesinde `Yeni Personel` butonuna basarak kompakt, sayfaya sığan modalda Ad Soyad, Telefon, 4 Haneli Self-Servis PIN, Atandığı Mağaza/Şube/Depo, Görev, Vardiya Saati (ör. `09:00 - 18:00`), Maaş + Para Birimi (bitişik kompakt alan) ve İşe Giriş Tarihi bilgilerini girer. İsterse mevcut bir LookPrice panel kullanıcısıyla eşleştirir.
   - **Puantaj & QR** alt sekmesinde her mağaza ve depo satırında `Konum Ayarla` (mevcut GPS'i al veya enlem/boylam + yarıçap metre gir) ve `Kapı QR Afişi Yazdır` aksiyonu yer alır; tek tıkla A4 dikey, temiz kurumsal afiş yazdırılır.
2. **Personel — Mobil QR + GPS Giriş/Çıkış & Self-Servis**
   - Personel telefon kamerasıyla kapıdaki QR’ı okutur (veya işletmenin mobil personel linkini açar).
   - **Telefon + 4 Haneli PIN** ile saniyeler içinde oturum açar (oturum yalnızca bellek içi güvenli jetonla tutulur).
   - Ana ekranda alt başparmak erişim bölgesinde tek büyük aksiyon butonu görünür: **Giriş Yap** (içerideyse **Mola** / **Çıkış Yap**).
   - Butona basıldığında tarayıcı kamerası QR’ı doğrular (doğrudan kapı QR'ından gelindiyse token otomatik dolu gelir) ve GPS mesafesi sunucuda kontrol edilir; 1 saniye içinde `"08:58 · Ana Mağaza · 18 m mesafe doğrulandı"` onayı gösterilir.
   - Alt navigasyon çubuğundan (`Giriş-Çıkış`, `Puantajım`, `İzinlerim`, `Avans & Maaş`) aylık çalışma saatini, kalan yıllık iznini ve aldığı avansları görür; tek ekrandan **İzin Talebi** veya **Avans Talebi** gönderebilir.
3. **Yönetici — Bordro, Avans & Çift Yönlü Finans Akışı**
   - **Maaş & Avans** alt sekmesinde ay seçici (ör. `Kasım 2026`) tüm aktif personellerin otomatik hakediş tablosunu açar: `Sabit Maaş + Fazla Mesai + Prim + Yol/Yemek − Verilen Avanslar − Ücretsiz İzin = Net Ödenecek`.
   - `Ödeme Yap / Avans Ver` tıklandığında ödeme türü (`Maaş`, `Avans`, `Prim`, `SGK`, `Yol/Yemek`), tutar ve LookPrice **Kasa / Banka Hesabı** seçilir; kayıt hem personelin hesabına hem de **Gelir & Gider / Kasa** tablosuna atomik olarak işlenir.
   - Ters yönde: Yönetici doğrudan **Gelir & Gider / Kasa** ekranında gider eklerken `Personel Maaş, SGK & Prim` kategorisini seçtiğinde otomatik olarak **Personel Seçici** ve **Ödeme Tipi (Maaş/Avans/Prim/SGK)** alanları açılır; kaydedildiğinde personelin İK bordro defterine anında düşer.
4. **Yönetici — İzin Onayı, Özlük Belgeleri & Zimmet**
   - **İzinler** sekmesinde kıdeme göre otomatik yıllık izin hak edişi (`<5 yıl: 14 gün`, `5-15 yıl: 20 gün`, `15+ yıl: 26 gün` — işletmeye göre düzenlenebilir), bekleyen mobil talepler, aynı şubede çakışma uyarısı ve tek tıkla Onayla/Reddet bulunur.
   - **Özlük & Zimmet** sekmesinde (veya personel detay çekmecesinde) resmi belgeler (Kimlik, Sözleşme, SGK İşe Giriş, Sağlık/Hijyen Raporu, Ehliyet/SRC) geçerlilik tarihiyle yüklenir; süresi 30 gün içinde dolacak veya geçmiş belgeler üst şeritte net metin uyarılarıyla sıralanır. Zimmet kalemleri (POS, telefon, anahtar, araç, üniforma) için tek tıkla yazdırılabilir **Zimmet Teslim / İade Tutanağı** üretilir.

### Görsel Kimlik & Tema

- **Estetik Yön**: LookPrice operatör paneliyle tam uyumlu, yüksek bilgi yoğunluklu, sade ve ciddi kurumsal SaaS dili (masaüstünde `%80` ölçek eşdeğeri kompakt tablo/form yerleşimi; mobil personel portalında dış mekan gün ışığında okunabilir, başparmak dostu minimal tasarım).
- **Renk Paleti & Kontrast**:
  - `%60` temiz nötr zemin (`bg-slate-50` / `dark:bg-slate-950`, içerik yüzeyi `bg-white` / `dark:bg-slate-900`), `%30` ince yapısal sınırlar (`border-slate-200` / `dark:border-slate-800`), `%10` aksiyon vurgusu (`slate-900` / `indigo-600`).
  - Semantik durum renkleri yalnızca veri durumu için ve daima açık metin etiketiyle birlikte kullanılır: Yeşil (`#16A34A` — İşyerinde / Onaylı / Geçerli), Kehribar (`#D97706` — Geç Kaldı / Süresi Yaklaşıyor / Bekliyor), Kırmızı (`#DC2626` — Gelmedi / Süresi Doldu / Reddedildi).
  - Tüm koyu/açık yüzeylerde tam zıtlık garantisi; kart içinde kart yasağı, kalın sol şerit yasağı ve durağan metadata için hap/rozet karmaşası yerine sade `·` ayraçlı metin hiyerarşisi.
- **Tipografi & Hiyerarşi**:
  - Mevcut LookPrice sans-serif yazı tipi ailesi korunur; kısa, tek satır başlıklar (`whitespace-nowrap`) ve maksimum 2 ağırlık (Regular 400, SemiBold 600).
  - Tüm saatler, gecikme dakikaları, GPS mesafeleri, maaşlar ve avans bakiyeleri dikey hizalama için `tabular-nums` / monospace rakam düzeniyle sunulur.
- **Bileşen Yerleşimi & Mobil Ergonomi**:
  - **Yönetici Paneli**: Tek satırlık 5’li modül içi sekme şeridi (`Canlı & Puantaj`, `Kadro`, `Maaş & Avans`, `İzinler`, `Özlük & Zimmet`), yanında kompakt KPI özet bandı (`İşyerinde`, `Geç / Eksik`, `Bekleyen Talep`, `Belge Uyarısı`) ve yoğun satır yüksekliğine (`38px-44px`) sahip filtrelenebilir veri tabloları. Sınırlı karakterli alanlar (PIN, Para Birimi, Saat, Yarıçap, Gün Sayısı) kompakt sabit genişlikte gruplanır; tüm modallar ekrana sığar.
  - **Mobil Self-Servis Portalı**: Üstte kompakt `52px` işletme/personel çubuğu, ortada kaydırılabilir durum ve geçmiş alanı, altta en az `44x44px` dokunma hedefli 4’lü alt navigasyon ve ana giriş-çıkış aksiyonu (sabit üst/alt çubukların toplamı ekranın `%15`’ini aşmaz). Masaüstünde açıldığında dar şeride sıkışmaz, düzenli 2 sütunlu görünüme genişler.

### Etkileşimli Geri Bildirim & Durumlar

- Tüm veri ekranlarında tutarlı **iskelet yükleme (skeleton)**, aksiyon butonlu **boş durum** (ör. `"İlk Personeli Ekle"`), anlık **arama/şube/durum filtresi** ve işlem sonrası net **toast bildirimleri** yer alır.
- QR okutma ve GPS doğrulama adımlarında anlık durum geri bildirimi (`Konum alınıyor...` → `Mesafe doğrulandı` veya açıklayıcı konum izni yönlendirmesi) sunulur.

---

## 3. Temel Ürün Kararları & Ödünleşimler

- **Karar 1 — Bağımsız `employees` Varlığı + İsteğe Bağlı Panel Kullanıcı Eşleşmesi**
  - *Seçilen Yaklaşım*: Personel kayıtları mevcut ERP kullanıcılarından (`users`) ayrı, kapsamlı bir İK tablosunda tutulur ve isteğe bağlı `user_id` ile bağlanır.
  - *Neden*: Depo görevlisi, mutfak personeli, şoför veya saha çalışanlarının LookPrice yönetim paneline erişimi olmamalıdır; ancak puantaj, maaş, izin ve özlük takibi eksiksiz yapılmalıdır.
  - *Elenen Alternatif*: Sadece `users` tablosunu genişletmek; bu yaklaşım panel erişimi olmayan personeller için güvenlik riski ve gereksiz yetki karmaşası oluştururdu.

- **Karar 2 — Çift Yönlü Finans Senkronizasyonunda Kaynak Kimliği (`source_type` / `source_id`) Modeli**
  - *Seçilen Yaklaşım*: `portfolio_transactions` tablosuna `employee_id` ve `payroll_item_type` alanları eklenir; İK tarafından yapılan ödemeler `source_type = 'hr_payroll_payment'` ile finans defterine, finans ekranından personel seçilerek girilen `staff_payroll` giderleri ise otomatik olarak İK bordro hareketine bağlanır. Bir tarafta silme/güncelleme yapıldığında bağlı kayıt da tutarlı biçimde güncellenir.
  - *Neden*: LookPrice'ın mevcut kasa/banka senkronizasyon mimarisiyle `%100` uyumludur, çift kayıt (double-counting) riskini sıfırlar ve geçmiş raporları bozmaz.
  - *Elenen Alternatif*: İki ayrı bağımsız gider defteri tutmak; ay sonu kasa mutabakatında tutarsızlık yaratırdı.

- **Karar 3 — Kurulumsuz Mobil Tarayıcı QR + GPS Doğrulama**
  - *Seçilen Yaklaşım*: Ek mobil uygulama mağazası bağımlılığı olmadan standart tarayıcı kamerası (`html5-qrcode`) ve cihaz `Geolocation` API'si kullanılır; her lokasyonun kapı QR'ında şubeye özel yenilenebilir token yer alır ve Haversine mesafe doğrulaması **sunucu tarafında** yapılır.
  - *Neden*: Mağaza ve depo çalışanları telefonuna ek uygulama kurmadan 10 saniyede kullanmaya başlar; doğrulamanın sunucuda yapılması istemci manipülasyonunu önler.
  - *Elenen Alternatif*: Sadece cihaz tarafında mesafe kontrolü yapmak (kolayca aşılabilir) veya ayrı native mobil uygulama geliştirmek (operasyonel kurulum yükü yüksek).

- **Karar 4 — Yeni Paket Kurulumu Olmadan Mevcut Altyapıyı Kullanma**
  - *Seçilen Yaklaşım*: Projede halihazırda kurulu olan QR üretim, kamera QR tarama, parola özetleme, hız sınırlama, dosya yükleme ve Excel dışa aktarma kütüphaneleri kullanılır.
  - *Neden*: Paket şişkinliğini ve derleme riskini sıfırlar; mevcut LookPrice performans standartlarını korur.

---

## 4. Teknik Mimari & Veri Stratejisi *(Teknik Referans)*

### Sistem Mimarisi & Bileşen İlişkisi

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        LOOKPRICE İSTEMCİ KATMANI                           │
├─────────────────────────────────────┬──────────────────────────────────────┤
│  Yönetici Paneli (StoreDashboard)   │  Mobil Personel Self-Servis Portalı  │
│  ┌───────────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Personel & İK Ana Modülü      │  │  │ Telefon + 4 Haneli PIN Girişi  │  │
│  │ • Canlı Pano & Puantaj / QR   │  │  │ • QR Kamera + GPS Giriş/Çıkış  │  │
│  │ • Kadro & Personel Detayı     │  │  │ • Aylık Puantajım              │  │
│  │ • Maaş, Avans & Bordro        │  │  │ • İzinlerim & Talep Oluştur    │  │
│  │ • İzin Yönetimi               │  │  │ • Avans & Ödeme Geçmişim       │  │
│  │ • Özlük Belgeleri & Zimmet    │  │  └───────────────┬────────────────┘  │
│  └───────────────┬───────────────┘  │                  │                   │
│                  │  ┌───────────────┤                  │                   │
│  ┌───────────────▼──▼────────────┐  │                  │                   │
│  │ Gelir & Gider / Kasa Modülü   │  │                  │                   │
│  │ (staff_payroll ↔ Personel)    │  │                  │                   │
│  └───────────────┬───────────────┘  │                  │                   │
└──────────────────┼──────────────────┴──────────────────┼───────────────────┘
                   │ Store JWT (Admin)                   │ Employee Bearer JWT
                   ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS API & GÜVENLİK KATMANI                        │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │ Yönetici İK Uçları           │    │ Mobil Self-Servis Uçları         │  │
│  │ • Kadro, Vardiya, QR/GPS     │    │ • Hız Sınırlı PIN Giriş + Çıkış  │  │
│  │ • Puantaj & Aylık Özet       │    │ • Sunucu Taraflı QR + Haversine  │  │
│  │ • Bordro & Finans Senkronu   │    │   GPS Mesafe Doğrulama           │  │
│  │ • İzin Onay & Özlük/Zimmet   │    │ • Kendi İzin / Avans Talepleri   │  │
│  └──────────────┬───────────────┘    └────────────────┬─────────────────┘  │
│                 └──────────────────┬──────────────────┘                    │
│                                    ▼                                       │
│                   Çift Yönlü Finans Senkron Servisi                        │
│             (hr_payroll_ledger ↔ portfolio_transactions)                   │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL VERİ KATMANI                            │
│  stores (mevcut şube/depo + QR/GPS) ──► hr_employees ──► hr_attendance     │
│                                            │                               │
│        ┌───────────────────┬───────────────┼───────────────┐               │
│        ▼                   ▼               ▼               ▼               │
│  hr_payroll_ledger     hr_leaves     hr_documents      hr_assets           │
│        │                                                                   │
│        └── (çift yönlü bağ) ──► portfolio_transactions & kasa/banka        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Veri Modeli & İlişkiler

- **Lokasyon & QR Kontrol Noktaları (`hr_location_checkpoints`)**: Mevcut `stores` (ana mağaza, şubeler, depolar) kayıtlarına bağlanır; her lokasyon için benzersiz yenilenebilir `qr_token`, enlem (`latitude`), boylam (`longitude`), izin verilen yarıçap (`radius_meters`, varsayılan `150`), katı GPS kuralı bayrağı ve çalışma saatleri tutulur.
- **Personel Kartı (`hr_employees`)**: `store_id`, `branch_id` (atanan şube/depo), isteğe bağlı `user_id`, ad soyad, TCKN/pasaport, telefon, sunucuda özetlenmiş 4 haneli `pin_hash`, görev/departman, çalışma tipi, işe giriş/çıkış tarihi, vardiya başlangıç-bitiş (`shift_start`, `shift_end`, gecikme toleransı dk), net/brüt maaş + para birimi, günlük yemek/yol desteği, IBAN, acil durum bilgisi ve aktiflik durumu.
- **Puantaj & Giriş-Çıkış Kayıtları (`hr_attendance_logs`)**: `employee_id`, `branch_id`, tarih, `check_in_at`, `check_out_at`, `break_minutes`, giriş/çıkış GPS koordinatları, hesaplanan mesafe (metre), doğrulama durumu (`qr_gps_verified`, `qr_only`, `out_of_range`, `manual_admin`), otomatik hesaplanan `late_minutes`, `early_leave_minutes`, `overtime_minutes` ve toplam çalışma dakikası.
- **Maaş, Avans, Prim & SGK Defteri (`hr_payroll_ledger`)**: `employee_id`, dönem (`YYYY-MM`), kalem türü (`salary`, `advance`, `bonus`, `sgk`, `meal_transport`, `overtime`, `deduction`), tutar, para birimi, durum (`pending_request`, `approved`, `paid`, `rejected`), ödeme tarihi, Kasa/Banka hesap kimliği ve çift yönlü bağlı `portfolio_transaction_id`.
- **İzin & Rapor Talepleri (`hr_leave_requests`)**: `employee_id`, izin türü (`annual`, `sick`, `excuse`, `unpaid`, `parental`), başlangıç-bitiş tarihi, iş günü sayısı, açıklama, durum (`pending`, `approved`, `rejected`), onaylayan yönetici ve not.
- **Özlük Belgeleri (`hr_documents`)**: `employee_id`, belge tipi (sektöre göre hazır şablonlar: Kimlik, İş Sözleşmesi, SGK İşe Giriş, Adli Sicil, Sağlık/Hijyen Raporu, Ehliyet/SRC, MYK Yetki Belgesi), dosya referansı, geçerlilik/bitiş tarihi ve not.
- **Zimmet Kayıtları (`hr_assets`)**: `employee_id`, demirbaş adı, kategori (Telefon, POS, Anahtar, Araç, Bilgisayar, Üniforma), seri/plaka no, teslim tarihi, iade tarihi, durum (`assigned`, `returned`, `damaged`) ve açıklama.
- **Finans Bağlantısı (`portfolio_transactions` genişletmesi)**: Mevcut gider/kasa tablosuna `employee_id` ve `payroll_item_type` sütunları eklenerek geriye dönük tam uyumlulukla çift yönlü bağlantı kurulur.

### Etkileşimli Bileşen & Durum Haritası

- **Canlı Pano & Puantaj Akışı**: Tarih veya ay filtresi değiştirildiğinde günlük/aylık puantaj listesi ve canlı `"Şu An İşyerinde"` sayacı güncellenir; yönetici eksik çıkış veya unutulan girişler için `Manuel Düzelt` modalıyla gerekçeli kayıt açabilir, tek tıkla Excel puantaj dışa aktarabilir ve her şube/depo için A4 QR afişini yazdırabilir.
- **Kadro & Personel Detay Çekmecesi**: Şube/depo, durum ve arama filtreleriyle kadro listelenir; bir personele tıklandığında sağdan açılan detay panelinde tek ekrandan özlük bilgileri, son puantajları, avans/maaş geçmişi, izin bakiyesi, belgeleri ve zimmetleri yönetilir; tek tıkla self-servis linki ve PIN sıfırlama paylaşılır.
- **Bordro & Çift Yönlü Finans Akışı**: Ay seçildiğinde tüm aktif çalışanların maaş + mesai + prim − avans − ücretsiz izin hesabı canlı özetlenir. `Öde & Gidere İşle` veya `Avans Ver` gönderildiğinde veritabanı işlemi içinde hem İK hareketi hem `portfolio_transactions` gideri oluşturulur. Finans modülünde `staff_payroll` seçildiğinde aktif personel listesi yüklenir; işlem kaydedildiğinde/düzenlendiğinde/silindiğinde İK bordro satırı eşzamanlı güncellenir.
- **İzin & Özlük/Zimmet Akışı**: Bekleyen mobil izin/avans talepleri tek tıkla onaylanır veya reddedilir; aynı şubede tarih çakışması varsa onay öncesi uyarı gösterilir. Belge yükleme formu dosya boyut/tip doğrulaması yapar ve geçerlilik tarihi yaklaşanları üst özet şeridinde öne çıkarır.
- **Mobil Self-Servis Akışı**: Kapı QR'ındaki bağlantı açıldığında mağaza adı ve lokasyon kodu otomatik tanınır; Telefon + PIN doğrulaması ardından aktif vardiya durumuna göre `Giriş Yap`, `Mola Başlat/Bitir` veya `Çıkış Yap` aksiyonları anlık GPS kontrolüyle çalışır; izin ve avans talepleri anında yönetici paneline düşer.

### Güvenlik & Dayanıklılık Korumaları

- **PIN & Mobil Oturum Güvenliği**: 4 haneli personel PIN'leri veritabanında asla düz metin saklanmaz (tuzlu özetleme ile doğrulanır); mobil giriş ucu IP ve telefon bazlı hız sınırlama ve ardışık hatalı deneme kilidi ile korunur. Mobil oturum jetonları yalnızca ilgili mağaza ve personel kimliğine kısıtlıdır, React belleğinde taşınır ve yönetici oturumuna karışmaz.
- **Sorgu ve Erişim İzolasyonu**: Tüm İK veritabanı sorguları parametreli olarak yazılır ve her uçta mağaza sahipliği (`store_id`) sunucu tarafında zorunlu doğrulanır; şubeler arası veri sızıntısı engellenir.
- **Güvenli Belge Saklama**: Yüklenen özlük dosyaları izinli uzantı/MIME (PDF, JPG, PNG, WEBP) ve boyut sınırı (10 MB) kontrolünden geçer, rastgele adlandırmayla dış erişime kapalı dizinde saklanır ve yalnızca yetkili mağaza yöneticisi tarafından sunucu kontrolüyle indirilebilir.
