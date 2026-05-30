export type EventCategory = 'finansal' | 'studyo' | 'sektor' | 'kisisel' | 'rakip' | 'ekonomik_kriz'

export interface EventEffect {
  money?:         number
  reputation?:    number
  qualityBonus?:  number
  weekDelay?:     number
  employeeLeave?: boolean
}

export interface EventChoice {
  text:       string
  condition?: { minMoney?: number; minReputation?: number }
  effect:     EventEffect
}

export interface RandomEvent {
  id:            string
  category:      EventCategory
  title:         string
  description:   string
  type:          'passive' | 'choice'
  weight:        number
  cooldownYears: number
  trigger?: {
    minReputation?: number
    maxReputation?: number
    minMoney?:      number
    maxMoney?:      number
    minPublished?:  number
  }
  effect?:   EventEffect
  choices?:  EventChoice[]
}

export const EVENTS: RandomEvent[] = [
  // ── FİNANSAL (12) ─────────────────────────────────────────────────────────
  {
    id: 'vergi_denetimi', category: 'finansal', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minPublished: 2 },
    title: 'Vergi Denetimi',
    description: 'Maliye müfettişleri stüdyona geldi. Kayıtlarınızı incelemek istiyorlar.',
    choices: [
      { text: 'Kayıtları Düzenle (-$15.000)', effect: { money: -15000 } },
      { text: 'Denetçiyle İşbirliği Yap (-$5.000, -5 itibar)', effect: { money: -5000, reputation: -5 } },
      { text: 'İtiraz Et (min. 40 itibar)', condition: { minReputation: 40 }, effect: { reputation: -10 } },
    ],
  },
  {
    id: 'yatirimci_teklifi', category: 'finansal', type: 'choice',
    weight: 6, cooldownYears: 4,
    trigger: { minReputation: 40 },
    title: 'Yatırımcı Teklifi',
    description: 'Bir risk sermayesi fonu stüdyonuza yatırım yapmak istiyor. Bağımsızlığınızdan ödün vermeniz gerekebilir.',
    choices: [
      { text: 'Yatırımı Kabul Et (+$100.000, -5 itibar)', effect: { money: 100000, reputation: -5 } },
      { text: 'Reddet (+5 itibar)', effect: { reputation: 5 } },
      { text: 'Müzakere Et (min. 60 itibar, +$75.000)', condition: { minReputation: 60 }, effect: { money: 75000 } },
    ],
  },
  {
    id: 'banka_kredisi', category: 'finansal', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Banka Kredi Teklifi',
    description: 'Yerel banka stüdyonuza uygun koşullarla kredi teklif ediyor.',
    choices: [
      { text: 'Krediyi Al (+$50.000)', effect: { money: 50000 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'beklenmedik_gider', category: 'finansal', type: 'passive',
    weight: 7, cooldownYears: 2,
    title: 'Beklenmedik Gider',
    description: 'Ofis ekipmanı bakım ve onarım maliyetleri hesaptan fazla çıktı.',
    effect: { money: -8000 },
  },
  {
    id: 'sponsor_anlasma', category: 'finansal', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 30 },
    title: 'Sponsor Anlaşması',
    description: 'Bir teknoloji şirketi ürününüzü tanıtmanız karşılığında sponsorluk teklif ediyor.',
    choices: [
      { text: 'Anlaşmayı Kabul Et (+$30.000, -3 itibar)', effect: { money: 30000, reputation: -3 } },
      { text: 'Reddet (+3 itibar)', effect: { reputation: 3 } },
    ],
  },
  {
    id: 'sigorta_odemesi', category: 'finansal', type: 'passive',
    weight: 4, cooldownYears: 4,
    trigger: { minPublished: 2 },
    title: 'Sigorta Ödemesi',
    description: 'Geçen yıl yaptığınız sigorta başvurusu onaylandı. Ödeme hesabınıza yatırıldı.',
    effect: { money: 12000 },
  },
  {
    id: 'hisse_kazanci', category: 'finansal', type: 'passive',
    weight: 3, cooldownYears: 3,
    trigger: { minMoney: 50000 },
    title: 'Hisse Senedi Kazancı',
    description: 'Birkaç yıl önce aldığınız teknoloji hisseleri iyi getiri sağladı.',
    effect: { money: 20000 },
  },
  {
    id: 'para_cezasi', category: 'finansal', type: 'passive',
    weight: 5, cooldownYears: 2,
    title: 'Para Cezası',
    description: 'Belediye ruhsat yenileme gecikmeniz nedeniyle idari para cezası uygulandı.',
    effect: { money: -5000, reputation: -3 },
  },
  {
    id: 'muhasebe_hatasi', category: 'finansal', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Muhasebe Hatası',
    description: 'Muhasebecinin fark ettiği bir hata var. Düzeltmek mi, yoksa görmezden mi gelmek?',
    choices: [
      { text: 'Hatayı Düzelt (-$3.000)', effect: { money: -3000 } },
      { text: 'Yoksay (-8 itibar)', effect: { reputation: -8 } },
    ],
  },
  {
    id: 'kredi_karti_dolandiriciligi', category: 'finansal', type: 'choice',
    weight: 3, cooldownYears: 4,
    title: 'Dolandırıcılık Girişimi',
    description: 'Stüdyo hesabına şüpheli bir işlem yapılmaya çalışıldı. Ne yapacaksınız?',
    choices: [
      { text: 'Kartı İptal Et (-$2.000 işlem ücreti)', effect: { money: -2000 } },
      { text: 'Bankayı Ara (ücretsiz, biraz zaman kaybı)', effect: {} },
    ],
  },
  {
    id: 'devlet_destegi', category: 'finansal', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minReputation: 50 },
    title: 'Devlet Destek Hibesi',
    description: 'Kültür Bakanlığı yerli oyun geliştiricilerine hibe açıkladı. Başvurmak ister misiniz?',
    choices: [
      { text: 'Başvur (+$40.000)', effect: { money: 40000 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'beklenmedik_gelir', category: 'finansal', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 3 },
    title: 'Beklenmedik Royalty Geliri',
    description: 'Eski oyunlarınızdan birinin yabancı pazarlardaki satışları beklenmedik gelir sağladı.',
    effect: { money: 25000 },
  },

  // ── STÜDYO (12) ────────────────────────────────────────────────────────────
  {
    id: 'ekipman_arizasi', category: 'studyo', type: 'passive',
    weight: 7, cooldownYears: 2,
    title: 'Ekipman Arızası',
    description: 'Ana geliştirme sunucusu arıza yaptı. Ekip bir hafta yedek makinelerle çalışmak zorunda.',
    effect: { money: -6000, weekDelay: 1 },
  },
  {
    id: 'ofis_su_baskini', category: 'studyo', type: 'choice',
    weight: 3, cooldownYears: 5,
    title: 'Su Baskını',
    description: 'Üst kattaki boru patladı, ofisin bir bölümü zarar gördü.',
    choices: [
      { text: 'Ekibi Geçici Mekâna Taşı (-$10.000)', effect: { money: -10000 } },
      { text: 'Sigorta Talep Et (-$3.000, +2 hafta gecikme)', effect: { money: -3000, weekDelay: 2 } },
    ],
  },
  {
    id: 'buyuk_bug', category: 'studyo', type: 'choice',
    weight: 6, cooldownYears: 2,
    trigger: { minPublished: 1 },
    title: 'Kritik Bug Bulundu',
    description: 'Geliştirme sürecinde oyunun temel sistemini etkileyen kritik bir hata keşfedildi.',
    choices: [
      { text: 'Hemen Düzelt (+1 hafta gecikme)', effect: { weekDelay: 1 } },
      { text: 'Sonraya Bırak (-8 itibar)', effect: { reputation: -8 } },
      { text: 'Dış Kaynak Kullan (min. $15.000)', condition: { minMoney: 15000 }, effect: { money: -15000 } },
    ],
  },
  {
    id: 'viral_sosyal_medya', category: 'studyo', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Viral Sosyal Medya',
    description: 'Stüdyonuzun geliştirme günlüğü sosyal medyada viral oldu. İtibarınız artıyor.',
    effect: { reputation: 10 },
  },
  {
    id: 'ekip_moral_krizi', category: 'studyo', type: 'choice',
    weight: 6, cooldownYears: 3,
    title: 'Ekip Moral Krizi',
    description: 'Ekip yorgun ve motivasyonu düşük. Bir şeyler yapmazsanız proje kalitesi düşebilir.',
    choices: [
      { text: 'Bonus Ver (min. $10.000)', condition: { minMoney: 10000 }, effect: { money: -10000, qualityBonus: 15 } },
      { text: 'Motivasyon Konuşması Yap (+5 kalite)', effect: { qualityBonus: 5 } },
      { text: 'Görmezden Gel (-10 kalite)', effect: { qualityBonus: -10 } },
    ],
  },
  {
    id: 'yeni_yazilim_lisansi', category: 'studyo', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minMoney: 20000 },
    title: 'Yeni Yazılım Lisansı',
    description: 'Bir geliştirme aracı şirketi stüdyonuza özel fiyat teklif etti.',
    choices: [
      { text: 'Satın Al (min. $20.000, +20 kalite)', condition: { minMoney: 20000 }, effect: { money: -20000, qualityBonus: 20 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'yangin_alarmi', category: 'studyo', type: 'passive',
    weight: 4, cooldownYears: 3,
    title: 'Yangın Alarmı',
    description: 'Yanlış alarm nedeniyle ofis tahliye edildi, bir haftalık iş kaybı yaşandı.',
    effect: { weekDelay: 1 },
  },
  {
    id: 'internet_kesintisi', category: 'studyo', type: 'passive',
    weight: 6, cooldownYears: 2,
    title: 'İnternet Kesintisi',
    description: 'Sağlayıcı kaynaklı kesinti ekibin verimliliğini ciddi düşürdü.',
    effect: { weekDelay: 1 },
  },
  {
    id: 'basarili_crunch', category: 'studyo', type: 'passive',
    weight: 5, cooldownYears: 2,
    trigger: { minPublished: 1 },
    title: 'Başarılı Crunch Dönemi',
    description: 'Ekip gönüllü olarak fazla mesai yaptı ve beklenmedik kalite artışı sağlandı.',
    effect: { qualityBonus: 20 },
  },
  {
    id: 'ofis_tasinma', category: 'studyo', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minMoney: 30000 },
    title: 'Ofis Taşıma Fırsatı',
    description: 'Daha iyi bir lokasyonda uygun fiyatlı ofis çıktı. Taşınmak ekip üretkenliğini artırabilir.',
    choices: [
      { text: 'Taşın (min. $30.000, +30 kalite)', condition: { minMoney: 30000 }, effect: { money: -30000, qualityBonus: 30 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'veri_kaybi', category: 'studyo', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Veri Kaybı',
    description: 'Disk arızası nedeniyle bir kısım proje verisi kayboldu.',
    choices: [
      { text: 'Yedekten Kurtar (+2 hafta gecikme)', effect: { weekDelay: 2 } },
      { text: 'Yeniden Yaz (+4 hafta, -10 kalite)', effect: { weekDelay: 4, qualityBonus: -10 } },
    ],
  },
  {
    id: 'sosyal_medya_krizi', category: 'studyo', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minReputation: 40 },
    title: 'Sosyal Medya Krizi',
    description: 'Bir çalışanın kişisel paylaşımı stüdyo itibarını zedeliyor.',
    choices: [
      { text: 'Özür Dile (-5 itibar)', effect: { reputation: -5 } },
      { text: 'Sessiz Kal (-15 itibar)', effect: { reputation: -15 } },
      { text: 'PR Ajansı Tut (min. $8.000, -2 itibar)', condition: { minMoney: 8000 }, effect: { money: -8000, reputation: -2 } },
    ],
  },

  // ── SEKTÖR (10) ────────────────────────────────────────────────────────────
  {
    id: 'piyasa_cokusu', category: 'sektor', type: 'passive',
    weight: 3, cooldownYears: 5,
    title: 'Oyun Piyasası Çöküşü',
    description: 'Sektörde genel bir durgunluk yaşanıyor. Gelirler ve itibar etkileniyor.',
    effect: { money: -15000, reputation: -5 },
  },
  {
    id: 'yeni_platform_duyurusu', category: 'sektor', type: 'passive',
    weight: 4, cooldownYears: 4,
    title: 'Yeni Platform Duyurusu',
    description: 'Büyük bir şirket yeni nesil oyun platformunu duyurdu. Sektörde heyecan var.',
    effect: { reputation: 5 },
  },
  {
    id: 'buyuk_firma_iflas', category: 'sektor', type: 'passive',
    weight: 3, cooldownYears: 5,
    title: 'Büyük Firma İflas',
    description: 'Sektörün köklü firmalarından biri kapılarını kapattı. Piyasa yeniden şekilleniyor.',
    effect: { reputation: 3 },
  },
  {
    id: 'endustri_grevi', category: 'sektor', type: 'choice',
    weight: 3, cooldownYears: 5,
    title: 'Endüstri Grevi',
    description: 'Oyun geliştiricileri sendikası genel grev ilan etti. Tutumunuzu belirleyin.',
    choices: [
      { text: 'Grevi Destekle (+8 itibar, +2 hafta gecikme)', effect: { reputation: 8, weekDelay: 2 } },
      { text: 'Çalışmaya Devam Et (-5 itibar)', effect: { reputation: -5 } },
    ],
  },
  {
    id: 'yeni_motor_cikti', category: 'sektor', type: 'choice',
    weight: 5, cooldownYears: 4,
    trigger: { minMoney: 15000 },
    title: 'Yeni Oyun Motoru Çıktı',
    description: 'Devrim niteliğinde bir oyun motoru piyasaya çıktı. Lisans almak ister misiniz?',
    choices: [
      { text: 'Lisans Al (min. $15.000, +25 kalite)', condition: { minMoney: 15000 }, effect: { money: -15000, qualityBonus: 25 } },
      { text: 'Bekle', effect: {} },
    ],
  },
  {
    id: 'oyun_festivali', category: 'sektor', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 35 },
    title: 'Oyun Festivali Daveti',
    description: 'Uluslararası bir oyun fuarına katılım daveti geldi.',
    choices: [
      { text: 'Katıl (-$5.000, +15 itibar)', effect: { money: -5000, reputation: 15 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'medya_ilgisi', category: 'sektor', type: 'passive',
    weight: 6, cooldownYears: 2,
    trigger: { minPublished: 2 },
    title: 'Oyun Medyasının İlgisi',
    description: 'Büyük bir oyun dergisi stüdyonuzu "izlenmesi gereken isimler" listesine ekledi.',
    effect: { reputation: 8 },
  },
  {
    id: 'telif_hukuku_degisikligi', category: 'sektor', type: 'passive',
    weight: 3, cooldownYears: 5,
    title: 'Telif Hukuku Değişikliği',
    description: 'Yeni düzenlemeler bazı mevcut içerik lisanslarını etkiliyor. Hukuki belirsizlik itibarı düşürüyor.',
    effect: { reputation: -3 },
  },
  {
    id: 'konsol_savas', category: 'sektor', type: 'passive',
    weight: 4, cooldownYears: 4,
    title: 'Konsol Savaşı',
    description: 'İki büyük konsol üreticisi arasındaki rekabet bağımsız stüdyolara dikkat çekiyor.',
    effect: { reputation: 3 },
  },
  {
    id: 'indie_dalga', category: 'sektor', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Indie Dalga',
    description: 'Bağımsız oyun geliştiricileri bu dönem sektörde büyük ilgi görüyor.',
    effect: { reputation: 5 },
  },

  // ── KİŞİSEL (8) ────────────────────────────────────────────────────────────
  {
    id: 'konferans_daveti', category: 'kisisel', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 30 },
    title: 'Konferans Daveti',
    description: 'Teknoloji konferansı sizi konuşmacı olarak davet ediyor.',
    choices: [
      { text: 'Katıl (-$3.000, +12 itibar)', effect: { money: -3000, reputation: 12 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'roportaj_talebi', category: 'kisisel', type: 'choice',
    weight: 6, cooldownYears: 2,
    trigger: { minReputation: 25 },
    title: 'Röportaj Talebi',
    description: 'Popüler bir oyun podcast\'i sizi misafir olarak istiyor.',
    choices: [
      { text: 'Kabul Et (+8 itibar)', effect: { reputation: 8 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'mentorlik_teklifi', category: 'kisisel', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minReputation: 50 },
    title: 'Mentörlük Teklifi',
    description: 'Genç bir geliştirici sizi mentor olarak istiyor. Zaman ayırır mısınız?',
    choices: [
      { text: 'Kabul Et (+10 itibar)', effect: { reputation: 10 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'yorgunluk_krizi', category: 'kisisel', type: 'choice',
    weight: 5, cooldownYears: 3,
    title: 'Tükenmişlik Krizi',
    description: 'Aşırı çalışmanın faturasını ödüyorsunuz. Bir adım geri çekilmek gerekiyor.',
    choices: [
      { text: 'Dinlen (+2 hafta gecikme ama sağlıklı çalış)', effect: { weekDelay: 2 } },
      { text: 'Çalışmaya Devam Et (-15 kalite)', effect: { qualityBonus: -15 } },
    ],
  },
  {
    id: 'aile_ziyareti', category: 'kisisel', type: 'passive',
    weight: 5, cooldownYears: 2,
    title: 'Aile Ziyareti',
    description: 'Aileniz şehre geldi. Birkaç günü onlarla geçirmek zorunda kaldınız.',
    effect: { weekDelay: 1 },
  },
  {
    id: 'saglik_sorunu', category: 'kisisel', type: 'choice',
    weight: 4, cooldownYears: 3,
    title: 'Sağlık Sorunu',
    description: 'Hafif bir sağlık sorunu yaşadınız. Doktor dinlenme öneriyor.',
    choices: [
      { text: 'İstirahat Al (+2 hafta gecikme, +10 kalite)', effect: { weekDelay: 2, qualityBonus: 10 } },
      { text: 'Çalışmaya Devam Et (-5 kalite, -2 itibar)', effect: { qualityBonus: -5, reputation: -2 } },
    ],
  },
  {
    id: 'kitap_teklifi', category: 'kisisel', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minReputation: 60 },
    title: 'Kitap Yazma Teklifi',
    description: 'Bir yayınevi oyun geliştirme deneyimlerinizi kitaplaştırmanızı öneriyor.',
    choices: [
      { text: 'Kabul Et (+$15.000, +8 itibar)', effect: { money: 15000, reputation: 8 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'odul_toreni_daveti', category: 'kisisel', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minReputation: 45 },
    title: 'Ödül Töreni Daveti',
    description: 'Sektörün prestijli ödül törenine davet edildiniz.',
    choices: [
      { text: 'Katıl (-$2.000, +10 itibar)', effect: { money: -2000, reputation: 10 } },
      { text: 'Reddet', effect: {} },
    ],
  },

  // ── RAKİP (10) ─────────────────────────────────────────────────────────────
  {
    id: 'rakip_casusluk', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minReputation: 50 },
    title: 'Rakipten Casusluk İddiası',
    description: 'Bir rakip stüdyonun çalışanlarınızı takip ettiği öğrenildi.',
    choices: [
      { text: 'Hukuki Yol (-$8.000, +5 itibar)', effect: { money: -8000, reputation: 5 } },
      { text: 'Basına Sız (-3 itibar)', effect: { reputation: -3 } },
      { text: 'Yoksay', effect: {} },
    ],
  },
  {
    id: 'rakip_calisan_teklifi', category: 'rakip', type: 'choice',
    weight: 5, cooldownYears: 3,
    trigger: { minReputation: 40 },
    title: 'Rakip Çalışan Teklifi',
    description: 'Rakip bir stüdyonun yetenekli çalışanı size geçmek istiyor.',
    choices: [
      { text: 'Teklifi Geri Çevir', effect: {} },
      { text: 'Kabul Et (+5 itibar, +15 kalite)', effect: { reputation: 5, qualityBonus: 15 } },
      { text: 'Contra Teklif (min. $5.000)', condition: { minMoney: 5000 }, effect: { money: -5000, qualityBonus: 20 } },
    ],
  },
  {
    id: 'fikir_hirsizligi_iddiasi', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minPublished: 2 },
    title: 'Fikir Hırsızlığı İddiası',
    description: 'Bir rakip stüdyo oyununuzun kendi fikirlerini çaldığını iddia ediyor.',
    choices: [
      { text: 'Dava Aç (-$10.000, +5 itibar)', effect: { money: -10000, reputation: 5 } },
      { text: 'Uzlaş (-$3.000)', effect: { money: -3000 } },
      { text: 'Yoksay (-5 itibar)', effect: { reputation: -5 } },
    ],
  },
  {
    id: 'rakip_isbirligi', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 4,
    trigger: { minReputation: 35 },
    title: 'Rakip İşbirliği Teklifi',
    description: 'Bir rakip stüdyo ortak proje için işbirliği teklif ediyor.',
    choices: [
      { text: 'Kabul Et (+8 itibar, +$20.000)', effect: { reputation: 8, money: 20000 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'rakip_kopyalama', category: 'rakip', type: 'passive',
    weight: 5, cooldownYears: 3,
    trigger: { minPublished: 1 },
    title: 'Rakip Oyununu Kopyaladı',
    description: 'Bir rakip stüdyonun oyununuzun mekaniklerini birebir kopyaladığı ortaya çıktı. Topluluk sizi destekliyor.',
    effect: { reputation: 5 },
  },
  {
    id: 'rakip_iflas_firsati', category: 'rakip', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minMoney: 100000 },
    title: 'Rakip İflas Fırsatı',
    description: 'İflas eden rakip stüdyonun varlıklarını satın alma fırsatı doğdu.',
    choices: [
      { text: 'Satın Al (min. $100.000, +15 itibar)', condition: { minMoney: 100000 }, effect: { money: -100000, reputation: 15 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'sektorde_dedikodu', category: 'rakip', type: 'passive',
    weight: 6, cooldownYears: 2,
    title: 'Sektörde Dedikodu',
    description: 'Stüdyonuz hakkında asılsız dedikodular dolaşıyor. İtibarınız hafifçe zarar gördü.',
    effect: { reputation: -3 },
  },
  {
    id: 'rakip_medyada_atakta', category: 'rakip', type: 'passive',
    weight: 5, cooldownYears: 2,
    trigger: { minReputation: 30 },
    title: 'Rakip Medyada Atakta',
    description: 'Rakip stüdyo agresif bir medya kampanyasıyla dikkat çekiyor. Gölgede kaldınız.',
    effect: { reputation: -5 },
  },
  {
    id: 'talent_savasi', category: 'rakip', type: 'choice',
    weight: 4, cooldownYears: 3,
    trigger: { minReputation: 45 },
    title: 'Yetenek Savaşı',
    description: 'Sektörün en iyi geliştiricilerinden biri iş arıyor. Rakipler de peşinde.',
    choices: [
      { text: 'Eleman Kap (min. $15.000, +25 kalite)', condition: { minMoney: 15000 }, effect: { money: -15000, qualityBonus: 25 } },
      { text: 'Reddet', effect: {} },
    ],
  },
  {
    id: 'rakip_patent_davasi', category: 'rakip', type: 'choice',
    weight: 3, cooldownYears: 5,
    trigger: { minPublished: 3 },
    title: 'Rakip Patent Davası',
    description: 'Rakip bir firma oyununuzdaki bir mekanik için patent ihlali davası açtı.',
    choices: [
      { text: 'Savaş (-$20.000, +3 itibar)', effect: { money: -20000, reputation: 3 } },
      { text: 'Uzlaş (-$8.000)', effect: { money: -8000 } },
      { text: 'Lisansla (-$5.000, -2 itibar)', effect: { money: -5000, reputation: -2 } },
    ],
  },

  // ── EKONOMİK KRİZ ──────────────────────────────────────────────────────────
  {
    id: 'sunucu_coktu', category: 'ekonomik_kriz', type: 'passive',
    weight: 5, cooldownYears: 2,
    title: 'Sunucu Çöktü',
    description: 'Oyun sunucularınız beklenmedik bir yük altında çöktü. Acil bakım ekibi tutmanız gerekiyor.',
    effect: { money: -3000 },
  },
  {
    id: 'lisans_yenileme', category: 'ekonomik_kriz', type: 'passive',
    weight: 4, cooldownYears: 3,
    title: 'Yazılım Lisansı Yenileme',
    description: 'Kullandığınız geliştirme araçlarının lisansları sona erdi. Yenileme zorunlu.',
    effect: { money: -5000 },
  },
  {
    id: 'ekipman_arizasi_ekonomik', category: 'ekonomik_kriz', type: 'passive',
    weight: 6, cooldownYears: 2,
    title: 'Ekipman Arızası',
    description: 'Birkaç geliştirici bilgisayarı aynı anda arıza verdi. Acil yedek parça gerekiyor.',
    effect: { money: -2000 },
  },
  {
    id: 'hukuki_uyari', category: 'ekonomik_kriz', type: 'passive',
    weight: 3, cooldownYears: 4,
    title: 'Hukuki Uyarı',
    description: 'Bir patent firması yazılımınızda iddia ettiği ihlal nedeniyle hukuki uyarı gönderdi. Danışmanlık ücreti kaçınılmaz.',
    effect: { money: -4000 },
  },
]
