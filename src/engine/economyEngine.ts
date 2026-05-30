export interface CostBreakdown {
  rent:   number
  server: number
  tools:  number
  total:  number
}

export function computeWeeklyCosts(
  employeeCount: number,
  publishedProjects: Array<{ weeksPublished: number }>
): CostBreakdown {
  const rent   = 500 * employeeCount
  const server = publishedProjects.reduce(
    (sum, p) => sum + Math.max(50, 500 - p.weeksPublished * 10),
    0
  )
  const tools = 200 * employeeCount
  return { rent, server, tools, total: rent + server + tools }
}

export function computeEffectivePrice(
  price: number,
  discountPct: number | null
): number {
  if (discountPct === null) return price
  return price * (1 - discountPct)
}

export function computeSalesMultiplier(discountPct: number | null): number {
  if (discountPct === null) return 1.0
  if (discountPct === 0.25) return 1.5
  if (discountPct === 0.50) return 2.5
  if (discountPct === 0.75) return 4.0
  return 1.0
}
