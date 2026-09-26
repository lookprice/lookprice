export interface StaffWaiter {
  id: string;
  name: string;
  pin: string;
  phone?: string;
  section?: string;
  active: boolean;
}

export const DEFAULT_WAITERS: StaffWaiter[] = [
  { id: 'w_1', name: 'Garson 1 (Ahmet)', pin: '1001', section: 'Salon', phone: '', active: true },
  { id: 'w_2', name: 'Garson 2 (Mehmet)', pin: '1002', section: 'Bahçe', phone: '', active: true },
  { id: 'w_3', name: 'Garson 3 (Can)', pin: '1003', section: 'Havuz / Şezlong', phone: '', active: true },
  { id: 'w_4', name: 'Garson 4 (Ayşe)', pin: '1004', section: 'Teras / VIP Loca', phone: '', active: true },
];

export const getStoreWaiters = (branding: any): StaffWaiter[] => {
  if (branding?.waiter_list && Array.isArray(branding.waiter_list) && branding.waiter_list.length > 0) {
    return branding.waiter_list;
  }
  return DEFAULT_WAITERS;
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
