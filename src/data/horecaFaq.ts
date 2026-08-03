export const horecaFaq = [
    {
      id: 'offline_mode',
      category: 'genel',
      status: 'active',
      q: 'İnternet kesildiğinde veya çevrimdışı (offline) modda sistem çalışmaya devam eder mi?',
      a: 'Evet. LookPrice altyapısı, kesintisiz çalışma garantisi (offline-first) sunar. İnternet bağlantınız kopsa dahi terminal ve el terminalleriniz sipariş almaya, adisyon açmaya, masa durumlarını güncellemeye ve yerel ağ üzerinden haberleşmeye devam eder. İnternet bağlantısı geri geldiğinde, tüm veriler bulut sunucularımızla arka planda otomatik ve güvenli bir şekilde eşitlenir.'
    },
    {
      id: 'realtime_sync',
      category: 'siparis_odeme',
      status: 'active',
      q: 'Anlık senkronizasyon nasıl çalışıyor? Bir garsonun açtığı adisyona diğer garsonlar sipariş ekleyebilir mi?',
      a: 'Evet. LookPrice, tüm terminaller arasında tam zamanlı çift yönlü senkronizasyon (real-time state sync) kullanır. Bir garsonun bir masada açtığı adisyona veya girdiği siparişe, yetkisi dahilindeki diğer tüm garsonlar ve kasa yetkilisi anlık olarak kendi ekranlarından erişebilir, yeni sipariş ekleyebilir veya güncel masa hesabını görüntüleyebilir. Çakışmalar sistem tarafından otomatik olarak engellenir.'
    },
    {
      id: 'split_payment',
      category: 'siparis_odeme',
      status: 'active',
      q: 'Masa başında hesap isteme, hesap bölme ve Alman Usulü ödeme paylaşımı yapılabiliyor mu?',
      a: 'Evet. LookPrice Hızlı POS ve Restoran arayüzünde gelişmiş Alman Usulü hesap bölme ve parçalı tahsilat özellikleri mevcuttur. Adisyondaki sipariş kalemlerini kişi sayısına göre eşit bölebilir veya dilediğiniz ürünleri seçerek kısmi ödeme (Nakit, Kredi Kartı veya her ikisi birden) alabilirsiniz. Kalan bakiye sistem tarafından otomatik olarak hesaplanır.'
    },
    {
      id: 'digital_menu_order',
      category: 'menu_masa',
      status: 'active',
      q: 'Müşteriler için QR dijital menünüz var mı? Menü üzerinden doğrudan sipariş verilebiliyor mu?',
      a: 'Evet, gelişmiş bir temassız QR Dijital Menü modülümüz mevcuttur. Müşterileriniz masadaki QR kodu telefon kamerasıyla okutarak menünüze anında ulaşır. Yönetim panelinizden yapacağınız tek bir ayarla menüyü sadece "Görsel Katalog" olarak kullanabileceğiniz gibi, müşterilerinizin doğrudan masadan sipariş verebileceği interaktif "Masadan Sipariş" özelliğini de aktif edebilirsiniz.'
    },
    {
      id: 'menu_details',
      category: 'menu_masa',
      status: 'active',
      q: 'Dijital Menülerde ürün içerikleri, gramajları, alerjenleri ve ürün seçeneklerini görebiliyor muyuz?',
      a: 'Kesinlikle. QR Dijital Menü sistemimiz zengin içerik desteğine sahiptir. Her bir ürünün malzeme detaylarını, porsiyon/gramaj bilgilerini ve alerjen uarılarını ekleyebilirsiniz. Ayrıca pişme derecesi, sos seçimi veya ekstra malzeme gibi dinamik varyasyon grupları tanımlayarak müşterilerinizin siparişlerini tamamen özelleştirilmiş şekilde vermesini sağlayabilirsiniz.'
    },
    {
      id: 'happy_hours',
      category: 'menu_masa',
      status: 'active',
      q: 'Sistemde Happy Hours (Süreli Kampanya/Tarife) tanımlaması yapılabiliyor mu?',
      a: 'Evet. Haftanın belirli günlerinde ve günün seçtiğiniz saat aralıklarında geçerli olacak özel fiyat listeleri ve Happy Hour kuralları oluşturabilirsiniz. Belirlediğiniz saat geldiğinde sistem fiyatları otomatik olarak günceller ve süre tamamlandığında ek bir insan müdahalesine gerek kalmaksızın standart menü fiyatlarına sorunsuz şekilde geri döner.'
    },
    {
      id: 'kitchen_routing',
      category: 'genel',
      status: 'active',
      q: 'Bar ve Mutfak sipariş ayrımı yapılabiliyor mu? Tek adisyondan farklı bölümlere order emri yazdırılabilir mi?',
      a: 'Evet. Gelişmiş sipariş yönlendirme motorumuz sayesinde adisyondaki tüm kalemler departmanlarına göre filtrelenir. Örneğin, tek bir adisyon onaylandığında içecek siparişleri bar yazıcısına, yemek siparişleri ise mutfak ekranına veya mutfak yazıcısına saniyeler içinde otomatik olarak yönlendirilir ve mutfak fişi basılır.'
    },
    {
      id: 'role_permissions',
      category: 'guvenlik_yetki',
      status: 'active',
      q: 'Garsonların ve Kasiyerlerin yetki sınırlandırması yapılabiliyor mu? IP ve yönetsel kısıtlamalar var mı?',
      a: 'Evet. LookPrice üzerinde personel rollerini (Yönetici, Şef Garson, Garson, Kasiyer) milimetrik düzeyde yetkilendirebilirsiniz. Adisyon iptali, ikram, iskonto veya iade gibi işlemler yalnızca yönetici şifresi veya yetkili onayıyla yapılabilir. Ayrıca, garsonların sadece işletme içindeki yerel Wi-Fi ağına (IP kısıtlaması) bağlıyken sipariş alabilmesini sağlayarak güvenlik duvarınızı güçlendirebilirsiniz.'
    },
    {
      id: 'recipe_bom_conversion',
      category: 'stok_recete',
      status: 'active',
      q: 'Kokteyl veya yemeklerde, ürünü oluşturan malzemelerin stok takibi için reçete (BOM) ve gramaj dönüştürme yapılabiliyor mu?',
      a: 'Evet. "Malzeme Yapısı (Reçete / BOM)" modülümüz sayesinde kokteyl, sos veya ana yemekler için mililitre, gram veya adet bazında hassas reçeteler tanımlayabilirsiniz. Örneğin bir kokteyl satıldığında reçetedeki alkol miktarı mililitre olarak, garnitürler ise adet olarak ana stoktan milisaniyeler içinde düşer. Bu sayede maliyet ve fire oranlarınızı kuruşu kuruşuna kontrol edebilirsiniz.'
    },
    {
      id: 'product_variants',
      category: 'stok_recete',
      status: 'active',
      q: 'Ürünlerin çeşitlerini ve seçeneklerini tanımlayarak stok takibi yapabiliyor muyuz?',
      a: 'Evet. Bir ürüne dilediğiniz kadar varyasyon grubu (örn. Boyut, Ekstra Sos, Ekstra Peynir) ekleyebilirsiniz. Her bir varyasyon seçeneği için ayrı bir ek fiyat veya maliyet tanımlayabileceğiniz gibi, varyasyon seçimlerine özel stok düşüm kuralları ve barkodlar tanımlayarak stok kartlarınızı kusursuz şekilde yönetebilirsiniz.'
    },
    {
      id: 'reports_analytics',
      category: 'siparis_odeme',
      status: 'active',
      q: 'Ürün bazlı satış, maliyet ve ciro analiz raporları mevcut mu?',
      a: 'Evet. Yönetim panelinizde yer alan akıllı raporlama modülü ile en çok satan ürünleri, en yüksek ciro getiren kategorileri, garson performanslarını, saatlik yoğunluk haritalarınızı ve net kârlılık grafiklerinizi anlık olarak görüntüleyebilirsiniz. Raporları dilediğiniz tarih aralığına göre süzüp PDF veya Excel olarak dışa aktarabilirsiniz.'
    },
    {
      id: 'online_order_system',
      category: 'menu_masa',
      status: 'active',
      q: 'Online paket servis sipariş sisteminiz var mı?',
      a: 'Evet. İşletmenize özel olarak oluşturulan sipariş web arayüzü sayesinde, harici yemek platformlarına fahiş komisyonlar ödemeden, doğrudan kendi müşterilerinizden "Paket Servis" ve "Gel-Al" siparişleri alabilirsiniz. Gelen siparişler doğrudan Kasa / POS ekranınıza bir bildirim sesiyle düşer ve onayınızla mutfağa yönlendirilir.'
    },
    {
      id: 'pos_cash_registers',
      category: 'siparis_odeme',
      status: 'active',
      q: 'Yeni nesil yazar kasa ve fiziksel POS cihazlarını sisteme tanımlayabiliyor muyuz?',
      a: 'Evet. "POS Bridge" akıllı entegrasyon altyapımız sayesinde Türkiye piyasasındaki önde gelen yeni nesil yazar kasa POS (Beko, Profilo, Ingenico vb.) cihazlarıyla tam entegre çalışıyoruz. Masada ödeme tamamlandığında tutar otomatik olarak POS cihazına aktarılır ve tahsilat sağlandığında mali yazar kasa fişi otomatik olarak basılır.'
    },
    {
      id: 'supply_chain_planning',
      category: 'stok_recete',
      status: 'planned',
      q: 'Stok tedarik planlama ve otomatik tedarik öneri sisteminiz var mı?',
      a: 'Ar-Ge ve Planlama Aşamasında: Tedarik zincirinizi baştan uca dijitalleştirecek "Akıllı Tedarik Planlama" modülümüz üzerinde çalışmalarımız devam etmektedir. Yakın zamanda devreye alacağımız bu modül ile geçmiş satış trendleriniz ve stok tüketim hızınız analiz edilecek; kritik seviyeye yaklaşan ham maddeler için sistem size otomatik olarak tedarikçi sipariş formu ve satın alma önerileri hazırlayacaktır.'
    },
    {
      id: 'stock_alarms',
      category: 'stok_recete',
      status: 'active',
      q: 'Stok reçete takibinde kritik stok seviyesi uyarısı ve stok raporları alınabiliyor mu?',
      a: 'Evet. Her ürün ve ham madde için ayrı ayrı "Kritik Stok Seviyesi" belirleyebilirsiniz. Stok miktarı belirlediğiniz güvenli sınırın altına düştüğünde sistem size ve yöneticilere panel üzerinden anlık uyarı bildirimi gönderir. Günlük, haftalık veya aylık stok hareket raporları alarak kayıp ve kaçakların tamamen önüne geçebilirsiniz.'
    },
    {
      id: 'table_management',
      category: 'menu_masa',
      status: 'active',
      q: 'Görsel Masa Yönetim sistemi, masa taşıma ve canlı doluluk takibi mevcut mu?',
      a: 'Evet. Restoranınızın fiziki yerleşim planına göre özelleştirilebilen interaktif masa yönetim haritamız mevcuttur. Masaların doluluk oranlarını, içerideki müşterilerin kalış sürelerini ve hesap durumlarını canlı renk kodlarıyla izleyebilirsiniz. Sürükle-bırak kolaylığı ile masa birleştirebilir, başka masaya adisyon aktarabilir veya masa transferi yapabilirsiniz.'
    },
    {
      id: 'speed_and_security',
      category: 'genel',
      status: 'active',
      q: 'LookPrice adisyon altyapısı ne kadar hızlı ve verilerimiz ne kadar güvende?',
      a: 'LookPrice, ultra hızlı veri tabanı motoru ve modern web teknolojileri (SPA) üzerine inşa edilmiştir. Yoğun saatlerde dahi adisyon açma ve sipariş gönderme işlemleri milisaniyeler içinde gerçekleşir, donma veya kasma yaşanmaz. Tüm verileriniz bankacılık seviyesinde SSL şifreleme ile korunur ve bulut sunucularımızda çift yedekli olarak anlık kopyalanır.'
    },
    {
      id: 'qr_table_bell',
      category: 'menu_masa',
      status: 'active',
      q: 'QR Kod masa yönetim sisteminde garson çağırma veya hesap isteme özellikleri var mı?',
      a: 'Evet. Her masa için üretilen özel QR kodlar sadece menü görüntülemeye yaramaz. Müşterileriniz QR menüyü okuttuklarında ekranda yer alan "Garson Çağır", "Hesap İste" veya "Yardım" butonlarına tıklayabilirler. Bu çağrılar, masanın numarasıyla birlikte ilgili garsonun akıllı saatine veya el terminali ekranına anında bildirim olarak iletilir.'
    },
    {
      id: 'auto_service_fees',
      category: 'siparis_odete',
      status: 'in_development',
      q: 'Adisyonlara otomatik eklenebilecek servis bedeli, kuver ve bahşiş tanımlanabiliyor mu?',
      a: 'Geliştirme Aşamasında: Adisyon toplamına yüzde (%) olarak veya kişi başı sabit ücret şeklinde eklenebilecek Servis Bedeli, Kuver ve Bahşiş (Tip) yönetim modülümüzün geliştirme çalışmaları devam etmektedir. Çok yakında dilediğiniz masalara veya genel siparişlere otomatik kuver ekleme kurallarını panelinizden kolayca yönetebileceksiniz.'
    }
  ];
  
