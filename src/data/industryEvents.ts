import type { Season } from '@/types'

export type IndustryEventType = 'major' | 'indie' | 'award'
export type PresentationType  = 'teaser' | 'demo' | 'duyuru'

export interface IndustryEventDef {
  id:              string
  name:            string
  description:     string
  season:          Season
  week:            number
  type:            IndustryEventType
  focusPlatforms:  ('pc' | 'konsol' | 'mobil')[]
  focusGenres:     string[]
  passivePopBoost: number
}

export interface PresentationConfig {
  type:             PresentationType
  cost:             number
  salesMultiplier:  number
  reputationBonus:  number
  durationWeeks:    number
}

export const PRESENTATION_CONFIGS: Record<PresentationType, PresentationConfig> = {
  teaser: {
    type: 'teaser',
    cost: 5000,
    salesMultiplier: 1.10,
    reputationBonus: 5,
    durationWeeks: 2,
  },
  demo: {
    type: 'demo',
    cost: 15000,
    salesMultiplier: 1.25,
    reputationBonus: 10,
    durationWeeks: 3,
  },
  duyuru: {
    type: 'duyuru',
    cost: 35000,
    salesMultiplier: 1.40,
    reputationBonus: 20,
    durationWeeks: 3,
  },
}

export const INDUSTRY_EVENTS: IndustryEventDef[] = [
  {
    id: 'gdc',
    name: 'GDC',
    description: 'Geliştirici konferansı. Strateji ve simülasyon oyunları öne çıkar.',
    season: 'ilkbahar',
    week: 2,
    type: 'major',
    focusPlatforms: ['pc'],
    focusGenres: ['strateji', 'simulasyon', 'bulmaca'],
    passivePopBoost: 8,
  },
  {
    id: 'indie_ilkbahar',
    name: 'İndie Fuarı İlkbahar',
    description: 'Bağımsız geliştirici festivali. Küçük bütçeli oyunlar için fırsat.',
    season: 'ilkbahar',
    week: 4,
    type: 'indie',
    focusPlatforms: ['pc', 'mobil'],
    focusGenres: [],
    passivePopBoost: 4,
  },
  {
    id: 'e3',
    name: 'E3 / Summer Game Fest',
    description: 'Yılın en büyük oyun fuarı. Konsol, aksiyon ve RPG oyunları parlıyor.',
    season: 'yaz',
    week: 2,
    type: 'major',
    focusPlatforms: ['konsol'],
    focusGenres: ['aksiyon', 'rpg'],
    passivePopBoost: 8,
  },
  {
    id: 'gamescom',
    name: 'Gamescom',
    description: "Avrupa'nın en büyük oyun fuarı. PC ve mobil odaklı.",
    season: 'sonbahar',
    week: 1,
    type: 'major',
    focusPlatforms: ['pc', 'mobil'],
    focusGenres: ['strateji', 'simulasyon'],
    passivePopBoost: 8,
  },
  {
    id: 'indie_sonbahar',
    name: 'İndie Fuarı Sonbahar',
    description: 'Sonbahar indie festivali. PC odaklı küçük bütçeli oyunlar.',
    season: 'sonbahar',
    week: 3,
    type: 'indie',
    focusPlatforms: ['pc'],
    focusGenres: [],
    passivePopBoost: 4,
  },
  {
    id: 'tga',
    name: 'Oyun Ödülleri',
    description: 'Yılın en iyi oyunları seçiliyor. Score ≥ 75 ile yayınladıysan aday olabilirsin.',
    season: 'kis',
    week: 4,
    type: 'award',
    focusPlatforms: [],
    focusGenres: [],
    passivePopBoost: 0,
  },
]
