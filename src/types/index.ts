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

// Ortak taban — tüm proje tiplerinde mevcut
interface BaseProject {
  id:            string
  name:          string
  genreId:       string
  topicId:       string
  platformId:    string
  scope:         ProjectScope
  startDate:     GameDate
  totalWeeks:    number
  weeksElapsed:  number
  qualityPoints: number
  status:        ProjectStatus
  publishResult?: PublishResult
  price:            number        // lansmanda belirlenen birim fiyat ($)
  discountPct:      number | null // aktif indirim oranı (0.25 | 0.50 | 0.75), null = yok
  isOnSale:         boolean       // platform sale eventine katılıyor mu
  publishTickCount: number | null // yayınlandığı timeStore.tickCount; geliştirmede null
  featuredUntilTick:   number | null  // featured placement aktifken bitiş tick'i
  exclusivePlatformId: string | null  // exclusive deal kabul edildiyse platform id
  publishYear?:  number   // yayınlandığı oyun yılı (timeStore.date.year)
  publishScore?: number   // publish anındaki nihai skor
}

export interface StandaloneProject extends BaseProject {
  contentType: 'standalone'
}

export interface SequelProject extends BaseProject {
  contentType:       'sequel'
  parentProjectId:   string
  fanBaseMultiplier: number   // 1.0 + (parentSales/50000)*0.5, max 2.0
}

export interface DlcProject extends BaseProject {
  contentType:     'dlc'
  parentProjectId: string
  priceOverride:   number   // oyuncu belirler, max = Math.floor(parentRevenue/parentSales)
}

export interface UpdateProject extends BaseProject {
  contentType:     'guncelleme'
  parentProjectId: string
}

export type GameProject = StandaloneProject | SequelProject | DlcProject | UpdateProject

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
  id:              string
  name:            string
  salesMultiplier: number
  pricePerUnit:    number
  suggestedPrice:  number
}

export interface Topic {
  id: string
  name: string
  genreAffinity: string[]
}
