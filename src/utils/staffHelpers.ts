export interface StaffWaiter {
  id: string;
  name: string;
  pin: string;
  phone?: string;
  section?: string;
  active: boolean;
}

export const isHorecaStore = (branding: any): boolean => {
  if (!branding) return false;
  const storeType = (branding.store_type || branding.page_layout_settings?.sector || '').toLowerCase();
  return storeType === 'cafe_restaurant' || storeType === 'horeca' || storeType === 'horecalp' || Boolean(branding.hotel_module_enabled);
};

export const getStoreWaiters = (branding: any): StaffWaiter[] => {
  // STRICT SECTOR ISOLATION (RULE 0):
  // Waiters/Garsonlar belong EXCLUSIVELY to horecaLP (cafe_restaurant / horeca / hotel).
  // shopLP (retail/product), real estate, and automotive stores must NEVER have waiters or waiter lists.
  if (!isHorecaStore(branding)) {
    return [];
  }
  if (branding?.waiter_list && Array.isArray(branding.waiter_list)) {
    return branding.waiter_list;
  }
  return [];
};

export const generateWaiterWhatsappInviteUrl = (
  waiter: StaffWaiter,
  storeName: string,
  menuUrl: string
): string => {
  const cleanPhone = (waiter.phone || '').replace(/\D/g, '');
  const targetUrl = `${menuUrl}${menuUrl.includes('?') ? '&' : '?'}garson_id=${encodeURIComponent(waiter.id)}&garson_pin=${encodeURIComponent(waiter.pin)}&mode=waiter`;
  
  const message = `🍽️ *${storeName || 'LookPrice'} - Garson El Terminali Yetkisi*

👤 *Personel:* ${waiter.name}
📍 *Bölüm / Görev Alanı:* ${waiter.section || 'Genel Saha'}
🔑 *Giriş PIN Kodu:* *${waiter.pin}*

👉 *Sipariş Terminaline Başlamak İçin Tıklayın:*
${targetUrl}

_(Bağlantıya tıklayarak telefonunuzdan masalara, havuz kenarına ve şezlonglara anında sipariş alabilirsiniz.)_`;

  const encodedMsg = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  return `https://wa.me/?text=${encodedMsg}`;
};
