// src/engine/mediaReactionEngine.ts
import type { GameProject, PublishResult, MediaReactions, OutletReview, YoutuberReaction } from '@/types'
import { scoreToBand, VERDICT, OUTLETS, YOUTUBERS, hashSeed, seededRandom } from '@/data/mediaOutlets'
import { OUTLET_QUOTES, YOUTUBER_QUOTES, SOCIAL_QUOTES, SOCIAL_VIRAL, SOCIAL_BOMB, fillTemplate } from '@/data/mediaQuotes'

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length]
}

export function generateMediaReactions(
  result: PublishResult,
  project: GameProject,
  ctx: { viral?: boolean; reviewBomb?: boolean } = {}
): MediaReactions {
  const band = scoreToBand(result.score)
  const d = result.publishDate
  const baseSeed = hashSeed(`${project.id}-${d.year}-${d.season}-${d.week}`)
  const vars = { oyun: project.name, tur: project.genreId }

  const reviews: OutletReview[] = OUTLETS.slice(0, 4).map((outlet, i) => {
    const delta = Math.round(seededRandom(baseSeed + i * 7 + 1) * 2) - 1   // -1..+1
    const outletScore = Math.max(0, Math.min(10, Math.round(result.score / 10) + delta))
    const quote = fillTemplate(pick(OUTLET_QUOTES[band], seededRandom(baseSeed + i * 7 + 2)), vars)
    return { outlet, score: outletScore, quote }
  })

  const youtubers: YoutuberReaction[] = YOUTUBERS.slice(0, 2).map((yt, i) => ({
    channel: yt.channel,
    viewsLabel: yt.viewsLabel,
    quote: fillTemplate(pick(YOUTUBER_QUOTES[band], seededRandom(baseSeed + i * 11 + 5)), vars),
  }))

  const socialPool = ctx.reviewBomb ? SOCIAL_BOMB : ctx.viral ? SOCIAL_VIRAL : SOCIAL_QUOTES[band]
  const social = [0, 1, 2].map((i) =>
    fillTemplate(pick(socialPool, seededRandom(baseSeed + i * 13 + 9)), vars)
  )

  return { metascore: result.score, verdict: VERDICT[band], reviews, youtubers, social }
}
