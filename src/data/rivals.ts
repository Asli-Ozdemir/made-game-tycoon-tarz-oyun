import type { RivalCompany, RivalPersonality } from '@/types/rival'
import type { IntentDialogue } from '@/data/detectiveCases'

const RIVAL_INTERROGATIONS: Record<string, IntentDialogue> = {
  nexus: {
    prompt: 'Eski ekip üyelerinin kendi yollarını denemesi çok ilham verici. Sizi yakından izliyoruz.',
    choices: [
      { text: 'Bu övgünün arkasında başka bir niyet var gibi.', intent: 'suspicious' },
      { text: 'Teşekkürler, desteklediğiniz için.', intent: 'trusting' },
    ],
  },
  pixelforge: {
    prompt: 'Birlikte bir proje yapabilirdik belki. Pazar herkes için büyük, dağıtım ağlarınız nasıl çalışıyor?',
    choices: [
      { text: 'Dağıtım ağımıza mı göz koydular?', intent: 'suspicious' },
      { text: 'Güzel fikir, konuşabiliriz.', intent: 'trusting' },
    ],
  },
  ironclad: {
    prompt: 'Aynı türde oyunlar yapıyoruz. Pazar payı... tabii ki sınırlı. İyi şanslar.',
    choices: [
      { text: 'Bu bir uyarı mı, yoksa tehdit mi?', intent: 'suspicious' },
      { text: 'Rekabet sağlıklı, birlikte büyürüz.', intent: 'trusting' },
    ],
  },
  starlight: {
    prompt: 'Sizin oyunlarınızı çok inceledim. Oynanış kararlarınız... oldukça özgün.',
    choices: [
      { text: 'Neden bu kadar detaylı inceliyorlar?', intent: 'suspicious' },
      { text: 'Teşekkürler, emek verdik.', intent: 'trusting' },
    ],
  },
  tinyworlds: {
    prompt: 'Küçük stüdyolar dayanışma içinde olmalı. Finansal durumunuz nasıl, zorluk çekiyor musunuz?',
    choices: [
      { text: 'Finansal durumu neden sordular?', intent: 'suspicious' },
      { text: 'İyi niyetli bir soru, teşekkürler.', intent: 'trusting' },
    ],
  },
  glitchlab: {
    prompt: 'Sizi bir süredir takip ediyoruz. İyi işler çıkarıyorsunuz... şimdilik.',
    choices: [
      { text: '"Şimdilik" derken ne demek istediler?', intent: 'suspicious' },
      { text: 'Teşekkürler, sizi de takip ediyoruz.', intent: 'trusting' },
    ],
  },
}

export const FIXED_RIVALS: RivalCompany[] = [
  {
    id: 'nexus',
    name: 'Nexus Games',
    tier: 'major',
    personality: 'aggressive',
    foundedYear: 1990,
    genres: ['RPG', 'Aksiyon'],
    relationship: 'unknown',
    fame: 250_000,
    revenue: 50_000_000,
    games: [],
    noticeThreshold: 80,
    isFormerEmployer: true,
    isProcedural: false,
    interrogation: RIVAL_INTERROGATIONS.nexus,
  },
  {
    id: 'pixelforge',
    name: 'PixelForge',
    tier: 'mid',
    personality: 'friendly',
    foundedYear: 1995,
    genres: ['Bulmaca', 'Simülasyon'],
    relationship: 'unknown',
    fame: 35_000,
    revenue: 5_000_000,
    games: [],
    noticeThreshold: 20,
    isFormerEmployer: false,
    isProcedural: false,
    interrogation: RIVAL_INTERROGATIONS.pixelforge,
  },
  {
    id: 'ironclad',
    name: 'Ironclad Studios',
    tier: 'mid',
    personality: 'aggressive',
    foundedYear: 1993,
    genres: ['Strateji', 'Aksiyon'],
    relationship: 'unknown',
    fame: 45_000,
    revenue: 7_500_000,
    games: [],
    noticeThreshold: 25,
    isFormerEmployer: false,
    isProcedural: false,
    interrogation: RIVAL_INTERROGATIONS.ironclad,
  },
  {
    id: 'starlight',
    name: 'Starlight Interactive',
    tier: 'mid',
    personality: 'secretive',
    foundedYear: 1997,
    genres: ['Macera', 'RPG'],
    relationship: 'unknown',
    fame: 28_000,
    revenue: 4_000_000,
    games: [],
    noticeThreshold: 30,
    isFormerEmployer: false,
    isProcedural: false,
    interrogation: RIVAL_INTERROGATIONS.starlight,
  },
  {
    id: 'tinyworlds',
    name: 'Tiny Worlds',
    tier: 'indie',
    personality: 'friendly',
    foundedYear: 1998,
    genres: ['Simülasyon', 'Bulmaca'],
    relationship: 'unknown',
    fame: 5_000,
    revenue: 200_000,
    games: [],
    noticeThreshold: 5,
    isFormerEmployer: false,
    isProcedural: false,
    interrogation: RIVAL_INTERROGATIONS.tinyworlds,
  },
  {
    id: 'glitchlab',
    name: 'Glitch Lab',
    tier: 'indie',
    personality: 'defensive',
    foundedYear: 1999,
    genres: ['Aksiyon', 'Bulmaca'],
    relationship: 'unknown',
    fame: 3_000,
    revenue: 100_000,
    games: [],
    noticeThreshold: 8,
    isFormerEmployer: false,
    isProcedural: false,
    interrogation: RIVAL_INTERROGATIONS.glitchlab,
  },
]

const PROC_PREFIXES = ['Pixel', 'Nova', 'Storm', 'Iron', 'Sky', 'Dark', 'Ultra', 'Hyper']
const PROC_SUFFIXES = ['Works', 'Labs', 'Studio', 'Games', 'Craft', 'Forge', 'Arts', 'Byte']
const PROC_PERSONALITIES: RivalPersonality[] = ['aggressive', 'friendly', 'defensive', 'secretive']
const PROC_GENRES = ['RPG', 'Aksiyon', 'Strateji', 'Bulmaca', 'Simülasyon', 'Macera']

export function generateProceduralRivals(count: number): RivalCompany[] {
  const MAX_UNIQUE = PROC_PREFIXES.length * PROC_SUFFIXES.length
  if (count > MAX_UNIQUE) {
    throw new Error(`generateProceduralRivals: count ${count} exceeds pool size ${MAX_UNIQUE}`)
  }

  const usedNames = new Set<string>()
  const rivals: RivalCompany[] = []

  for (let i = 0; i < count; i++) {
    let name: string
    do {
      const p = PROC_PREFIXES[Math.floor(Math.random() * PROC_PREFIXES.length)]
      const s = PROC_SUFFIXES[Math.floor(Math.random() * PROC_SUFFIXES.length)]
      name = `${p} ${s}`
    } while (usedNames.has(name))
    usedNames.add(name)

    const personality = PROC_PERSONALITIES[Math.floor(Math.random() * PROC_PERSONALITIES.length)]
    const threshold = 1 + Math.floor(Math.random() * 40)  // 1–40 reputation

    rivals.push({
      id: `proc_${Date.now()}_${i}`,
      name,
      tier: 'indie',
      personality,
      foundedYear: 1998 + i,
      genres: [PROC_GENRES[Math.floor(Math.random() * PROC_GENRES.length)]],
      relationship: 'unknown',
      fame: Math.floor(Math.random() * 2000),
      revenue: Math.floor(Math.random() * 50_000),
      games: [],
      noticeThreshold: threshold,
      isFormerEmployer: false,
      isProcedural: true,
    })
  }

  return rivals
}
