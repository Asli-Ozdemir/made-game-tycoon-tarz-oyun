import type { RandomEvent, EventChoice } from '@/data/events'

export interface GameStateSnapshot {
  reputation:     number
  money:          number
  totalPublished: number
}

export function candidateEvents(
  catalog:          RandomEvent[],
  cooldowns:        Record<string, number>,
  lastCategoryYear: Record<string, number>,
  currentYear:      number,
  gameState:        GameStateSnapshot
): RandomEvent[] {
  return catalog.filter((event) => {
    // 1. Trigger koşulları
    const t = event.trigger
    if (t) {
      if (t.minReputation !== undefined && gameState.reputation < t.minReputation) return false
      if (t.maxReputation !== undefined && gameState.reputation > t.maxReputation) return false
      if (t.minMoney      !== undefined && gameState.money      < t.minMoney)      return false
      if (t.maxMoney      !== undefined && gameState.money      > t.maxMoney)      return false
      if (t.minPublished  !== undefined && gameState.totalPublished < t.minPublished) return false
    }
    // 2. Bireysel cooldown
    const lastTriggered = cooldowns[event.id]
    if (lastTriggered !== undefined && currentYear - lastTriggered < event.cooldownYears) return false
    // 3. Kategori cooldown
    if (lastCategoryYear[event.category] === currentYear) return false

    return true
  })
}

export function pickEvent(candidates: RandomEvent[]): RandomEvent | null {
  if (candidates.length === 0) return null
  const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0)
  let rand = Math.random() * totalWeight
  for (const event of candidates) {
    rand -= event.weight
    if (rand <= 0) return event
  }
  return candidates[candidates.length - 1]
}

export function isChoiceAvailable(
  condition: EventChoice['condition'],
  gameState: GameStateSnapshot
): boolean {
  if (!condition) return true
  if (condition.minMoney      !== undefined && gameState.money      < condition.minMoney)      return false
  if (condition.minReputation !== undefined && gameState.reputation < condition.minReputation) return false
  return true
}
