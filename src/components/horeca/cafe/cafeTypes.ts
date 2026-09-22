export interface BookingChildGuest {
  id: string;
  birth_date: string;
}

export type BoardOptionKey = 'RO' | 'BB' | 'HB' | 'FB' | 'AI';

export const calculateGuestAgeInfo = (birthDateStr: string, customPolicy?: any) => {
  const policy = customPolicy || {
    enabled: true,
    apply_to_room: true,
    infant_0_2_rate: 100,
    toddler_3_6_rate: 50,
    child_7_12_rate: 30
  };

  if (!birthDateStr) {
    const defaultInfantRate = policy.infant_0_2_rate ?? 100;
    return {
      age: 2,
      category: 'infant' as const,
      discountRate: defaultInfantRate,
      labelTr: 'Bebek (0-2 Yaş)',
      discountText: defaultInfantRate === 100 ? '%100 Ücretsiz' : defaultInfantRate > 0 ? `%${defaultInfantRate} İndirimli` : 'Standart'
    };
  }

  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (isNaN(age) || age < 0) age = 0;

  if (!policy.enabled || policy.apply_to_room === false) {
    return {
      age,
      category: (age <= 2 ? 'infant' : age <= 6 ? 'toddler' : age <= 12 ? 'child' : 'adult') as any,
      discountRate: 0,
      labelTr: age <= 2 ? `Bebek (${age} Yaş)` : age <= 6 ? `Küçük Çocuk (${age} Yaş)` : age <= 12 ? `Çocuk (${age} Yaş)` : `Yetişkin (${age} Yaş)`,
      discountText: 'Standart (İndirimsiz)'
    };
  }

  if (age <= 2) {
    const rate = policy.infant_0_2_rate ?? 100;
    return {
      age,
      category: 'infant' as const,
      discountRate: rate,
      labelTr: `Bebek (${age} Yaş)`,
      discountText: rate === 100 ? '%100 Ücretsiz' : rate > 0 ? `%${rate} İndirimli` : 'İndirimsiz'
    };
  } else if (age <= 6) {
    const rate = policy.toddler_3_6_rate ?? 50;
    return {
      age,
      category: 'toddler' as const,
      discountRate: rate,
      labelTr: `Küçük Çocuk (${age} Yaş)`,
      discountText: rate === 100 ? '%100 Ücretsiz' : rate > 0 ? `%${rate} İndirimli` : 'İndirimsiz'
    };
  } else if (age <= 12) {
    const rate = policy.child_7_12_rate ?? 30;
    return {
      age,
      category: 'child' as const,
      discountRate: rate,
      labelTr: `Çocuk (${age} Yaş)`,
      discountText: rate === 100 ? '%100 Ücretsiz' : rate > 0 ? `%${rate} İndirimli` : 'İndirimsiz'
    };
  } else {
    return {
      age,
      category: 'adult' as const,
      discountRate: 0,
      labelTr: `Yetişkin (${age} Yaş)`,
      discountText: 'Tam Ücret'
    };
  }
};

export interface CompletedReservationVoucher {
  code: string;
  room: any;
  checkIn: string;
  checkOut: string;
  nights: number;
  boardName: string;
  paymentLabel: string;
  guest: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  adultsCount: number;
  breakdown: any;
  waUrl: string;
}
