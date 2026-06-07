// tests/audio/soundService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@pixi/sound', () => ({
  Sound: {
    from: vi.fn(({ loaded }: { url: string; preload: boolean; loaded: (err: null, snd: object) => void }) => {
      const mockSound = { play: vi.fn(), stop: vi.fn(), volume: 0, loop: false, paused: true }
      setTimeout(() => loaded(null, mockSound), 0)
      return mockSound
    }),
  },
}))

vi.mock('@/store/audioStore', () => ({
  useAudioStore: {
    getState: vi.fn(() => ({
      masterVolume: 0.8,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      muted: false,
    })),
    subscribe: vi.fn(() => () => {}),
    setState: vi.fn(),
  },
}))

import { sfx, stopMusic, initSounds } from '@/audio/soundService'

describe('soundService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sfx() yüklenmemiş ses için hata vermez', () => {
    expect(() => sfx('click')).not.toThrow()
  })

  it('muted=true iken sfx() çağrısı hata vermez', async () => {
    const { useAudioStore } = await import('@/store/audioStore')
    vi.mocked(useAudioStore.getState).mockReturnValueOnce({
      masterVolume: 0.8, sfxVolume: 0.8, musicVolume: 0.5, muted: true,
    } as ReturnType<typeof useAudioStore.getState>)
    expect(() => sfx('click')).not.toThrow()
  })

  it('stopMusic() çalışan müzik yoksa hata vermez', () => {
    expect(() => stopMusic()).not.toThrow()
  })

  it('initSounds() Sound.from hata verirse çökmez', async () => {
    const { Sound } = await import('@pixi/sound')
    vi.mocked(Sound.from).mockImplementationOnce(() => {
      throw new Error('ses dosyası yok')
    })
    await expect(initSounds()).resolves.not.toThrow()
  })
})
