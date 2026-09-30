export const N11_PRODUCT_SALE_STATUS = {
  1: { code: "BEFORE_SALE", title: "Satış Öncesi" },
  2: { code: "ON_SALE", title: "Satışta" },
  3: { code: "OUT_OF_STOCK", title: "Stok Yok" },
  4: { code: "SALE_CLOSED", title: "Satışa Kapalı" },
} as const;

export const N11_PRODUCT_APPROVAL_STATUS = {
  1: { code: "ACTIVE", title: "Aktif (Satışta)" },
  2: { code: "SUSPENDED", title: "Beklemede" },
  3: { code: "PROHIBITED", title: "Yasaklı" },
  4: { code: "UNLISTED", title: "Liste Dışı" },
  5: { code: "WAITING_FOR_APPROVAL", title: "Onay Bekleyen" },
  6: { code: "REJECTED", title: "Reddedilen" },
} as const;

export const N11_DISCOUNT_TYPE = {
  1: "İndirim Tutarı Cinsinden",
  2: "İndirim Oranı Cinsinden",
  3: "İndirimli Fiyat Cinsinden",
} as const;

export const N11_PRODUCT_CONDITION = {
  1: "Yeni",
  2: "2. El",
} as const;

export const N11_PAYMENT_TYPE = {
  1: "Kredi Kartı",
  2: "BKM Express",
  3: "Akbank Direkt",
  4: "PayPal",
  5: "MallPoint",
  6: "GarantiPay",
  7: "Garanti Loan",
  8: "MasterPass",
  9: "İşbank Pay",
  10: "Paycell",
  11: "Compay",
  12: "YKB Pay",
  13: "Fibabank",
  14: "Diğer",
} as const;

export const N11_DELIVERY_FEE_TYPE = {
  1: "N11 Öder (Ücretsiz Kargo)",
  2: "Alıcı Öder",
  3: "Mağaza Öder (Ücretsiz Kargo)",
  4: "Şartlı Kargo (Alıcı Öder)",
  5: "Şartlı Kargo (Satıcı Öder)",
} as const;

export const N11_ORDER_STATUS = {
  1: "İşlem Bekliyor",
  2: "İşlemde",
  3: "İptal Edilmiş",
  4: "Geçersiz",
  5: "Tamamlandı",
} as const;

export const N11_ORDER_ITEM_STATUS = {
  1: { title: "İşlem Bekliyor", color: "yellow" },
  2: { title: "Ödendi", color: "blue" },
  3: { title: "Geçersiz", color: "gray" },
  4: { title: "İptal Edilmiş", color: "red" },
  5: { title: "Kabul Edilmiş", color: "indigo" },
  6: { title: "Kargoda", color: "purple" },
  7: { title: "Teslim Edilmiş", color: "emerald" },
  8: { title: "Reddedilmiş", color: "rose" },
  9: { title: "İade Edildi", color: "amber" },
  10: { title: "Tamamlandı", color: "green" },
  11: { title: "İade/İptal/Değişim Talep Edildi", color: "orange" },
  12: { title: "İade/İptal/Değişim Tamamlandı", color: "slate" },
  13: { title: "Kargoda İade", color: "pink" },
  14: { title: "Kargo Yapılması Gecikmiş", color: "red" },
  15: { title: "Kabul Edilmiş Ama Zamanında Kargoya Verilmemiş", color: "orange" },
  16: { title: "Teslim Edilmiş İade", color: "zinc" },
  17: { title: "Tamamlandıktan Sonra İade", color: "stone" },
} as const;

export const N11_CLAIM_CANCEL_STATUS = {
  REQUESTED: "İptal Talebi Geldi",
  RETRACTED: "İptal Geri Çekildi",
  COMPLETED: "İptal Edildi",
  DENIED: "İptal Talebi Reddedildi",
  REJECT: "Reddedildi",
  MANUAL_REFUND: "Manuel Para İadesi Tamamlandı",
  ALL: "Bütün İptal Durumları",
} as const;

export function getN11OrderItemStatusText(status: number | string): string {
  const num = Number(status);
  return (N11_ORDER_ITEM_STATUS as any)[num]?.title || `Bilinmeyen Statü (${status})`;
}

export function getN11PaymentTypeText(type: number | string): string {
  const num = Number(type);
  return (N11_PAYMENT_TYPE as any)[num] || `Diğer/Bilinmeyen (${type})`;
}

export function getN11DeliveryFeeTypeText(type: number | string): string {
  const num = Number(type);
  return (N11_DELIVERY_FEE_TYPE as any)[num] || `Bilinmeyen (${type})`;
}
