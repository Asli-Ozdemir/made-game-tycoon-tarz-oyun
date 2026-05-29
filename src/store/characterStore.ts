import { create } from 'zustand'
import { BACKGROUNDS } from '@/data/backgrounds'
import type { BackgroundId, ProfessionStats, PersonalityStats } from '@/data/backgrounds'

const DEFAULT_PROFESSION: ProfessionStats = { programlama: 0, tasarim: 0, ses: 0, projeyonetimi: 0 }
const DEFAULT_PERSONALITY: PersonalityStats = { karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0 }

interface CharacterStore {
  isCreated:   boolean
  name:        string
  studioName:  string
  background:  BackgroundId | null
  profession:  ProfessionStats
  personality: PersonalityStats
  setBackground:       (bg: BackgroundId) => void
  setPersonality:      (stats: PersonalityStats) => void
  setIdentity:         (name: string, studioName: string) => void
  finalize:            () => void
  reset:               () => void
  getPlayerSkillBonus: () => number
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  isCreated:   false,
  name:        '',
  studioName:  '',
  background:  null,
  profession:  DEFAULT_PROFESSION,
  personality: DEFAULT_PERSONALITY,

  setBackground: (bg) => {
    const def = BACKGROUNDS.find((b) => b.id === bg)!
    set({ background: bg, profession: def.profession })
  },

  setPersonality: (stats) => set({ personality: stats }),

  setIdentity: (name, studioName) => set({ name, studioName }),

  finalize: () => set({ isCreated: true }),

  reset: () => set({
    isCreated:   false,
    name:        '',
    studioName:  '',
    background:  null,
    profession:  { ...DEFAULT_PROFESSION },
    personality: { ...DEFAULT_PERSONALITY },
  }),

  getPlayerSkillBonus: () => {
    const { profession } = get()
    const avg = (profession.programlama + profession.tasarim + profession.ses + profession.projeyonetimi) / 4
    return avg * 0.3
  },
}))
