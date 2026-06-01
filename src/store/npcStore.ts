// src/store/npcStore.ts
import { create } from 'zustand'
import { NPC_DEFS, type Dialogue } from '@/data/npcDialogues'

interface NPCState {
  relationship: number
  seenDialogueIds: string[]
}

interface NPCStore {
  npcs: Record<string, NPCState>
  getRelationship: (npcId: string) => number
  getTier: (npcId: string) => 1 | 2 | 3
  hasSeenDialogue: (npcId: string, dialogueId: string) => boolean
  completeDialogue: (npcId: string, dialogueId: string, bonus: number) => void
  getAvailableDialogues: (npcId: string) => Dialogue[]
}

function initNpcs(): Record<string, NPCState> {
  const result: Record<string, NPCState> = {}
  for (const id of Object.keys(NPC_DEFS)) {
    result[id] = { relationship: 0, seenDialogueIds: [] }
  }
  return result
}

export const useNPCStore = create<NPCStore>((set, get) => ({
  npcs: initNpcs(),

  getRelationship(npcId) {
    return get().npcs[npcId]?.relationship ?? 0
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
      return {
        npcs: {
          ...s.npcs,
          [npcId]: {
            relationship: Math.min(100, prev.relationship + (alreadySeen ? 0 : bonus)),
            seenDialogueIds: alreadySeen
              ? prev.seenDialogueIds
              : [...prev.seenDialogueIds, dialogueId],
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
