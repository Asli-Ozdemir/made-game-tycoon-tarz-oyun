import { create } from 'zustand'
import { useProjectStore } from '@/store/projectStore'
import { sfx } from '@/audio/soundService'
import { DEMO_MODE } from '@/config'

export interface ObjectiveDef {
  id: string
  title: string
  description: string
}

const FIRST_OBJECTIVE: ObjectiveDef = {
  id: 'first_game',
  title: 'İlk oyununu yap',
  description: 'Bilgisayarına git ve ilk oyun projesini başlat.',
}

const DEVELOP_OBJECTIVE: ObjectiveDef = {
  id: 'develop_game',
  title: 'Oyununu geliştir',
  description: 'İlk projen başladı. Geliştirmeye devam et!',
}

const DEMO_CHAIN: ObjectiveDef[] = [
  {
    id: 'visit_marcus',
    title: 'Sahafı ziyaret et',
    description: 'Proje gelişiyor. Bu arada sahile in, sahaf Marcus ile tanış.',
  },
  {
    id: 'fish_pier',
    title: 'İskelede balık tut',
    description: "Remy'nin iskelesinde bir balık seansı tamamla.",
  },
  {
    id: 'archive_shift',
    title: 'Arşiv taraması yap',
    description: "Marcus'un arşivinde bir vardiya tamamla — fikir tohumu kazan.",
  },
  {
    id: 'sleep_spend',
    title: 'Uyu ve zihnini geliştir',
    description: 'Yatağına git, Zihin ağacında bir tohum harca.',
  },
  {
    id: 'publish_game',
    title: 'Oyununu yayınla',
    description: 'İlk oyununu tamamla ve dünyaya sun!',
  },
]

interface ObjectiveStoreState {
  activeObjective:  ObjectiveDef | null
  showMovementHint: boolean
  showPointer:      boolean
  setObjective:         (obj: ObjectiveDef | null) => void
  dismissMovementHint:  () => void
  dismissPointer:       () => void
  tryStartOnboarding:   () => void
  advanceToGameDev:     () => void
  completeDemoStep:     (stepId: string) => void
  reset:                () => void
}

export const useObjectiveStore = create<ObjectiveStoreState>((set) => ({
  activeObjective:  null,
  showMovementHint: false,
  showPointer:      false,

  setObjective:        (obj) => set({ activeObjective: obj }),
  dismissMovementHint: ()    => set({ showMovementHint: false }),
  dismissPointer:      ()    => set({ showPointer: false }),

  tryStartOnboarding: () => {
    const projects = useProjectStore.getState().projects
    if (projects.length > 0) return
    set({ activeObjective: FIRST_OBJECTIVE, showMovementHint: true, showPointer: true })
  },

  advanceToGameDev: () => {
    sfx('objective')
    if (DEMO_MODE) {
      set({ activeObjective: DEMO_CHAIN[0], showPointer: false })
    } else {
      set({ activeObjective: DEVELOP_OBJECTIVE, showPointer: false })
    }
  },

  completeDemoStep: (stepId) => {
    if (!DEMO_MODE) return
    set((s) => {
      if (s.activeObjective?.id !== stepId) return s
      const idx = DEMO_CHAIN.findIndex((o) => o.id === stepId)
      if (idx === -1) return s
      sfx('objective')
      return { ...s, activeObjective: DEMO_CHAIN[idx + 1] ?? null }
    })
  },

  reset: () => set({ activeObjective: null, showMovementHint: false, showPointer: false }),
}))
