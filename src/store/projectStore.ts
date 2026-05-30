import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import { computeProjectBonus } from '@/engine/employeeEngine'
import { useEmployeeStore } from '@/store/employeeStore'
import { useGameStore } from '@/store/gameStore'
import type { GameProject, PublishResult, ProjectScope } from '@/types'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]
  publishProject: (id: string, result: PublishResult) => void
  applyEventEffect: (qualityBonus: number, weekDelay: number) => void
  applyFollowUpEffect: (parentId: string, contentType: 'dlc' | 'guncelleme', scope: ProjectScope) => void
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

  publishProject: (id, result) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status: 'yayinlandi', publishResult: result } : p
      ),
    }))
    const project = get().projects.find(p => p.id === id)
    if (project?.contentType === 'dlc') {
      get().applyFollowUpEffect(project.parentProjectId, 'dlc', project.scope)
    } else if (project?.contentType === 'guncelleme') {
      get().applyFollowUpEffect(project.parentProjectId, 'guncelleme', project.scope)
      useGameStore.getState().gainReputation(3)
    }
  },

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

  applyFollowUpEffect: (parentId, contentType, scope) => {
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== parentId || p.status !== 'yayinlandi' || !p.publishResult) return p
        if (contentType === 'dlc') {
          return {
            ...p,
            publishResult: {
              ...p.publishResult,
              sales: Math.round(p.publishResult.sales * 1.2),
              revenue: Math.round(p.publishResult.revenue * 1.2),
            },
          }
        }
        // guncelleme
        const scoreBonus = scope === 'kucuk' ? 5 : scope === 'orta' ? 10 : 15
        return {
          ...p,
          publishResult: {
            ...p.publishResult,
            score: Math.min(100, p.publishResult.score + scoreBonus),
          },
        }
      }),
    }))
  },

  reset: () => set({ projects: [] }),
}))
