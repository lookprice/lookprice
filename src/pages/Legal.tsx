import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Trash2, ChevronLeft, Lock, Server, Database, Clock, AlertTriangle, CheckCircle2, Globe } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const LegalPage: React.FC<{ type: 'privacy' | 'terms' | 'deletion' }> = ({ type }) => {
  const navigate = useNavigate();
  const [docLang, setDocLang] = useState<'en' | 'tr'>('en');

  const content = {
    privacy: {
      titleEn: 'Privacy Policy & Amazon SP-API Data Protection Policy (DPP)',
      titleTr: 'Gizlilik Politikası ve Amazon SP-API Veri Koruma Politikası (DPP)',
      icon: <Shield className="w-8 h-8 text-indigo-600" />,
      lastUpdateEn: 'November 6, 2026',
      lastUpdateTr: '6 Kasım 2026',
      sectionsEn: [
        {
          heading: '1. Organization & Solution Provider Identity',
          text: 'LookPrice ("Organization", "we", "our", accessible at https://lookprice.net) is a public multi-channel cloud ERP, Product Information Management (PIM), e-Invoice, and Order Optimization SaaS platform registered in Turkey (TR). This Privacy & Data Governance Policy governs how LookPrice collects, processes, stores, protects, shares, retains, and disposes of information—including Amazon Selling Partner API (SP-API) data and Personally Identifiable Information (PII)—in strict compliance with the Amazon Services API Developer Agreement, Acceptable Use Policy (AUP), Data Protection Policy (DPP), KVKK (Turkish Law No. 6698), and GDPR.'
        },
        {
          heading: '2. How Amazon Information & PII Are Collected',
          text: 'LookPrice collects Amazon Information strictly from authorized Amazon Selling Partners ("Merchants") who explicitly grant OAuth 2.0 authorization via Login with Amazon (LWA). We do not scrape or retrieve Amazon data from any unverified external sources. Depending on the Merchant’s workflow, we access SP-API endpoints using short-lived LWA access tokens and Restricted Data Tokens (RDT) via the Tokens API for the following authorized roles:\n• Product Listing & Pricing: Product SKU, ASIN, catalog attributes, and pricing tiers.\n• Inventory & Order Management: Warehouse stock quantities, order IDs, order statuses, SKUs, and financial summaries.\n• Direct-to-Consumer Shipping (Restricted PII via RDT): Buyer recipient name, shipping street address, city, postal code, and phone number.\n• Tax Invoicing (Restricted PII via RDT): Buyer legal name/company title, billing address, Turkish Tax Office (Vergi Dairesi), and Turkish Tax ID / National ID (VKN / TCKN).'
        },
        {
          heading: '3. How Amazon Information & PII Are Used and Processed',
          text: 'All Amazon Information and Buyer PII retrieved via SP-API is processed solely on behalf of the authorizing Merchant for the following explicit operational purposes:\n1. Merchant-Fulfilled Network (MFN) Shipping & Fulfillment: Generating domestic carrier shipping labels and waybills (e-İrsaliye) so the Merchant can ship orders directly to customers.\n2. Statutory Turkish Tax Invoicing (GİB e-Fatura & e-Arşiv): Under Turkish Revenue Administration (Gelir İdaresi Başkanlığı - GİB) Tax Procedure Law (VUK), every commercial e-commerce sale in Turkey requires an official electronic tax invoice containing the buyer’s legal name, billing address, and Tax ID (VKN/TCKN). LookPrice uses RDT tax data exclusively to generate and transmit statutory UBL-TR electronic invoices.\n3. Multi-Channel Inventory & Order Synchronization: Deducting stock across physical and online warehouses in real time to prevent overselling and stockouts.'
        },
        {
          heading: '4. How Data Is Stored & Protected (Encryption in Transit & At Rest)',
          text: 'LookPrice enforces enterprise-grade technical and organizational security controls in full alignment with NIST SP 800-53 and ISO/IEC 27001:\n• Encryption in Transit: All external API requests, OAuth callbacks, webhook payloads, and internal microservice communications are encrypted in transit using TLS 1.2 and TLS 1.3 with strong cipher suites (ECDHE-RSA-AES256-GCM-SHA384).\n• Encryption at Rest & Key Management: All databases (PostgreSQL), storage volumes, and encrypted backups storing Amazon Information and PII at rest are encrypted using AES-256 symmetric encryption and RSA-2048 asymmetric cryptography. Cryptographic keys are managed, hardware-protected, and automatically rotated every 365 days via Google Cloud Key Management Service (Cloud KMS) with strict IAM separation of duties.\n• Network Isolation: Production databases and application servers reside inside isolated Google Cloud Virtual Private Cloud (VPC) private subnets with zero public IP addresses, protected by Cloud Armor Web Application Firewalls (WAF), IDS/IPS intrusion detection, and DDoS mitigation.'
        },
        {
          heading: '5. How Data Is Shared (Strict Third-Party Disclosure Controls)',
          text: 'LookPrice NEVER sells, rents, leases, monetizes, or discloses Amazon Information or Buyer PII to data brokers, marketing agencies, or unauthorized third parties. Strict tenant-level data isolation ensures one Merchant can never view or access another Merchant’s data. Buyer PII is transmitted externally ONLY when strictly necessary to execute the Merchant’s authorized instruction:\n• Statutory Tax Reporting: Transmitting encrypted UBL-TR invoice payloads to the Turkish Revenue Administration (GİB) via accredited e-Invoice integrators solely to register the legal tax invoice.\n• Order Shipment: Transmitting recipient shipping address to the Merchant’s contracted logistics carrier solely to generate the physical shipping label.'
        },
        {
          heading: '6. Data Retention, Automated Disposal & Deletion Policy (< 30 Days)',
          text: 'In strict accordance with Amazon’s Data Protection Policy (DPP), LookPrice retains Personally Identifiable Information (PII) retrieved through SP-API (buyer name, shipping/billing address, phone number, and tax identification) for NO LONGER THAN 30 DAYS after order shipment or tax invoice issuance.\n• Automated 30-Day Purge: An automated daily background job cryptographically scrubs, overwrites, and permanently deletes all Buyer PII fields from active PostgreSQL tables and caches once the 30-day fulfillment window elapses (or immediately after statutory invoice transmission).\n• Immediate Revocation & Deletion: If a Selling Partner disconnects their Amazon account, revokes OAuth authorization in Seller Central, or submits a deletion request to info@lookprice.net or sales@lookprice.net, all associated LWA tokens, RDT sessions, and stored Amazon Information are permanently purged within 24 hours.'
        },
        {
          heading: '7. Access Control, Logging, Monitoring & Incident Response',
          text: '• Least-Privilege Access & MFA: Access to production systems is restricted strictly on a need-to-know basis using Role-Based Access Control (RBAC), unique individual employee identities (zero shared accounts), 12+ character complex passwords rotated every 90–365 days, and mandatory Multi-Factor Authentication (MFA).\n• Security Logging & Monitoring: Tamper-evident audit logs (Google Cloud Audit Logs & SIEM) record all authentication events, database queries, and RDT token invocations with a minimum 12-month retention period and real-time anomaly alerting.\n• 24-Hour Incident Notification: In the event of any suspected or confirmed security incident, unauthorized access, or data breach involving Amazon Information, our Incident Management Point of Contact (IMPOC) will notify Amazon immediately at security@amazon.com within 24 hours of detection.'
        },
        {
          heading: '8. Security, Corporate Offices & Privacy Point of Contact (IMPOC)',
          text: 'Organization Name: LookPrice (https://lookprice.net)\nPrimary Security & Incident Management Point of Contact (IMPOC): Serdar Erdekli\nCorporate Emails: sales@lookprice.net | info@lookprice.net\n\nTURKIYE Office (Headquarters):\nAddress: Dizdariye Mah. Belediye Cad. No:10/2 Büyükçekmece - ISTANBUL / TURKIYE\nPhone: +90 212 881 24 42 | Email: sales@lookprice.net\n\nK.K.T.C. Office (Cyprus Regional Branch):\nAddress: 30 Ağustos Sok. Kyrenia Court 10 / 11 GİRNE (KYRENIA) / K.K.T.C.\nPhone: +90 548 890 23 09 | Email: info@lookprice.net'
        }
      ],
      sectionsTr: [
        {
          heading: '1. Kurum ve Çözüm Ortağı Kimliği',
          text: 'LookPrice ("Kurum", "biz", https://lookprice.net adresinden erişilebilir), Türkiye (TR) merkezli çok kanallı bulut ERP, Ürün Bilgi Yönetimi (PIM), e-Fatura/e-Arşiv ve Sipariş Optimizasyonu SaaS platformudur. İşbu Gizlilik ve Veri Yönetişimi Politikası; Amazon Selling Partner API (SP-API) verileri ve Kişisel Veriler (PII) dahil olmak üzere tüm verilerin Amazon Hizmetleri API Geliştirici Sözleşmesi, Kabul Edilebilir Kullanım Politikası (AUP), Veri Koruma Politikası (DPP), 6698 sayılı KVKK ve GDPR hükümlerine tam uyumlu olarak nasıl toplandığını, işlendiğini, saklandığını, korunduğunu ve imha edildiğini düzenler.'
        },
        {
          heading: '2. Amazon Verilerinin ve Kişisel Verilerin (PII) Toplanması',
          text: 'LookPrice, Amazon verilerini yalnızca Login with Amazon (LWA) OAuth 2.0 yetkilendirmesi ile açık onay veren Amazon Satıcılarından ("Mağazalar") toplar. Yetkili SP-API rolleri kapsamında kısa ömürlü LWA erişim anahtarları ve Restricted Data Token (RDT) kullanılarak şu veriler işlenir:\n• Ürün Listeleme ve Fiyatlandırma: SKU, ASIN, katalog nitelikleri ve fiyat bilgileri.\n• Envanter ve Sipariş Yönetimi: Stok miktarları, sipariş numaraları ve sipariş durumları.\n• Doğrudan Tüketiciye Kargo (RDT ile Kısıtlı PII): Alıcı adı, teslimat adresi ve telefon numarası.\n• Vergi Faturalandırması (RDT ile Kısıtlı PII): Alıcı resmi unvanı, fatura adresi, Vergi Dairesi ve VKN / TCKN bilgileri.'
        },
        {
          heading: '3. Verilerin Kullanım ve İşleme Amaçları',
          text: 'SP-API üzerinden alınan tüm veriler yalnızca yetki veren satıcının operasyonlarını yürütmek amacıyla kullanılır:\n1. MFN Kargo ve Teslimat: Satıcının siparişleri müşteriye gönderebilmesi için kargo barkodu ve e-İrsaliye oluşturulması.\n2. Yasal GİB e-Fatura ve e-Arşiv Düzenleme: Gelir İdaresi Başkanlığı (GİB) Vergi Usul Kanunu (VUK) uyarınca Amazon.com.tr siparişleri için resmi UBL-TR elektronik fatura oluşturulması.\n3. Çok Kanallı Stok ve Sipariş Senkronizasyonu: Fiziksel mağaza ve pazaryeri stoklarının anlık eşitlenerek stoksuz satışın önlenmesi.'
        },
        {
          heading: '4. Veri Saklama, Şifreleme ve Ağ Güvenliği',
          text: '• Aktarım Sırasında Şifreleme (In Transit): Tüm API trafiği ve veri iletişimi TLS 1.2 ve TLS 1.3 protokolleri ile şifrelenir.\n• Durağan Halde Şifreleme (At Rest) ve Anahtar Yönetimi: Tüm veritabanları (PostgreSQL) ve yedekler AES-256 ve RSA-2048 algoritmaları ile şifrelenir. Şifreleme anahtarları Google Cloud KMS üzerinde donanımsal olarak korunur ve yılda bir otomatik döndürülür.\n• Ağ İzolasyonu: Üretim veritabanları dış internete kapalı özel VPC alt ağlarında (private subnet) barındırılır; Cloud Armor WAF, IDS/IPS ve DDoS koruması ile korunur.'
        },
        {
          heading: '5. Veri Paylaşımı (Üçüncü Taraflarla Paylaşım Yasağı)',
          text: 'LookPrice, Amazon verilerini veya alıcı kişisel verilerini hiçbir koşulda üçüncü taraflara satmaz, kiralamaz veya pazarlama amacıyla paylaşmaz. Veriler yalnızca satıcının yasal e-faturasını kesmek üzere GİB onaylı entegratöre ve paketin taşınması için satıcının anlaşmalı kargo firmasına şifreli olarak iletilir.'
        },
        {
          heading: '6. Veri Saklama Süresi ve Otomatik İmha Politikası (< 30 Gün)',
          text: 'Amazon Veri Koruma Politikası (DPP) uyarınca, SP-API üzerinden alınan tüm Kişisel Veriler (PII), siparişin kargolanmasından veya faturanın kesilmesinden itibaren EN FAZLA 30 GÜN saklanır. 30 günü dolduran veya satıcı tarafından bağlantısı kesilen tüm kişisel veriler otomatik arka plan görevleriyle veritabanlarımızdan kalıcı ve geri döndürülemez biçimde silinir/anonimleştirilir.'
        },
        {
          heading: '7. Güvenlik İzleme, Loglama, İhlal Bildirimi (24 Saat) ve Kurumsal İletişim',
          text: 'Tüm sistem erişimleri çok faktörlü kimlik doğrulama (MFA) ve bireysel RBAC yetkileriyle sınırlandırılmıştır. Güvenlik logları SIEM üzerinde en az 12 ay saklanır. Amazon verilerini ilgilendiren olası bir güvenlik ihlali durumunda tespit anından itibaren en geç 24 saat içinde security@amazon.com adresine resmi bildirim yapılır.\n\nKurumsal İletişim & Veri Koruma Sorumlusu (IMPOC): Serdar Erdekli\n• TÜRKİYE Merkez: Dizdariye Mah. Belediye Cad. No:10/2 Büyükçekmece - İSTANBUL | Tel: +90 212 881 24 42 | E-posta: sales@lookprice.net\n• K.K.T.C. Ofis: 30 Ağustos Sok. Kyrenia Court 10 / 11 GİRNE (KYRENIA) | Tel: +90 548 890 23 09 | E-posta: info@lookprice.net'
        }
      ]
    },
    terms: {
      titleEn: 'Terms of Service & Solution Provider Agreement',
      titleTr: 'Kullanım Koşulları ve Çözüm Ortağı Sözleşmesi',
      icon: <FileText className="w-8 h-8 text-indigo-600" />,
      lastUpdateEn: 'November 6, 2026',
      lastUpdateTr: '6 Kasım 2026',
      sectionsEn: [
        {
          heading: '1. Scope of SaaS Services',
          text: 'LookPrice (https://lookprice.net) provides cloud-based Enterprise Resource Planning (ERP), Product Information Management (PIM), real-time multi-channel inventory synchronization, order management, shipping label generation, and Turkish Revenue Administration (GİB) e-Fatura/e-Arşiv integration for retail merchants and Amazon.com.tr Selling Partners.'
        },
        {
          heading: '2. Merchant Authorization & OAuth Security',
          text: 'Merchants connect their marketplace accounts (including Amazon Selling Partner API via Login with Amazon OAuth 2.0) voluntarily. Merchants retain full ownership of their catalog, order, and financial records, and may revoke API access at any time via the LookPrice dashboard or Amazon Seller Central.'
        },
        {
          heading: '3. Acceptable Use & Regulatory Compliance',
          text: 'Users agree to use LookPrice strictly for lawful commercial operations, accurate inventory representation, and compliant tax invoicing. LookPrice operates in full compliance with the Amazon Services API Developer Agreement, Acceptable Use Policy, and Data Protection Policy.'
        }
      ],
      sectionsTr: [
        {
          heading: '1. Hizmet Kapsamı',
          text: 'LookPrice (https://lookprice.net); perakende mağazaları ve Amazon.com.tr satıcıları için bulut tabanlı ERP, Ürün Bilgi Yönetimi (PIM), gerçek zamanlı çok kanallı stok senkronizasyonu, sipariş yönetimi, kargo etiketi üretimi ve GİB e-Fatura/e-Arşiv entegrasyonu sunar.'
        },
        {
          heading: '2. Mağaza Yetkilendirmesi ve OAuth Güvenliği',
          text: 'Satıcılar pazaryeri hesaplarını (Amazon SP-API OAuth 2.0 dahil) kendi onaylarıyla bağlar. Satıcılar diledikleri zaman LookPrice paneli veya Amazon Seller Central üzerinden erişim yetkisini iptal edebilir.'
        },
        {
          heading: '3. Mevzuata Uygunluk',
          text: 'LookPrice, Amazon API Geliştirici Sözleşmesi, Kabul Edilebilir Kullanım Politikası (AUP) ve Veri Koruma Politikası (DPP) kurallarına tam uyumlu olarak hizmet verir.'
        }
      ]
    },
    deletion: {
      titleEn: 'Data Deletion & Right to Erasure Instructions',
      titleTr: 'Veri Silme ve İmha Talimatları',
      icon: <Trash2 className="w-8 h-8 text-indigo-600" />,
      lastUpdateEn: 'November 6, 2026',
      lastUpdateTr: '6 Kasım 2026',
      sectionsEn: [
        {
          heading: 'Automated 30-Day PII Purge Policy',
          text: 'All Amazon Buyer PII retrieved via SP-API Restricted Data Tokens (RDT) is automatically and permanently purged from LookPrice databases within 30 days of order fulfillment without requiring any manual action.'
        },
        {
          heading: 'Step 1: Instant Disconnection via LookPrice Dashboard',
          text: 'Navigate to Store Dashboard -> Settings -> Marketplace Integrations (Amazon SP-API / Meta / Google) and click "Disconnect & Purge Credentials". This immediately revokes OAuth refresh tokens and deletes all cached marketplace data.'
        },
        {
          heading: 'Step 2: Revocation via Amazon Seller Central or Direct Request',
          text: 'You may also revoke LookPrice authorization directly inside Amazon Seller Central -> Partner Network -> Manage Your Apps, or email our Data Protection Officer at info@lookprice.net or sales@lookprice.net for immediate full-account erasure within 24 hours.'
        }
      ],
      sectionsTr: [
        {
          heading: 'Otomatik 30 Günlük Kişisel Veri (PII) İmha Politikası',
          text: 'Amazon SP-API üzerinden alınan tüm alıcı kişisel verileri (PII), sipariş tamamlandıktan sonra en geç 30 gün içerisinde hiçbir manuel işleme gerek kalmaksızın otomatik olarak silinir.'
        },
        {
          heading: 'Adım 1: LookPrice Paneli Üzerinden Anında Bağlantı Kesme',
          text: 'Mağaza Paneli -> Ayarlar -> Pazaryeri Entegrasyonları sekmesine giderek "Bağlantıyı Kes ve Verileri Sil" butonuna tıkladığınızda tüm OAuth anahtarları ve önbellek verileri anında imha edilir.'
        },
        {
          heading: 'Adım 2: Amazon Seller Central veya Doğrudan Silme Talebi',
          text: 'Yetkilendirmeyi Amazon Seller Central -> Uygulamalarımı Yönet ekranından kaldırabilir veya info@lookprice.net / sales@lookprice.net adreslerine e-posta göndererek 24 saat içinde tüm verilerinizin kalıcı olarak silinmesini talep edebilirsiniz.'
        }
      ]
    }
  };

  const active = content[type];
  const activeSections = docLang === 'en' ? active.sectionsEn : active.sectionsTr;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors group cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{docLang === 'en' ? 'Back to LookPrice Home (lookprice.net)' : 'LookPrice Ana Sayfaya Dön'}</span>
          </button>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <Globe className="w-4 h-4 text-indigo-600 ml-2" />
            <button
              onClick={() => setDocLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                docLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              English (Official Audit View)
            </button>
            <button
              onClick={() => setDocLang('tr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                docLang === 'tr' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Türkçe
            </button>
          </div>
        </div>

        {/* Navigation Pills between Legal Pages */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            to="/privacy"
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
              type === 'privacy'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Privacy & Amazon DPP Policy (/privacy)
          </Link>
          <Link
            to="/terms"
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
              type === 'terms'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Terms of Service (/terms)
          </Link>
          <Link
            to="/data-deletion"
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
              type === 'deletion'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Data Deletion Policy (/data-deletion)
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-10 border-b border-slate-200 bg-slate-900 text-white">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/15 shrink-0">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Amazon SP-API DPP & KVKK / GDPR Compliant</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {docLang === 'en' ? active.titleEn : active.titleTr}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  {docLang === 'en'
                    ? `Effective & Last Updated: ${active.lastUpdateEn} • Organization: LookPrice (https://lookprice.net)`
                    : `Yürürlük ve Son Güncelleme: ${active.lastUpdateTr} • Kurum: LookPrice (https://lookprice.net)`}
                </p>
              </div>
            </div>

            {/* Key Security Control Summary Matrix for Auditors */}
            {type === 'privacy' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-black">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Encryption</span>
                  </div>
                  <p className="text-white text-xs font-bold mt-1">AES-256 at Rest & TLS 1.3 in Transit</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-black">
                    <Clock className="w-3.5 h-3.5" />
                    <span>PII Retention</span>
                  </div>
                  <p className="text-white text-xs font-bold mt-1">&lt; 30 Days Automated Purge</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-sky-300 text-xs font-black">
                    <Server className="w-3.5 h-3.5" />
                    <span>Network Control</span>
                  </div>
                  <p className="text-white text-xs font-bold mt-1">Isolated GCP VPC & Cloud Armor WAF</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Incident SLA</span>
                  </div>
                  <p className="text-white text-xs font-bold mt-1">&lt; 24h Report to security@amazon.com</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {activeSections.map((section, idx) => (
              <div key={idx} className="space-y-2.5 pb-6 border-b border-slate-100 last:border-b-0 last:pb-0">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">{section.heading}</h2>
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {section.text}
                </p>
              </div>
            ))}

            <div className="pt-6 border-t border-slate-200 bg-slate-50 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {docLang === 'en'
                      ? 'Data Protection Officer & Incident Management Point of Contact (IMPOC)'
                      : 'Veri Koruma Görevlisi ve Güvenlik İhlali İrtibat Noktası (IMPOC)'}
                  </h3>
                  <p className="text-slate-600 text-xs mt-1">
                    Serdar Erdekli • Email: <a href="mailto:sales@lookprice.net" className="text-indigo-600 font-bold underline">sales@lookprice.net</a> / <a href="mailto:info@lookprice.net" className="text-indigo-600 font-bold underline">info@lookprice.net</a>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="mailto:sales@lookprice.net"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors"
                  >
                    sales@lookprice.net
                  </a>
                  <a
                    href="mailto:info@lookprice.net"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors"
                  >
                    info@lookprice.net
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 text-xs text-slate-700">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="font-black text-slate-900 uppercase tracking-wider text-[11px] mb-1">TURKIYE (Headquarters)</div>
                  <p className="font-semibold">Dizdariye Mah. Belediye Cad. No:10/2 Büyükçekmece - ISTANBUL</p>
                  <p className="mt-1 font-bold text-indigo-600">Tel: <a href="tel:+902128812442" className="hover:underline">+90 212 881 24 42</a> • Mail: <a href="mailto:sales@lookprice.net" className="hover:underline">sales@lookprice.net</a></p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="font-black text-slate-900 uppercase tracking-wider text-[11px] mb-1">K.K.T.C. (Cyprus Office)</div>
                  <p className="font-semibold">30 Ağustos Sok. Kyrenia Court 10 / 11 GİRNE (KYRENIA)</p>
                  <p className="mt-1 font-bold text-indigo-600">Tel: <a href="tel:+905488902309" className="hover:underline">+90 548 890 23 09</a> • Mail: <a href="mailto:info@lookprice.net" className="hover:underline">info@lookprice.net</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-bold">
            © 2026 LookPrice (https://lookprice.net). All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalPage;
