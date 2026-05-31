import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStore } from '@/store/worldStore'

beforeEach(() => {
  useWorldStore.setState({ gameMode: 'exploration', currentLocation: null })
})

describe('worldStore', () => {
  it('başlangıçta exploration modunda', () => {
    expect(useWorldStore.getState().gameMode).toBe('exploration')
  })

  it('başlangıçta currentLocation null', () => {
    expect(useWorldStore.getState().currentLocation).toBeNull()
  })

  it('setGameMode tycoon a geçirir', () => {
    useWorldStore.getState().setGameMode('tycoon')
    expect(useWorldStore.getState().gameMode).toBe('tycoon')
  })

  it('setGameMode exploration a geri döner', () => {
    useWorldStore.getState().setGameMode('tycoon')
    useWorldStore.getState().setGameMode('exploration')
    expect(useWorldStore.getState().gameMode).toBe('exploration')
  })

  it('setLocation cafe set eder', () => {
    useWorldStore.getState().setLocation('cafe')
    expect(useWorldStore.getState().currentLocation).toBe('cafe')
  })

  it('setLocation fair set eder', () => {
    useWorldStore.getState().setLocation('fair')
    expect(useWorldStore.getState().currentLocation).toBe('fair')
  })

  it('setLocation null ile temizler', () => {
    useWorldStore.getState().setLocation('cafe')
    useWorldStore.getState().setLocation(null)
    expect(useWorldStore.getState().currentLocation).toBeNull()
  })

  it('setLocation sahaf set eder', () => {
    useWorldStore.getState().setLocation('sahaf')
    expect(useWorldStore.getState().currentLocation).toBe('sahaf')
  })

  it('setLocation balikci set eder', () => {
    useWorldStore.getState().setLocation('balikci')
    expect(useWorldStore.getState().currentLocation).toBe('balikci')
  })

  it('setLocation pub set eder', () => {
    useWorldStore.getState().setLocation('pub')
    expect(useWorldStore.getState().currentLocation).toBe('pub')
  })
})
