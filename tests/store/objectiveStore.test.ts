// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { useObjectiveStore } from '@/store/objectiveStore'
import { useProjectStore } from '@/store/projectStore'
import { createProject } from '@/engine/projectEngine'
import { useTimeStore } from '@/store/timeStore'

beforeEach(() => {
  useObjectiveStore.getState().reset()
  useProjectStore.getState().reset()
  useTimeStore.getState().reset()
})

describe('objectiveStore', () => {
  it('başlangıçta boş — hedef yok, hint yok, pointer yok', () => {
    const s = useObjectiveStore.getState()
    expect(s.activeObjective).toBeNull()
    expect(s.showMovementHint).toBe(false)
    expect(s.showPointer).toBe(false)
  })

  it('tryStartOnboarding: proje yoksa ilk hedefi başlatır', () => {
    useObjectiveStore.getState().tryStartOnboarding()
    const s = useObjectiveStore.getState()
    expect(s.activeObjective?.id).toBe('first_game')
    expect(s.showMovementHint).toBe(true)
    expect(s.showPointer).toBe(true)
  })

  it('tryStartOnboarding: proje varsa onboarding başlamaz', () => {
    const date = useTimeStore.getState().date
    useProjectStore.getState().addProject({
      ...createProject({ name: 'Test', genreId: 'aksiyon', topicId: 'uzay', platformId: 'pc', scope: 'kucuk', startDate: date }),
      price: 10,
    })
    useObjectiveStore.getState().tryStartOnboarding()
    expect(useObjectiveStore.getState().activeObjective).toBeNull()
  })

  it('advanceToGameDev: hedefi ilerletir ve pointer kalkar', () => {
    useObjectiveStore.getState().tryStartOnboarding()
    useObjectiveStore.getState().advanceToGameDev()
    const s = useObjectiveStore.getState()
    expect(s.activeObjective?.id).toBe('develop_game')
    expect(s.showPointer).toBe(false)
    expect(s.showMovementHint).toBe(true)
  })

  it('dismissMovementHint: hint kapanır', () => {
    useObjectiveStore.getState().tryStartOnboarding()
    useObjectiveStore.getState().dismissMovementHint()
    expect(useObjectiveStore.getState().showMovementHint).toBe(false)
  })

  it('dismissPointer: pointer kapanır', () => {
    useObjectiveStore.getState().tryStartOnboarding()
    useObjectiveStore.getState().dismissPointer()
    expect(useObjectiveStore.getState().showPointer).toBe(false)
  })

  it('reset: her şeyi temizler', () => {
    useObjectiveStore.getState().tryStartOnboarding()
    useObjectiveStore.getState().reset()
    const s = useObjectiveStore.getState()
    expect(s.activeObjective).toBeNull()
    expect(s.showMovementHint).toBe(false)
    expect(s.showPointer).toBe(false)
  })
})
