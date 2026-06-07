// tests/store/audioStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  length: 0,
  key: () => null,
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

import { useAudioStore } from '@/store/audioStore'

describe('audioStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    useAudioStore.setState({
      masterVolume: 0.8,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      muted: false,
    })
  })

  it('varsayılan değerler doğru', () => {
    const s = useAudioStore.getState()
    expect(s.masterVolume).toBe(0.8)
    expect(s.sfxVolume).toBe(0.8)
    expect(s.musicVolume).toBe(0.5)
    expect(s.muted).toBe(false)
  })

  it('setMasterVolume günceller', () => {
    useAudioStore.getState().setMasterVolume(0.5)
    expect(useAudioStore.getState().masterVolume).toBe(0.5)
  })

  it('setSfxVolume günceller', () => {
    useAudioStore.getState().setSfxVolume(0.3)
    expect(useAudioStore.getState().sfxVolume).toBe(0.3)
  })

  it('setMusicVolume günceller', () => {
    useAudioStore.getState().setMusicVolume(0.6)
    expect(useAudioStore.getState().musicVolume).toBe(0.6)
  })

  it('toggleMute: false → true', () => {
    useAudioStore.getState().toggleMute()
    expect(useAudioStore.getState().muted).toBe(true)
  })

  it('toggleMute iki kez → false', () => {
    useAudioStore.getState().toggleMute()
    useAudioStore.getState().toggleMute()
    expect(useAudioStore.getState().muted).toBe(false)
  })

  it("setMasterVolume localStorage'a kaydeder", () => {
    useAudioStore.getState().setMasterVolume(0.3)
    const saved = JSON.parse(localStorageMock.getItem('audio-preferences')!)
    expect(saved.masterVolume).toBe(0.3)
  })

  it("setMuted localStorage'a kaydeder", () => {
    useAudioStore.getState().setMuted(true)
    const saved = JSON.parse(localStorageMock.getItem('audio-preferences')!)
    expect(saved.muted).toBe(true)
  })
})
