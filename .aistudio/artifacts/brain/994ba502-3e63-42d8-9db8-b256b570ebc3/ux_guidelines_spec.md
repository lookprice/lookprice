# LOOKPRICE & ENRAKİPSİZ - MİMARİ VE UI/UX GÖRÜNÜM ŞARTNAMESİ (KARA KAPLI DEFTER)

Bu şartname; LookPrice, Enrakipsiz ve tüm sektörel dikey ekosistemlerin (ShopLP, HoReCaLP, REstateLP, AutoLP, BookLP, HotelLP) geliştirme süreçlerinde **"Amatör Hata Yok"** prensibiyle uygulanacak zorunlu mühendislik ve tasarım yasalarını belirler.

---

## 1. VIEWPORT & MODAL TAŞMA KORUMA PROTOKOLÜ (Viewport-Fit Modal Protocol)

- **Kural 1.1 (Maksimum Yükseklik ve Kaydırma Zorunluluğu)**:
  - Tüm açılır pencereler (Modaller, Drawer'lar, Sheet bileşenleri), ekran yüksekliğinin tamamını bloke edemez.
  - Sabit modal kapsayıcıları kesinlikle `max-h-[85vh]` ila `max-h-[92vh]` aralığında sınırlandırılmalı ve içerik uzun olduğunda kullanıcıyı sıkıştırmadan akıcı bir şekilde kaydırmak için `overflow-y-auto` (özel scrollbar ile) tanımlanmalıdır.
  - Alt kısımdaki aksiyon butonları (`Kaydet`, `Gönder`, `Kapat`) form içeriği uzasa bile esnek veya sticky alt yapı ile her zaman görünür/erişilebilir kalmalıdır.

- **Kural 1.2 (Responsive Izgara ve Kompakt Input Standardı)**:
  - Karakter sınırı belli olan dar alanlar (barkod, KDV, para birimi, miktar, oranlar) asla devasa grid sütunları işgal edemez.
  - Operatör panelleri (SuperAdmin, StoreDashboard, StaffDashboard) harici müşteri web siteleri hariç olmak üzere, yatay ve dikey kaydırmayı en aza indiren **Yüksek Bilgi Yoğunluğu (%80 Zoom Eşdeğeri Minimalist Operatör Standardı)** ile tasarlanmalıdır.

---

## 2. OPERATÖR İŞ AKIŞI VE FİLTRE KALICILIK PROTOKOLÜ (Zero-Filter-Wipeout & Context Preservation Protocol)

- **Kural 2.1 (Arama ve Filtrelerin Sıfırlanma Yasağı - "Anti-Reset Guard")**:
  - Operatör bir listede (Alış Faturaları, Satış Faturaları, e-İrsaliyeler, Cariler, Ürünler) arama çubuğuna bir firma, fatura no, ürün adı veya barkod yazdığında, ilgili kaydı inceleyip/düzenleyip **KAYDETTİĞİNDE VEYA SİLDİĞİNDE ARAMA FİLTRESİ KESİNLİKLE SIFIRLANAMAZ**.
  - Liste, kullanıcının filtrelediği arama terimiyle kalmaya devam etmeli; arka plandaki tazelemeler (`fetchInvoicesData`, `fetchData`) mevcut arama terimini (`activeSearch || search`) zorunlu parametre olarak taşımalıdır.

- **Kural 2.2 (localStorage & URL Query Senkronizasyonu)**:
  - Operatörün arama terimi bileşen bazında `localStorage` (`purchase_search_${storeId}`, `sales_search_${storeId}`, `waybills_search_${storeId}`, `companies_search_${storeId}`) ile korunmalı; sayfa yenilense veya sekmeler arası geçiş yapılsa dahi operatör kaldığı yerden devam edebilmelidir.
  - Arama girdi alanları üzerinde, operatörün istediği an aramayı tek tıkla sıfırlayabileceği entegre **'X' Temizleme Butonu** bulunmalıdır. Arama sadece kullanıcı bilerek bu butona bastığında veya metni sildiğinde temizlenir.

- **Kural 2.3 (Çift Katmanlı Arama Koruması - Client-Side Search Defense)**:
  - Sunucu yanıtı geniş veya önbelleksiz dönse dahi, `filteredInvoices` / `filteredItems` `useMemo` seviyesinde istemci tarafı filtreleme (`normalizeSearch`) devrede olmalı; filtre dışındaki hiçbir yabancı satır operatörün ekranına fırlamamalıdır.

---

## 3. OTOMATİK TESPİT VE GÜVENCE MEKANİZMALARI (Yüksek Teknoloji Test Protokolü)

Panellerde ve web sitelerinde ekrana sığmama, taşma veya butonlara erişememe problemlerini manuel kontrole bırakmadan otomatik olarak tespit etmek ve önlemek için aşağıdaki mühendislik katmanları devreye alınmıştır:

### A. CSS / Tailwind Derleme Seviyesinde Statik Kontrol (`Overflow & Viewport Guard`)
- Geliştirme esnasında Tailwind sınıflarında `overflow-y-auto` ve `max-h-[...]` içermeyen modal bileşenleri linter seviyesinde uyarılır.

### B. Otomatik Playwright / Puppeteer "Viewport Stress Test" Otomasyonu
- Her build aşamasında (`npm run build`), testbot otomatik olarak tüm kritik modalları (`DemoModal`, `RealEstateModal`, `AutoModal`, `FastPosModal`) farklı ekran çözünürlüklerinde (`1366x768`, `1280x800`, mobil `390x844`) açar.
- **Buton Erişilebilirlik Testi**: Modal içindeki birincil CTA butonlarının (`Talebi Gönder`, `Kaydet`) viewport sınırları içinde ve tıklanabilir (`is_visible_in_viewport`) olduğunu doğrular. Eğer buton ekrandan taşmışsa build otomatik olarak durdurulur ve hata raporlanır.

### C. Zıtlık ve Okunabilirlik Kontrolü (Contrast Guardian)
- Koyu arka planlar (`bg-slate-900`, `bg-black`) üzerinde her zaman açık renk metinler (`text-white`, `text-slate-100`), açık arka planlar üzerinde ise koyu renk metinler (`text-slate-900`) zorunludur. Görünmez veya düşük kontrastlı metin kombinasyonları otomatik olarak engellenir.

---

## 4. GELİŞTİRİCİLER İÇİN ALTIN KURALLAR (Commit Öncesi Checklist)
1. **Modal Yazarken**: `max-h-[90vh] overflow-y-auto` sınıflarını ekledin mi?
2. **Form Tasarlarken**: Uzun formlarda butonlar en altta sabit mi kalıyor, yoksa klavye/ekran yüksekliğinde kayboluyor mu?
3. **Filtre & Arama**: Kayıt kaydetme/silme sonrasında operatörün arama filtresi korundu mu? Sayfa yenilendiğinde filtre sıfırlanıyor mu?
4. **Sektörel İzolasyon**: shopLP pazaryeri özellikleri horecaLP veya emlak/otomotiv modüllerine sızdı mı?
5. **Fiyat ve Değerler**: Binlik ayraç (`1.250.000 ₺`) formatı uygulandı mı?
