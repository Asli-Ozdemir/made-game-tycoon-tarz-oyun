// src/store/lifePathStore.ts
import { create } from 'zustand'
import type { LifePath } from '@/data/skillTree'
import { PATH_THRESHOLD, PATH_NPC_MAP } from '@/data/lifePathData'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useNPCStore } from '@/store/npcStore'

interface LifePathStore {
  progress: Record<LifePath, number>
  activePathId: LifePath | null
  addProgress(path: LifePath, amount: number): void
  switchPath(newPath: LifePath): void
  reset(): void
}

export const useLifePathStore = create<LifePathStore>((set, get) => ({
  progress: { hirs: 0, huzur: 0, emek: 0 },
  activePathId: null,

  addProgress(path, amount) {
    const { activePathId, progress } = get()

    // Kilitli fazda sadece aktif yol birikim yapabilir
    if (activePathId !== null && activePathId !== path) return

    const newVal = Math.min(progress[path] + amount, PATH_THRESHOLD)
    set(s => ({ progress: { ...s.progress, [path]: newVal } }))

    // Threshold geçildi ve henüz kilitlenmemiş?
    if (newVal >= PATH_THRESHOLD && get().activePathId === null) {
      set({ activePathId: path })
      useSkillTreeStore.setState({ selectedLifePath: path })
    }
  },

  switchPath(newPath) {
    const { activePathId, progress } = get()
    if (!activePathId || activePathId === newPath) return

    // 1. T5 kilitlenir, yeni yol aktif
    useSkillTreeStore.setState({ selectedLifePath: newPath })

    // 2 + 3. Eski yolun NPC'lerini cezalandır
    const oldNpcs = PATH_NPC_MAP[activePathId]
    for (const npcId of oldNpcs) {
      useNPCStore.getState().penalizeNpc(npcId)
    }

    // 4. Eski yolun progressi düşer
    const penalizedProgress = Math.max(0, progress[activePathId] - 40)

    set(s => ({
      activePathId: newPath,
      progress: { ...s.progress, [activePathId]: penalizedProgress },
    }))
  },

  reset() {
    set({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
    useSkillTreeStore.setState({ selectedLifePath: null })
  },
}))
