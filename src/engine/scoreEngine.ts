import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import type { GameDate, GameProject, PublishResult } from '@/types'

interface ScoreOptions {
  reputation: number
  publishDate: GameDate
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function calculatePublishResult(
  project: GameProject,
  opts: ScoreOptions
): PublishResult {
  const topic    = TOPICS[project.topicId]
  const genre    = GENRES[project.genreId]
  const platform = PLATFORMS[project.platformId]

  const affinityBonus = topic?.genreAffinity.includes(project.genreId) ? 20 : 0
  const maxQuality    = project.totalWeeks * 6
  const qualityBonus  = clamp(Math.round((project.qualityPoints / maxQuality) * 20), 0, 20)
  const repBonus      = Math.round(opts.reputation / 10)
  const variance      = Math.round((seededRandom(project.id.charCodeAt(0)) * 20) - 10)

  const score = clamp(50 + affinityBonus + qualityBonus + repBonus + variance, 1, 100)

  const baseSales      = genre?.baseSales ?? 500
  const salesMultiplier = platform?.salesMultiplier ?? 1.0
  const sales = Math.round(baseSales * salesMultiplier * (score / 50) * (1 + opts.reputation / 100))

  const pricePerUnit = platform?.pricePerUnit ?? 20
  const revenue      = sales * pricePerUnit

  return { score, sales, revenue, publishDate: opts.publishDate }
}
