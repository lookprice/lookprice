import React, { useState, useMemo, useEffect } from 'react';
import {
  Send, Copy, Check, Download, Printer, Building2,
  Globe, Mail, Instagram, Plus, Trash2,
  RefreshCw, Sliders
} from 'lucide-react';

export type MarketingSectorKey = 'shoplp' | 'horecalp' | 'restatelp' | 'autolp' | 'booklp' | 'weblp';
export type MarketingToneKey = 'direct_hook' | 'consultative' | 'executive' | 'transformation';
export type MarketingChannelKey = 'whatsapp' | 'instagram' | 'email';

export interface SectorCustomizationStep {
  stepNumber: string;
  title: string;
  desc: string;
}

export interface SectorValuePillar {
  code: string;
  title: string;
  desc: string;
}

export interface SectorMarketingConfig {
  key: MarketingSectorKey;
  name: string;
  productBrand: string;
  shortLabel: string;
  demoSlug: string;
  webLpDemoSlug: string;
  demoStoreTitle: string;
  heroKicker: string;
  heroHeadline: string;
  heroSubheadline: string;
  websiteHookTitle: string;
  websiteHookDescription: string;
  customizationSteps: SectorCustomizationStep[];
  sweetenerLead: string;
  painPointSummary: string;
  valuePillars: SectorValuePillar[];
  brochureTagline: string;
  accentHex: string;
  secondaryHex: string;
  defaultLoginEmail: string;
  defaultLoginPass: string;
}

export interface SavedProspectCampaign {
  id: string;
  businessName: string;
  contactPerson: string;
  branchCount: number;
  city: string;
  sector: MarketingSectorKey;
  phone: string;
  email: string;
  instagramHandle: string;
  currentSystemNote: string;
  customWebDemoUrl: string;
  customSectorDemoUrl: string;
  demoLoginEmail: string;
  demoLoginPass: string;
  includeCredentials: boolean;
  status: 'draft' | 'sent_whatsapp' | 'sent_instagram' | 'sent_email' | 'replied' | 'converted';
  createdAt: string;
}

const SECTOR_CONFIGS: Record<MarketingSectorKey, SectorMarketingConfig> = {
  shoplp: {
    key: 'shoplp',
    name: 'Perakende & Mağazacılık (ShopLP)',
    productBrand: 'ShopLP Cloud Retail & E-Ticaret',
    shortLabel: 'Perakende & E-Mağaza',
    demoSlug: 'shoplp-demo',
    webLpDemoSlug: 'weblp-demo',
    demoStoreTitle: 'ShopLP Çok Şubeli Perakende & E-Mağaza Vitrini',
    heroKicker: 'KURUMSAL WEB SİTENİZ HAZIR — KONTROL TAMAMEN SİZDE',
    heroHeadline: 'Kurumsal Web Sitenizi Hazırladık. Kendi Panelinizden Kişiselleştirin ve Anında Yayına Alın.',
    heroSubheadline: 'Size özel kurguladığımız modern e-mağaza ve kurumsal web vitrininizi dakikalar içinde logonuz, kurumsal renkleriniz ve kendi alan adınızla kişiselleştirerek teslim alabilirsiniz.',
    websiteHookTitle: 'Web Siteniz İçin Size Ulaştık: Kurumsal Vitrininiz Teslime Hazır',
    websiteHookDescription: 'Ajans beklemeye veya teknik kod bilgisine ihtiyaç duymadan; size özel hazırladığımız kurumsal web sitenizi yönetim panelinizden kendi marka kimliğinize göre saniyeler içinde şekillendirebilirsiniz.',
    customizationSteps: [
      {
        stepNumber: '01',
        title: 'Marka Kimliği, Logo ve Kurumsal Renk Seçimi',
        desc: 'Yönetim panelinizden logonuzu yükleyin, kurumsal renk paletinizi, yazı karakterinizi ve ana sayfa vitrin bloklarınızı tek tıkla kendi zevkinize göre belirleyin.'
      },
      {
        stepNumber: '02',
        title: 'Canlı Ürün Vitrini & Çoklu Dil (TR / EN / EL)',
        desc: 'Panelinize eklediğiniz veya fiyatını güncellediğiniz her ürün, kategori ve kampanya bannerı hiçbir ek işlem gerektirmeden web sitenizde anında canlı yayına girer.'
      },
      {
        stepNumber: '03',
        title: 'Kendi Alan Adınız (Domain) & Kurumsal Sayfalar',
        desc: 'Sitenizi kendi kurumsal alan adınızla (firmaadiniz.com) yayınlayın; Hakkımızda, Şube Lokasyonlarımız ve İletişim sayfalarınızı dilediğiniz an güncelleyin.'
      }
    ],
    sweetenerLead: 'Peki Web Sitenizin Arkasında Nasıl Bir Güç Var? Geleneksel masaüstü yazılımların aksine, web sitenizle aynı panelde çalışan ShopLP ile tüm şubelerinizi, pazaryerlerinizi ve ön muhasebenizi tek merkezden yönetebilirsiniz:',
    painPointSummary: 'Şubeler arası kopuk masaüstü programları, manuel stok takibi ve pazaryerlerinde tek tek ürün/fiyat güncelleme zahmetini tamamen ortadan kaldırır.',
    valuePillars: [
      {
        code: '01',
        title: 'Çok Şubeli Canlı Stok & Barkodlu Hızlı POS',
        desc: 'Tüm şubelerinizin kasa satışlarını, depo bakiyelerini ve şubeler arası barkodlu ürün transferlerini tek bir bulut ekrandan saniyesi saniyesine izleyin.'
      },
      {
        code: '02',
        title: '5 Büyük Pazaryeri & İlan Hata Teşhis Merkezi',
        desc: 'Trendyol, Hepsiburada, N11, Amazon ve Pazarama mağazalarınıza tek tıkla ürün gönderin; reddedilen ilanların sebebini (görsel, barkod, kategori) net olarak görün.'
      },
      {
        code: '03',
        title: 'Resmi e-Fatura & e-Arşiv Entegrasyonu',
        desc: 'GİB mükellef sorgulama, alış/satış e-Fatura ve e-Arşiv süreçlerinizi döviz karşılıkları ve otomatik KDV gruplamasıyla doğrudan panelinizden kesin.'
      },
      {
        code: '04',
        title: 'TCMB Dövizli Cari Hesap & WhatsApp Mutabakat',
        desc: 'Toptancı ve müşteri bakiyelerinizi güncel TCMB döviz kurlarıyla takip edin; tek tıkla PDF hesap ekstresi ve WhatsApp üzerinden dijital mutabakat gönderin.'
      },
      {
        code: '05',
        title: 'Ürünlerden Tek Tıkla Sosyal Medya & Slayt Stüdyosu',
        desc: 'Stoktaki ürünlerinizin fotoğraflarından saniyeler içinde kurumsal fiyat etiketli Instagram postları ve çok sahneli Reels slayt videoları oluşturun.'
      },
      {
        code: '06',
        title: 'Web Siteniz ve Kasanız Arasında Sıfır Fark',
        desc: 'Mağaza kasanızda satılan bir ürünün stoğu aynı saniyede kurumsal web sitenizden ve bağlı pazaryerlerinizden otomatik olarak düşer.'
      }
    ],
    brochureTagline: 'Kurumsal Web Siteniz + Çok Şubeli Perakende, POS, Pazaryeri ve e-Fatura Yönetimi Tek Panelde.',
    accentHex: '#2563eb',
    secondaryHex: '#0284c7',
    defaultLoginEmail: 'demo@shoplp.com',
    defaultLoginPass: '123456'
  },
  horecalp: {
    key: 'horecalp',
    name: 'Restoran, Kafe & Otel (HoReCaLP)',
    productBrand: 'HoReCaLP Cloud Gastronomy & Hospitality',
    shortLabel: 'Restoran, Kafe & Otel',
    demoSlug: 'horecalp-demo',
    webLpDemoSlug: 'weblp-demo',
    demoStoreTitle: 'HoReCaLP Dijital QR Menü, Adisyon & Mutfak Vitrini',
    heroKicker: 'KURUMSAL WEB SİTENİZ VE QR MENÜNÜZ HAZIR — KONTROL SİZDE',
    heroHeadline: 'Mekanınızın Kurumsal Web Sitesi ve Dijital QR Menüsü Hazır. Kendi Panelinizden Kişiselleştirin.',
    heroSubheadline: 'Restoran, kafe veya oteliniz için hazırladığımız modern web sitesini ve çok dilli temassız QR menüyü kendi logonuz, renkleriniz ve menü fotoğraflarınızla dakikalar içinde yayına alın.',
    websiteHookTitle: 'Web Siteniz ve Dijital Menünüz İçin Size Ulaştık: Teslime Hazır',
    websiteHookDescription: 'Matbaa baskı maliyetlerine veya dışarıdan ajans desteğine bağımlı kalmadan; mekanınızın kurumsal web sitesini ve masalardaki QR menüsünü kendi yönetim panelinizden anlık olarak yönetebilirsiniz.',
    customizationSteps: [
      {
        stepNumber: '01',
        title: 'Mekan Kimliğine Uygun Tasarım & Renk Kişiselleştirme',
        desc: 'Logonuzu, mekan atmosferinizi yansıtan kapak görsellerini ve kurumsal renk paletinizi seçerek web sitenizi ve dijital menünüzü kendi tarzınıza göre uyarlayın.'
      },
      {
        stepNumber: '02',
        title: 'Anlık Fiyat, Porsiyon & Çoklu Dil (TR / EN / EL)',
        desc: 'Panelden değiştirdiğiniz her yemek fiyatı, yeni eklenen ürünler veya tükenen kalemler aynı saniyede web sitenizde ve masalardaki QR menüde (Türkçe, İngilizce, Yunanca) güncellenir.'
      },
      {
        stepNumber: '03',
        title: 'Özel Alan Adı (Domain) & Şube/İletişim Bilgileri',
        desc: 'Mekanınızın kendi alan adıyla (mekanadiniz.com) yayına çıkın; çalışma saatlerinizi, konum haritanızı ve şube iletişim bilgilerinizi tek tıkla düzenleyin.'
      }
    ],
    sweetenerLead: 'Sadece Bir Web Sitesi ve QR Menü Değil! Web sitenizi yönettiğiniz aynı panel üzerinden tüm şubelerinizin masa adisyonunu, mutfak ekranlarını ve kasa raporlarını da uçtan uca yönetebilirsiniz:',
    painPointSummary: 'Yüksek yıllık lisanslı hantal adisyon cihazlarını, kağıt adisyon karmaşasını ve şubedeki bilgisayara bağımlı kalma zorunluluğunu ortadan kaldırır.',
    valuePillars: [
      {
        code: '01',
        title: 'Hızlı POS & Gelişmiş Masa / Adisyon Yönetimi',
        desc: 'Bahçe, teras ve salon masa planlarınızı oluşturun; masa birleştirme, masa taşıma, ikram ve Alman usulü (ürün bazlı veya tutar bazlı) hesap bölmeyi tek dokunuşla yapın.'
      },
      {
        code: '02',
        title: 'Dijital Mutfak & Bar Hazırlık Ekranı (KDS)',
        desc: 'Garsonun veya müşterinin girdiği siparişler porsiyon ve pişirme notlarıyla birlikte anında mutfak ve bar ekranlarına düşer; hazırlanan ürünler saniyesiyle takip edilir.'
      },
      {
        code: '03',
        title: 'Çok Şubeli Canlı Ciro & Gün Sonu Z Raporu',
        desc: 'Mekanda olmasanız bile cep telefonunuzdan hangi şubede kaç masa açık, anlık kasa cirosu ne kadar ve en çok hangi ürünler satılıyor canlı olarak izleyin.'
      },
      {
        code: '04',
        title: 'Gıda Stok, Tedarikçi Cari & Resmi e-Fatura',
        desc: 'Mutfak sarf malzemelerinizi, içecek stoklarınızı, tedarikçi alış faturalarınızı ve cari hesap bakiyelerinizi aynı bulut panelden eksiksiz kontrol edin.'
      },
      {
        code: '05',
        title: 'Otel & Konaklama Folyo Modülü (İsteğe Bağlı)',
        desc: 'Butik otel veya hibrit tesis işletiyorsanız; oda rezervasyonlarını, konaklama folyolarını ve restoran adisyonlarını tek bir entegre yapıda birleştirin.'
      },
      {
        code: '06',
        title: 'Sosyal Medya Menü & Kampanya Afiş Stüdyosu',
        desc: 'Günün menüsünü, yeni kokteyllerinizi veya hafta sonu etkinliklerinizi ürün fotoğraflarınızdan saniyeler içinde kurumsal sosyal medya afişine dönüştürün.'
      }
    ],
    brochureTagline: 'Kurumsal Web Siteniz + Çok Dilli QR Menü, Hızlı Adisyon, Mutfak Ekranı ve Şube Yönetimi.',
    accentHex: '#2563eb',
    secondaryHex: '#0284c7',
    defaultLoginEmail: 'demo@horecalp.com',
    defaultLoginPass: '123456'
  },
  restatelp: {
    key: 'restatelp',
    name: 'Gayrimenkul & Emlak Ofisleri (REstateLP)',
    productBrand: 'REstateLP Prestij Emlak & Portföy CRM',
    shortLabel: 'Gayrimenkul & Emlak',
    demoSlug: 'emlak-demo',
    webLpDemoSlug: 'weblp-demo',
    demoStoreTitle: 'REstateLP Haritalı İlan Vitrini & Emlak CRM Sistemi',
    heroKicker: 'PRESTİJLİ EMLAK WEB SİTENİZ HAZIR — KENDİ PANELİNİZDEN YÖNETİN',
    heroHeadline: 'Emlak Ofisinizin Kurumsal Web Sitesi ve Haritalı Portföy Vitrini Hazır.',
    heroSubheadline: 'Sadece seri ilan portallarına bağımlı kalmayın; kendi logonuz, kurumsal kimliğiniz ve kendi alan adınızla çalışan tam ekran haritalı (IDX) emlak web sitenizi hemen kişiselleştirin.',
    websiteHookTitle: 'Kurumsal Emlak Web Siteniz İçin Size Ulaştık: Teslime Hazır',
    websiteHookDescription: 'Ofisinizin prestijini yansıtan, yatırımcıların harita ve gelişmiş filtrelerle portföylerinizi inceleyebileceği kurumsal web sitenizi kendi yönetim panelinizden kolayca özelleştirebilirsiniz.',
    customizationSteps: [
      {
        stepNumber: '01',
        title: 'Kurumsal Ofis Kimliği, Logo & Vitrin Şablonu',
        desc: 'Emlak ofisinizin logosunu, kurumsal renklerini, üst başlık (header) tasarımını ve danışman kadronuzun profillerini yönetim panelinizden dakikalar içinde tanımlayın.'
      },
      {
        stepNumber: '02',
        title: 'KKTC & Türkiye Uyumlu Gelişmiş İlan Filtreleri',
        desc: 'Panelinize girdiğiniz her gayrimenkul; Koçan/Tapu türü (Eşdeğer, Türk Koçanlı, Tahsis), İmar durumu, KAKS, Trafo, KDV ve Sterlin/Döviz fiyatıyla web sitenizde anında yayınlanır.'
      },
      {
        stepNumber: '03',
        title: 'Tam Ekran İnteraktif Harita (IDX) & Özel Domain',
        desc: 'Kendi alan adınızla (emlakofisiniz.com) yayınlanan sitenizde müşterileriniz ilanlarınızı uydu ve sokak haritası üzerinde konumlarıyla birlikte interaktif olarak keşfeder.'
      }
    ],
    sweetenerLead: 'Web Sitenizin Arkasındaki Tam Donanımlı Emlak CRM Gücü: Sitenizi yönettiğiniz panel, aynı zamanda tüm şubelerinizin ve danışmanlarınızın saha operasyonunu dijitalleştiren eksiksiz bir gayrimenkul yönetim merkezidir:',
    painPointSummary: 'Dağınık WhatsApp gruplarında kaybolan portföy bilgilerini, kağıt yer gösterme belgelerini ve manuel vitrin afişi hazırlama zahmetini bitirir.',
    valuePillars: [
      {
        code: '01',
        title: 'Çok Şubeli Portföy Havuzu & Danışman Yetkilendirme',
        desc: 'Ofislerinizdeki tüm satılık/kiralık portföyleri, mülk sahibi özel notlarını ve danışman prim/performans dağılımlarını güvenli bulut ortamında yönetin.'
      },
      {
        code: '02',
        title: 'Biyometrik Dijital İmzalı Yer Gösterme & Sözleşmeler',
        desc: 'Sahada tablet veya telefondan Yer Gösterme Belgesi, Kira Kontratı ve Satış Sözleşmesi oluşturun; müşterinizden ekrana dokunarak dijital imza alın.'
      },
      {
        code: '03',
        title: 'Tek Tıkla Standart A4 Cam Vitrini & PDF Katalog',
        desc: 'İlanınızdan tek tuşla ofis camınıza asmaya hazır, QR kodlu ve kurumsal logolu standart A4 dikey vitrin posteri veya müşteriye özel PDF sunum dosyası üretin.'
      },
      {
        code: '04',
        title: 'Alıcı Talep Havuzu & Otomatik Eşleştirme Radarı',
        desc: 'Bütçe, bölge ve oda kriterlerini kaydettiğiniz yatırımcı taleplerini yeni giren portföylerinizle otomatik eşleştirerek satış hızınızı ikiye katlayın.'
      },
      {
        code: '05',
        title: 'Kopyala-Yapıştır Hazır Sosyal Medya & Slayt Stüdyosu',
        desc: 'İlan fotoğraflarınızdan kurumsal fiyat bantlı Instagram görselleri, çok sahneli slayt videoları ve tüm teknik detayları içeren hazır paylaşım metinleri üretin.'
      },
      {
        code: '06',
        title: 'Çoklu Döviz (GBP / EUR / USD / TRY) & Çoklu Dil',
        desc: 'Yurt dışı yatırımcılar için hem web sitenizi çok dilli kullanın hem de Sterlin, Euro, Dolar ve TL bazlı portföy fiyatlamasını sıfır kur hatasıyla yönetin.'
      }
    ],
    brochureTagline: 'Kurumsal Haritalı Emlak Web Siteniz + Portföy CRM, Dijital Sözleşme ve A4 Vitrin Stüdyosu.',
    accentHex: '#2563eb',
    secondaryHex: '#0284c7',
    defaultLoginEmail: 'demo@restatelp.com',
    defaultLoginPass: '123456'
  },
  autolp: {
    key: 'autolp',
    name: 'Oto Galeri & Motorlu Araçlar (AutoLP)',
    productBrand: 'AutoLP Dijital Showroom & Galeri Yönetim Sistemi',
    shortLabel: 'Oto Galeri & Otomotiv',
    demoSlug: 'oto-demo',
    webLpDemoSlug: 'weblp-demo',
    demoStoreTitle: 'AutoLP Dijital Oto Showroom & Galeri Yönetim Vitrini',
    heroKicker: 'DİJİTAL OTO SHOWROOM WEB SİTENİZ HAZIR — KONTROL SİZDE',
    heroHeadline: 'Galerinizin Kurumsal Web Sitesi ve Dijital Araç Showroomu Hazır.',
    heroSubheadline: 'Araç portföyünüzü kendi marka çatınız altında sergileyebileceğiniz, ekspertiz ve teknik donanım filtreli kurumsal oto galeri web sitenizi kendi panelinizden kişiselleştirerek hemen yayına alın.',
    websiteHookTitle: 'Kurumsal Galeri Web Siteniz İçin Size Ulaştık: Teslime Hazır',
    websiteHookDescription: 'Müşterilerinize güven veren, tüm araç envanterinizi detaylı teknik özellikleri ve yüksek çözünürlüklü galerisiyle sunan kurumsal web sitenizi dakikalar içinde kendi kimliğinize uyarlayabilirsiniz.',
    customizationSteps: [
      {
        stepNumber: '01',
        title: 'Showroom Marka Kimliği, Logo & Tema Ayarları',
        desc: 'Galerinizin logosunu, kurumsal renklerini, vitrin düzenini ve iletişim kanallarını yönetim panelinizden hiçbir teknik destek almadan kolayca belirleyin.'
      },
      {
        stepNumber: '02',
        title: 'Anlık Araç Envanteri & Ekspertiz Gösterimi',
        desc: 'Panelinize eklediğiniz her aracın marka, model, yıl, kilometre, yakıt, vites, ekspertiz durumu ve döviz/TL fiyatı web sitenizde anında canlı vitrine çıkar.'
      },
      {
        stepNumber: '03',
        title: 'Kendi Alan Adınız (Domain) & WhatsApp Hızlı Teklif',
        desc: 'Kendi alan adınızla (galeriadiniz.com) çalışan web siteniz üzerinden müşterileriniz ilgilendikleri araç için doğrudan WhatsApp hattınıza veya panelinize talep gönderebilir.'
      }
    ],
    sweetenerLead: 'Web Sitenizin Arkasındaki Galeri & Filo Yönetim Gücü: Sitenizi yönettiğiniz panel üzerinden aynı zamanda tüm şubelerinizin araç maliyetlerini, satış sözleşmelerini ve müşteri taleplerini eksiksiz yönetebilirsiniz:',
    painPointSummary: 'Araç alış/masraf hesaplarının defterlerde kaybolmasını, manuel sözleşme hazırlama sürecini ve sosyal medya için tek tek görsel tasarlama zahmetini bitirir.',
    valuePillars: [
      {
        code: '01',
        title: 'Çok Şubeli Araç Envanteri & Dövizli Maliyet/Kâr Analizi',
        desc: 'Aracın alış bedeli, gümrük, bakım, kuaför ve ekspertiz masraflarını GBP/EUR/USD veya TL bazında kaydedin; satış anında net kârlılığınızı kuruşu kuruşuna görün.'
      },
      {
        code: '02',
        title: 'Biyometrik Dijital İmzalı Araç Satış & Kapora Sözleşmesi',
        desc: 'Araç satış, kapora, konsinye bırakma ve test sürüşü sözleşmelerini otomatik araç bilgileriyle saniyeler içinde oluşturup tablet/telefondan dijital imzayla arşivleyin.'
      },
      {
        code: '03',
        title: 'Müşteri Araç Talep Radarı & Takas Değerleme',
        desc: 'Showroomda aradığı aracı bulamayan müşterilerinizin kriterlerini kaydedin; uygun araç stoğunuza girdiğinde sistem sizi anında bilgilendirsin.'
      },
      {
        code: '04',
        title: 'Kiralık / Şirket Araç Filosu & Muayene Takibi',
        desc: 'Bünyenizdeki araçların kasko, trafik sigortası, fenni muayene, seyrüsefer ve periyodik bakım tarihlerini otomatik hatırlatmalarla eksiksiz takip edin.'
      },
      {
        code: '05',
        title: 'Tek Tıkla Showroom Vitrin Afişi & Sosyal Medya Stüdyosu',
        desc: 'Yeni gelen araçlarınızın fotoğraflarından teknik özellik bantlı, kurumsal logolu Instagram postları, slayt videoları ve hazır ilan metinleri üretin.'
      },
      {
        code: '06',
        title: 'TCMB Döviz Kurlu Cari Hesap & Senet/Ödeme Takibi',
        desc: 'Müşteri ve tedarikçi cari bakiyelerinizi, vadeli ödemelerinizi ve döviz kurlarını tek bir güvenli finans ekranından kontrol edin.'
      }
    ],
    brochureTagline: 'Kurumsal Dijital Showroom Web Siteniz + Envanter, Maliyet, Dijital Sözleşme ve Filo Yönetimi.',
    accentHex: '#2563eb',
    secondaryHex: '#0284c7',
    defaultLoginEmail: 'demo@autolp.com',
    defaultLoginPass: '123456'
  },
  booklp: {
    key: 'booklp',
    name: 'Kitabevi, Kırtasiye & Kültür (BookLP)',
    productBrand: 'BookLP Kitabevi & Kültür Mağazası Sistemi',
    shortLabel: 'Kitabevi & Kırtasiye',
    demoSlug: 'booklp-demo',
    webLpDemoSlug: 'weblp-demo',
    demoStoreTitle: 'BookLP Online Kitabevi Vitrini & ISBN POS Sistemi',
    heroKicker: 'ONLINE KİTABEVİ WEB SİTENİZ HAZIR — KENDİ PANELİNİZDEN YÖNETİN',
    heroHeadline: 'Kitabevinizin Kurumsal Web Sitesi ve Online Eser Vitrini Hazır.',
    heroSubheadline: 'Okurlarınızın yazar, yayınevi, çevirmen veya ISBN ile saniyeler içinde kitap arayabileceği modern online kitabevi web sitenizi kendi logonuz ve kurumsal kimliğinizle hemen yayına alın.',
    websiteHookTitle: 'Online Kitabevi Web Siteniz İçin Size Ulaştık: Teslime Hazır',
    websiteHookDescription: 'Binlerce eseri kategorileri, kapak görselleri ve künye bilgileriyle sergileyebileceğiniz kurumsal web sitenizi kendi yönetim panelinizden zahmetsizce kişiselleştirebilirsiniz.',
    customizationSteps: [
      {
        stepNumber: '01',
        title: 'Kitabevi Kimliği, Logo & Vitrin Koleksiyonları',
        desc: 'Logonuzu, kurumsal renklerinizi, Haftanın Seçkisi / Çok Satanlar vitrin bloklarınızı ve okur duyurularınızı panelinizden dilediğiniz gibi düzenleyin.'
      },
      {
        stepNumber: '02',
        title: 'Yazar, Yayınevi & ISBN Odaklı Canlı Katalog',
        desc: 'Panelinizdeki her eser; yazar, yayınevi, baskı yılı, sayfa sayısı ve güncel stok/fiyat bilgisiyle web sitenizde anında okurlarınızın erişimine açılır.'
      },
      {
        stepNumber: '03',
        title: 'Kendi Alan Adınız (Domain) & Mağaza İçi QR Sorgulama',
        desc: 'Kendi alan adınızla (kitabeviniz.com) yayın yapın; mağaza içindeki okurlarınızın raflardaki QR kodları okutarak güncel fiyat ve eser özeti görmesini sağlayın.'
      }
    ],
    sweetenerLead: 'Web Sitenizin Arkasındaki Çok Şubeli Kitabevi & Kırtasiye Gücü: Sitenizi yönettiğiniz panel, tüm şubelerinizin kasa satışlarını, yayınevi carilerini ve kurumsal okul listesi tekliflerini tek merkezde birleştirir:',
    painPointSummary: 'On binlerce ISBN barkodunun şubeler arasında karışmasını, sezonluk fiyat geçişlerindeki etiket karmaşasını ve yayınevi mutabakat zorluklarını çözer.',
    valuePillars: [
      {
        code: '01',
        title: 'ISBN Barkodlu Hızlı POS & Çok Şubeli Stok',
        desc: 'Kasada saniyeler içinde barkod okutarak satış yapın; aranan bir kitabın hangi şubenizde kaç adet kaldığını anında görüp şubeler arası transfer başlatın.'
      },
      {
        code: '02',
        title: 'Yayınevi & Dağıtımcı İskonto / Cari Hesap Takibi',
        desc: 'Yayınevlerinden gelen faturaları, alış iskonto oranlarını, konsinye eserleri ve döviz/TL cari bakiyelerinizi tek ekrandan hatasız yönetin.'
      },
      {
        code: '03',
        title: 'Okul & Kurumsal Toplu Liste Teklif Modülü',
        desc: 'Okul sezonunda veli veya kurum listelerini hızla oluşturun, özel iskonto tanımlayın ve tek tıkla kurumsal PDF teklif veya e-Fatura/e-Arşiv kesin.'
      },
      {
        code: '04',
        title: '5 Büyük Pazaryeri Entegrasyonu & Hata Teşhisi',
        desc: 'Kitap ve kırtasiye ürünlerinizi Trendyol, Hepsiburada, N11, Amazon ve Pazarama mağazalarınıza tek merkezden aktarın, stokları otomatik eşitleyin.'
      },
      {
        code: '05',
        title: 'Yeni Çıkan Eserler İçin Sosyal Medya Afiş Stüdyosu',
        desc: 'Kitap kapağından ve arka kapak yazısından saniyeler içinde Instagram hikaye/post tasarımları ve çok sahneli tanıtım videoları oluşturun.'
      },
      {
        code: '06',
        title: 'Resmi e-Fatura, e-Arşiv & Gün Sonu Raporlama',
        desc: 'Tüm şubelerinizin kasa Z raporlarını, nakit/kredi kartı dağılımlarını ve resmi e-Fatura süreçlerini bulut üzerinden güvenle yönetin.'
      }
    ],
    brochureTagline: 'Kurumsal Online Kitabevi Web Siteniz + ISBN Hızlı POS, Çok Şubeli Stok ve Yayınevi Yönetimi.',
    accentHex: '#2563eb',
    secondaryHex: '#0284c7',
    defaultLoginEmail: 'demo@booklp.com',
    defaultLoginPass: '123456'
  },
  weblp: {
    key: 'weblp',
    name: 'Kurumsal Firma & Hizmet Sektörü (WebLP)',
    productBrand: 'WebLP Kurumsal Web & Bulut İşletme Platformu',
    shortLabel: 'Kurumsal Web & CRM',
    demoSlug: 'weblp-demo',
    webLpDemoSlug: 'weblp-demo',
    demoStoreTitle: 'WebLP Dinamik Kurumsal Web Sitesi & İşletme Yönetim Paneli',
    heroKicker: 'KURUMSAL WEB SİTENİZ TESLİME HAZIR — KONTROL TAMAMEN SİZDE',
    heroHeadline: 'Firmanızın Yeni Nesil Kurumsal Web Sitesi Hazır. Kendi Panelinizden Kişiselleştirin.',
    heroSubheadline: 'Ajanslara bağımlı kalmadan; kendi logonuz, kurumsal renkleriniz, hizmet sayfalarınız ve kendi alan adınızla yönetebileceğiniz kurumsal web sitenizi hemen teslim alın.',
    websiteHookTitle: 'Kurumsal Web Siteniz İçin Size Ulaştık: Teslime Hazır',
    websiteHookDescription: 'Firmanızın dijital vitrinini yenilemek veya güçlendirmek için aylarca süren tasarım süreçlerine ihtiyacınız yok. Hazırladığımız kurumsal web sitenizi kendi yönetim panelinizden dakikalar içinde kişiselleştirebilirsiniz.',
    customizationSteps: [
      {
        stepNumber: '01',
        title: 'Kurumsal Kimlik, Logo, Renk & Font Kişiselleştirme',
        desc: 'Firmanızın logosunu yükleyin, kurumsal renk paletinizi ve tipografinizi seçin; ana sayfa hero alanını ve kurumsal vitrin bloklarını tek tıkla düzenleyin.'
      },
      {
        stepNumber: '02',
        title: 'Hizmetler, Projeler, Referanslar & Çoklu Dil (TR / EN / EL)',
        desc: 'Sunduğunuz hizmetleri, tamamladığınız projeleri ve kurumsal duyurularınızı kod bilmeden ekleyin; sitenizi Türkçe, İngilizce ve Yunanca olarak yayınlayın.'
      },
      {
        stepNumber: '03',
        title: 'Kendi Alan Adınız (Domain), SEO & İletişim Formları',
        desc: 'Sitenizi kendi kurumsal alan adınızla (firmaadiniz.com) bağlayın; Google SEO ayarlarınızı ve web sitenizden gelen müşteri iletişim taleplerini panelinizden takip edin.'
      }
    ],
    sweetenerLead: 'Peki İleride Daha Fazlasına İhtiyaç Duyarsanız? WebLP ile kurumsal web sitenizi yönettiğiniz panel, işletmeniz büyüdükçe tek bir anahtarla tam kapsamlı bir ticari yönetim (ERP/CRM) sistemine dönüşür:',
    painPointSummary: 'Sadece statik bir tanıtım sitesiyle sınırlı kalmanızı önler; web siteniz ile şirket içi teklif, fatura ve şube operasyonlarınızı tek çatı altında birleştirir.',
    valuePillars: [
      {
        code: '01',
        title: 'Müşteri İletişim & Kurumsal Teklif / Sözleşme Yönetimi',
        desc: 'Web sitenizden gelen talepleri anında yakalayın; müşterilerinize kurumsal antetli PDF fiyat teklifleri ve dijital imzalı hizmet sözleşmeleri hazırlayın.'
      },
      {
        code: '02',
        title: 'TCMB Döviz Kurlu Cari Hesap & Tahsilat Takibi',
        desc: 'Müşteri ve tedarikçi hesaplarınızı TRY, USD, EUR ve GBP bazında takip edin; tek tıkla cari hesap ekstresi ve WhatsApp üzerinden mutabakat gönderin.'
      },
      {
        code: '03',
        title: 'Resmi e-Fatura & e-Arşiv Entegrasyonu',
        desc: 'Muhasebe süreçlerinizi hızlandırın; hizmet veya ürün faturalarınızı GİB entegrasyonuyla doğrudan kendi kurumsal panelinizden kesin.'
      },
      {
        code: '04',
        title: 'Çok Şubeli Stok, Hizmet & Depo Modülü',
        desc: 'Dilediğiniz an ürün/hizmet kataloglarınızı, şubeler arası stoklarınızı ve barkodlu Hızlı POS satış ekranını panelinizde aktif hale getirin.'
      },
      {
        code: '05',
        title: 'Kurumsal Sosyal Medya Görsel & Slayt Stüdyosu',
        desc: 'Hizmetlerinizi ve kampanyalarınızı tanıtan kurumsal sosyal medya postlarını ve çok sahneli slayt videolarını ajans maliyeti olmadan kendiniz üretin.'
      },
      {
        code: '06',
        title: '%100 Bulut Tabanlı, Mobil ve Masaüstü Uyumlu',
        desc: 'Ofiste bilgisayara bağımlı kalmadan; cep telefonunuzdan, tabletinizden veya herhangi bir bilgisayardan hem web sitenizi hem de şirketinizi yönetin.'
      }
    ],
    brochureTagline: 'Kişiselleştirilebilir Kurumsal Web Siteniz + Teklif, Cari Hesap, e-Fatura ve Çok Şubeli İşletme Yönetimi.',
    accentHex: '#2563eb',
    secondaryHex: '#0284c7',
    defaultLoginEmail: 'demo@weblp.com',
    defaultLoginPass: '123456'
  }
};

const TONE_OPTIONS: { key: MarketingToneKey; label: string; desc: string }[] = [
  {
    key: 'direct_hook',
    label: 'Kurumsal Web Sitesi Odaklı (Önerilen)',
    desc: '"Web siteniz için size ulaştık, kurumsal siteniz hazır" girişiyle yakalar; nasıl kişiselleştirileceğini anlatıp ardından büyük resmi sunar.'
  },
  {
    key: 'consultative',
    label: 'Kişiselleştirme & Dijital Dönüşüm',
    desc: 'Web sitesini kendi panelinden yönetme özgürlüğünü ve masaüstü yazılımlardan bulut ekosisteme geçiş avantajlarını vurgular.'
  },
  {
    key: 'executive',
    label: 'Üst Düzey Yönetici Özeti (Kısa & Net)',
    desc: 'Firma sahipleri için doğrudan hazır web vitrini, özelleştirme adımları ve çok şubeli yönetim gücünü özetleyen net kurumsal metin.'
  },
  {
    key: 'transformation',
    label: 'Çok Şubeli Büyüme & Tam Entegrasyon',
    desc: 'Birden fazla şubesi olan işletmelere web sitesi + tüm şubelerin tek ekrandan kontrolü vizyonunu aktarır.'
  }
];

const STORAGE_KEY = 'lookprice_superadmin_marketing_campaigns_v2';

interface SuperAdminMarketingHubProps {
  lang?: string;
  stores?: Array<{ id: string | number; name: string; slug: string }>;
}

export const SuperAdminMarketingHub: React.FC<SuperAdminMarketingHubProps> = ({ stores = [] }) => {
  const [selectedSector, setSelectedSector] = useState<MarketingSectorKey>('shoplp');
  const [selectedTone, setSelectedTone] = useState<MarketingToneKey>('direct_hook');
  const [activeChannel, setActiveChannel] = useState<MarketingChannelKey>('whatsapp');

  // Prospect details
  const [businessName, setBusinessName] = useState<string>('Seçkin Grup Mağazaları');
  const [contactPerson, setContactPerson] = useState<string>('Firma Yetkilisi');
  const [branchCount, setBranchCount] = useState<number>(2);
  const [city, setCity] = useState<string>('Lefkoşa');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [currentSystemNote, setCurrentSystemNote] = useState<string>('Geleneksel Masaüstü Paket Yazılım');

  // Demo Links & Credentials
  const sectorConfig = SECTOR_CONFIGS[selectedSector];
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://lookprice.net';

  const [customWebDemoUrl, setCustomWebDemoUrl] = useState<string>(`${baseOrigin}/@${SECTOR_CONFIGS.shoplp.webLpDemoSlug}`);
  const [customSectorDemoUrl, setCustomSectorDemoUrl] = useState<string>(`${baseOrigin}/@${SECTOR_CONFIGS.shoplp.demoSlug}`);
  const [demoLoginEmail, setDemoLoginEmail] = useState<string>(SECTOR_CONFIGS.shoplp.defaultLoginEmail);
  const [demoLoginPass, setDemoLoginPass] = useState<string>(SECTOR_CONFIGS.shoplp.defaultLoginPass);
  const [includeCredentials, setIncludeCredentials] = useState<boolean>(true);
  const [senderName, setSenderName] = useState<string>('LookPrice Kurumsal Çözüm Ekibi');
  const [senderPhone, setSenderPhone] = useState<string>('+90 (548) 800 00 00');

  // Editable Copy Override
  const [isCustomCopyEdited, setIsCustomCopyEdited] = useState<boolean>(false);
  const [customCopyText, setCustomCopyText] = useState<string>('');
  const [customEmailSubject, setCustomEmailSubject] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGeneratingPng, setIsGeneratingPng] = useState<boolean>(false);

  // Saved Prospect Campaigns
  const [savedCampaigns, setSavedCampaigns] = useState<SavedProspectCampaign[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCampaigns));
    } catch {
      // ignore
    }
  }, [savedCampaigns]);

  // Sync URLs and credentials when sector changes
  const handleSelectSector = (sec: MarketingSectorKey) => {
    setSelectedSector(sec);
    const cfg = SECTOR_CONFIGS[sec];
    setCustomWebDemoUrl(`${baseOrigin}/@${cfg.webLpDemoSlug}`);
    setCustomSectorDemoUrl(`${baseOrigin}/@${cfg.demoSlug}`);
    setDemoLoginEmail(cfg.defaultLoginEmail);
    setDemoLoginPass(cfg.defaultLoginPass);
    setIsCustomCopyEdited(false);
  };

  // Populate from an existing store if operator chooses
  const handleSelectExistingStoreAsDemo = (storeSlug: string) => {
    if (!storeSlug) return;
    setCustomSectorDemoUrl(`${baseOrigin}/@${storeSlug}`);
    setIsCustomCopyEdited(false);
  };

  // Generate clean, corporate, emoji-free copy following the 3-stage narrative
  const generatedCopy = useMemo(() => {
    const cfg = SECTOR_CONFIGS[selectedSector];
    const cleanBiz = businessName.trim() || 'Değerli İşletmemiz';
    const cleanPerson = contactPerson.trim() ? `Sayın ${contactPerson.trim()}` : `${cleanBiz} Yönetimi`;
    const cleanCity = city.trim() ? `${city.trim()} bölgesindeki ` : '';
    const branchPhrase = branchCount > 1 ? `${branchCount} şubeli yapınız` : 'işletmeniz';

    const customizationSummaryLines = cfg.customizationSteps
      .map((s) => `${s.stepNumber}. ${s.title}: ${s.desc}`)
      .join('\n');

    const pillarsSummaryLines = cfg.valuePillars
      .slice(0, 5)
      .map((p) => `— ${p.title}: ${p.desc}`)
      .join('\n');

    const credentialsBlock = includeCredentials
      ? `\n YÖNETİM PANELİ CANLI TEST GİRİŞİ:\nPanel Giriş Adresi: ${baseOrigin}/login\nKullanıcı E-Posta: ${demoLoginEmail}\nŞifre: ${demoLoginPass}`
      : '';

    const demoLinksBlock = `CANLI VİTRİN & SİSTEM DEMOLARI:\n— Kurumsal Web Vitrini: ${customWebDemoUrl}\n— ${cfg.shortLabel} Sektörel Vitrin: ${customSectorDemoUrl}${credentialsBlock}`;

    if (activeChannel === 'whatsapp') {
      let intro = '';
      if (selectedTone === 'direct_hook') {
        intro = `Merhaba ${cleanPerson},\n\n${cleanCity}${cleanBiz} için kurumsal web sitenizi hazırladık. Web siteniz şu an teslime ve yayına hazır durumda.\n\nSize ulaşmamızın ilk sebebi; dışarıdan ajans beklemeye veya kod yazmaya gerek kalmadan, hazırladığımız bu kurumsal web sitesini kendi yönetim panelinizden dakikalar içinde nasıl kişiselleştirebileceğinizi göstermektir:`;
      } else if (selectedTone === 'consultative') {
        intro = `Merhaba ${cleanPerson},\n\n${cleanCity}${cleanBiz} markanızın dijital vitrinini inceledik ve işletmeniz için modern, yönetim panelli kurumsal web sitenizi hazırladık.\n\nKurumsal web sitenizi teslim aldığınızda, tamamen kendi kontrolünüzde olan yönetim panelinizden şu 3 adımla sitenizi dilediğiniz an kişiselleştirebilirsiniz:`;
      } else if (selectedTone === 'executive') {
        intro = `Sayın ${cleanPerson},\n\n${cleanBiz} için yönetim panelli kurumsal web siteniz hazırlandı. Aylarca süren tasarım süreçleri olmadan, sitenizi kendi panelinizden markanıza göre hemen özelleştirip yayına alabilirsiniz:`;
      } else {
        intro = `Merhaba ${cleanPerson},\n\n${cleanCity}${cleanBiz} (${branchPhrase}) için hem kurumsal web sitenizi hazır hale getirdik hem de tüm şubelerinizi tek merkezden yönetebileceğiniz bulut altyapısını kurguladık.\n\nÖncelikle, hazır olan kurumsal web sitenizi kendi panelinizden nasıl kişiselleştirebilirsiniz?`;
      }

      const body = `${intro}

WEB SİTENİZİ NASIL KİŞİSELLEŞTİRİRSİNİZ?
${customizationSummaryLines}

PEKİ DAHA FAZLASI MI LAZIM? BÜYÜK RESMİ KEŞFEDİN:
${cfg.sweetenerLead}

${pillarsSummaryLines}

${demoLinksBlock}

Uygun olduğunuzda 10 dakikalık kısa bir çevrimiçi veya yüz yüze görüşmede, ${cleanBiz} için hazırladığımız web vitrinini ve çok şubeli yönetim panelini canlı olarak göstermek isteriz.

Saygılarımızla,
${senderName}
İletişim: ${senderPhone}
Web: https://lookprice.net`;

      return {
        subject: `${cleanBiz} — Kurumsal Web Siteniz Hazır (Kişiselleştirme & ${cfg.productBrand})`,
        body
      };
    }

    if (activeChannel === 'instagram') {
      const body = `Merhaba ${cleanBiz} Ekibi,

Markanız için yönetim panelli kurumsal web sitenizi hazırladık. Sitenizi herhangi bir teknik bilgiye ihtiyaç duymadan; kendi logonuz, kurumsal renkleriniz, çoklu dil (TR/EN/EL) desteğiniz ve kendi alan adınızla (domain) yönetim panelinizden dakikalar içinde kişiselleştirerek teslim alabilirsiniz.

Üstelik web sitenizi yönettiğiniz bu panel, ${branchPhrase} için geleneksel masaüstü programların ötesinde tam kapsamlı bir bulut yönetim gücü sunar:
— ${cfg.valuePillars[0].title}
— ${cfg.valuePillars[1].title}
— ${cfg.valuePillars[2].title}
— ${cfg.valuePillars[4].title}

Hazırladığımız canlı örnekleri incelemek için:
Kurumsal Web: ${customWebDemoUrl}
${cfg.shortLabel} Vitrini: ${customSectorDemoUrl}${
        includeCredentials ? `\nPanel Test Girişi (${baseOrigin}/login): ${demoLoginEmail} / Şifre: ${demoLoginPass}` : ''
      }

Size özel kurguladığımız web sitenizi ve yönetim panelini paylaşabilmemiz için yetkilinizin WhatsApp veya telefon numarasını iletebilir misiniz?

${senderName} | lookprice.net`;

      return {
        subject: `${cleanBiz} Kurumsal Web Vitrini`,
        body
      };
    }

    // Email channel
    const subject = `${cleanBiz} | Kurumsal Web Siteniz Teslime Hazır — Kişiselleştirme ve Çok Şubeli Yönetim Çözümü`;
    const body = `Sayın ${cleanPerson},

${cleanCity}${cleanBiz} markanız için modern, mobil uyumlu ve yönetim panelli kurumsal web sitenizi hazırladık.

Size ulaşmamızın temel amacı; hiçbir ajans bağımlılığı veya teknik kodlama süreci olmadan, hazır durumdaki kurumsal web sitenizi kendi yönetim panelinizden nasıl kişiselleştirebileceğinizi ve ardından bu altyapıyla ${branchPhrase} operasyonlarını nasıl tek merkezden yönetebileceğinizi paylaşmaktır.

------------------------------------------------------------------------
1. BÖLÜM: KURUMSAL WEB SİTENİZ HAZIR — NASIL KİŞİSELLEŞTİRİRSİNİZ?
------------------------------------------------------------------------
Size teslim edeceğimiz yönetim paneline giriş yaptığınız andan itibaren web sitenizin tüm kontrolü sizdedir:

${customizationSummaryLines}

------------------------------------------------------------------------
2. BÖLÜM: BÜYÜK RESİM — WEB SİTENİZİN ARKASINDAKİ ${cfg.productBrand.toUpperCase()} GÜCÜ
------------------------------------------------------------------------
${cfg.sweetenerLead}

${cfg.valuePillars.map((p) => `[${p.code}] ${p.title}\n${p.desc}`).join('\n\n')}

------------------------------------------------------------------------
CANLI İNCELEME VE TEST BAĞLANTILARI
------------------------------------------------------------------------
${demoLinksBlock}

${cleanBiz} yönetimine özel hazırladığımız bu yapıyı, kendi kurumsal logonuz ve örnek verilerinizle canlı olarak sunmak üzere bu hafta içinde 15 dakikalık bir tanışma toplantısı planlamaktan memnuniyet duyarız.

Çalışmalarınızda başarılar dileriz.

Saygılarımızla,
${senderName}
Telefon / WhatsApp: ${senderPhone}
Kurumsal Web: https://lookprice.net`;

    return { subject, body };
  }, [
    selectedSector,
    selectedTone,
    activeChannel,
    businessName,
    contactPerson,
    branchCount,
    city,
    customWebDemoUrl,
    customSectorDemoUrl,
    demoLoginEmail,
    demoLoginPass,
    includeCredentials,
    senderName,
    senderPhone,
    baseOrigin
  ]);

  const effectiveCopyText = isCustomCopyEdited ? customCopyText : generatedCopy.body;
  const effectiveEmailSubject = isCustomCopyEdited ? customEmailSubject : generatedCopy.subject;

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(label);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
    const encoded = encodeURIComponent(effectiveCopyText);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = () => {
    const subjectEnc = encodeURIComponent(effectiveEmailSubject);
    const bodyEnc = encodeURIComponent(effectiveCopyText);
    const mailto = `mailto:${email.trim()}?subject=${subjectEnc}&body=${bodyEnc}`;
    window.location.href = mailto;
  };

  const handleOpenInstagram = async () => {
    await handleCopyText(effectiveCopyText, 'instagram_dm');
    const cleanHandle = instagramHandle.replace(/^@/, '').trim();
    const targetUrl = cleanHandle
      ? `https://www.instagram.com/${cleanHandle}/`
      : 'https://www.instagram.com/';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveProspect = (status: SavedProspectCampaign['status'] = 'draft') => {
    const newEntry: SavedProspectCampaign = {
      id: `camp_${Date.now()}`,
      businessName: businessName.trim() || 'İsimsiz Firma',
      contactPerson: contactPerson.trim(),
      branchCount,
      city: city.trim(),
      sector: selectedSector,
      phone: phone.trim(),
      email: email.trim(),
      instagramHandle: instagramHandle.trim(),
      currentSystemNote: currentSystemNote.trim(),
      customWebDemoUrl,
      customSectorDemoUrl,
      demoLoginEmail,
      demoLoginPass,
      includeCredentials,
      status,
      createdAt: new Date().toISOString()
    };
    setSavedCampaigns((prev) => [newEntry, ...prev]);
  };

  const handleLoadProspect = (item: SavedProspectCampaign) => {
    setSelectedSector(item.sector);
    setBusinessName(item.businessName);
    setContactPerson(item.contactPerson);
    setBranchCount(item.branchCount);
    setCity(item.city);
    setPhone(item.phone);
    setEmail(item.email);
    setInstagramHandle(item.instagramHandle);
    setCurrentSystemNote(item.currentSystemNote);
    setCustomWebDemoUrl(item.customWebDemoUrl);
    setCustomSectorDemoUrl(item.customSectorDemoUrl);
    setDemoLoginEmail(item.demoLoginEmail);
    setDemoLoginPass(item.demoLoginPass);
    setIncludeCredentials(item.includeCredentials);
    setIsCustomCopyEdited(false);
  };

  const handleDeleteProspect = (id: string) => {
    setSavedCampaigns((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateProspectStatus = (id: string, status: SavedProspectCampaign['status']) => {
    setSavedCampaigns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  // Helper for Canvas text wrapping
  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines = 4
  ): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        linesDrawn++;
        if (linesDrawn >= maxLines) {
          ctx.fillText(line.trim() + '...', x, currentY);
          return currentY + lineHeight;
        }
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  };

  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // High-Resolution 1080x1350 Executive Corporate Brochure PNG Generator (Aligned with lookprice.net theme, Zero Emojis)
  const handleDownloadBrochurePng = async () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cfg = SECTOR_CONFIGS[selectedSector];
      const cleanBiz = businessName.trim();

      // 1. Deep Obsidian Slate Background (lookprice.net aesthetic)
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Subtle architectural grid lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.lineWidth = 1;
      for (let gx = 60; gx < 1080; gx += 120) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, 1350);
        ctx.stroke();
      }
      for (let gy = 60; gy < 1350; gy += 120) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(1080, gy);
        ctx.stroke();
      }

      // Top Corporate Accent Bar
      const topBarGrad = ctx.createLinearGradient(0, 0, 1080, 0);
      topBarGrad.addColorStop(0, '#2563eb');
      topBarGrad.addColorStop(0.5, '#38bdf8');
      topBarGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = topBarGrad;
      ctx.fillRect(0, 0, 1080, 8);

      // 2. Top Header Bar (y: 44)
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 28px Inter, system-ui, sans-serif';
      ctx.fillText('LOOKPRICE', 60, 72);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 28px Inter, system-ui, sans-serif';
      ctx.fillText('.NET', 228, 72);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 15px Inter, system-ui, sans-serif';
      ctx.fillText(`|   ${cfg.productBrand.toUpperCase()}`, 305, 70);

      // Right-aligned target company reference (clean, corporate, no stars/emojis)
      if (cleanBiz) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 15px Inter, system-ui, sans-serif';
        ctx.fillText(`KURUMSAL SUNUM DOSYASI: ${cleanBiz.toUpperCase()}`, 1020, 70);
        ctx.textAlign = 'left';
      }

      // Divider line under header
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, 96);
      ctx.lineTo(1020, 96);
      ctx.stroke();

      // 3. Stage 1: Hero Hook ("Kurumsal Web Siteniz Hazır")
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 14px Inter, system-ui, sans-serif';
      ctx.fillText(cfg.heroKicker.toUpperCase(), 60, 134);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 36px Inter, system-ui, sans-serif';
      const afterHeadlineY = wrapCanvasText(
        ctx,
        cfg.heroHeadline,
        60,
        178,
        960,
        44,
        2
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 18px Inter, system-ui, sans-serif';
      const afterSubY = wrapCanvasText(
        ctx,
        cfg.heroSubheadline,
        60,
        afterHeadlineY + 8,
        960,
        26,
        2
      );

      // 4. Stage 2: "Web Sitenizi Nasıl Kişiselleştirirsiniz?" 3-Column Strip
      const custSectionY = Math.max(afterSubY + 18, 290);
      drawRoundRect(ctx, 60, custSectionY, 960, 210, 14);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Section Header inside Customization Box
      ctx.fillStyle = '#60a5fa';
      ctx.font = '700 13px Inter, system-ui, sans-serif';
      ctx.fillText('KENDİ YÖNETİM PANELİNİZDEN DAKİKALAR İÇİNDE KİŞİSELLEŞTİRME ADIMLARI', 84, custSectionY + 30);

      const colW = 296;
      cfg.customizationSteps.forEach((step, idx) => {
        const colX = 84 + idx * (colW + 14);
        const stepTop = custSectionY + 48;

        // Vertical divider between columns
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(colX - 8, stepTop);
          ctx.lineTo(colX - 8, custSectionY + 190);
          ctx.stroke();
        }

        // Step number badge
        drawRoundRect(ctx, colX, stepTop, 36, 24, 6);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.fill();
        ctx.fillStyle = '#60a5fa';
        ctx.font = '700 13px Inter, system-ui, sans-serif';
        ctx.fillText(step.stepNumber, colX + 10, stepTop + 17);

        // Step title
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 16px Inter, system-ui, sans-serif';
        const afterStepTitleY = wrapCanvasText(
          ctx,
          step.title,
          colX,
          stepTop + 46,
          colW - 10,
          21,
          2
        );

        // Step desc
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 13.5px Inter, system-ui, sans-serif';
        wrapCanvasText(
          ctx,
          step.desc,
          colX,
          afterStepTitleY + 4,
          colW - 10,
          19,
          4
        );
      });

      // 5. Stage 3: The Big Picture Header ("Web Sitenizin Arkasındaki Bulut Gücü")
      const bigPicHeaderY = custSectionY + 244;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 13px Inter, system-ui, sans-serif';
      ctx.fillText('SADECE WEB SİTESİ DEĞİL — BÜYÜK RESMİ KEŞFEDİN', 60, bigPicHeaderY);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 21px Inter, system-ui, sans-serif';
      const afterLeadY = wrapCanvasText(
        ctx,
        cfg.sweetenerLead,
        60,
        bigPicHeaderY + 28,
        960,
        28,
        2
      );

      // 6. 6 Value Pillar Cards (2 columns x 3 rows)
      const gridStartY = afterLeadY + 14;
      const cardW = 470;
      const cardH = 148;
      const gapX = 20;
      const gapY = 16;

      cfg.valuePillars.slice(0, 6).forEach((pillar, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 60 + col * (cardW + gapX);
        const cy = gridStartY + row * (cardH + gapY);

        drawRoundRect(ctx, cx, cy, cardW, cardH, 12);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Left accent stripe
        drawRoundRect(ctx, cx, cy, 5, cardH, 3);
        ctx.fillStyle = '#2563eb';
        ctx.fill();

        // Number tag
        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 13px Inter, system-ui, sans-serif';
        ctx.fillText(pillar.code, cx + 22, cy + 30);

        // Pillar Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 17px Inter, system-ui, sans-serif';
        const afterPillarTitleY = wrapCanvasText(
          ctx,
          pillar.title,
          cx + 50,
          cy + 30,
          cardW - 68,
          22,
          2
        );

        // Pillar Description
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 14px Inter, system-ui, sans-serif';
        wrapCanvasText(
          ctx,
          pillar.desc,
          cx + 22,
          Math.max(afterPillarTitleY + 6, cy + 58),
          cardW - 40,
          20,
          4
        );
      });

      // 7. Bottom Footer: Live Demo Links & Contact Credentials
      const footerY = 1145;
      drawRoundRect(ctx, 60, footerY, 960, 155, 14);
      ctx.fillStyle = '#090d16';
      ctx.fill();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 13px Inter, system-ui, sans-serif';
      ctx.fillText('CANLI VİTRİN VE YÖNETİM PANELİ TEST BAĞLANTILARI', 86, footerY + 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 15.5px Inter, system-ui, sans-serif';
      ctx.fillText(`Kurumsal Web Vitrini:  ${customWebDemoUrl}`, 86, footerY + 62);
      ctx.fillText(`${cfg.shortLabel} Vitrini:  ${customSectorDemoUrl}`, 86, footerY + 90);

      if (includeCredentials) {
        ctx.fillStyle = '#93c5fd';
        ctx.font = '500 14.5px Inter, system-ui, sans-serif';
        ctx.fillText(
          `Yönetim Paneli Girişi (${baseOrigin}/login)   |   Kullanıcı: ${demoLoginEmail}   |   Şifre: ${demoLoginPass}`,
          86,
          footerY + 122
        );
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 14.5px Inter, system-ui, sans-serif';
        ctx.fillText(cfg.brochureTagline, 86, footerY + 122);
      }

      // Right side contact box inside footer
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 16px Inter, system-ui, sans-serif';
      ctx.fillText(senderName, 994, footerY + 62);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 18px Inter, system-ui, sans-serif';
      ctx.fillText(senderPhone, 994, footerY + 90);
      ctx.fillStyle = '#64748b';
      ctx.font = '500 13px Inter, system-ui, sans-serif';
      ctx.fillText('www.lookprice.net', 994, footerY + 122);
      ctx.textAlign = 'left';

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeName = (cleanBiz || cfg.key).toLowerCase().replace(/[^a-z0-9]/gi, '-');
      link.download = `lookprice-kurumsal-brosur-${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // A4 Executive Print Brochure (Zero external CDN, pure inline CSS, lookprice.net aesthetic, zero emojis)
  const handlePrintA4Brochure = () => {
    const cfg = SECTOR_CONFIGS[selectedSector];
    const cleanBiz = businessName.trim() || 'Değerli İşletmemiz';
    const printWin = window.open('', '_blank', 'width=960,height=1080');
    if (!printWin) return;

    const custStepsHtml = cfg.customizationSteps
      .map(
        (step) => `
        <div class="cust-step">
          <div class="cust-num">${step.stepNumber}</div>
          <div class="cust-title">${step.title}</div>
          <div class="cust-desc">${step.desc}</div>
        </div>
      `
      )
      .join('');

    const pillarsHtml = cfg.valuePillars
      .slice(0, 6)
      .map(
        (p) => `
        <div class="pillar-card">
          <div class="pillar-top">
            <span class="pillar-code">${p.code}</span>
            <span class="pillar-title">${p.title}</span>
          </div>
          <div class="pillar-desc">${p.desc}</div>
        </div>
      `
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>LookPrice Kurumsal Tanıtım Broşürü - ${cleanBiz}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #020617;
      color: #f8fafc;
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 4mm;
    }
    .brand {
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .brand span { color: #38bdf8; }
    .brand-sub {
      font-size: 8.5pt;
      font-weight: 600;
      color: #94a3b8;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .target-badge {
      font-size: 8.5pt;
      font-weight: 600;
      color: #cbd5e1;
      background: #0f172a;
      border: 1px solid #334155;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .hero-block {
      margin-top: 4mm;
    }
    .kicker {
      font-size: 8.5pt;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }
    .headline {
      font-size: 18pt;
      font-weight: 800;
      line-height: 1.22;
      color: #ffffff;
      letter-spacing: -0.4px;
      margin-bottom: 2.5mm;
    }
    .subheadline {
      font-size: 9.8pt;
      line-height: 1.45;
      color: #94a3b8;
    }
    .cust-container {
      background: #0f172a;
      border: 1px solid #1d4ed8;
      border-radius: 8px;
      padding: 4.5mm;
      margin-top: 4mm;
    }
    .cust-header {
      font-size: 8pt;
      font-weight: 700;
      color: #60a5fa;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 3mm;
    }
    .cust-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4mm;
    }
    .cust-step {
      border-left: 2px solid #2563eb;
      padding-left: 3mm;
    }
    .cust-num {
      font-size: 8pt;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 1mm;
    }
    .cust-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 1.5mm;
    }
    .cust-desc {
      font-size: 8pt;
      line-height: 1.4;
      color: #94a3b8;
    }
    .big-picture-header {
      margin-top: 4.5mm;
    }
    .big-picture-kicker {
      font-size: 8pt;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 1mm;
    }
    .big-picture-lead {
      font-size: 10pt;
      font-weight: 600;
      color: #e2e8f0;
      line-height: 1.38;
    }
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3.5mm;
      margin-top: 3.5mm;
    }
    .pillar-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-left: 3px solid #2563eb;
      border-radius: 6px;
      padding: 3.5mm 4mm;
    }
    .pillar-top {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 1.5mm;
    }
    .pillar-code {
      font-size: 8.5pt;
      font-weight: 800;
      color: #38bdf8;
    }
    .pillar-title {
      font-size: 9.8pt;
      font-weight: 700;
      color: #ffffff;
    }
    .pillar-desc {
      font-size: 8.2pt;
      line-height: 1.42;
      color: #94a3b8;
    }
    .footer-box {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 4mm 5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4mm;
    }
    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
    }
    .footer-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .footer-url {
      font-size: 8.8pt;
      font-weight: 600;
      color: #f8fafc;
    }
    .footer-cred {
      font-size: 8pt;
      color: #93c5fd;
      margin-top: 1mm;
    }
    .footer-contact {
      text-align: right;
    }
    .footer-sender {
      font-size: 9.5pt;
      font-weight: 700;
      color: #ffffff;
    }
    .footer-phone {
      font-size: 11pt;
      font-weight: 800;
      color: #38bdf8;
      margin-top: 1mm;
    }
    .footer-domain {
      font-size: 8pt;
      color: #64748b;
      margin-top: 1mm;
    }
  </style>
</head>
<body>
  <div>
    <div class="top-bar">
      <div>
        <span class="brand">LOOKPRICE<span>.NET</span></span>
        <span class="brand-sub">${cfg.productBrand}</span>
      </div>
      <div class="target-badge">${cleanBiz} (${branchCount > 1 ? `${branchCount} Şubeli Yapı` : 'Kurumsal İşletme'})</div>
    </div>

    <div class="hero-block">
      <div class="kicker">${cfg.heroKicker}</div>
      <div class="headline">${cfg.heroHeadline}</div>
      <div class="subheadline">${cfg.heroSubheadline}</div>
    </div>

    <div class="cust-container">
      <div class="cust-header">1. Aşama: Hazır Web Sitenizi Kendi Panelinizden Nasıl Kişiselleştirirsiniz?</div>
      <div class="cust-grid">
        ${custStepsHtml}
      </div>
    </div>

    <div class="big-picture-header">
      <div class="big-picture-kicker">2. Aşama: Büyük Resim &amp; Çok Şubeli Bulut Yönetim Gücü</div>
      <div class="big-picture-lead">${cfg.sweetenerLead}</div>
    </div>

    <div class="pillars-grid">
      ${pillarsHtml}
    </div>
  </div>

  <div class="footer-box">
    <div class="footer-links">
      <div class="footer-label">Canlı Kurumsal Web &amp; Sektörel Vitrin Bağlantıları</div>
      <div class="footer-url">Kurumsal Web Vitrini: ${customWebDemoUrl}</div>
      <div class="footer-url">${cfg.shortLabel} Vitrini: ${customSectorDemoUrl}</div>
      ${
        includeCredentials
          ? `<div class="footer-cred">Yönetim Paneli Test Girişi (${baseOrigin}/login) — Kullanıcı: ${demoLoginEmail} | Şifre: ${demoLoginPass}</div>`
          : `<div class="footer-cred">${cfg.brochureTagline}</div>`
      }
    </div>
    <div class="footer-contact">
      <div class="footer-sender">${senderName}</div>
      <div class="footer-phone">${senderPhone}</div>
      <div class="footer-domain">www.lookprice.net</div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Top Corporate Bar — Aligned with lookprice.net dark slate & blue theme */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <span>LOOKPRICE.NET KURUMSAL BÜYÜME & PAZARLAMA MERKEZİ</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              &ldquo;Kurumsal Web Siteniz Hazır&rdquo; Kişiselleştirme & Sektörel Bulut Tanıtım Stüdyosu
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Potansiyel müşterilerinize önce hazır kurumsal web sitelerini nasıl kişiselleştirebileceklerini gösterin, ardından çok şubeli LookPrice bulut ekosisteminin büyük resmini sunun.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBrochurePng}
              disabled={isGeneratingPng}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPng ? 'Broşür Hazırlanıyor...' : 'Kurumsal Broşür İndir (PNG)'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintA4Brochure}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>A4 Katalog / PDF Yazdır</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveProspect('draft')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aday Listesine Kaydet</span>
            </button>
          </div>
        </div>

        {/* Sector Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-slate-800">
          {(Object.keys(SECTOR_CONFIGS) as MarketingSectorKey[]).map((secKey) => {
            const cfg = SECTOR_CONFIGS[secKey];
            const isSelected = selectedSector === secKey;
            return (
              <button
                key={secKey}
                type="button"
                onClick={() => handleSelectSector(secKey)}
                className={`text-left px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    {secKey.toUpperCase()}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                </div>
                <div className="text-xs font-semibold text-white truncate mt-0.5">
                  {cfg.shortLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 12-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Target Prospect & Link Configuration */}
        <div className="lg:col-span-4 space-y-4">
          {/* Prospect Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Hedef Müşteri & Şube Profili
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Kişiselleştirilmiş Kurgu
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hedef Firma / Marka Adı
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    setIsCustomCopyEdited(false);
                  }}
                  placeholder="Örn: Seçkin Yapı Market"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Yetkili Kişi / Unvan
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => {
                      setContactPerson(e.target.value);
                      setIsCustomCopyEdited(false);
                    }}
                    placeholder="Örn: Ahmet Bey"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Şube Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={branchCount}
                    onChange={(e) => {
                      setBranchCount(Math.max(1, parseInt(e.target.value, 10) || 1));
                      setIsCustomCopyEdited(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Şehir / Bölge
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setIsCustomCopyEdited(false);
                    }}
                    placeholder="Lefkoşa"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Mobil
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 548 ..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instagram Hesabı
                  </label>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@firmaadi"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kurumsal E-Posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@firma.com"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Demo Links & Login Credentials Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Canlı Vitrin & Panel Demo Bağlantıları
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Kurumsal Web Sitesi Demo Linki (@weblp-demo)
                </label>
                <input
                  type="text"
                  value={customWebDemoUrl}
                  onChange={(e) => {
                    setCustomWebDemoUrl(e.target.value);
                    setIsCustomCopyEdited(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    2. Sektörel Vitrin Demo Linki (@{sectorConfig.demoSlug})
                  </label>
                  {stores.length > 0 && (
                    <select
                      onChange={(e) => handleSelectExistingStoreAsDemo(e.target.value)}
                      defaultValue=""
                      className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Mevcut Mağazadan Seç...</option>
                      {stores.map((st) => (
                        <option key={st.id} value={st.slug}>
                          {st.name} (@{st.slug})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  value={customSectorDemoUrl}
                  onChange={(e) => {
                    setCustomSectorDemoUrl(e.target.value);
                    setIsCustomCopyEdited(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                  <input
                    type="checkbox"
                    checked={includeCredentials}
                    onChange={(e) => {
                      setIncludeCredentials(e.target.checked);
                      setIsCustomCopyEdited(false);
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Metin ve Broşüre Yönetim Paneli Test Giriş Bilgisi Ekle
                  </span>
                </label>

                {includeCredentials && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Demo Kullanıcı E-Posta
                      </label>
                      <input
                        type="text"
                        value={demoLoginEmail}
                        onChange={(e) => {
                          setDemoLoginEmail(e.target.value);
                          setIsCustomCopyEdited(false);
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Demo Şifre
                      </label>
                      <input
                        type="text"
                        value={demoLoginPass}
                        onChange={(e) => {
                          setDemoLoginPass(e.target.value);
                          setIsCustomCopyEdited(false);
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Gönderen İmza / Ekip Adı
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => {
                      setSenderName(e.target.value);
                      setIsCustomCopyEdited(false);
                    }}
                    className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Gönderen İletişim Telefonu
                  </label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => {
                      setSenderPhone(e.target.value);
                      setIsCustomCopyEdited(false);
                    }}
                    className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Copywriting Tone Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Metin Kurgusu & İletişim Yaklaşımı
              </h3>
            </div>
            <div className="space-y-1.5">
              {TONE_OPTIONS.map((t) => {
                const active = selectedTone === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setSelectedTone(t.key);
                      setIsCustomCopyEdited(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {t.label}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column (4 cols): Ready-to-Send Copy Editor & Channel Dispatch */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Kurumsal Tanıtım Metni (Sıfır Emoji / Düzenlenebilir)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  1. Web Siteniz Hazır &rarr; 2. Nasıl Kişiselleştirilir? &rarr; 3. Büyük Resim
                </p>
              </div>
              {isCustomCopyEdited && (
                <button
                  type="button"
                  onClick={() => setIsCustomCopyEdited(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Şablona Sıfırla</span>
                </button>
              )}
            </div>

            {/* Channel Tabs */}
            <div className="grid grid-cols-3 gap-1.5 my-3 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveChannel('whatsapp');
                  setIsCustomCopyEdited(false);
                }}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeChannel === 'whatsapp'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                WhatsApp Mesajı
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveChannel('instagram');
                  setIsCustomCopyEdited(false);
                }}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeChannel === 'instagram'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Instagram DM
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveChannel('email');
                  setIsCustomCopyEdited(false);
                }}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeChannel === 'email'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Kurumsal E-Posta
              </button>
            </div>

            {activeChannel === 'email' && (
              <div className="mb-2.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  E-Posta Konu Başlığı
                </label>
                <input
                  type="text"
                  value={effectiveEmailSubject}
                  onChange={(e) => {
                    setCustomEmailSubject(e.target.value);
                    if (!isCustomCopyEdited) {
                      setCustomCopyText(generatedCopy.body);
                      setIsCustomCopyEdited(true);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <textarea
                rows={18}
                value={effectiveCopyText}
                onChange={(e) => {
                  setCustomCopyText(e.target.value);
                  if (!isCustomCopyEdited) {
                    setCustomEmailSubject(generatedCopy.subject);
                    setIsCustomCopyEdited(true);
                  }
                }}
                className="w-full flex-1 p-3 text-xs leading-relaxed font-sans rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleCopyText(effectiveCopyText, 'main_copy')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedType === 'main_copy' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Metin Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>Tanıtım Metnini Kopyala</span>
                  </>
                )}
              </button>

              {activeChannel === 'whatsapp' && (
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp İle Gönder</span>
                </button>
              )}

              {activeChannel === 'instagram' && (
                <button
                  type="button"
                  onClick={handleOpenInstagram}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Metni Kopyala & Instagram Aç</span>
                </button>
              )}

              {activeChannel === 'email' && (
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-Posta İstemcisinde Aç</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Live Executive Brochure Preview (lookprice.net Dark Corporate Theme) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg text-white">
            {/* Top Blue Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-700" />

            <div className="p-4 space-y-4">
              {/* Brochure Header */}
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div>
                  <div className="text-sm font-extrabold tracking-tight text-white">
                    LOOKPRICE<span className="text-sky-400">.NET</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {sectorConfig.productBrand}
                  </div>
                </div>
                {businessName.trim() && (
                  <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                    {businessName.trim()}
                  </div>
                )}
              </div>

              {/* Stage 1: Kurumsal Web Siteniz Hazır */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  {sectorConfig.heroKicker}
                </div>
                <h4 className="text-sm font-extrabold text-white leading-snug">
                  {sectorConfig.heroHeadline}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {sectorConfig.heroSubheadline}
                </p>
              </div>

              {/* Stage 2: Nasıl Kişiselleştirirsiniz? */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-lg p-3 space-y-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Web Sitenizi Kendi Panelinizden Nasıl Kişiselleştirirsiniz?
                </div>
                <div className="space-y-2">
                  {sectorConfig.customizationSteps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="border-l-2 border-blue-600 pl-2.5 py-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-sky-400">
                          {step.stepNumber}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {step.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 3: Büyük Resim & Vurucu Sistem Özellikleri */}
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Büyük Resim: Web Sitenizin Arkasındaki Bulut Gücü
                  </div>
                  <p className="text-[11px] font-medium text-slate-300 leading-snug mt-0.5">
                    {sectorConfig.sweetenerLead}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {sectorConfig.valuePillars.map((pillar) => (
                    <div
                      key={pillar.code}
                      className="bg-slate-900 border border-slate-800 border-l-2 border-l-blue-600 rounded-lg p-2.5"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-extrabold text-sky-400">
                          {pillar.code}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {pillar.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-1">
                        {pillar.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brochure Footer */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Canlı Vitrin & Yönetim Paneli Bağlantıları
                </div>
                <div className="text-[11px] text-slate-200 font-medium truncate">
                  Kurumsal Web: <span className="text-white font-semibold">{customWebDemoUrl}</span>
                </div>
                <div className="text-[11px] text-slate-200 font-medium truncate">
                  {sectorConfig.shortLabel}: <span className="text-white font-semibold">{customSectorDemoUrl}</span>
                </div>
                {includeCredentials && (
                  <div className="text-[10px] text-sky-300 pt-1 border-t border-slate-800">
                    Panel Test Girişi ({baseOrigin}/login): {demoLoginEmail} / Şifre: {demoLoginPass}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Prospect Campaigns Table */}
      {savedCampaigns.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Kaydedilen Potansiyel Müşteri & Tanıtım Listesi ({savedCampaigns.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hazırladığınız kurumsal teklifleri tek tıkla geri yükleyebilir veya iletişim durumunu güncelleyebilirsiniz.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-2.5">Firma / Şube</th>
                  <th className="py-2 px-2.5">Sektör</th>
                  <th className="py-2 px-2.5">Yetkili & İletişim</th>
                  <th className="py-2 px-2.5">Durum</th>
                  <th className="py-2 px-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {savedCampaigns.map((item) => {
                  const cfg = SECTOR_CONFIGS[item.sector] || SECTOR_CONFIGS.shoplp;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.businessName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.branchCount} Şube • {item.city || 'Belirtilmedi'}
                        </div>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                          {cfg.shortLabel}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {item.contactPerson || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.phone || item.instagramHandle || item.email || 'İletişim girilmedi'}
                        </div>
                      </td>
                      <td className="py-2 px-2.5">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateProspectStatus(
                              item.id,
                              e.target.value as SavedProspectCampaign['status']
                            )
                          }
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                        >
                          <option value="draft">Taslak Hazır</option>
                          <option value="sent_whatsapp">WhatsApp Gönderildi</option>
                          <option value="sent_instagram">Instagram DM Gönderildi</option>
                          <option value="sent_email">E-Posta Gönderildi</option>
                          <option value="replied">Dönüş Alındı / Görüşülüyor</option>
                          <option value="converted">Müşteri Kazanıldı</option>
                        </select>
                      </td>
                      <td className="py-2 px-2.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadProspect(item)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Yükle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProspect(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminMarketingHub;
