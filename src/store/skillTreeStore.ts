import { create } from 'zustand'
import { SKILL_NODES } from '@/data/skillTree'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'

type NodeState = 'locked' | 'unlockable' | 'active'

interface SkillTreeStore {
  unlockedNodeIds: string[]
  selectedLifePath: 'hirs' | 'huzur' | 'emek' | null
  canUnlock: (id: string) => boolean
  unlockNode: (id: string) => void
  getNodeState: (id: string) => NodeState
  getActiveEffects: () => import('@/data/skillTree').SkillEffect[]
  reset: () => void
}

export const useSkillTreeStore = create<SkillTreeStore>((set, get) => ({
  unlockedNodeIds: [],
  selectedLifePath: null,

  canUnlock(id) {
    const node = SKILL_NODES.find(n => n.id === id)
    if (!node) return false
    const { unlockedNodeIds, selectedLifePath } = get()
    if (unlockedNodeIds.includes(id)) return false
    if (node.lifePathLock && node.lifePathLock !== selectedLifePath) return false
    if (!node.dependsOn.every(dep => unlockedNodeIds.includes(dep))) return false
    const seeds = useIdeaSeedStore.getState().seeds
    return node.cost.every(c => seeds[c.type] >= c.amount)
  },

  unlockNode(id) {
    if (!get().canUnlock(id)) return
    const node = SKILL_NODES.find(n => n.id === id)!
    for (const c of node.cost) {
      useIdeaSeedStore.getState().spendSeed(c.type, c.amount)
    }
    set(s => ({ unlockedNodeIds: [...s.unlockedNodeIds, id] }))
  },

  getNodeState(id): NodeState {
    const { unlockedNodeIds } = get()
    if (unlockedNodeIds.includes(id)) return 'active'
    if (get().canUnlock(id)) return 'unlockable'
    return 'locked'
  },

  getActiveEffects() {
    const { unlockedNodeIds } = get()
    return SKILL_NODES
      .filter(n => unlockedNodeIds.includes(n.id))
      .map(n => n.effect)
  },

  reset() {
    set({ unlockedNodeIds: [], selectedLifePath: null })
  },
}))
