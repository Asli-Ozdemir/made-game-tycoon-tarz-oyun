import { create } from 'zustand'
import { tickProject, isProjectComplete } from '@/engine/projectEngine'
import { computeProjectBonus } from '@/engine/employeeEngine'
import { getSkillBonuses } from '@/engine/skillEffectEngine'
import { useEmployeeStore } from '@/store/employeeStore'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useMarketStore } from '@/store/marketStore'
import { useNewsStore } from '@/store/newsStore'
import { generateMediaReactions } from '@/engine/mediaReactionEngine'
import { VERDICT, scoreToBand } from '@/data/mediaOutlets'
import { useInterviewStore } from '@/store/interviewStore'
import type { GameProject, PublishResult, ProjectScope } from '@/types'
import { SEASONS } from '@/types'
import { applyFocus, axesTotal, EMPTY_AXES, type FocusAxis } from '@/engine/qualityAxes'

interface ProjectStoreState {
  projects: GameProject[]
  addProject: (project: GameProject) => void
  tickAllProjects: () => GameProject[]
  publishProject: (id: string, result: PublishResult) => void
  cancelProject:          (id: string) => void
  updateProjectPrice:     (id: string, newPrice: number) => void
  joinSaleEvent:          (id: string, discountPct: number) => void
  leaveSaleEvent:         (id: string) => void
  clearSaleParticipation: () => void
  applyEventEffect: (qualityBonus: number, weekDelay: number) => void
  applyFollowUpEffect: (parentId: string, contentType: 'dlc' | 'guncelleme', scope: ProjectScope) => void
  setFeaturedUntilTick: (projectId: string, tick: number) => void
  setExclusivePlatform: (projectId: string, platformId: string) => void
  pendingCarryQuality: number
  advanceWeeks:     (id: string, weeks: number) => void
  applyFocusAxis:   (id: string, focus: FocusAxis) => void
  applySparkQuality:(id: string, amount: number) => void
  applyBugPenalty:  (id: string, amount: number) => void
  setPendingCarry:  (amount: number) => void
  reset: () => void
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  pendingCarryQuality: 0,

  addProject: (project) =>
    set((s) => {
      const carry = s.pendingCarryQuality
      const withCarry = carry > 0
        ? { ...project, qualityPoints: project.qualityPoints + carry }
        : project
      return { projects: [...s.projects, withCarry], pendingCarryQuality: 0 }
    }),

  tickAllProjects: () => {
    const completed: GameProject[] = []
    set((s) => {
      const employees = useEmployeeStore.getState().employees
      const updated = s.projects.map((p) => {
        if (p.status !== 'gelistirme') return p
        const assignedEmps = employees.filter((e) => e.assignedProjectId === p.id)
        const bonus = computeProjectBonus(assignedEmps)
        const qualityMult = getSkillBonuses().qualityMultForGenre(p.genreId)
        const next = tickProject(p, bonus, qualityMult)
        if (isProjectComplete(next)) completed.push(next)
        return next
      })
      return { projects: updated }
    })
    return completed
  },

  publishProject: (id, result) => {
    const tickCount = useTimeStore.getState().tickCount
    const date = useTimeStore.getState().date
    const target = get().projects.find((p) => p.id === id)
    const media = target ? generateMediaReactions(result, target, {}) : undefined
    const resultWithMedia = { ...result, media }
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'yayinlandi',
              publishResult: resultWithMedia,
              publishTickCount: tickCount,
              publishYear: date.year,
              publishScore: result.score,
            }
          : p
      ),
    }))
    const project = get().projects.find((p) => p.id === id)
    if (project) {
      const seasonIdx = SEASONS.indexOf(date.season)
      useNewsStore.getState().addItem({
        type: 'player_mention',
        rivalId: null,
        text: `"${project.name}" yayında — ${VERDICT[scoreToBand(result.score)]} (Metaskor ${result.score})`,
        year: date.year,
        season: seasonIdx,
      })
    }
    if (project?.platformId) {
      useMarketStore.getState().applyReactiveDelta(project.platformId, -3)
    }
    if (project?.contentType === 'dlc') {
      get().applyFollowUpEffect(project.parentProjectId, 'dlc', project.scope)
    } else if (project?.contentType === 'guncelleme') {
      get().applyFollowUpEffect(project.parentProjectId, 'guncelleme', project.scope)
      useGameStore.getState().gainReputation(3)
    }
    // Röportaj roll'u (bazen) — yayın başına deterministik rastgele
    if (project) {
      const publishCount = useGameStore.getState().totalPublished
      const rnd = Math.abs(Math.sin(tickCount * 12.9898) * 43758.5453) % 1
      useInterviewStore.getState().rollInterview(scoreToBand(result.score), publishCount, result.revenue, rnd)
    }
  },

  cancelProject: (id) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, status: 'iptal' }
          : p
      ),
    })),

  updateProjectPrice: (id, newPrice) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== id || p.status !== 'yayinlandi') return p
        if (newPrice >= p.price) return p  // sadece düşürebilir
        return { ...p, price: newPrice }
      }),
    })),

  joinSaleEvent: (id, discountPct) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'yayinlandi'
          ? { ...p, isOnSale: true, discountPct }
          : p
      ),
    })),

  leaveSaleEvent: (id) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'yayinlandi'
          ? { ...p, isOnSale: false, discountPct: null }
          : p
      ),
    })),

  clearSaleParticipation: () =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.isOnSale ? { ...p, isOnSale: false, discountPct: null } : p
      ),
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

  setFeaturedUntilTick: (projectId, tick) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, featuredUntilTick: tick } : p
    ),
  })),

  setExclusivePlatform: (projectId, platformId) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, exclusivePlatformId: platformId } : p
    ),
  })),

  advanceWeeks: (id, weeks) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, weeksElapsed: Math.min(p.totalWeeks, p.weeksElapsed + weeks) }
          : p
      ),
    })),

  applyFocusAxis: (id, focus) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== id || p.status !== 'gelistirme') return p
        const before = p.axes ?? EMPTY_AXES
        const after  = applyFocus(before, focus)
        const delta  = axesTotal(after) - axesTotal(before)
        return { ...p, axes: after, qualityPoints: Math.max(0, p.qualityPoints + delta) }
      }),
    })),

  applySparkQuality: (id, amount) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, qualityPoints: p.qualityPoints + amount }
          : p
      ),
    })),

  applyBugPenalty: (id, amount) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id && p.status === 'gelistirme'
          ? { ...p, qualityPoints: Math.max(0, p.qualityPoints - amount) }
          : p
      ),
    })),

  setPendingCarry: (amount) => set({ pendingCarryQuality: amount }),

  reset: () => set({ projects: [] }),
}))
