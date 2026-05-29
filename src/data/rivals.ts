import type { RivalCompany, RivalPersonality } from '@/types/rival'

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
