import { nanoid } from 'nanoid'
import { SCOPE_CONFIG } from '@/data/topics'
import type { GameDate, GameProject, ProjectScope } from '@/types'
import { EMPTY_AXES } from '@/engine/qualityAxes'

type CreateProjectParams = {
  name: string
  genreId: string
  topicId: string
  platformId: string
  scope: ProjectScope
  startDate: GameDate
} & (
  | { contentType?: 'standalone' }
  | { contentType: 'sequel'; parentProjectId: string; fanBaseMultiplier: number }
  | { contentType: 'dlc'; parentProjectId: string; priceOverride: number }
  | { contentType: 'guncelleme'; parentProjectId: string }
)

export function createProject(params: CreateProjectParams): GameProject {
  const cfg = SCOPE_CONFIG[params.scope]
  const base = {
    id: nanoid(),
    name: params.name,
    genreId: params.genreId,
    topicId: params.topicId,
    platformId: params.platformId,
    scope: params.scope,
    startDate: params.startDate,
    totalWeeks: cfg.weeks,
    weeksElapsed: 0,
    qualityPoints: 0,
    axes: { ...EMPTY_AXES },
    status: 'gelistirme' as const,
    price: 0,
    discountPct: null,
    isOnSale: false,
    publishTickCount: null,
    featuredUntilTick:   null,
    exclusivePlatformId: null,
  }
  if (params.contentType === 'sequel') {
    return { ...base, contentType: 'sequel', parentProjectId: params.parentProjectId, fanBaseMultiplier: params.fanBaseMultiplier }
  }
  if (params.contentType === 'dlc') {
    return { ...base, contentType: 'dlc', parentProjectId: params.parentProjectId, priceOverride: params.priceOverride }
  }
  if (params.contentType === 'guncelleme') {
    return { ...base, contentType: 'guncelleme', parentProjectId: params.parentProjectId }
  }
  return { ...base, contentType: 'standalone' }
}

export function tickProject(
  project: GameProject,
  employeeBonus: number = 0,
  qualityMult: number = 1.0,
): GameProject {
  if (project.status !== 'gelistirme') return project
  const cfg = SCOPE_CONFIG[project.scope]
  return {
    ...project,
    weeksElapsed: project.weeksElapsed + 1,
    qualityPoints: project.qualityPoints + (cfg.qualityPerWeek + employeeBonus) * qualityMult,
  }
}

export function isProjectComplete(project: GameProject): boolean {
  return project.weeksElapsed >= project.totalWeeks
}
