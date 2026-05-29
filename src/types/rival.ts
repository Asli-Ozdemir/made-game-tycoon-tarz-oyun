// src/types/rival.ts
export type RivalTier = 'indie' | 'mid' | 'major'
export type RivalPersonality = 'aggressive' | 'friendly' | 'defensive' | 'secretive'
export type RelationshipStatus =
  | 'unknown'    // henüz fark etmedi
  | 'noticed'    // fark etti
  | 'rival'      // aktif rekabet
  | 'nemesis'    // düşman
  | 'ally'       // müttefik (merge için önkoşul)
  | 'merged'     // birleşildi
  | 'destroyed'  // yok edildi

export interface RivalGame {
  id: string
  title: string
  genre: string
  score: number        // 1–100
  revenue: number
  releasedYear: number
}

export interface RivalCompany {
  id: string
  name: string
  tier: RivalTier
  personality: RivalPersonality
  foundedYear: number
  genres: string[]
  relationship: RelationshipStatus
  fame: number         // rakibin kendi şöhreti (büyük sayı, görüntüleme için)
  revenue: number      // rakibin toplam geliri
  games: RivalGame[]
  noticeThreshold: number  // oyuncunun gameStore.reputation (0–100) ile karşılaştırılır
  isFormerEmployer: boolean
  isProcedural: boolean
}

export type NewsType =
  | 'rival_release'
  | 'rival_award'
  | 'rival_scandal'
  | 'rival_notice'
  | 'player_mention'
  | 'market_trend'
  | 'random_event'

export interface NewsItem {
  id: string
  type: NewsType
  rivalId: string | null
  text: string
  year: number
  season: number  // SEASONS dizin indeksi: 0=ilkbahar 1=yaz 2=sonbahar 3=kış
  seen: boolean
}

export type ResolutionChoice = 'buyout' | 'destroy' | 'forgive' | 'merge'

export interface AwardsNominee {
  name: string      // oyun adı
  studio: string    // stüdyo adı
  score: number
  isPlayer: boolean
}

export interface AwardsEvent {
  year: number
  nominees: AwardsNominee[]
  winnerId: string  // 'player' veya rivalId
}
