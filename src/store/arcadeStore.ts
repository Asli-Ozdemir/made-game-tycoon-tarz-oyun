// src/store/arcadeStore.ts
import { create } from 'zustand'
import { ARCADE_SHIFTS } from '@/data/arcadeShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { ArcadeShift } from '@/data/arcadeShifts'

export type ArcadePhase =
  | 'idle'
  | 'briefing'
  | 'shift'
  | 'retro_game'
  | 'machine_choice'
  | 'result'

export interface ArcadeSessionResult {
  gameHistorySeeds: number
  nostaljiSeeds:    number
  progress:         number
  tier:             'good' | 'okay' | 'bad'
}

interface ArcadeStoreState {
  completedShifts: string[]
  activeShift:     ArcadeShift | null
  phase:           ArcadePhase
  customerScore:   number          // 0–100, set by panel
  repairScore:     number          // 0–100, set by PixiJS scene
  retroWinner:     'player' | 'rex' | null
  machineChoice:   string | null

  startShift(id: string): void
  advanceFromBriefing(): void
  recordShiftResult(customerScore: number, repairScore: number): void
  recordRetroResult(winner: 'player' | 'rex'): void
  chooseMachine(machineId: string): void
  endShift(): ArcadeSessionResult | null
  reset(): void
}

function calcTier(customerScore: number, repairScore: number): 'good' | 'okay' | 'bad' {
  if (customerScore >= 70 && repairScore >= 70) return 'good'
  if (customerScore < 40 || repairScore < 40)   return 'bad'
  return 'okay'
}

function calcReward(
  tier: 'good' | 'okay' | 'bad',
  retroWinner: 'player' | 'rex' | null,
  isSession10: boolean,
): { gameHistory: number; nostalji: number; huzur: number } {
  let gameHistory: number
  let nostalji: number
  let huzur: number

  if (tier === 'good')      { gameHistory = 3; nostalji = 2; huzur = 5 }
  else if (tier === 'okay') { gameHistory = 2; nostalji = 1; huzur = 3 }
  else                      { gameHistory = 1; nostalji = 0; huzur = 1 }

  if (retroWinner === 'player') gameHistory += 1
  if (isSession10)              gameHistory += 5

  return { gameHistory, nostalji, huzur }
}

const INITIAL: Omit<ArcadeStoreState,
  'startShift' | 'advanceFromBriefing' | 'recordShiftResult' |
  'recordRetroResult' | 'chooseMachine' | 'endShift' | 'reset'
> = {
  completedShifts: [],
  activeShift:     null,
  phase:           'idle',
  customerScore:   0,
  repairScore:     0,
  retroWinner:     null,
  machineChoice:   null,
}

export const useArcadeStore = create<ArcadeStoreState>((set, get) => ({
  ...INITIAL,

  startShift(id) {
    if (get().activeShift !== null) return
    const found = ARCADE_SHIFTS.find(s => s.id === id)
    if (!found) return
    set({
      activeShift:   found,
      phase:         'briefing',
      customerScore: 0,
      repairScore:   0,
      retroWinner:   null,
      machineChoice: null,
    })
  },

  advanceFromBriefing() {
    if (get().phase !== 'briefing') return
    set({ phase: 'shift' })
  },

  recordShiftResult(customerScore, repairScore) {
    if (get().phase !== 'shift') return
    const { activeShift } = get()
    if (!activeShift) return
    const nextPhase: ArcadePhase = activeShift.isArcEnd ? 'retro_game' : 'result'
    set({ customerScore, repairScore, phase: nextPhase })
  },

  recordRetroResult(winner) {
    if (get().phase !== 'retro_game') return
    set({ retroWinner: winner, phase: 'machine_choice' })
  },

  chooseMachine(machineId) {
    if (get().phase !== 'machine_choice') return
    set({ machineChoice: machineId, phase: 'result' })
  },

  endShift() {
    const { activeShift, customerScore, repairScore, retroWinner } = get()
    if (get().phase !== 'result') return null
    if (!activeShift) return null

    const tier = calcTier(customerScore, repairScore)
    const isSession10 = activeShift.id === 'arcade_10'
    const { gameHistory, nostalji, huzur } = calcReward(tier, retroWinner, isSession10)

    useIdeaSeedStore.getState().addSeed('game_history', gameHistory)
    if (nostalji > 0) useIdeaSeedStore.getState().addSeed('nostalji', nostalji)
    useLifePathStore.getState().addProgress('huzur', huzur)

    const result: ArcadeSessionResult = {
      gameHistorySeeds: gameHistory,
      nostaljiSeeds:    nostalji,
      progress:         huzur,
      tier,
    }

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift:     null,
      phase:           'idle',
      customerScore:   0,
      repairScore:     0,
      retroWinner:     null,
      machineChoice:   null,
    }))

    return result
  },

  reset() {
    set({ ...INITIAL })
  },
}))
