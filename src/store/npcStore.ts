// src/store/npcStore.ts
import { create } from 'zustand'
import { NPC_DEFS, type Dialogue } from '@/data/npcDialogues'
import { getSkillBonuses } from '@/engine/skillEffectEngine'

interface NPCState {
  relationship: number
  seenDialogueIds: string[]
}

interface NPCStore {
  npcs: Record<string, NPCState>
  gainMultipliers: Record<string, number>
  relationshipCaps: Record<string, number>
  getRelationship: (npcId: string) => number
  getRelationshipCap: (npcId: string) => number
  getTier: (npcId: string) => 1 | 2 | 3
  hasSeenDialogue: (npcId: string, dialogueId: string) => boolean
  completeDialogue: (npcId: string, dialogueId: string, bonus: number) => void
  penalizeNpc: (npcId: string) => void
  capRelationship: (npcId: string, max: number) => void
  adjustRelationship: (npcId: string, delta: number) => void
  getAvailableDialogues: (npcId: string) => Dialogue[]
}

function initNpcs(): Record<string, NPCState> {
  const result: Record<string, NPCState> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = { relationship: 0, seenDialogueIds: [] }
  }
  return result
}

function initMultipliers(): Record<string, number> {
  const result: Record<string, number> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = 1.0
  }
  return result
}

export const useNPCStore = create<NPCStore>((set, get) => ({
  npcs: initNpcs(),
  gainMultipliers: initMultipliers(),
  relationshipCaps: {},

  getRelationship(npcId) {
    return get().npcs[npcId]?.relationship ?? 0
  },

  getRelationshipCap(npcId) {
    return get().relationshipCaps[npcId] ?? 100
  },

  getTier(npcId) {
    const rel = get().getRelationship(npcId)
    const def = NPC_DEFS[npcId]
    if (!def) return 1
    if (rel >= def.tier3Threshold) return 3
    if (rel >= def.tier2Threshold) return 2
    return 1
  },

  hasSeenDialogue(npcId, dialogueId) {
    return get().npcs[npcId]?.seenDialogueIds.includes(dialogueId) ?? false
  },

  completeDialogue(npcId, dialogueId, bonus) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      const alreadySeen = prev.seenDialogueIds.includes(dialogueId)
      const multiplier = s.gainMultipliers[npcId] ?? 1.0
      const skillMult  = getSkillBonuses().relationshipGainMult
      const effectiveBonus = alreadySeen ? 0 : bonus * multiplier * skillMult
      const newMultiplier = alreadySeen ? multiplier : Math.min(1.0, multiplier + 0.05)
      const cap = s.relationshipCaps[npcId] ?? 100

      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            relationship: Math.min(cap, prev.relationship + effectiveBonus),
            seenDialogueIds: alreadySeen
              ? prev.seenDialogueIds
              : [...prev.seenDialogueIds, dialogueId],
          },
        },
        gainMultipliers: {
          ...s.gainMultipliers,
          [npcId]: newMultiplier,
        },
      }
    })
  },

  penalizeNpc(npcId) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            ...prev,
            relationship: Math.max(0, prev.relationship - 20),
          },
        },
        gainMultipliers: {
          ...s.gainMultipliers,
          [npcId]: 0.5,
        },
      }
    })
  },

  capRelationship(npcId, max) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      return {
        relationshipCaps: { ...s.relationshipCaps, [npcId]: max },
        npcs: {
          ...s.npcs,
          [npcId]: { ...prev, relationship: Math.min(prev.relationship, max) },
        },
      }
    })
  },

  adjustRelationship(npcId, delta) {
    set((s) => {
      const prev = s.npcs[npcId] ?? { relationship: 0, seenDialogueIds: [] }
      const cap = s.relationshipCaps[npcId] ?? 100
      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            ...prev,
            relationship: Math.max(0, Math.min(cap, prev.relationship + delta)),
          },
        },
      }
    })
  },

  getAvailableDialogues(npcId) {
    const def = NPC_DEFS[npcId]
    if (!def) return []
    const tier = get().getTier(npcId)
    return def.dialogues.filter((d) => d.tier <= tier)
  },
}))
