export interface HyperFrameStep {
  id: string;
  startSec: number;
  endSec: number;
  title: string;
  narration: {
    tr: string;
    en: string;
    el: string;
  };
  cursorTarget?: {
    x: number; // percentage 0 - 100
    y: number; // percentage 0 - 100
    action?: 'hover' | 'click' | 'type' | 'idle';
    actionText?: string;
  };
  statePayload?: any;
}

export interface HyperFrameScenario {
  id: 
    | 'book_nav' 
    | 'book_isbn' 
    | 'hotel_booking' 
    | 'hotel_whatsapp'
    | 'hotel_cleaning'
    | 'hotel_channel'
    | 'shop_pos';
  sectorKey: 'booklp' | 'hotellp' | 'shoplp';
  badge: string;
  accentColor: string; // e.g. '#a855f7'
  title: {
    tr: string;
    en: string;
    el: string;
  };
  description: {
    tr: string;
    en: string;
    el: string;
  };
  duration: number; // in seconds
  steps: HyperFrameStep[];
}

export const HYPERFRAME_SCENARIOS: HyperFrameScenario[] = [
  {
    id: 'book_nav',
    sectorKey: 'booklp',
    badge: 'BookLP • Eser Gezinti Barı',
    accentColor: '#a855f7',
    title: {
      tr: 'BookLP — Eserler Arası Kesintisiz Gezinti Barı',
      en: 'BookLP — Seamless In-Catalog Book Navigator Bar',
      el: 'BookLP — Απρόσκοπτη Γραμμή Περιήγησης Βιβλίων'
    },
    description: {
      tr: 'Ziyaretçiler detay sayfasından ayrılmadan, alt gezinti barı ile kategorideki tüm eserler arasında akıcı ve kesintisiz geçiş yapar.',
      en: 'Visitors fluidly discover and switch between all books in the category via the bottom navigator bar without ever leaving the product detail view.',
      el: 'Οι επισκέπτες ανακαλύπτουν και εναλλάσσουν βιβλία μέσω της κάτω γραμμής περιήγησης χωρίς να εγκαταλείψουν τη σελίδα.'
    },
    duration: 30,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 7,
        title: 'Kitap Detay Sayfası',
        narration: {
          tr: "LookPrice BookLP şablonunda ziyaretçi 'Kürk Mantolu Madonna' detay sayfasında gezinmektedir.",
          en: "In the LookPrice BookLP showcase, the reader is browsing 'Madonna in a Fur Coat' detail page.",
          el: "Στο LookPrice BookLP, ο αναγνώστης περιηγείται στη σελίδα 'Η Μαντόνα με το Γούνινο Παλτό'."
        },
        cursorTarget: { x: 65, y: 35, action: 'hover' },
        statePayload: {
          activeBookIndex: 0,
          highlightBar: false
        }
      },
      {
        id: 'step_2',
        startSec: 8,
        endSec: 15,
        title: 'Alt Gezinti Barından Eser Seçimi',
        narration: {
          tr: "Sayfayı yenilemeden alt gezinme çubuğunda listelenen 'Tutunamayanlar' eserinin üzerine gelinir ve tıklanır.",
          en: "Without refreshing the page, cursor moves down to 'The Disconnected' in the bottom navigation bar and clicks.",
          el: "Χωρίς ανανέωση της σελίδας, ο κέρσορας επιλέγει το 'Tutunamayanlar' στην κάτω γραμμή."
        },
        cursorTarget: { x: 50, y: 91, action: 'click', actionText: 'Tutunamayanlar' },
        statePayload: {
          activeBookIndex: 1,
          highlightBar: true
        }
      },
      {
        id: 'step_3',
        startSec: 16,
        endSec: 23,
        title: 'Anında İçerik & Fiyat Güncellemesi',
        narration: {
          tr: "Sayfa sıfırlanmadan kapak görseli, arka kapak alıntısı, 724 sayfa künyesi ve 340 ₺ fiyat anında güncellenir.",
          en: "Instant transition updates book cover, synopsis, 724 pages specs, and 340 ₺ pricing with zero screen flicker.",
          el: "Άμεση μετάβαση ενημερώνει το εξώφυλλο, τη σύνοψη, τις 724 σελίδες και την τιμή των 340 ₺."
        },
        cursorTarget: { x: 70, y: 48, action: 'hover' },
        statePayload: {
          activeBookIndex: 1,
          highlightBar: false
        }
      },
      {
        id: 'step_4',
        startSec: 24,
        endSec: 30,
        title: 'Kesintisiz Eser Geçişi Tamamlandı',
        narration: {
          tr: "Tek dokunuşla 'Saatleri Ayarlama Enstitüsü'ne geçiş yapılır. Okuyucuyu sayfada tutan yüksek dönüşümlü deneyim!",
          en: "With a single tap, reader explores 'The Time Regulation Institute'. A high-conversion reading experience!",
          el: "Με ένα άγγιγμα, εξερευνάται το επόμενο κλασικό έργο. Μια εμπειρία υψηλής μετατροπής!"
        },
        cursorTarget: { x: 62, y: 91, action: 'click', actionText: 'Saatleri Ayarlama' },
        statePayload: {
          activeBookIndex: 2,
          highlightBar: true
        }
      }
    ]
  },
  {
    id: 'book_isbn',
    sectorKey: 'booklp',
    badge: 'BookLP • Akıllı ISBN Çözümleme',
    accentColor: '#c084fc',
    title: {
      tr: 'BookLP — ISBN / Barkod ile Akıllı Kitap Kartı Oluşturma',
      en: 'BookLP — Smart Book Card Creation via ISBN Barcode',
      el: 'BookLP — Δημιουργία Κάρτας Βιβλίου μέσω ISBN'
    },
    description: {
      tr: 'Operatörün ISBN barkodunu okutmasıyla yazar, çevirmen, yayınevi ve basım yılı alanlarının otomatik dolması ve vitrine anında yansıması.',
      en: 'Scanning the ISBN barcode auto-fills author, publisher, publication year, page count and instantly publishes the book to the showcase.',
      el: 'Η σάρωση του γραμμωτού κώδικα ISBN συμπληρώνει αυτόματα συγγραφέα, εκδότη και δημοσιεύει το βιβλίο στη βιτρίνα.'
    },
    duration: 40,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 10,
        title: 'ISBN Kodu Girişi',
        narration: {
          tr: "Operatör 'Yeni Kitap Ekle' modülünde barkod alanına '9789750800726' kodunu girer.",
          en: "Operator navigates to 'Add New Book' and inputs the ISBN code '9789750800726'.",
          el: "Ο χειριστής εισάγει τον κωδικό ISBN '9789750800726' στη φόρμα."
        },
        cursorTarget: { x: 42, y: 34, action: 'type', actionText: '9789750800726' },
        statePayload: {
          isbnValue: '9789750800726',
          isScanning: false,
          isAutoFilled: false,
          isSaved: false
        }
      },
      {
        id: 'step_2',
        startSec: 11,
        endSec: 20,
        title: 'Akıllı ISBN Sorgusu',
        narration: {
          tr: "'Akıllı ISBN Çözümle' butonuna basılır; LookPrice uluslararası kitap veri kataloğundan künye bilgileri çekilir.",
          en: "Clicking 'Smart ISBN Resolve' queries LookPrice global book database for instant bibliographic metadata.",
          el: "Το πάτημα του 'Επίλυση ISBN' ανακτά άμεσα τα βιβλιογραφικά στοιχεία."
        },
        cursorTarget: { x: 74, y: 34, action: 'click', actionText: 'Çözümle' },
        statePayload: {
          isbnValue: '9789750800726',
          isScanning: true,
          isAutoFilled: false,
          isSaved: false
        }
      },
      {
        id: 'step_3',
        startSec: 21,
        endSec: 30,
        title: 'Tüm Künye Alanlarının Otomatik Dolması',
        narration: {
          tr: "Kitap Adı, Yazar (Sabahattin Ali), Yayınevi (Yapı Kredi Yayınları), 160 Sayfa ve Kapak Resmi anında dolduruldu!",
          en: "Book Title, Author (Sabahattin Ali), Publisher (YKY), 160 Pages, and Cover Art are populated automatically!",
          el: "Τίτλος, Συγγραφέας, Εκδότης, Σελίδες και Εξώφυλλο συμπληρώνονται αυτόματα!"
        },
        cursorTarget: { x: 38, y: 72, action: 'type', actionText: '185 ₺' },
        statePayload: {
          isbnValue: '9789750800726',
          isScanning: false,
          isAutoFilled: true,
          priceValue: '185 ₺',
          isSaved: false
        }
      },
      {
        id: 'step_4',
        startSec: 31,
        endSec: 40,
        title: 'Kaydet & Vitrinde Canlı Yayın',
        narration: {
          tr: "Kaydet butonuna basılır; kitap 10 saniye içinde mağaza vitrininde 'Yeni Çıkanlar' bandında yayına girer.",
          en: "Saved with one click; book goes live on the digital bookstore showcase within 10 seconds under 'New Releases'!",
          el: "Αποθηκεύεται με ένα κλικ και εμφανίζεται στη διαδικτυακή βιτρίνα σε 10 δευτερόλεπτα!"
        },
        cursorTarget: { x: 80, y: 88, action: 'click', actionText: 'Kaydet' },
        statePayload: {
          isbnValue: '9789750800726',
          isScanning: false,
          isAutoFilled: true,
          priceValue: '185 ₺',
          isSaved: true
        }
      }
    ]
  },
  {
    id: 'hotel_booking',
    sectorKey: 'hotellp',
    badge: 'HotelLP • Rezervasyon & Doluluk',
    accentColor: '#10b981',
    title: {
      tr: 'HotelLP — Oda Tipi, Olanaklar & Doluluk Takvimi',
      en: 'HotelLP — Room Types, Amenities & Interactive Booking Calendar',
      el: 'HotelLP — Τύποι Δωματίων, Παροχές & Ημερολόγιο Κρατήσεων'
    },
    description: {
      tr: 'Süit oda tipinin seçilmesi, kişi kapasitesi ve olanakların işaretlenmesi, takvim üzerinden müsaitlik kontrolü ve anlık rezervasyon akışı.',
      en: 'Explore luxury suites, check guest capacities & amenities, verify real-time dates on the availability calendar, and confirm bookings.',
      el: 'Εξερευνήστε σουίτες, επιλέξτε παροχές, ελέγξτε τη διαθεσιμότητα στο ημερολόγιο και ολοκληρώστε την κράτηση.'
    },
    duration: 45,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 11,
        title: 'Süit Oda Kartı & Detayları',
        narration: {
          tr: "Otel vitrininde 'Deluxe Deniz Manzaralı Süit' incelenir; 2+1 kapasite ve 4.500 ₺ / Gece fiyatı görüntülenir.",
          en: "Guest explores 'Deluxe Sea View Suite'; featuring 2+1 capacity and 4,500 ₺ / Night tariff.",
          el: "Ο επισκέπτης εξετάζει τη 'Deluxe Σουίτα με Θέα στη Θάλασσα' με τιμή 4.500 ₺ / διανυκτέρευση."
        },
        cursorTarget: { x: 38, y: 45, action: 'hover' },
        statePayload: {
          activeTab: 'details',
          selectedDates: null,
          isBooked: false
        }
      },
      {
        id: 'step_2',
        startSec: 12,
        endSec: 22,
        title: 'Lüks Olanaklar & Hizmetler',
        narration: {
          tr: "Odaya ait Jakuzi, Özel Teras, Ücretsiz Wi-Fi, Zengin Kahvaltı ve Minibar olanakları incelenir.",
          en: "Room amenities including Jacuzzi, Private Terrace, High-Speed Wi-Fi, Breakfast & Minibar are highlighted.",
          el: "Επισημαίνονται οι παροχές του δωματίου: Τζακούζι, Ιδιωτική Βεράντα, Wi-Fi και Πρωινό."
        },
        cursorTarget: { x: 68, y: 38, action: 'click', actionText: 'Olanaklar' },
        statePayload: {
          activeTab: 'amenities',
          selectedDates: null,
          isBooked: false
        }
      },
      {
        id: 'step_3',
        startSec: 23,
        endSec: 34,
        title: 'İnteraktif Doluluk Takvimi (14-18 Eylül)',
        narration: {
          tr: "Canlı doluluk takviminden 14 - 18 Eylül (4 Gece) seçilir; sistem anında toplam 18.000 ₺ tutarı hesaplar.",
          en: "Guest selects Sep 14 - 18 (4 Nights) on the calendar; instant calculation totals 18,000 ₺ with full availability.",
          el: "Επιλέγονται οι ημερομηνίες 14-18 Σεπτεμβρίου (4 διανυκτερεύσεις) με αυτόματο υπολογισμό 18.000 ₺."
        },
        cursorTarget: { x: 55, y: 64, action: 'click', actionText: '14-18 Eylül Seç' },
        statePayload: {
          activeTab: 'calendar',
          selectedDates: '14 - 18 Eylül (4 Gece)',
          totalPrice: '18.000 ₺',
          isBooked: false
        }
      },
      {
        id: 'step_4',
        startSec: 35,
        endSec: 45,
        title: 'Rezervasyon Onayı & WhatsApp Kuponu',
        narration: {
          tr: "Tek tıkla rezervasyon teyidi oluşturulur, takvim bloke edilir ve misafire dijital onay kuponu üretilir.",
          en: "Reservation is instantly confirmed, calendar dates locked, and official digital voucher generated.",
          el: "Η κράτηση επιβεβαιώνεται άμεσα και δημιουργείται ψηφιακό κουπόνι επιβεβαίωσης."
        },
        cursorTarget: { x: 80, y: 78, action: 'click', actionText: 'Onayla' },
        statePayload: {
          activeTab: 'calendar',
          selectedDates: '14 - 18 Eylül (4 Gece)',
          totalPrice: '18.000 ₺',
          isBooked: true,
          bookingRef: 'HTL-2026-9941'
        }
      }
    ]
  },
  {
    id: 'hotel_whatsapp',
    sectorKey: 'hotellp',
    badge: 'HotelLP • WhatsApp Voucher & QR',
    accentColor: '#22c55e',
    title: {
      tr: 'HotelLP — Otomatik WhatsApp Rezervasyon Kuponu & QR Giriş',
      en: 'HotelLP — Automated WhatsApp Booking Voucher & Instant QR Check-in',
      el: 'HotelLP — Αυτόματο Κουπόνι Κράτησης WhatsApp & QR Check-in'
    },
    description: {
      tr: 'Rezervasyon tamamlandığı an misafirin telefonuna otel logosu, check-in saati, navigasyon haritası ve QR anahtar gönderilir.',
      en: 'Instantly dispatches branded voucher, check-in instructions, GPS location pin, and fast-track QR key to the guest via WhatsApp.',
      el: 'Αποστέλλει άμεσα κουπόνι με λογότυπο, οδηγίες check-in και κωδικό QR στο WhatsApp του επισκέπτη.'
    },
    duration: 35,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 8,
        title: 'Rezervasyon Kaydı & Misafir İletişimi',
        narration: {
          tr: "Sistemde misafir Ahmet Yılmaz için 'Deluxe Balayı Süiti' kaydı teyit edilir ve WhatsApp API tetiklenir.",
          en: "Reservation for guest Ahmet Yilmaz in 'Deluxe Honeymoon Suite' is confirmed and WhatsApp trigger activates.",
          el: "Επιβεβαιώνεται η κράτηση για τον Ahmet Yilmaz και ενεργοποιείται το WhatsApp API."
        },
        cursorTarget: { x: 30, y: 35, action: 'hover' },
        statePayload: {
          stage: 'preview',
          guestName: 'Ahmet Yılmaz',
          phone: '+90 533 888 1234',
          room: 'Deluxe Balayı Süiti #304',
          dates: '18 - 22 Eylül 2026 (4 Gece)',
          isSent: false
        }
      },
      {
        id: 'step_2',
        startSec: 9,
        endSec: 18,
        title: 'Özelleştirilmiş QR Voucher Oluşturma',
        narration: {
          tr: "Otel logosu, Wi-Fi şifresi, resepsiyon WhatsApp butonu ve temassız kapı açıcı QR kod hazır hale getirilir.",
          en: "Branded QR voucher renders with hotel logo, high-speed Wi-Fi credentials, and one-tap reception contact.",
          el: "Δημιουργείται κουπόνι QR με λογότυπο, κωδικούς Wi-Fi και άμεση επαφή υποδοχής."
        },
        cursorTarget: { x: 50, y: 55, action: 'click', actionText: 'Voucher Üret' },
        statePayload: {
          stage: 'voucher_ready',
          guestName: 'Ahmet Yılmaz',
          phone: '+90 533 888 1234',
          room: 'Deluxe Balayı Süiti #304',
          dates: '18 - 22 Eylül 2026 (4 Gece)',
          isSent: false
        }
      },
      {
        id: 'step_3',
        startSec: 19,
        endSec: 27,
        title: 'Tek Tıkla WhatsApp Mesajı İletimi',
        narration: {
          tr: "Tek tuşla WhatsApp mesajı gönderilir; telefon ekranında resmi onay mesajı ve PDF voucher teslim edilir.",
          en: "With a single click, the verified WhatsApp notification and downloadable PDF voucher reach the guest's phone.",
          el: "Με ένα κλικ, το επίσημο μήνυμα επιβεβαίωσης και το PDF κουπόνι αποστέλλονται στο τηλέφωνο."
        },
        cursorTarget: { x: 75, y: 75, action: 'click', actionText: 'WhatsApp ile Gönder' },
        statePayload: {
          stage: 'voucher_ready',
          guestName: 'Ahmet Yılmaz',
          phone: '+90 533 888 1234',
          room: 'Deluxe Balayı Süiti #304',
          dates: '18 - 22 Eylül 2026 (4 Gece)',
          isSent: true
        }
      },
      {
        id: 'step_4',
        startSec: 28,
        endSec: 35,
        title: 'Teslim Edildi & Temassız Check-in Hazır',
        narration: {
          tr: "Çift mavi tik teyidi alınır; misafir otele ulaştığında resepsiyonda beklemeden doğrudan odasına geçebilir.",
          en: "Double blue check confirmed; the guest can bypass reception queues upon arrival with mobile fast check-in.",
          el: "Επιβεβαίωση παράδοσης: ο επισκέπτης απολαμβάνει ταχεία είσοδο χωρίς αναμονή στην υποδοχή."
        },
        cursorTarget: { x: 85, y: 40, action: 'hover' },
        statePayload: {
          stage: 'delivered',
          guestName: 'Ahmet Yılmaz',
          phone: '+90 533 888 1234',
          room: 'Deluxe Balayı Süiti #304',
          dates: '18 - 22 Eylül 2026 (4 Gece)',
          isSent: true
        }
      }
    ]
  },
  {
    id: 'hotel_cleaning',
    sectorKey: 'hotellp',
    badge: 'HotelLP • Kat Hizmetleri & Housekeeping',
    accentColor: '#06b6d4',
    title: {
      tr: 'HotelLP — Kat Hizmetleri & Temizlik Durum Takip Paneli',
      en: 'HotelLP — Housekeeping & Live Room Cleaning Status Board',
      el: 'HotelLP — Υπηρεσία Ορόφων & Πίνακας Κατάστασης Καθαριότητας'
    },
    description: {
      tr: 'Kat şefleri ve temizlik personeli için anlık oda durumları (Temiz, Kirli, Temizlikte, Bakımda) ve görev atamaları.',
      en: 'Floor managers and staff monitor live room statuses (Clean, Dirty, In Progress, Maintenance) and assign tasks in real time.',
      el: 'Πραγματικός χρόνος κατάστασης δωματίων (Καθαρό, Ακάθαρτο, Σε Καθαρισμό, Συντήρηση) για το προσωπικό.'
    },
    duration: 35,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 9,
        title: 'Kat Planı & Oda Durum Matrisi',
        narration: {
          tr: "Otel kat paneli açılır; 12 odanın 7'si Dolu, 3'ü Kirli (Check-out yapılan) ve 2'si Temiz olarak listelenir.",
          en: "Housekeeping floor board opens displaying 12 rooms: 7 Occupied, 3 Dirty (checked-out), and 2 Ready.",
          el: "Ο πίνακας ορόφου εμφανίζει 12 δωμάτια: 7 κατειλημμένα, 3 ακάθαρτα και 2 έτοιμα."
        },
        cursorTarget: { x: 25, y: 35, action: 'hover' },
        statePayload: {
          highlightRoom: null,
          staffAssigned: false,
          roomStatus: 'dirty'
        }
      },
      {
        id: 'step_2',
        startSec: 10,
        endSec: 18,
        title: 'Check-out Yapılan Odaya Görevli Atama',
        narration: {
          tr: "Boşalan #204 numaralı Deniz Manzaralı odaya temizlik personeli 'Fatma Hanım' öncelikli olarak atanır.",
          en: "Staff member 'Fatma H.' is assigned to priority room #204 Sea View following morning guest check-out.",
          el: "Ανάθεση καθαρισμού του δωματίου #204 στο προσωπικό με ένδειξη υψηλής προτεραιότητας."
        },
        cursorTarget: { x: 48, y: 48, action: 'click', actionText: 'Personel Ata: Fatma H.' },
        statePayload: {
          highlightRoom: 204,
          staffAssigned: true,
          roomStatus: 'cleaning'
        }
      },
      {
        id: 'step_3',
        startSec: 19,
        endSec: 27,
        title: 'Mobil Terminalden Temizlik Onayı',
        narration: {
          tr: "Personel mobil cihazından 'Oda Temizlendi & Minibar Sayıldı' butonuna dokunur; durum anında yeşile döner.",
          en: "Housekeeper taps 'Cleaned & Minibar Audited' on mobile tablet; room icon turns vibrant green instantly.",
          el: "Το προσωπικό επιβεβαιώνει την ολοκλήρωση και η ένδειξη του δωματίου γίνεται πράσινη."
        },
        cursorTarget: { x: 75, y: 65, action: 'click', actionText: 'Temizlendi & Onayla' },
        statePayload: {
          highlightRoom: 204,
          staffAssigned: true,
          roomStatus: 'inspected'
        }
      },
      {
        id: 'step_4',
        startSec: 28,
        endSec: 35,
        title: 'Resepsiyona Canlı Müsaitlik Bildirimi',
        narration: {
          tr: "Resepsiyon ekranına anlık sesli bildirim düşer: #204 hazır! Yeni gelen misafir anında odaya alınabilir.",
          en: "Live ping alerts the front desk: Room #204 is inspected and ready for early guest check-in!",
          el: "Ειδοποίηση στην υποδοχή: Το δωμάτιο #204 είναι έτοιμο για check-in!"
        },
        cursorTarget: { x: 80, y: 30, action: 'hover' },
        statePayload: {
          highlightRoom: 204,
          staffAssigned: true,
          roomStatus: 'ready'
        }
      }
    ]
  },
  {
    id: 'hotel_channel',
    sectorKey: 'hotellp',
    badge: 'HotelLP • Dinamik Fiyat Matrisi & Sezon',
    accentColor: '#f59e0b',
    title: {
      tr: 'HotelLP — Sezonluk Dinamik Fiyat & Hafta Sonu Çarpanı',
      en: 'HotelLP — Seasonal Dynamic Pricing Matrix & Weekend Multipliers',
      el: 'HotelLP — Δυναμική Τιμολόγηση & Εποχιακές Προσαρμογές'
    },
    description: {
      tr: 'Yüksek sezon, bayram ve hafta sonları için tek tıkla oda fiyatlarına kural tanımlama ve tüm vitrinde anında güncelleme.',
      en: 'Define smart pricing rules for high seasons, holidays, and weekends with real-time automatic showcase tariff updates.',
      el: 'Ορίστε έξυπνους κανόνες τιμολόγησης για περιόδους αιχμής, αργίες και Σαββατοκύριακα.'
    },
    duration: 35,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 9,
        title: 'Fiyat & Sezon Yönetim Tablosu',
        narration: {
          tr: "Fiyat matrisi ekranında 'Standart', 'Deluxe' ve 'Kral Dairesi' baz oda fiyatları listelenir.",
          en: "The hotel tariff board displays base rates for Standard, Deluxe, and Presidential Suite categories.",
          el: "Εμφανίζονται οι βασικές τιμές για Standard, Deluxe και Προεδρική Σουίτα."
        },
        cursorTarget: { x: 30, y: 35, action: 'hover' },
        statePayload: {
          multiplier: 1.0,
          seasonName: 'Standart Sezon',
          applied: false
        }
      },
      {
        id: 'step_2',
        startSec: 10,
        endSec: 18,
        title: 'Hafta Sonu & Yüksek Sezon Kuralı Seçimi',
        narration: {
          tr: "'Cuma-Cumartesi +%25 Çarpan' ve 'Minimum 2 Gece Konaklama' kuralı aktif hale getirilir.",
          en: "'Weekend +25% Multiplier' and '2-Night Minimum Stay' smart pricing policy is activated.",
          el: "Ενεργοποιείται κανόνας '+25% για Σαββατοκύριακα' και 'Ελάχιστη διαμονή 2 νύχτες'."
        },
        cursorTarget: { x: 60, y: 48, action: 'click', actionText: '+%25 Hafta Sonu Kuralı' },
        statePayload: {
          multiplier: 1.25,
          seasonName: 'Hafta Sonu Özel (+%25)',
          applied: false
        }
      },
      {
        id: 'step_3',
        startSec: 19,
        endSec: 27,
        title: 'Fiyatları Canlıya Uygula',
        narration: {
          tr: "Onayla butonuna basılır; Deluxe oda 4.500 ₺'den 5.625 ₺'ye saniyesinde otomatik olarak güncellenir.",
          en: "Apply button is clicked; Deluxe room rate recalculates from 4,500 ₺ to 5,625 ₺ across all calendar dates.",
          el: "Οι τιμές ενημερώνονται άμεσα: η Deluxe σουίτα από 4.500 ₺ αναπροσαρμόζεται σε 5.625 ₺."
        },
        cursorTarget: { x: 75, y: 75, action: 'click', actionText: 'Kuralları Uygula' },
        statePayload: {
          multiplier: 1.25,
          seasonName: 'Hafta Sonu Özel (+%25)',
          applied: true
        }
      },
      {
        id: 'step_4',
        startSec: 28,
        endSec: 35,
        title: 'Vitrinde ve Rezervasyonda Aktif',
        narration: {
          tr: "Web sitesine giren tüm misafirler hafta sonu tarihlerinde yeni güncel fiyatı görür, otel kârlılığı maksimize edilir.",
          en: "Guests instantly see updated dynamic weekend tariffs with zero manual intervention, maximizing hotel revenue.",
          el: "Οι επισκέπτες βλέπουν αυτόματα τις νέες τιμές για τα Σαββατοκύριακα, μεγιστοποιώντας την κερδοφορία."
        },
        cursorTarget: { x: 80, y: 35, action: 'hover' },
        statePayload: {
          multiplier: 1.25,
          seasonName: 'Hafta Sonu Özel (+%25)',
          applied: true,
          liveSync: true
        }
      }
    ]
  },
  {
    id: 'shop_pos',
    sectorKey: 'shoplp',
    badge: 'ShopLP • Varyant & Hızlı POS',
    accentColor: '#3b82f6',
    title: {
      tr: 'ShopLP — Varyantlı Ürün Ekleme & Hızlı POS Satışı',
      en: 'ShopLP — Variant Matrix Creation & Fast Barcode POS Checkout',
      el: 'ShopLP — Δημιουργία Παραλλαγών & Ταμείο Γρήγορου POS'
    },
    description: {
      tr: 'Tek ekrandan beden/renk varyantı oluşturma, ardından Hızlı POS ekranında barkod okutarak satışı tamamlama akışı.',
      en: 'Create size/color variant matrix in seconds, then complete fast sales at the POS terminal with instant e-archive slip.',
      el: 'Δημιουργήστε παραλλαγές μεγέθους/χρώματος και ολοκληρώστε πωλήσεις στο POS με άμεση απόδειξη.'
    },
    duration: 45,
    steps: [
      {
        id: 'step_1',
        startSec: 0,
        endSec: 12,
        title: 'Beden & Renk Varyant Matrisi',
        narration: {
          tr: "'Oversize Pamuklu Tişört' için Renkler (Siyah, Beyaz, Haki) ve Bedenler (S, M, L, XL) tek tıkla matrise dönüştürülür.",
          en: "For 'Oversize Cotton T-Shirt', Colors (Black, White, Khaki) and Sizes (S, M, L, XL) form a 12-SKU matrix.",
          el: "Χρώματα και μεγέθη μετατρέπονται σε μήτρα 12 παραλλαγών με ένα κλικ."
        },
        cursorTarget: { x: 45, y: 38, action: 'click', actionText: 'Matris Oluştur' },
        statePayload: {
          screen: 'matrix',
          matrixCount: 12,
          priceApplied: false,
          cartItems: []
        }
      },
      {
        id: 'step_2',
        startSec: 13,
        endSec: 23,
        title: 'Toplu Fiyat & Stok Uygulama',
        narration: {
          tr: "Tüm varyantlara tek seferde 450 ₺ satış fiyatı ve 25'er adet başlangıç stok miktarı atanır.",
          en: "With batch action, 450 ₺ sales price and 25 units stock level are assigned to all 12 variants simultaneously.",
          el: "Με μαζική ενέργεια ορίζεται τιμή 450 ₺ και απόθεμα 25 τεμαχίων σε όλες τις παραλλαγές."
        },
        cursorTarget: { x: 78, y: 44, action: 'click', actionText: '450 ₺ Uygula' },
        statePayload: {
          screen: 'matrix',
          matrixCount: 12,
          priceApplied: true,
          cartItems: []
        }
      },
      {
        id: 'step_3',
        startSec: 24,
        endSec: 34,
        title: 'Hızlı POS Ekranında Barkod Okutma',
        narration: {
          tr: "Kasa Hızlı POS ekranında '869012345678' barkodu taranır; 'Siyah / L' ürünü sepete 450 ₺ olarak eklenir.",
          en: "At the Fast POS counter, barcode '869012345678' is scanned; 'Black / L' drops into the cart for 450 ₺.",
          el: "Στο ταμείο POS, σαρώνεται το barcode και το προϊόν προστίθεται στο καλάθι για 450 ₺."
        },
        cursorTarget: { x: 35, y: 28, action: 'type', actionText: '869012345678' },
        statePayload: {
          screen: 'pos',
          cartItems: [
            { name: 'Oversize Pamuklu Tişört (Siyah / L)', qty: 1, price: 450 }
          ],
          paid: false
        }
      },
      {
        id: 'step_4',
        startSec: 35,
        endSec: 45,
        title: 'Nakit Tahsilat & Anında E-Arşiv Fişi',
        narration: {
          tr: "'Nakit 450 ₺' butonuna basılır; satış onaylanır ve yazıcıdan anında resmi e-arşiv satış fişi çıkar!",
          en: "Operator clicks 'Cash 450 ₺'; sale completes and official e-archive thermal slip is produced immediately!",
          el: "Ο χειριστής πατάει 'Μετρητά 450 ₺' και εκδίδεται άμεσα η επίσημη e-απόδειξη!"
        },
        cursorTarget: { x: 82, y: 82, action: 'click', actionText: 'Nakit 450 ₺' },
        statePayload: {
          screen: 'pos',
          cartItems: [
            { name: 'Oversize Pamuklu Tişört (Siyah / L)', qty: 1, price: 450 }
          ],
          paid: true,
          receiptNo: 'EARSIV-2026-00984'
        }
      }
    ]
  }
];
