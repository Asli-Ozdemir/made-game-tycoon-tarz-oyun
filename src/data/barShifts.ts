// src/data/barShifts.ts

export interface Guest {
  id: string
  name: string
  isBlacklisted: boolean
  isVip: boolean
  isDrunk: boolean
  isDangerous: boolean
  visualCues: string[]        // örn. ["Sallanıyor", "Gözleri kızarmış"]
  meetsNightRule: boolean     // gece kuralına uyuyor mu
}

export interface TensionStep {
  text: string                // sahne açıklaması
  options: {
    label: string             // seçenek metni
    tensionDelta: number      // + artış, - azalış (−20 to +30 arası önerilir)
  }[]
}

export interface Incident {
  id: string
  description: string         // "Sarhoş müşteri barmenle tartışıyor"
  tensionSteps: TensionStep[]
  fightIfUnresolved: boolean
}

export interface BarShift {
  id: string                  // 'shift_01' ... 'shift_10'
  nightRule: string           // "Bu gece sadece rezervasyonlular"
  blacklist: string[]         // Guest id listesi
  vipList: string[]           // Guest id listesi
  guests: Guest[]
  incidents: Incident[]
  incidentTriggers: number[]  // hangi misafirin işlenmesinden SONRA kesinti tetiklenir (guests[] 0-bazlı index; örn. [1] = 2. misafirden sonra)
}

// ─── VARDIYA 1 — Kolay (4 misafir, 1 olay) ──────────────────────────────────

const shift01: BarShift = {
  id: 'shift_01',
  nightRule: '18 yaşından küçük alınmaz',
  blacklist: ['guest_volkan_01'],
  vipList: [],
  guests: [
    {
      id: 'guest_ayse_01',
      name: 'Ayşe',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Düzgün giyinmiş', 'Sakin tavır'],
      meetsNightRule: true,
    },
    {
      id: 'guest_mehmet_01',
      name: 'Mehmet',
      isBlacklisted: false,
      isVip: false,
      isDrunk: true,
      isDangerous: false,
      visualCues: ['Sallanıyor', 'Gözleri kızarmış', 'Sesi yüksek'],
      meetsNightRule: true,
    },
    {
      id: 'guest_volkan_01',
      name: 'Volkan',
      isBlacklisted: true,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Sakin görünüyor'],
      meetsNightRule: true,
    },
    {
      id: 'guest_selin_01',
      name: 'Selin',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Grupla gelmiş', 'Normal'],
      meetsNightRule: true,
    },
  ],
  incidents: [
    {
      id: 'inc_tartisma_01',
      description: 'Sarhoş müşteri barmenle sert tartışmaya girdi. Sesler yükseliyor.',
      fightIfUnresolved: true,
      tensionSteps: [
        {
          text: 'Müşteri bardaki bardağı yere fırlattı. Barmen seni çağırdı.',
          options: [
            { label: 'Sakin ama kararlı konuş: "Lütfen sakin olun."', tensionDelta: -25 },
            { label: 'Hemen arasına gir ve müşteriyi dışarı yönlendir', tensionDelta: -10 },
            { label: '"Çık buradan!" diye bağır', tensionDelta: 30 },
          ],
        },
        {
          text: 'Müşteri hâlâ gergin. Barmen tedirgin bakıyor.',
          options: [
            { label: 'Müşteriye kapıya kadar eşlik et', tensionDelta: -30 },
            { label: '"Son uyarı, yoksa polisi ararım"', tensionDelta: -15 },
            { label: 'Gözle izle, bir şey yapma', tensionDelta: 20 },
          ],
        },
      ],
    },
  ],
  incidentTriggers: [1],
}

// ─── VARDIYA 2 — Orta (5 misafir, 1 olay) ───────────────────────────────────

const shift02: BarShift = {
  id: 'shift_02',
  nightRule: 'Sadece rezervasyonlular',
  blacklist: [],
  vipList: ['guest_zehra_02'],
  guests: [
    {
      id: 'guest_zehra_02',
      name: 'Zehra Hanım',
      isBlacklisted: false,
      isVip: true,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Şık giyinmiş', 'Özgüvenli yürüyüş'],
      meetsNightRule: true,
    },
    {
      id: 'guest_ali_02',
      name: 'Ali',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Sıradan kıyafet'],
      meetsNightRule: false,
    },
    {
      id: 'guest_can_02',
      name: 'Can',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Takım elbise', 'Sakin'],
      meetsNightRule: true,
    },
    {
      id: 'guest_serkan_02',
      name: 'Serkan',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: true,
      visualCues: ['Sinirli bakışlar', 'Kolları çapraz', 'Gergin duruş'],
      meetsNightRule: true,
    },
    {
      id: 'guest_deniz_02',
      name: 'Deniz',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Arkadaşlarıyla gelmiş', 'Normal'],
      meetsNightRule: true,
    },
  ],
  incidents: [
    {
      id: 'inc_kavga_02',
      description: 'İki müşteri köşe masasında tartışmaya başladı. Sesler yükseliyor.',
      fightIfUnresolved: true,
      tensionSteps: [
        {
          text: 'Biri diğerinin üzerine eğilmiş, parmak sallıyor. Çevreler toplandı.',
          options: [
            { label: 'İkisinin arasına gir, fiziksel ayır', tensionDelta: -20 },
            { label: '"Sakin olun, hep birlikte çözelim"', tensionDelta: -15 },
            { label: 'Barı çağır, sen beklet', tensionDelta: 10 },
          ],
        },
        {
          text: 'Taraflardan biri itmeye başladı.',
          options: [
            { label: 'Birisini nazikçe dışarı yönlendir', tensionDelta: -35 },
            { label: '"Bir adım daha atarsan polis arıyorum"', tensionDelta: -20 },
            { label: 'Aralarında dur ama konuşma', tensionDelta: 15 },
          ],
        },
      ],
    },
  ],
  incidentTriggers: [2],
}

// ─── VARDIYA 3 — Orta+ (5 misafir, 1 olay) ──────────────────────────────────

const shift03: BarShift = {
  id: 'shift_03',
  nightRule: 'Kravat zorunlu',
  blacklist: ['guest_omer_03'],
  vipList: [],
  guests: [
    {
      id: 'guest_kerem_03',
      name: 'Kerem',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatlı', 'Takım elbise'],
      meetsNightRule: true,
    },
    {
      id: 'guest_omer_03',
      name: 'Ömer',
      isBlacklisted: true,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatlı', 'Gülümsüyor'],
      meetsNightRule: true,
    },
    {
      id: 'guest_bora_03',
      name: 'Bora',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatı yok', 'Rahat kıyafet'],
      meetsNightRule: false,
    },
    {
      id: 'guest_nalan_03',
      name: 'Nalan',
      isBlacklisted: false,
      isVip: false,
      isDrunk: true,
      isDangerous: false,
      visualCues: ['Sallanıyor', 'Kravatı var'],
      meetsNightRule: true,
    },
    {
      id: 'guest_tamer_03',
      name: 'Tamer',
      isBlacklisted: false,
      isVip: false,
      isDrunk: false,
      isDangerous: false,
      visualCues: ['Kravatlı', 'Sakin'],
      meetsNightRule: true,
    },
  ],
  incidents: [
    {
      id: 'inc_hirsiz_03',
      description: 'Barmen sizi çağırdı: bir müşterinin cüzdanı çalınmış, bir şüpheli var.',
      fightIfUnresolved: true,
      tensionSteps: [
        {
          text: 'Şüpheli köşede oturuyor. İddia edilen kurban sizi bekliyor.',
          options: [
            { label: '"Şüpheliyi dışarı alalım, sakin konuşalım"', tensionDelta: -20 },
            { label: 'Şüpheliyi masada sorgula, herkes duysun', tensionDelta: 25 },
            { label: 'Polisi ara, kurbanı beklet', tensionDelta: -10 },
          ],
        },
        {
          text: 'Şüpheli suçlamayı reddediyor, sesler yükseliyor.',
          options: [
            { label: '"Güvenlik kamerasına bakacağız, sizi bilgilendiririz"', tensionDelta: -30 },
            { label: '"Şimdi çantanı aç"', tensionDelta: 30 },
            { label: 'Her ikisini de barın dışına çıkar', tensionDelta: -15 },
          ],
        },
      ],
    },
  ],
  incidentTriggers: [2],
}

export const BAR_SHIFTS: BarShift[] = [shift01, shift02, shift03]
