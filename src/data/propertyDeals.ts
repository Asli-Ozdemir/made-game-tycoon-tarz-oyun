// src/data/propertyDeals.ts
import type { NPCId } from '@/data/npcDialogues'
import type { RoomId } from '@/pixi/rooms/types'

export type BuyerType = 'kurumsal_yatirimci' | 'genc_girisimci' | 'spekulatif_yatirimci'

export type NegotiationSignal = 'accepted' | 'hesitated' | 'smiled' | 'walked'

export interface PropertyDeal {
  id: string
  label: string
  roomId: RoomId
  baseCost: number
  buyerCeilingMin: number
  buyerCeilingMax: number
  buyerTypes: BuyerType[]        // pool for random selection; changes on retry
  hint: string                   // vague Vivian hint — no exact names, no room IDs
  affectedNPC: NPCId | null      // relationship capped at 20 permanently on sale
  communityNPCs: NPCId[]         // -15 relationship penalty on sale
}

export const PROPERTY_DEALS: PropertyDeal[] = [
  {
    id: 'sahaf_binasi',
    label: 'Sahaf Binası',
    roomId: 'coast_center',
    baseCost: 40_000,
    buyerCeilingMin: 55_000,
    buyerCeilingMax: 75_000,
    buyerTypes: ['kurumsal_yatirimci', 'spekulatif_yatirimci'],
    hint: 'Eski, işlek bir bölge. Kitap kokusu ve tahta merdiven.',
    affectedNPC: 'marcus',
    communityNPCs: ['marta'],
  },
  {
    id: 'iskele_deposu',
    label: 'İskele Deposu',
    roomId: 'coast_docks',
    baseCost: 25_000,
    buyerCeilingMin: 38_000,
    buyerCeilingMax: 55_000,
    buyerTypes: ['spekulatif_yatirimci', 'genc_girisimci'],
    hint: 'Nehir kenarı sakin mahalle. Depo kokusu, sabah sisi.',
    affectedNPC: 'remy',
    communityNPCs: [],
  },
  {
    id: 'firin_arsasi',
    label: 'Fırın Arsası',
    roomId: 'coast_center',
    baseCost: 30_000,
    buyerCeilingMin: 45_000,
    buyerCeilingMax: 62_000,
    buyerTypes: ['genc_girisimci', 'spekulatif_yatirimci'],
    hint: 'Eski bir fırın yıkılmış, arsa boş. Sıcak bir bölge.',
    affectedNPC: 'marta',
    communityNPCs: ['marcus'],
  },
  {
    id: 'park_kenari',
    label: 'Park Kenarı',
    roomId: 'city_park',
    baseCost: 50_000,
    buyerCeilingMin: 70_000,
    buyerCeilingMax: 95_000,
    buyerTypes: ['kurumsal_yatirimci'],
    hint: 'Park yakını yeşil alan. Geniş, sessiz, potansiyel dolu.',
    affectedNPC: null,
    communityNPCs: [],
  },
  {
    id: 'klinik_yani',
    label: 'Klinik Yanı',
    roomId: 'city_edge',
    baseCost: 35_000,
    buyerCeilingMin: 50_000,
    buyerCeilingMax: 70_000,
    buyerTypes: ['kurumsal_yatirimci', 'genc_girisimci'],
    hint: 'Şehir kenarı, sağlık hizmetleri yakını. Gelecek vaat ediyor.',
    affectedNPC: 'elias',
    communityNPCs: [],
  },
]
