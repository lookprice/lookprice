import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldAlert, FileText, Mail, Phone, Clock } from "lucide-react";

interface IrpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export function IrpModal({ isOpen, onClose, lang }: IrpModalProps) {
  if (!isOpen) return null;

  const isTr = lang === 'tr';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8"
        >
          <div className="bg-slate-900 p-6 md:p-8 text-white relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30 text-rose-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{isTr ? 'Olay Müdahale Planı (IRP)' : 'Incident Response Plan (IRP)'}</h2>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-bold">
                  {isTr ? 'Veri Sızıntısı & Acil Durum Protokolü' : 'Data Breach & Emergency Protocol'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* 1. Amaç */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-800">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold">1. {isTr ? 'Amaç ve Kapsam' : 'Purpose and Scope'}</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">
                {isTr 
                  ? 'Bu Olay Müdahale Planı (IRP), mağaza altyapımızda veya API entegrasyonlarında (özellikle Amazon SP-API gibi dış servislerde) meydana gelebilecek olası bir güvenlik ihlali, veri sızıntısı veya şüpheli yetkisiz erişim durumunda standart ve hızlı bir prosedür izlenmesini sağlamak amacıyla hazırlanmıştır. Tüm sistem operatörleri bu protokole uymakla yükümlüdür.' 
                  : 'This Incident Response Plan (IRP) is prepared to ensure a standard and rapid procedure is followed in the event of a potential security breach, data leak, or suspicious unauthorized access in our store infrastructure or API integrations (especially external services like Amazon SP-API).'}
              </p>
            </section>

            {/* 2. 24 Saat Kuralı */}
            <section className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl">
              <div className="flex items-center space-x-2 text-rose-800 mb-2">
                <Clock className="w-5 h-5" />
                <h3 className="text-lg font-bold">2. {isTr ? '24 Saat İçinde Bildirim Zorunluluğu' : '24-Hour Notification Requirement'}</h3>
              </div>
              <p className="text-rose-700/80 leading-relaxed text-sm">
                {isTr 
                  ? 'Kişisel Verileri (PII) ilgilendiren herhangi bir güvenlik olayı veya yetkisiz API erişimi tespit edildiğinde, olay tespitten itibaren EN GEÇ 24 SAAT içinde security@amazon.com (eğer Amazon entegrasyonunu etkiliyorsa) ve yerel KVKK otoritelerine resmi olarak bildirilmelidir.' 
                  : 'When any security incident or unauthorized API access involving Personally Identifiable Information (PII) is detected, it must be officially reported to security@amazon.com (if affecting Amazon integration) and local data protection authorities NO LATER THAN 24 HOURS after detection.'}
              </p>
            </section>

            {/* 3. Müdahale Adımları */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">3. {isTr ? 'Standart Müdahale Adımları' : 'Standard Response Steps'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm">
                  <div className="font-bold text-indigo-600 mb-2">A. {isTr ? 'Tespit ve İzolasyon' : 'Detection and Isolation'}</div>
                  <p className="text-xs text-slate-600">
                    {isTr ? 'Şüpheli aktivite loglardan tespit edilir. Etkilenen API anahtarları veya kullanıcı hesapları derhal askıya alınarak ağ izolasyonu sağlanır.' : 'Suspicious activity is detected from logs. Affected API keys or user accounts are immediately suspended to ensure network isolation.'}
                  </p>
                </div>
                
                <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm">
                  <div className="font-bold text-indigo-600 mb-2">B. {isTr ? 'Değerlendirme ve Analiz' : 'Assessment and Analysis'}</div>
                  <p className="text-xs text-slate-600">
                    {isTr ? 'Sızan verinin boyutu (PII içerip içermediği) ve kaynağı belirlenir. Güvenlik Denetim İzi (Audit Logs) incelenir.' : 'The extent of leaked data (whether it contains PII) and its source are determined. Audit Logs are reviewed.'}
                  </p>
                </div>
                
                <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm">
                  <div className="font-bold text-indigo-600 mb-2">C. {isTr ? 'Bildirim' : 'Notification'}</div>
                  <p className="text-xs text-slate-600">
                    {isTr ? '24 saat kuralı işletilerek gerekli yerlere (Amazon Security, KVKK, Kullanıcılar) şeffaf bir bildirim yapılır.' : 'The 24-hour rule is executed, providing transparent notification to necessary parties (Amazon Security, DPA, Users).'}
                  </p>
                </div>
                
                <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm">
                  <div className="font-bold text-indigo-600 mb-2">D. {isTr ? 'İyileştirme (Eradication)' : 'Eradication & Recovery'}</div>
                  <p className="text-xs text-slate-600">
                    {isTr ? 'Güvenlik açığı yamalanır, yeni ve güvenli API anahtarları oluşturulur, şifreler sıfırlanır ve sistem güvenli modda yeniden başlatılır.' : 'Vulnerabilities are patched, new secure API keys are generated, passwords are reset, and the system is rebooted in safe mode.'}
                  </p>
                </div>
              </div>
            </section>

            {/* 4. İletişim Kanalları */}
            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">4. {isTr ? 'Acil İletişim Kanalları' : 'Emergency Contact Channels'}</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">{isTr ? 'Amazon Güvenlik Ekibi' : 'Amazon Security Team'}</div>
                    <a href="mailto:security@amazon.com" className="text-indigo-600 font-medium">security@amazon.com</a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700">{isTr ? 'Dahili Sistem Yöneticisi' : 'Internal System Admin'}</div>
                    <span className="text-slate-600 font-medium">admin@lookprice.net</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-slate-800 transition-colors"
            >
              {isTr ? 'Anladım ve Kabul Ediyorum' : 'Understood and Accepted'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
