export const shopFaq = [
  {
    id: 'barcode_scanner',
    category: 'stok_perakende',
    status: 'active',
    q: 'ShopLP fiziksel barkod okuyucu cihazlar ve barkod yazıcılar ile tam uyumlu çalışıyor mu?',
    a: 'Evet. ShopLP standart USB ve kablosuz Bluetooth barkod okuyucular ile tak-çalıştır şeklinde uyumludur. Hızlı satış ekranında ürün barkodunu okuttuğunuz anda ürün milisaniyeler içinde sepete eklenir. Ayrıca ürün kartlarından otomatik barkod oluşturabilir ve etiket yazıcınızdan barkod çıktıları basabilirsiniz.'
  },
  {
    id: 'fast_pos_retail',
    category: 'satis_kasa',
    status: 'active',
    q: 'Hızlı POS satış ekranında barkodsuz ürünleri de dokunmatik butonlarla kolayca satabilir miyiz? Entegre yazar kasa desteği var mı?',
    a: 'Evet. Hızlı satış ekranını tamamen özelleştirebilirsiniz. Barkodu olmayan veya manav, pastane gibi terazi ile satılan ürünlerinizi ana ekranınıza kısayol butonu olarak ekleyebilir, renk kodları ve özel ikonlar atayarak tek bir dokunuşla sepete aktarabilirsiniz. Ayrıca sistemimiz, yeni nesil entegre edilebilir yazar kasa/POS cihazları ile tam uyumlu çalışarak kasa süreçlerini kısaltır.'
  },
  {
    id: 'stock_alarms_retail',
    category: 'stok_perakende',
    status: 'active',
    q: 'Kritik stok seviyesi alarmı var mı? Ürünler tükenmeye yaklaştığında uyarı alıyor muyuz?',
    a: 'Evet. Her ürün veya varyasyon için ayrı ayrı minimum stok sınırı (alarm seviyesi) belirleyebilirsiniz. Ürün adedi bu sınırın altına düştüğünde sistem size anlık uyarı bildirimi gönderir ve tedarik raporlarında bu ürünleri otomatik listeler.'
  },
  {
    id: 'multi_currency_pricing',
    category: 'satis_kasa',
    status: 'active',
    q: 'Mağazamızda Euro, GBP veya USD ile de ödeme alabiliyor muyuz? Para üstünü dilediğimiz kurda hesaplayabiliyor mu?',
    a: 'Evet. ShopLP çoklu dövizli kasa yönetimini destekler. Ürün fiyatlarınız TL dahi olsa, müşteriniz ödemeyi Euro veya Dolar ile yapmak istediğinde sistem anlık Merkez Bankası kuruna göre ödenecek döviz tutarını hesaplar. Müşteriye verilecek para üstünü dilediğiniz para biriminde görebilirsiniz.'
  },
  {
    id: 'customers_debts_tracking',
    category: 'finans_cari',
    status: 'active',
    q: 'Müşterilerimize veresiye / cari hesap açabiliyor muyuz? Borç takibini nasıl yapıyoruz?',
    a: 'Evet. ShopLP gelişmiş bir Cari Hesap yönetim modülüne sahiptir. Güvendiğiniz müşterilerinize özel cari kartlar açarak yaptıkları alışverişleri "Veresiye / Borç" olarak kaydedebilirsiniz. Müşterinin toplam borç limiti, geçmiş ödemeleri ve bakiye dökümü tek ekranda izlenir, istendiğinde WhatsApp üzerinden borç ekstresi gönderilir.'
  },
  {
    id: 'e_invoice_integration',
    category: 'finans_cari',
    status: 'active',
    q: 'Satış sonrasında e-Fatura, e-Arşiv faturası kesebiliyor muyuz? Entegratör bağlantısı var mı?',
    a: 'Evet. ShopLP entegre e-belge modülü sayesinde yaptığınız satışları doğrudan entegratör (Mysoft vb.) altyapısı üzerinden resmi e-Fatura veya e-Arşiv faturasına dönüştürebilirsiniz. Satış anında TC/Vergi numarası girerek faturayı saniyeler içinde resmileştirip müşterinize e-posta ile ulaştırabilirsiniz.'
  },
  {
    id: 'variants_management',
    category: 'stok_perakende',
    status: 'active',
    q: 'Giyim veya ayakkabı mağazaları için beden, renk gibi zengin varyasyon ve stok takibi yapılabiliyor mu?',
    a: 'Evet. Tek bir ana ürün kartı altında dilediğiniz kadar varyasyon kırılımı (örn: M Beden - Kırmızı, L Beden - Mavi) tanımlayabilirsiniz. Her bir varyasyon의 barkodu, stok adedi ve fiyatı birbirinden bağımsız olarak saklanır ve satışı gerçekleştirildiğinde tam isabetli stok düşümü yapılır.'
  },
  {
    id: 'einvoice_vat_grouping',
    category: 'finans_cari',
    status: 'active',
    q: 'Çok kalemli satış faturalarında KDV hesaplamaları ve fatura satırları nasıl gruplanıyor?',
    a: 'ShopLP resmi kurallarla uyumludur. Satış faturalarında her kalem için ayrı ayrı KDV satırı oluşturmak yerine, aynı KDV oranına sahip ürünlerin vergileri otomatik olarak gruplanır (örn: %10 ve %20 ayrı ayrı gruplanır). Bu sayede faturanız kusursuz bir şekilde onaylanır.'
  },
  {
    id: 'incoming_invoice_view',
    category: 'finans_cari',
    status: 'active',
    q: 'Tedarikçilerimizden gelen Alış (Gelen) e-faturalarını sistemde nasıl görüyoruz? Otomatik stok kaydı yapar mı?',
    a: 'Gelen e-faturalar entegratör üzerinden orijinal formatında, geldiği gibi ham HTML olarak temiz bir şekilde ekrana yansıtılır. En önemlisi, hem Alış hem de Satış faturalarından (e-fatura ve manuel fatura) sistem otomatik cari hesap ve stok kayıtlarını oluşturur. Bu sayede manuel veri girişiyle ekstra iş yükü tamamen ortadan kalkar.'
  },
  {
    id: 'tech_service_mgmt',
    category: 'stok_perakende',
    status: 'active',
    q: 'Teknik Servis Yönetimi nasıl çalışır? Servis süreçlerini nasıl faturalandırabiliriz?',
    a: 'Gelişmiş Teknik Servis Modülü ile arızalı ürün kabullerini gerçekleştirebilir, dijital servis fişleri hazırlayabilirsiniz. Müşterilerinize SMS veya e-posta ile anlık durum bilgilendirmesi yapabilir, servis raporları ve fiyat teklifleri gönderebilirsiniz. Müşterinin onay veya ret durumuna göre süreç otomatik ilerler ve nihai olarak tek tıkla taslak satış faturası oluşturulur. Ayrıca müşterilerin detaylı servis geçmişi saklanarak geçmişe dönük olası uyuşmazlıkların önüne geçilir.'
  },
  {
    id: 'price_quotation_system',
    category: 'satis_kasa',
    status: 'active',
    q: 'Fiyat Teklif Sistemi ve online onay akışı nasıl işlemektedir?',
    a: 'Müşterileriniz için hızlıca profesyonel kurumsal fiyat teklifleri hazırlayabilirsiniz. Oluşturulan bu teklifleri müşterilerinize ister PDF belgesi olarak, ister interaktif dijital onay linki olarak saniyeler içerisinde iletebilirsiniz. Müşteri online teklif linkinden "Onayla" butonuna bastığı an, sistem teklifi otomatik olarak Taslak statüsünde resmi satış faturasına dönüştürür.'
  },
  {
    id: 'stock_movement_ledger',
    category: 'stok_perakende',
    status: 'active',
    q: 'Stok hareket ekstresi ile geçmişe dönük stok ve talep analizi yapılabilir mi?',
    a: 'Evet. Stok Hareket Ekstresi sayesinde her bir ürünün hangi tarihte, hangi şubeden ne kadar satıldığını, ne miktarda alış faturasıyla depoya girdiğini veya şubeler arası sevk edildiğini tarih tarih listeleyebilirsiniz. Bu ekstreler sayesinde geçmiş dönem hareketlerini izleyebilir ve ürünlerin mevsimsel talep durumlarını kolayca analiz edebilirsiniz.'
  },
  {
    id: 'bulk_price_updates',
    category: 'stok_perakende',
    status: 'active',
    q: 'Döviz dalgalanmalarına karşı toplu fiyat değiştirme özelliği mevcut mu?',
    a: 'Evet. Toplu Fiyat Güncelleme aracı sayesinde, piyasadaki anlık fiyat ve kur dalgalanmalarına karşı saniyeler içerisinde binlerce ürünün fiyatına müdahale edebilirsiniz. Belirli bir markanın, kategorinin veya şubenin ürünlerine yüzde (%) ya da sabit tutar bazında toplu zam veya indirim uygulayabilirsiniz.'
  },
  {
    id: 'expense_centers_tracking',
    category: 'finans_cari',
    status: 'active',
    q: 'İşletme giderlerimizi ürünlerle ilişkilendirip gider yerlerine göre takip edebilir miyiz?',
    a: 'Evet. Sistemde dilediğiniz kadar Gider Yeri (reklam, kira, lojistik vb.) tanımlayarak şirket harcamalarınızı kategorize edebilirsiniz. Ürün bazlı veya departman bazlı gider ayrıştırması yaparak net kârlılığınızı görebilir ve detaylı gider yeri analiz raporları alabilirsiniz.'
  },
  {
    id: 'shop_fleet_mgmt',
    category: 'stok_perakende',
    status: 'active',
    q: 'Şirketimizin teslimat araçları ve servis filosu için bir yönetim modülü var mı?',
    a: 'Evet. Entegre Filo Yönetim Sistemi ile şirketiniz bünyesindeki tüm dağıtım, nakliye ve servis araçlarının Sürücü zimmetlerini, aktif Kilometre (Km) durumlarını, Servis/Periyodik Bakım geçmişlerini, lastik değişimlerini, kaza raporlarını ve tüm resmi evraklarını (kasko, sigorta vb.) dijital ortamda takip edebilir ve vadesi yaklaşan resmi işlemleri raporlayabilirsiniz.'
  },
  {
    id: 'procurement_purchasing',
    category: 'stok_perakende',
    status: 'active',
    q: 'Tedarik ve Satın Alma süreçleri sistem üzerinden nasıl yönetilir?',
    a: 'Tedarik Yönetim Sistemi ile satınalma talepleri oluşturabilir, tedarikçilerden fiyat teklifleri toplayabilir ve onay süreçlerini yönetebilirsiniz. Onaylanan satınalma talepleri otomatik olarak alış siparişlerine ve mal kabul aşamasında doğrudan stok girişlerine dönüştürülür.'
  },
  {
    id: 'multi_branch_retail_mgmt',
    category: 'stok_perakende',
    status: 'active',
    q: 'Çok şubeli perakende zincirleri ve şubeler arası stok transferi nasıl yönetilir?',
    a: 'ShopLP tam uyumlu Çok Şubeli Altyapıya sahiptir. Dilediğiniz kadar şube oluşturabilir ve merkezden yönetebilirsiniz. Şubeler merkez ile eşgüdümlü çalışır ancak kendi kasalarını ve personellerini bağımsız yönetebilirler. Ürünlerinizin şubeler arası sevk (stok transfer) ve zimmet işlemlerini sistem üzerinden yapabilir, tüm stok seviyelerini tek bir platformdan anlık görebilirsiniz.'
  },
  {
    id: 'foreign_currency_ledger_reconciliation',
    category: 'finans_cari',
    status: 'active',
    q: 'Dövizli Cari Hesap Ekstreleri ve Dijital Mutabakat sistemi nasıl çalışır?',
    a: 'Müşteri ve tedarikçilerinizle olan ticari ilişkilerinizi TL, USD, EUR veya GBP cinsinden takip edebilirsiniz. Dövizli Cari Hesap Ekstreleri sayesinde her işleme ait kur farklarını sistem otomatik hesaplar. Ayrıca entegre Dijital Mutabakat Sistemi ile müşterilerinizle bakiye mutabakatlarını online onay linkleri üzerinden kağıtsız, hızlı ve hatasız gerçekleştirebilirsiniz.'
  },
  {
    id: 'qr_price_checker_mobile',
    category: 'stok_perakende',
    status: 'active',
    q: 'Mağaza içi "Fiyat Gör" QR özelliği müşterilerin ve personelin hayatını nasıl kolaylaştırır?',
    a: 'Müşterilerinizin mağaza içerisindeki ürünlerin fiyatını kolayca görebilmesi için sistem üzerinden otomatik bir "Fiyat Gör" QR kodu üretilir. Müşterileriniz bu QR kodu kendi akıllı telefonlarıyla okuttukları an, mobil tarayıcılarında açılan dijital barkod okuyucuyla mağaza ürünlerinin güncel fiyatlarını anında görürler. Mağaza personeli de elindeki telefonla bu sistemi kullanarak hızlı fiyat kontrolü yapabilir. Bu interaktif özellik, satın alma karar sürecini son derece hızlandırır.'
  },
  {
    id: 'e_commerce_integration_sanalpos',
    category: 'satis_kasa',
    status: 'active',
    q: 'Otomatik kurulan Kurumsal Web Sitemizde Sanal POS ve hangi ödeme kanalları tanımlıdır?',
    a: 'Üyeliğinizle birlikte kurumsal web siteniz otomatik olarak oluşturulur ve anında satışa hazır hale gelir. Web siteniz kurumsal kimliğinizi tam yansıtacak şekilde esnek ve özelleştirilebilir bir mimariye sahiptir. Sistemde Iyzico, Paypal, doğrudan Banka Havalesi/EFT, Şubede Öde ve Kapıda Öde gibi popüler ödeme alternatifleri önceden tanımlı ve entegredir. Çok şubeli yapılarda, müşterileriniz ürünün hangi şubenizde kaç adet olduğunu görebilir, adres harita bağlantıları sayesinde kendilerine en yakın şubenizden doğrudan satın alabilirler.'
  }
];
