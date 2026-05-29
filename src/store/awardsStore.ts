// src/store/awardsStore.ts
import { create } from 'zustand'
import { useRivalStore } from '@/store/rivalStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useCharacterStore } from '@/store/characterStore'
import type { AwardsEvent, AwardsNominee } from '@/types/rival'
import type { CutsceneId } from '@/types/cutscene'

// characterStore.background → awards_win cutscene ID mapping
const BG_TO_CUTSCENE: Record<string, CutsceneId> = {
  kk_uzmani:          'awards_win',
  bas_muhendis:       'awards_win',
  yaratici_direktor:  'awards_win_gallery',
  yapimci:            'awards_win_boardroom',
  eski_ceo:           'awards_win_boardroom',
}

interface AwardsStore {
  history:      AwardsEvent[]
  pendingEvent: AwardsEvent | null

  checkAwards: (
    year: number,
    playerBestGame: { name: string; score: number } | null
  ) => void
  clearPending: () => void
  reset:        () => void
}

export const useAwardsStore = create<AwardsStore>((set) => ({
  history:      [],
  pendingEvent: null,

  checkAwards: (year, playerBestGame) => {
    const rivals = useRivalStore.getState().rivals

    // O yıl rakiplerin çıkardığı oyunları topla
    const nominees: AwardsNominee[] = []

    for (const rival of rivals) {
      const yearGames = rival.games.filter(g => g.releasedYear === year)
      if (yearGames.length === 0) continue
      const best = yearGames.reduce((a, b) => a.score > b.score ? a : b)
      nominees.push({ name: best.title, studio: rival.name, score: best.score, isPlayer: false })
    }

    // Oyuncunun oyununu ekle
    if (playerBestGame) {
      nominees.push({
        name: playerBestGame.name,
        studio: useCharacterStore.getState().studioName || 'Stüdyon',
        score: playerBestGame.score,
        isPlayer: true,
      })
    }

    if (nominees.length === 0) return

    // Sırala, en iyi 3 aday
    const sorted = [...nominees].sort((a, b) => b.score - a.score)
    const topNominees = sorted.slice(0, 3)
    const winner = topNominees[0]

    // Kazananın rivalId'sini bul
    let winnerId = 'player'
    if (!winner.isPlayer) {
      const winnerRival = rivals.find(r => r.name === winner.studio)
      winnerId = winnerRival?.id ?? 'unknown'
    }

    const event: AwardsEvent = { year, nominees: topNominees, winnerId }

    set((s) => ({ history: [...s.history, event], pendingEvent: event }))

    // Cutscene tetikle
    if (winnerId === 'player') {
      const background = useCharacterStore.getState().background
      const cutsceneId = (background && BG_TO_CUTSCENE[background]) ?? 'awards_win'
      useCutsceneStore.getState().startCutsceneForce(cutsceneId)
    } else if (winnerId === 'nexus') {
      useCutsceneStore.getState().startCutsceneForce('awards_lose_to_nexus')
    }
  },

  clearPending: () => set({ pendingEvent: null }),

  reset: () => set({ history: [], pendingEvent: null }),
}))
