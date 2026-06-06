import { create } from 'zustand'
import { useProjectStore } from '@/store/projectStore'

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

interface ObjectiveStoreState {
  activeObjective:  ObjectiveDef | null
  showMovementHint: boolean
  showPointer:      boolean
  setObjective:         (obj: ObjectiveDef | null) => void
  dismissMovementHint:  () => void
  dismissPointer:       () => void
  tryStartOnboarding:   () => void
  advanceToGameDev:     () => void
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

  advanceToGameDev: () =>
    set({ activeObjective: DEVELOP_OBJECTIVE, showPointer: false }),

  reset: () => set({ activeObjective: null, showMovementHint: false, showPointer: false }),
}))
