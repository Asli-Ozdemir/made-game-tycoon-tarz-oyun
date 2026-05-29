import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import type { GameProject, PublishResult } from '@/types'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]
  publishProject: (id: string, result: PublishResult) => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),
  tickAllProjects: () => {
    const completed: GameProject[] = []
    set((s) => {
      const updated = s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        const next = tickProject(p)
        if (isProjectComplete(next)) completed.push(next)
        return next
      })
      return { projects: updated }
    })
    return completed
  },
  publishProject: (id, result) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: 'yayinlandi', publishResult: result } : p
      )
    }))
}))
