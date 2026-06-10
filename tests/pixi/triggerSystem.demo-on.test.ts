import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSetLocation = vi.fn()
const mockSetGameMode = vi.fn()
const mockSetIsPaused = vi.fn()

vi.mock('@/store/worldStore', () => ({
  useWorldStore: {
    getState: () => ({ setLocation: mockSetLocation, setGameMode: mockSetGameMode }),
  },
}))

vi.mock('@/store/dayTimeStore', () => ({
  useDayTimeStore: {
    getState: () => ({ setIsPaused: mockSetIsPaused }),
  },
}))

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(['bridge', 'city_core', 'city_culture', 'city_edge', 'city_park']),
  DEMO_BLOCKED_LOCATIONS: new Set(['pub', 'nehir']),
}))

import { handleTrigger } from '@/pixi/TriggerSystem'

describe('DEMO_MODE=true — TriggerSystem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pub_door tetikleyicisini engeller', () => {
    handleTrigger('pub_door')
    expect(mockSetLocation).not.toHaveBeenCalled()
  })

  it('balikci_door artık demoda açık — setLocation çağrılır', () => {
    handleTrigger('balikci_door')
    expect(mockSetLocation).toHaveBeenCalledWith('balikci')
  })

  it('nehir tetikleyicisini engeller', () => {
    handleTrigger('nehir')
    expect(mockSetLocation).not.toHaveBeenCalled()
  })

  it('sahaf_door tetikleyicisine izin verir (Marcus istisnası)', () => {
    handleTrigger('sahaf_door')
    expect(mockSetLocation).toHaveBeenCalledWith('sahaf')
  })

  it('studio_desk tetikleyicisine izin verir (tycoon modu)', () => {
    handleTrigger('studio_desk')
    expect(mockSetGameMode).toHaveBeenCalledWith('tycoon')
  })
})
