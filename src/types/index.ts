// --- Zaman ---
export type Season = 'ilkbahar' | 'yaz' | 'sonbahar' | 'kis'
export const SEASONS: Season[] = ['ilkbahar', 'yaz', 'sonbahar', 'kis']

export interface GameDate {
  year: number   // başlangıç: 2000
  season: Season
  week: number   // 1–4
}

// --- Proje ---
export type ProjectScope = 'kucuk' | 'orta' | 'buyuk' | 'iddiali'
export type ProjectStatus = 'gelistirme' | 'yayinlandi' | 'iptal'

export interface PublishResult {
  score: number       // 1–100
  sales: number       // birim
  revenue: number     // para cinsinden
  publishDate: GameDate
}

export interface GameProject {
  id: string
  name: string
  genreId: string
  topicId: string
  platformId: string
  scope: ProjectScope
  startDate: GameDate
  totalWeeks: number
  weeksElapsed: number
  qualityPoints: number
  status: ProjectStatus
  publishResult?: PublishResult
}

// --- Ana State ---
export type GameSpeed = 'durduruldu' | 'normal' | 'hizli' | 'cok_hizli'

export interface GameState {
  money: number
  reputation: number        // 0–100
  totalPublished: number
  date: GameDate
  speed: GameSpeed
  projects: GameProject[]
}

// --- Veri tipleri ---
export interface Genre {
  id: string
  name: string
  baseSales: number
  cycleLength: number   // yıl cinsinden döngü uzunluğu (5–8)
  startPhase: number    // başlangıç sinüs fazı (0–2π), türe özgü sabit
}

export interface Platform {
  id: string
  name: string
  salesMultiplier: number
  pricePerUnit: number
}

export interface Topic {
  id: string
  name: string
  genreAffinity: string[]
}
