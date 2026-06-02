// src/store/barStore.ts
import { create } from 'zustand'
import { BAR_SHIFTS } from '@/data/barShifts'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useLifePathStore } from '@/store/lifePathStore'
import type { BarShift, Incident } from '@/data/barShifts'

type IncidentOutcome = 'dialogue' | 'won_fight' | 'lost_fight' | null
type ShiftResult = { seeds: number; progress: number } | null

interface BarStore {
  activeShift: BarShift | null
  currentGuestIndex: number
  doorDecisions: Record<string, 'admit' | 'reject'>
  wrongDecisions: number
  activeIncident: Incident | null
  currentTensionStep: number
  tensionLevel: number
  incidentOutcome: IncidentOutcome
  fightActive: boolean
  playerHealth: number
  completedShifts: string[]

  startShift(shiftId: string): void
  makeGuestDecision(guestId: string, decision: 'admit' | 'reject'): void
  triggerIncident(incidentId: string): void
  chooseTensionOption(optionIndex: number): void
  endFight(playerWon: boolean): void
  endShift(): ShiftResult
  reset(): void
}

function calcReward(wrongDecisions: number, incidentOutcome: IncidentOutcome) {
  if (incidentOutcome === 'lost_fight' || wrongDecisions >= 3) {
    return { seeds: 1, progress: 3 }
  }
  if (incidentOutcome === 'won_fight' || wrongDecisions >= 1) {
    return { seeds: 2, progress: 8 }
  }
  return { seeds: 3, progress: 12 }
}

export const useBarStore = create<BarStore>((set, get) => ({
  activeShift: null,
  currentGuestIndex: 0,
  doorDecisions: {},
  wrongDecisions: 0,
  activeIncident: null,
  currentTensionStep: 0,
  tensionLevel: 50,
  incidentOutcome: null,
  fightActive: false,
  playerHealth: 3,
  completedShifts: [],

  startShift(shiftId) {
    if (get().activeShift !== null) return
    const found = BAR_SHIFTS.find(s => s.id === shiftId)
    if (!found) return
    set({
      activeShift: found,
      currentGuestIndex: 0,
      doorDecisions: {},
      wrongDecisions: 0,
      activeIncident: null,
      currentTensionStep: 0,
      tensionLevel: 50,
      incidentOutcome: null,
      fightActive: false,
      playerHealth: 3,
    })
  },

  makeGuestDecision(guestId, decision) {
    const { activeShift } = get()
    if (!activeShift) return
    const guest = activeShift.guests.find(g => g.id === guestId)
    if (!guest) return

    const shouldAdmit =
      guest.isVip ||
      (!guest.isBlacklisted && !guest.isDrunk && !guest.isDangerous && guest.meetsNightRule)
    const isWrong = (decision === 'admit') !== shouldAdmit

    set(s => ({
      doorDecisions: { ...s.doorDecisions, [guestId]: decision },
      wrongDecisions: isWrong ? s.wrongDecisions + 1 : s.wrongDecisions,
      currentGuestIndex: s.currentGuestIndex + 1,
    }))
  },

  triggerIncident(incidentId) {
    const { activeShift } = get()
    if (!activeShift) return
    const incident = activeShift.incidents.find(i => i.id === incidentId)
    if (!incident) return
    set({ activeIncident: incident, tensionLevel: 50, currentTensionStep: 0 })
  },

  chooseTensionOption(optionIndex) {
    const { activeIncident, tensionLevel, currentTensionStep } = get()
    if (!activeIncident) return
    const step = activeIncident.tensionSteps[currentTensionStep]
    if (!step) return
    const option = step.options[optionIndex]
    if (!option) return

    const newTension = Math.max(0, Math.min(100, tensionLevel + option.tensionDelta))

    if (newTension <= 0) {
      set({ tensionLevel: 0, activeIncident: null, incidentOutcome: 'dialogue' })
      return
    }

    if (newTension >= 100) {
      set({ tensionLevel: 100, fightActive: true, playerHealth: 3 })
      return
    }

    const nextStep = currentTensionStep + 1 < activeIncident.tensionSteps.length
      ? currentTensionStep + 1
      : currentTensionStep

    set({ tensionLevel: newTension, currentTensionStep: nextStep })
  },

  endFight(playerWon) {
    set({
      fightActive: false,
      incidentOutcome: playerWon ? 'won_fight' : 'lost_fight',
      activeIncident: null,
    })
  },

  endShift(): ShiftResult {
    const { activeShift, wrongDecisions, incidentOutcome } = get()
    if (!activeShift) return null

    const { seeds, progress } = calcReward(wrongDecisions, incidentOutcome)
    useIdeaSeedStore.getState().addSeed('kaos', seeds)
    useLifePathStore.getState().addProgress('emek', progress)

    set(s => ({
      completedShifts: [...s.completedShifts, activeShift.id],
      activeShift: null,
      currentGuestIndex: 0,
      doorDecisions: {},
      wrongDecisions: 0,
      activeIncident: null,
      currentTensionStep: 0,
      tensionLevel: 50,
      incidentOutcome: null,
      fightActive: false,
      playerHealth: 3,
    }))

    return { seeds, progress }
  },

  reset() {
    set({
      activeShift: null,
      currentGuestIndex: 0,
      doorDecisions: {},
      wrongDecisions: 0,
      activeIncident: null,
      currentTensionStep: 0,
      tensionLevel: 50,
      incidentOutcome: null,
      fightActive: false,
      playerHealth: 3,
      completedShifts: [],
    })
  },
}))
