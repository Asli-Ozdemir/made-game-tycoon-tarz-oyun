// src/data/socialSkills.ts

export type SocialSkillId = 'capkinlik' | 'dostluk' | 'sicakkanlilik' | 'sogukkanlilik'

export type SocialSkillXpSource =
  | 'attracted_npc_talk'   // Tercih edilen cinsiyet NPC'siyle konuşmak  (Çapkınlık)
  | 'deep_dialogue'        // Herhangi NPC ile T2+ diyalog               (Dostluk)
  | 'first_meeting'        // Yeni NPC ile ilk kez konuşmak              (Sıcakkanlılık)
  | 'villain_detected'     // Kötü niyetli NPC'nin sinsiliklerini fark etmek (Soğukkanlılık)

export interface SocialSkillEffect {
  type:
    | 'charm_bonus'          // Tercih edilen cinsiyet NPC'leri daha hızlı etkilenir
    | 'friendship_decay'     // Kalpler daha zor azalır (düşük değer = daha az azalma)
    | 'first_impression'     // İlk tanışmada kalp artışı bonusu
    | 'villain_sense'        // Kötü niyetli karakterleri sezme şansı (0–1)
  value: number
}

export interface SocialSkillTier {
  tier:        number
  xpRequired:  number        // Bu tier'ı açmak için gereken kümülatif XP
  name:        string
  description: string
  effect:      SocialSkillEffect
}

export interface SocialSkill {
  id:          SocialSkillId
  name:        string
  description: string
  xpSource:    SocialSkillXpSource
  tiers:       SocialSkillTier[]
}

// XP eşikleri: T1=5, T2=15, T3=35, T4=70, T5=120
const XP_THRESHOLDS = [5, 15, 35, 70, 120] as const

// ── Çapkınlık ─────────────────────────────────────────────────────────────────
const capkinlik: SocialSkill = {
  id:          'capkinlik',
  name:        'Çapkınlık',
  description: 'Tercih ettiğin cinsiyetteki NPC\'leri daha hızlı etkileme yeteneği.',
  xpSource:    'attracted_npc_talk',
  tiers: [
    {
      tier: 1, xpRequired: XP_THRESHOLDS[0],
      name: 'İlk Bakış',
      description: 'Tercih ettiğin kişilerle ilk konuşmalar biraz daha akıcı geçer.',
      effect: { type: 'charm_bonus', value: 0.10 },
    },
    {
      tier: 2, xpRequired: XP_THRESHOLDS[1],
      name: 'Sohbet Ustası',
      description: 'Söz seçimin ve zamanlamanla fark yaratırsın.',
      effect: { type: 'charm_bonus', value: 0.20 },
    },
    {
      tier: 3, xpRequired: XP_THRESHOLDS[2],
      name: 'Çekici Anlatı',
      description: 'Karşındaki seni dinlemek ister — her kelime yerli yerinde.',
      effect: { type: 'charm_bonus', value: 0.35 },
    },
    {
      tier: 4, xpRequired: XP_THRESHOLDS[3],
      name: 'Yıldız Etkisi',
      description: 'Odaya girdiğinde dikkat çekersin; bağlar çok hızlı derinleşir.',
      effect: { type: 'charm_bonus', value: 0.55 },
    },
    {
      tier: 5, xpRequired: XP_THRESHOLDS[4],
      name: 'Efsanevi Çekicilik',
      description: 'Tercih ettiğin kişiler sana neredeyse anında ısınır.',
      effect: { type: 'charm_bonus', value: 0.80 },
    },
  ],
}

// ── Dostluk ───────────────────────────────────────────────────────────────────
const dostluk: SocialSkill = {
  id:          'dostluk',
  name:        'Dostluk',
  description: 'NPC\'lerle kurulan bağların daha kalıcı olmasını sağlar; kalpler zor azalır.',
  xpSource:    'deep_dialogue',
  tiers: [
    {
      tier: 1, xpRequired: XP_THRESHOLDS[0],
      name: 'Samimi Duruş',
      description: 'Görmezden gelinen günlerde bile ilişkiler biraz daha dayanıklı.',
      effect: { type: 'friendship_decay', value: 0.15 },
    },
    {
      tier: 2, xpRequired: XP_THRESHOLDS[1],
      name: 'Güvenilir Yüz',
      description: 'İnsanlar sana güvenir; küçük ihmallar affedilir.',
      effect: { type: 'friendship_decay', value: 0.30 },
    },
    {
      tier: 3, xpRequired: XP_THRESHOLDS[2],
      name: 'Derin Bağ',
      description: 'Haftalarca görüşmesen de dostluklar sağlam kalır.',
      effect: { type: 'friendship_decay', value: 0.45 },
    },
    {
      tier: 4, xpRequired: XP_THRESHOLDS[3],
      name: 'Ömür Boyu Dost',
      description: 'İlişkilerdeki erozyon neredeyse hissedilmez.',
      effect: { type: 'friendship_decay', value: 0.65 },
    },
    {
      tier: 5, xpRequired: XP_THRESHOLDS[4],
      name: 'Efsane Sadakat',
      description: 'Kurduğun dostluklar hiçbir koşulda bozulmaz.',
      effect: { type: 'friendship_decay', value: 0.85 },
    },
  ],
}

// ── Sıcakkanlılık ─────────────────────────────────────────────────────────────
const sicakkanlilik: SocialSkill = {
  id:          'sicakkanlilik',
  name:        'Sıcakkanlılık',
  description: 'Yeni tanıştığın NPC\'lerde ilk izlenim bonusu — kalpler hızlı başlar.',
  xpSource:    'first_meeting',
  tiers: [
    {
      tier: 1, xpRequired: XP_THRESHOLDS[0],
      name: 'Güler Yüz',
      description: 'İlk karşılaşmada hafif bir sıcaklık hissettirirsin.',
      effect: { type: 'first_impression', value: 2 },
    },
    {
      tier: 2, xpRequired: XP_THRESHOLDS[1],
      name: 'Coşkulu Karşılama',
      description: 'Yeni tanışmalar ekstra kalple başlar.',
      effect: { type: 'first_impression', value: 4 },
    },
    {
      tier: 3, xpRequired: XP_THRESHOLDS[2],
      name: 'Mıknatıs Kişilik',
      description: 'İlk dakikada bile kendin gibi hissettirirsin.',
      effect: { type: 'first_impression', value: 7 },
    },
    {
      tier: 4, xpRequired: XP_THRESHOLDS[3],
      name: 'Doğal Karizmatik',
      description: 'Tanışmalar her zaman çok iyi başlar.',
      effect: { type: 'first_impression', value: 11 },
    },
    {
      tier: 5, xpRequired: XP_THRESHOLDS[4],
      name: 'Işık Gibi',
      description: 'Yanında herkes daha iyi hisseder; ilk anlar unutulmaz olur.',
      effect: { type: 'first_impression', value: 16 },
    },
  ],
}

// ── Soğukkanlılık ─────────────────────────────────────────────────────────────
const sogukkanlilik: SocialSkill = {
  id:          'sogukkanlilik',
  name:        'Soğukkanlılık',
  description: 'Kötü niyetli karakterlerin sinsiliklerini sezme yeteneği.',
  xpSource:    'villain_detected',
  tiers: [
    {
      tier: 1, xpRequired: XP_THRESHOLDS[0],
      name: 'Şüpheci Bakış',
      description: 'Bazen bir şeylerin yanlış gittiğini fark edersin.',
      effect: { type: 'villain_sense', value: 0.20 },
    },
    {
      tier: 2, xpRequired: XP_THRESHOLDS[1],
      name: 'Analitik Göz',
      description: 'Kötü niyet belirtilerini daha sık yakalarsın.',
      effect: { type: 'villain_sense', value: 0.40 },
    },
    {
      tier: 3, xpRequired: XP_THRESHOLDS[2],
      name: 'Keskin Sezgi',
      description: 'Biri sana zarar vermeyi planlarsa hissedersin.',
      effect: { type: 'villain_sense', value: 0.60 },
    },
    {
      tier: 4, xpRequired: XP_THRESHOLDS[3],
      name: 'Buz Gibi Akıl',
      description: 'Manipülasyon girişimlerini neredeyse her zaman görürsün.',
      effect: { type: 'villain_sense', value: 0.80 },
    },
    {
      tier: 5, xpRequired: XP_THRESHOLDS[4],
      name: 'Ayna Kalkan',
      description: 'Hiçbir sinsililik gözünden kaçmaz; her niyet apaçık görünür.',
      effect: { type: 'villain_sense', value: 1.00 },
    },
  ],
}

export const SOCIAL_SKILLS: SocialSkill[] = [
  capkinlik,
  dostluk,
  sicakkanlilik,
  sogukkanlilik,
]
