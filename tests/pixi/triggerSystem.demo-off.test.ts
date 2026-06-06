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
  DEMO_MODE: false,
  DEMO_BLOCKED_ROOMS: new Set(['bridge', 'city_core', 'city_culture', 'city_edge', 'city_park']),
  DEMO_BLOCKED_LOCATIONS: new Set(['pub', 'balikci', 'nehir']),
}))

import { handleTrigger } from '@/pixi/TriggerSystem'

describe('DEMO_MODE=false — TriggerSystem (tam oyun)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('pub_door tetikleyicisine izin verir', () => {
    handleTrigger('pub_door')
    expect(mockSetLocation).toHaveBeenCalledWith('pub')
  })

  it('balikci_door tetikleyicisine izin verir', () => {
    handleTrigger('balikci_door')
    expect(mockSetLocation).toHaveBeenCalledWith('balikci')
  })

  it('nehir tetikleyicisine izin verir', () => {
    handleTrigger('nehir')
    expect(mockSetLocation).toHaveBeenCalledWith('nehir')
  })

  it('sahaf_door tetikleyicisine izin verir', () => {
    handleTrigger('sahaf_door')
    expect(mockSetLocation).toHaveBeenCalledWith('sahaf')
  })
})
