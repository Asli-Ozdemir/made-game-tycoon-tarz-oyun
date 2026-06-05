import { create } from 'zustand'
import { BACKGROUNDS } from '@/data/backgrounds'
import { START_YEAR } from '@/engine/aging'
import type { BackgroundId, ProfessionStats, PersonalityStats } from '@/data/backgrounds'

const PLAYER_START_AGE = 35   // oyuncu oyun başında ~35

const DEFAULT_PROFESSION: ProfessionStats = { programlama: 0, tasarim: 0, ses: 0, projeyonetimi: 0 }
const DEFAULT_PERSONALITY: PersonalityStats = { karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0 }

interface CharacterStore {
  isCreated:   boolean
  name:        string
  studioName:  string
  background:  BackgroundId | null
  profession:  ProfessionStats
  personality: PersonalityStats
  attractedTo: ('male' | 'female')[]
  birthYear:   number | null
  setBackground:       (bg: BackgroundId) => void
  setPersonality:      (stats: PersonalityStats) => void
  setIdentity:         (name: string, studioName: string) => void
  setAttractedTo:      (genders: ('male' | 'female')[]) => void
  finalize:            () => void
  reset:               () => void
  getPlayerSkillBonus: () => number
  getPlayerAge:           (currentYear: number) => number | null
  playerEnergyMultiplier: (currentYear: number) => number
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  isCreated:   false,
  name:        '',
  studioName:  '',
  background:  null,
  profession:  DEFAULT_PROFESSION,
  personality: DEFAULT_PERSONALITY,
  attractedTo: [],
  birthYear:   null,

  setBackground: (bg) => {
    const def = BACKGROUNDS.find((b) => b.id === bg)!
    set({ background: bg, profession: def.profession })
  },

  setPersonality: (stats) => set({ personality: stats }),

  setIdentity: (name, studioName) => set({ name, studioName }),

  setAttractedTo: (genders) => set({ attractedTo: genders }),

  finalize: () => set({ isCreated: true, birthYear: START_YEAR - PLAYER_START_AGE }),

  reset: () => set({
    isCreated:   false,
    name:        '',
    studioName:  '',
    background:  null,
    profession:  { ...DEFAULT_PROFESSION },
    personality: { ...DEFAULT_PERSONALITY },
    attractedTo: [],
    birthYear:   null,
  }),

  getPlayerSkillBonus: () => {
    const { profession } = get()
    const avg = (profession.programlama + profession.tasarim + profession.ses + profession.projeyonetimi) / 4
    return avg * 0.3
  },

  getPlayerAge: (currentYear) => {
    const by = get().birthYear
    return by == null ? null : currentYear - by
  },

  // Oyuncu hafif yaşlanması: ilk 25 yıl tam enerji, sonra yıl başına -%10 (taban 0.5)
  playerEnergyMultiplier: (currentYear) => {
    const elapsed = currentYear - START_YEAR
    if (elapsed < 25) return 1.0
    return Math.max(0.5, 1.0 - (elapsed - 24) * 0.1)
  },
}))
