import { create } from 'zustand'
import { START_YEAR, ageFromBirthYear, stageForAge, yearsElapsed } from '@/engine/aging'
import { eventsForYear } from '@/engine/lifeEventEngine'
import { LIFE_EVENTS } from '@/data/lifeEvents'
import { getNpc } from '@/data/npcDialogues'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useNPCStore } from '@/store/npcStore'
import type { LifeEvent, LifeEffect, LifeCtx } from '@/types/lifeEvent'
import type { NPCDef } from '@/data/npcDialogues'

type Role = 'hireable' | 'romanceable'

interface LifeStore {
  lastProcessedYear: number
  firedEvents:       Set<string>
  flags:             Set<string>
  roles:             Record<string, Role[]>
  dialogueOverrides: Record<string, string>
  spawnedNpcs:       NPCDef[]
  retiredNpcs:       Set<string>

  advanceYear: (year: number, events?: LifeEvent[]) => void
  hasFlag:     (flag: string) => boolean
  hasRole:     (npcId: string, role: Role) => boolean
  reset:       () => void
}

function buildCtx(year: number, flags: Set<string>): LifeCtx {
  const ageOf = (npcId: string): number => {
    const def = getNpc(npcId)
    return def?.birthYear != null ? ageFromBirthYear(def.birthYear, year) : 0
  }
  return {
    year,
    yearsElapsed: yearsElapsed(year),
    getAge: ageOf,
    getStage: (npcId) => stageForAge(ageOf(npcId)),
    hasFlag: (f) => flags.has(f),
    heartOf: (npcId) => useNPCStore.getState().getRelationship(npcId),
  }
}

export const useLifeStore = create<LifeStore>((set, get) => {
  function applyEffect(effect: LifeEffect): void {
    switch (effect.kind) {
      case 'setFlag':
        set((s) => ({ flags: new Set(s.flags).add(effect.flag) }))
        break
      case 'unlockRole':
        set((s) => ({
          roles: { ...s.roles, [effect.npcId]: [...(s.roles[effect.npcId] ?? []), effect.role] },
        }))
        break
      case 'setDialogueNode':
        set((s) => ({ dialogueOverrides: { ...s.dialogueOverrides, [effect.npcId]: effect.node } }))
        break
      case 'cutscene':
        useCutsceneStore.getState().startCutsceneForce(effect.id)
        break
      case 'spawnNpc':
        set((s) => ({ spawnedNpcs: [...s.spawnedNpcs, effect.def] }))
        break
      case 'retireNpc':
        set((s) => ({ retiredNpcs: new Set(s.retiredNpcs).add(effect.npcId) }))
        break
    }
  }

  return {
    lastProcessedYear: START_YEAR,
    firedEvents:       new Set(),
    flags:             new Set(),
    roles:             {},
    dialogueOverrides: {},
    spawnedNpcs:       [],
    retiredNpcs:       new Set(),

    advanceYear: (year, events = LIFE_EVENTS) => {
      const from = get().lastProcessedYear
      if (year <= from) return
      for (let y = from + 1; y <= year; y++) {
        const ctx = buildCtx(y, get().flags)
        const due = eventsForYear(events, ctx, get().firedEvents)
        for (const e of due) {
          applyEffect(e.effect)
          set((s) => ({ firedEvents: new Set(s.firedEvents).add(e.id) }))
        }
      }
      set({ lastProcessedYear: year })
    },

    hasFlag: (flag) => get().flags.has(flag),
    hasRole: (npcId, role) => (get().roles[npcId] ?? []).includes(role),

    reset: () => set({
      lastProcessedYear: START_YEAR,
      firedEvents: new Set(), flags: new Set(), roles: {},
      dialogueOverrides: {}, spawnedNpcs: [], retiredNpcs: new Set(),
    }),
  }
})
