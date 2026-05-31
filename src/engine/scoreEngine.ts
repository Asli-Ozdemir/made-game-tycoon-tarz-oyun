import { GENRES } from '@/data/genres'
import { PLATFORMS } from '@/data/platforms'
import { TOPICS } from '@/data/topics'
import type { GameDate, GameProject, PublishResult } from '@/types'
import { computeEffectivePrice, computeSalesMultiplier } from '@/engine/economyEngine'
import { computePlatformShareMultiplier } from '@/engine/marketEngine'
import { useTrendStore } from '@/store/trendStore'
import { useMarketStore } from '@/store/marketStore'
import { useTimeStore } from '@/store/timeStore'

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
  opts: ScoreOptions,
  playerSkillBonus: number = 0,
  parentProject?: GameProject & { publishResult: PublishResult }
): PublishResult {
  const topic    = TOPICS[project.topicId]
  const genre    = GENRES[project.genreId]
  const platform = PLATFORMS[project.platformId]

  const affinityBonus = topic?.genreAffinity.includes(project.genreId) ? 20 : 0
  const maxQuality    = project.totalWeeks * 6
  const qualityBonus  = clamp(Math.round((project.qualityPoints / maxQuality) * 20), 0, 20)
  const repBonus      = Math.round(opts.reputation / 10)
  const variance      = Math.round((seededRandom(project.id.charCodeAt(0)) * 20) - 10)

  // Sequel: kaynak oyun puanına göre skor bonusu
  let sequelScoreBonus = 0
  if (project.contentType === 'sequel' && parentProject?.publishResult) {
    const parentScore = parentProject.publishResult.score
    sequelScoreBonus = parentScore >= 85 ? 20 : parentScore >= 70 ? 10 : 0
  }

  const score = clamp(
    50 + affinityBonus + qualityBonus + repBonus + Math.round(playerSkillBonus) + sequelScoreBonus + variance,
    1, 100
  )

  // Güncelleme: her zaman sıfır satış ve gelir
  if (project.contentType === 'guncelleme') {
    return { score, sales: 0, revenue: 0, publishDate: opts.publishDate }
  }

  const baseSales         = genre?.baseSales ?? 500
  const trendMultiplier         = useTrendStore.getState().getMultiplier(project.genreId)
  const platformShare           = useMarketStore.getState().platforms[project.platformId]?.share ?? 50
  const platformShareMultiplier = computePlatformShareMultiplier(platformShare)

  const currentTick = useTimeStore.getState().tickCount

  // Featured placement bonusu
  const featuredMultiplier = (
    project.featuredUntilTick !== null &&
    currentTick <= project.featuredUntilTick
  ) ? 1.2 : 1.0

  // Exclusive deal bonusu
  const exclusiveMultiplier = project.exclusivePlatformId !== null ? 1.4 : 1.0

  // Platform fiyat indirimi bonusu
  const priceCut = useMarketStore.getState().priceCutActive
  const priceCutMultiplier = (
    priceCut !== null &&
    priceCut.platformId === project.platformId &&
    currentTick <= priceCut.untilTick
  ) ? 1.5 : 1.0

  const salesMultiplier   = platform?.salesMultiplier ?? 1.0
  const fanBaseMultiplier = project.contentType === 'sequel' ? project.fanBaseMultiplier : 1.0
  const sales = Math.round(
    baseSales
    * salesMultiplier
    * fanBaseMultiplier
    * trendMultiplier
    * platformShareMultiplier
    * featuredMultiplier
    * exclusiveMultiplier
    * priceCutMultiplier
    * (score / 50)
    * (1 + opts.reputation / 100)
  )

  const dlcOverride    = project.contentType === 'dlc' ? project.priceOverride : undefined
  const basePrice      = project.price > 0 ? project.price : (dlcOverride ?? platform?.pricePerUnit ?? 20)
  const pricePerUnit   = computeEffectivePrice(basePrice, project.discountPct ?? null)
  const salesAdjusted  = Math.round(sales * computeSalesMultiplier(project.discountPct ?? null))
  const revenue        = salesAdjusted * pricePerUnit

  return { score, sales: salesAdjusted, revenue, publishDate: opts.publishDate }
}
