import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import { computeProjectBonus } from '@/engine/employeeEngine'
import { useEmployeeStore } from '@/store/employeeStore'
import type { GameProject, PublishResult } from '@/types'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]
  publishProject: (id: string, result: PublishResult) => void
  applyEventEffect: (qualityBonus: number, weekDelay: number) => void
  reset: () => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),
  tickAllProjects: () => {
    const completed: GameProject[] = []
    set((s) => {
      const employees = useEmployeeStore.getState().employees
      const updated = s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        const assignedEmps = employees.filter((e) => e.assignedProjectId === p.id)
        const bonus = computeProjectBonus(assignedEmps)
        const next = tickProject(p, bonus)
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
    })),
  applyEventEffect: (qualityBonus, weekDelay) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        return {
          ...p,
          qualityPoints: Math.max(0, p.qualityPoints + qualityBonus),
          totalWeeks: p.totalWeeks + weekDelay,
        }
      }),
    }))
  },
  reset: () => set({ projects: [] })
}))
