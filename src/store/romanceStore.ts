import { create } from 'zustand'
import { getNpc } from '@/data/npcDialogues'
import type { NPCDef } from '@/data/npcDialogues'
import { useCharacterStore } from '@/store/characterStore'
import { useLifeStore } from '@/store/lifeStore'
import { useNPCStore } from '@/store/npcStore'
import { useTimeStore } from '@/store/timeStore'
import { useGameStore } from '@/store/gameStore'

export type RomanceStage = 'arkadas' | 'sevgili' | 'nisanli' | 'evli'

const CONFESS_HEART = 70   // itiraf için gereken ilişki (npcStore 0–100; T3 eşiği)
const DATE_MIN = 3          // teklif için min. buluşma
const MAX_CHILDREN = 2
export const BOUQUET_COST = 200    // çiçekçiden (Greta) demet
export const RING_COST    = 5000   // kuyumcudan yüzük

// B'nin evlendirdiği NPC'ler (oyuncu artık onlarla romantik olamaz)
function takenByB(npcId: string): boolean {
  if ((npcId === 'daniel' || npcId === 'sigrid') &&
      useLifeStore.getState().hasFlag('married_daniel_sigrid')) return true
  return false
}

function makeChildDef(name: string, birthYear: number, gender: 'male' | 'female'): NPCDef {
  return {
    id: `child-${birthYear}-${name.toLowerCase()}`,
    name,
    role: 'Çocuk',
    philosophy: 'Oyuncunun çocuğu — yeni nesil; yıllarca büyür.',
    emoji: '🧒',
    gender,
    isRomanceCandidate: false,
    birthYear,
    tier2Threshold: 30,
    tier3Threshold: 70,
    dialogues: [],
  }
}

interface RomanceStore {
  stage:      Record<string, RomanceStage>
  dateCount:  Record<string, number>
  hasBouquet: boolean
  hasRing:    boolean

  getStage:   (npcId: string) => RomanceStage
  canRomance: (npcId: string) => boolean
  buyBouquet: () => boolean
  buyRing:    () => boolean
  confess:    (npcId: string) => boolean
  goOnDate:   (npcId: string) => boolean
  propose:    (npcId: string) => boolean
  marry:      (npcId: string) => boolean
  haveChild:  (childName: string, gender?: 'male' | 'female') => boolean
  reset:      () => void
}

export const useRomanceStore = create<RomanceStore>((set, get) => ({
  stage:      {},
  dateCount:  {},
  hasBouquet: false,
  hasRing:    false,

  getStage: (npcId) => get().stage[npcId] ?? 'arkadas',

  canRomance: (npcId) => {
    const def = getNpc(npcId)
    if (!def || !def.isRomanceCandidate) return false
    if (takenByB(npcId)) return false
    // Cinsiyet tercihi (attractedTo boşsa herkes)
    const pref = useCharacterStore.getState().attractedTo
    if (pref.length > 0 && !pref.includes(def.gender)) return false
    // Yetişkin mi (birthYear yoksa yetişkin kabul; minörler birthYear taşır)
    if (def.birthYear != null) {
      const age = useTimeStore.getState().date.year - def.birthYear
      if (age < 18) return false
    }
    return true
  },

  buyBouquet: () => {
    if (get().hasBouquet) return false
    if (useGameStore.getState().money < BOUQUET_COST) return false
    useGameStore.getState().addMoney(-BOUQUET_COST)
    set({ hasBouquet: true })
    return true
  },
  buyRing: () => {
    if (get().hasRing) return false
    if (useGameStore.getState().money < RING_COST) return false
    useGameStore.getState().addMoney(-RING_COST)
    set({ hasRing: true })
    return true
  },

  confess: (npcId) => {
    if (!get().canRomance(npcId)) return false
    if (get().getStage(npcId) !== 'arkadas') return false
    if (!get().hasBouquet) return false
    if (useNPCStore.getState().getRelationship(npcId) < CONFESS_HEART) return false
    set((s) => ({ stage: { ...s.stage, [npcId]: 'sevgili' }, hasBouquet: false }))
    useCharacterStore.setState({ partnerId: npcId })
    useLifeStore.getState().setFlag(`player_romance_${npcId}`)
    return true
  },

  goOnDate: (npcId) => {
    if (get().getStage(npcId) !== 'sevgili') return false
    set((s) => ({ dateCount: { ...s.dateCount, [npcId]: (s.dateCount[npcId] ?? 0) + 1 } }))
    return true
  },

  propose: (npcId) => {
    if (get().getStage(npcId) !== 'sevgili') return false
    if (!get().hasRing) return false
    if ((get().dateCount[npcId] ?? 0) < DATE_MIN) return false
    set((s) => ({ stage: { ...s.stage, [npcId]: 'nisanli' }, hasRing: false }))
    return true
  },

  marry: (npcId) => {
    if (get().getStage(npcId) !== 'nisanli') return false
    set((s) => ({ stage: { ...s.stage, [npcId]: 'evli' } }))
    useCharacterStore.setState({ spouseId: npcId })
    useLifeStore.getState().setFlag(`player_married_${npcId}`)
    return true
  },

  haveChild: (childName, gender = 'male') => {
    const cs = useCharacterStore.getState()
    if (cs.spouseId == null) return false
    if (cs.childIds.length >= MAX_CHILDREN) return false
    const year = useTimeStore.getState().date.year
    const def = makeChildDef(childName, year, gender)
    useLifeStore.getState().spawnNpc(def)
    useCharacterStore.setState({ childIds: [...cs.childIds, def.id] })
    return true
  },

  reset: () => set({ stage: {}, dateCount: {}, hasBouquet: false, hasRing: false }),
}))
