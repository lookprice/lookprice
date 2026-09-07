export const REAL_ESTATE_REGIONS = {
  "Girne": ["Ağırdağ", "Akçiçek", "Akdeniz", "Alagadi", "Alemdağ", "Alsancak", "Arapköy", "Aşağı Girne", "Bahçeli", "Bellapais", "Beşparmak", "Boğaz", "Çamlıbel", "Çatalköy", "Dağyolu", "Dikmen", "Doğanköy", "Edremit", "Esentepe", "Geçitköy", "Girne Merkez", "Göçeri", "Hisarköy", "Ilgaz", "İncesu", "Karaağaç", "Karakum", "Karaoğlanoğlu", "Karmi", "Karşıyaka", "Kayalar", "Kılıçarslan", "Koruçam", "Kozan", "Kömürcü", "Lapta", "Malatya", "Ozanköy", "Pınarbaşı", "Sadrazamköy", "Şirinevler", "Taşkent", "Tepebaşı", "Türk Mahallesi", "Yeşiltepe", "Yukarı Girne", "Zeytinlik"],
  "Lefkoşa": ["Akıncılar", "Alayköy", "Balıkesir", "Batıkent", "Beyköy", "Cihangir", "Çağlayan", "Çukurova", "Değirmenlik", "Demirhan", "Dilekkaya", "Dumlupınar", "Düzova", "Erdemli", "Gaziköy", "Gelibolu", "Göçmenköy", "Gökhan", "Gönyeli", "Gürpınar", "Hamitköy", "Haspolat", "Kalavaç", "Kanlıköy", "Kırklar", "Kızılbaş", "Köşklüçiftlik", "Kumsal", "Küçük Kaymaklı", "Lefkoşa Surlariçi", "Marmara", "Meriç", "Metehan", "Minareliköy", "Ortaköy", "Sanayi Bölgesi", "Taşkınköy", "Türkeli", "Yeniceköy", "Yenikent", "Yenişehir"],
  "Gazimağusa": ["Akdoğan", "Akova", "Alaniçi", "Arıdamı", "Aslanköy", "Atlılar", "Baykal", "Beyarmudu", "Çanakkale", "Çayönü", "Çınarlı", "Dörtyol", "Dumlupınar", "Geçitkale", "Gönendere", "Gülseren", "Güvercinlik", "İnönü", "Kaleiçi", "Karakol", "Korkuteli", "Köprülü", "Kurudere", "Küçük Erenköy", "Mağusa Merkez", "Mallıdağ", "Maraş", "Mormenekşe", "Muratağa", "Mutluyaka", "Nergisli", "Paşaköy", "Pınarlı", "Pirhan", "Sakarya", "Salamis", "Serdarlı", "Sütlüce", "Tatlısu", "Tirmen", "Turunçlu", "Tuzla", "Türkmenköy", "Ulukışla", "Vadili", "Yamaçköy", "Yeni Boğaziçi", "Yıldırım"],
  "İskele": ["Ağıllar", "Altınova", "Ardahan", "Avtepe", "Aygün", "Bafra", "Bahçeler", "Balalan", "Boğaz", "Boğaziçi", "Boğaztepe - Monarga", "Boltaşlı", "Büyükkonuk", "Çayırova", "Derince", "Dipkarpaz", "Ergazi", "Esenköy", "İskele Merkez", "Kaleburnu", "Kalecik", "Kantara", "Kaplıca", "Kilitkaya", "Kumyalı", "Kurtuluş", "Kuruova", "Kuzucuk", "Long Beach", "Mehmetçik", "Mersinlik", "Ötüken", "Pamuklu", "Sazlıköy", "Sınırüstü", "Sipahi", "Taşlıca", "Topçuköy", "Turnalar", "Tuzluca", "Yarköy", "Yedikonuk", "Yeni Erenköy", "Yeşilköy", "Ziyamet"],
  "Güzelyurt": ["Akçay", "Aşağı Bostancı", "Aydınköy", "Güzelyurt Merkez", "Kalkanlı", "Mevlevi", "Serhatköy", "Yayla", "Yukarı Bostancı", "Zümrütköy"],
  "Lefke": ["Bağlıköy", "Cengizköy", "Doğancı", "Gaziveren", "Gemikonağı", "Lefke", "Taşpınar", "Yedidalga", "Yeşilırmak", "Yeşilyurt"]
};

export const EMLAK_TIPI_SUB_TIPLERI: Record<string, string[]> = {
  "residence": ["Daire", "Villa", "Penthouse", "Müstakil", "Residence", "Yazlık"],
  "commercial": ["Dükkan", "Ofis", "İş Yeri", "Komple Bina", "Plaza", "Depo"],
  "land": ["Tarla", "İmarlı Arsa", "Bahçeli Arsa", "Turistik Arsa", "Zeytinlik"],
  "Konut": ["Daire", "Villa", "Penthouse", "Müstakil", "Residence", "Yazlık"],
  "Ticari": ["Dükkan", "Ofis", "İş Yeri", "Komple Bina", "Plaza", "Depo"],
  "Arsa": ["Tarla", "İmarlı Arsa", "Bahçeli Arsa", "Turistik Arsa", "Zeytinlik"]
};

export const getAvailableSubTypes = (propertyType: string): string[] => {
  if (!propertyType || propertyType === "all") {
    const all = [
      ...EMLAK_TIPI_SUB_TIPLERI["residence"],
      ...EMLAK_TIPI_SUB_TIPLERI["commercial"],
      ...EMLAK_TIPI_SUB_TIPLERI["land"]
    ];
    return Array.from(new Set(all));
  }
  const key = propertyType === "residence" || propertyType === "Konut" ? "residence" :
              propertyType === "commercial" || propertyType === "Ticari" ? "commercial" :
              propertyType === "land" || propertyType === "Arsa" ? "land" : propertyType;
  return EMLAK_TIPI_SUB_TIPLERI[key] || [];
};

export const getAvailableSubRegions = (regionKey: string): string[] => {
  if (!regionKey || regionKey === "all") return [];
  const cleanKey = regionKey.toLowerCase().trim();
  const foundKey = Object.keys(REAL_ESTATE_REGIONS).find(
    k => k.toLowerCase().trim() === cleanKey
  );
  return foundKey ? (REAL_ESTATE_REGIONS as any)[foundKey] || [] : [];
};
