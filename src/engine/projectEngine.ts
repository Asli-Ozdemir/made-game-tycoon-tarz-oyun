import { nanoid } from 'nanoid'
import { SCOPE_CONFIG } from '@/data/topics'
import type { GameDate, GameProject, ProjectScope } from '@/types'

interface CreateProjectParams {
  name: string
  genreId: string
  topicId: string
  platformId: string
  scope: ProjectScope
  startDate: GameDate
}

export function createProject(params: CreateProjectParams): GameProject {
  const cfg = SCOPE_CONFIG[params.scope]
  return {
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
    status: 'gelistirme'
  }
}

export function tickProject(project: GameProject): GameProject {
  if (project.status !== 'gelistirme') return project
  const cfg = SCOPE_CONFIG[project.scope]
  return {
    ...project,
    weeksElapsed: project.weeksElapsed + 1,
    qualityPoints: project.qualityPoints + cfg.qualityPerWeek
  }
}

export function isProjectComplete(project: GameProject): boolean {
  return project.weeksElapsed >= project.totalWeeks
}
