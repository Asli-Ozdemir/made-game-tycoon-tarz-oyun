// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))
vi.mock('@/audio/soundService', () => ({ sfx: vi.fn() }))

import { useObjectiveStore } from '@/store/objectiveStore'

beforeEach(() => {
  useObjectiveStore.getState().reset()
})

describe('DEMO_MODE=true — demo hedef zinciri', () => {
  it('advanceToGameDev demoda zinciri başlatır (visit_marcus)', () => {
    useObjectiveStore.getState().advanceToGameDev()
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('visit_marcus')
  })

  it('completeDemoStep yanlış adımda ilerlemez', () => {
    useObjectiveStore.getState().advanceToGameDev()
    useObjectiveStore.getState().completeDemoStep('fish_pier')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('visit_marcus')
  })

  it('completeDemoStep doğru adımda sıradakine geçer', () => {
    useObjectiveStore.getState().advanceToGameDev()
    useObjectiveStore.getState().completeDemoStep('visit_marcus')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('fish_pier')
    useObjectiveStore.getState().completeDemoStep('fish_pier')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('archive_shift')
    useObjectiveStore.getState().completeDemoStep('archive_shift')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('sleep_spend')
    useObjectiveStore.getState().completeDemoStep('sleep_spend')
    expect(useObjectiveStore.getState().activeObjective?.id).toBe('publish_game')
  })

  it('son adım tamamlanınca hedef temizlenir', () => {
    useObjectiveStore.getState().setObjective({ id: 'publish_game', title: 'x', description: 'y' })
    useObjectiveStore.getState().completeDemoStep('publish_game')
    expect(useObjectiveStore.getState().activeObjective).toBeNull()
  })

  it('aktif hedef yokken no-op', () => {
    useObjectiveStore.getState().completeDemoStep('visit_marcus')
    expect(useObjectiveStore.getState().activeObjective).toBeNull()
  })
})
