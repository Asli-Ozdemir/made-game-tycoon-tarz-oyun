// src/audio/soundService.ts
import { Sound } from '@pixi/sound'
import { useAudioStore } from '@/store/audioStore'

let _initialized = false

type SfxName = 'click' | 'confirm' | 'project_start' | 'sleep' | 'objective' | 'publish' | 'error' | 'npc'
type MusicName = 'menu' | 'coast'

const SFX_URLS: Record<SfxName, string> = {
  click:         'audio/sfx/click.mp3',
  confirm:       'audio/sfx/confirm.mp3',
  project_start: 'audio/sfx/project_start.mp3',
  sleep:         'audio/sfx/sleep.mp3',
  objective:     'audio/sfx/objective.mp3',
  publish:       'audio/sfx/publish.mp3',
  error:         'audio/sfx/error.mp3',
  npc:           'audio/sfx/npc.mp3',
}

const MUSIC_URLS: Record<MusicName, string> = {
  menu:  'audio/music/menu.mp3',
  coast: 'audio/music/coast.mp3',
}

const sfxSounds = new Map<SfxName, Sound>()
const musicSounds = new Map<MusicName, Sound>()
let currentMusic: Sound | null = null
let currentMusicName: MusicName | null = null
let musicFadeRafId: number | null = null

async function tryLoad(url: string): Promise<Sound | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
  const load = new Promise<Sound | null>((resolve) => {
    try {
      Sound.from({
        url,
        preload: true,
        loaded: (err, snd) => resolve(err ? null : (snd ?? null)),
      })
    } catch {
      resolve(null)
    }
  })
  return Promise.race([load, timeout])
}

export async function initSounds(): Promise<void> {
  if (_initialized) return
  _initialized = true

  const tasks = [
    ...Object.entries(SFX_URLS).map(async ([name, url]) => {
      const s = await tryLoad(url)
      if (s) sfxSounds.set(name as SfxName, s)
    }),
    ...Object.entries(MUSIC_URLS).map(async ([name, url]) => {
      const s = await tryLoad(url)
      if (s) {
        s.loop = true
        musicSounds.set(name as MusicName, s)
      }
    }),
  ]
  await Promise.allSettled(tasks)

  useAudioStore.subscribe((state) => {
    if (currentMusic) {
      currentMusic.volume = state.muted ? 0 : state.musicVolume * state.masterVolume
    }
  })
}

export function sfx(name: SfxName): void {
  const { muted, sfxVolume, masterVolume } = useAudioStore.getState()
  if (muted) return
  const s = sfxSounds.get(name)
  if (!s) return
  try {
    s.volume = sfxVolume * masterVolume
    s.play()
  } catch {}
}

function cancelFade() {
  if (musicFadeRafId !== null) {
    cancelAnimationFrame(musicFadeRafId)
    musicFadeRafId = null
  }
}

function fadeTo(sound: Sound, targetVol: number, durationMs: number, onDone?: () => void) {
  cancelFade()
  const startVol = sound.volume
  const startTime = performance.now()
  function tick() {
    const elapsed = performance.now() - startTime
    const t = Math.min(1, elapsed / durationMs)
    sound.volume = startVol + (targetVol - startVol) * t
    if (t < 1) {
      musicFadeRafId = requestAnimationFrame(tick)
    } else {
      musicFadeRafId = null
      onDone?.()
    }
  }
  musicFadeRafId = requestAnimationFrame(tick)
}

export function playMusic(name: MusicName, options?: { fade?: number }): void {
  const { muted, musicVolume, masterVolume } = useAudioStore.getState()
  if (currentMusicName === name) return
  const fadeDuration = options?.fade ?? 800
  const targetVol = muted ? 0 : musicVolume * masterVolume

  function startNew() {
    const s = musicSounds.get(name)
    if (!s) return
    currentMusic = s
    currentMusicName = name
    s.volume = 0
    try { s.play() } catch {}
    fadeTo(s, targetVol, fadeDuration)
  }

  if (currentMusic && !currentMusic.paused) {
    const old = currentMusic
    fadeTo(old, 0, fadeDuration / 2, () => {
      try { old.stop() } catch {}
      if (currentMusic === old) {
        currentMusic = null
        currentMusicName = null
      }
      startNew()
    })
  } else {
    startNew()
  }
}

export function stopMusic(options?: { fade?: number }): void {
  if (!currentMusic) return
  const fadeDuration = options?.fade ?? 800
  const s = currentMusic
  fadeTo(s, 0, fadeDuration, () => {
    try { s.stop() } catch {}
    if (currentMusic === s) {
      currentMusic = null
      currentMusicName = null
    }
  })
}
