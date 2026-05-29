import { SEASONS } from '@/types'
import type { GameDate } from '@/types'

export function advanceWeek(date: GameDate): GameDate {
  if (date.week < 4) {
    return { ...date, week: date.week + 1 }
  }
  const seasonIndex = SEASONS.indexOf(date.season)
  if (seasonIndex < 3) {
    return { year: date.year, season: SEASONS[seasonIndex + 1], week: 1 }
  }
  return { year: date.year + 1, season: 'ilkbahar', week: 1 }
}

export function dateToString(date: GameDate): string {
  const labels: Record<string, string> = {
    ilkbahar: 'İlkbahar', yaz: 'Yaz', sonbahar: 'Sonbahar', kis: 'Kış'
  }
  return `${labels[date.season]} ${date.year} — Hafta ${date.week}`
}

export function totalWeeks(from: GameDate, to: GameDate): number {
  const toIndex = (d: GameDate) =>
    d.year * 16 + SEASONS.indexOf(d.season) * 4 + (d.week - 1)
  return toIndex(to) - toIndex(from)
}
