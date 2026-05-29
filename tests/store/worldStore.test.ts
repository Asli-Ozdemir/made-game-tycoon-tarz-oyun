import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStore } from '@/store/worldStore'

beforeEach(() => {
  useWorldStore.setState({ gameMode: 'exploration', currentLocation: null })
})

describe('worldStore', () => {
  it('başlangıçta exploration modunda', () => {
    expect(useWorldStore.getState().gameMode).toBe('exploration')
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

  it('setLocation null ile temizler', () => {
    useWorldStore.getState().setLocation('cafe')
    useWorldStore.getState().setLocation(null)
    expect(useWorldStore.getState().currentLocation).toBeNull()
  })
})
