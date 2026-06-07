// src/store/audioStore.ts
import { create } from 'zustand'

interface AudioPrefs {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  muted: boolean
}

interface AudioStoreState extends AudioPrefs {
  setMasterVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setMusicVolume: (v: number) => void
  setMuted: (m: boolean) => void
  toggleMute: () => void
}

const PREF_KEY = 'audio-preferences'

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw) return JSON.parse(raw) as AudioPrefs
  } catch {}
  return { masterVolume: 0.8, sfxVolume: 0.8, musicVolume: 0.5, muted: false }
}

function savePrefs(s: AudioPrefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({
      masterVolume: s.masterVolume,
      sfxVolume: s.sfxVolume,
      musicVolume: s.musicVolume,
      muted: s.muted,
    }))
  } catch {}
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  ...loadPrefs(),
  setMasterVolume: (v) => { set({ masterVolume: v }); savePrefs({ ...get(), masterVolume: v }) },
  setSfxVolume:    (v) => { set({ sfxVolume: v });    savePrefs({ ...get(), sfxVolume: v }) },
  setMusicVolume:  (v) => { set({ musicVolume: v });  savePrefs({ ...get(), musicVolume: v }) },
  setMuted:        (m) => { set({ muted: m });         savePrefs({ ...get(), muted: m }) },
  toggleMute:      ()  => {
    const muted = !get().muted
    set({ muted })
    savePrefs({ ...get(), muted })
  },
}))
