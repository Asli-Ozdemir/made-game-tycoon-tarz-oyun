// src/engine/skillEffectEngine.ts
// Aggregates all active skill-tree effects into typed bonuses.
// Call getSkillBonuses() at engine integration points — it reads from the store
// synchronously, so it's safe to call inside Zustand actions.

import { useSkillTreeStore } from '@/store/skillTreeStore'

// Maps tycoon_bonus stat keys to genre IDs
const STAT_TO_GENRE: Partial<Record<string, string>> = {
  rpg_quality:    'rpg',
  sim_quality:    'simulasyon',
  action_quality: 'aksiyon',
  hikaye_quality: 'rpg',   // most narrative-heavy genre available
}

export interface SkillBonuses {
  /** Total quality multiplier for a given genre (1.0 = no bonus) */
  qualityMultForGenre(genreId: string): number
  /** Revenue multiplier (1.0 = no bonus) */
  incomeMult: number
  /** Fraction of total salary waived (0.0–0.5 capped) */
  salaryReduction: number
  /** Fraction by which weekly maintenance costs are reduced (0.0–0.5 capped) */
  crisisReduction: number
  /** Fraction by which crisis duration is shortened (0.0–0.75 capped) */
  crisisDurationReduction: number
  /** Additional flat reputation to add when a node unlocks */
  reputationBonus: number
  /** NPC relationship gain multiplier (1.0 = no bonus) */
  relationshipGainMult: number
}

export function getSkillBonuses(): SkillBonuses {
  const effects = useSkillTreeStore.getState().getActiveEffects()

  let allQualityAdd      = 0
  const genreQualityAdd: Record<string, number> = {}
  let incomeMult         = 1.0
  let salaryReduction    = 0
  let crisisReduction    = 0
  let crisisDurReduction = 0
  let reputationBonus    = 0
  let relationshipMult   = 1.0
  let bugQualityAdd      = 0  // bug_reduce treated as extra quality bonus

  for (const effect of effects) {
    switch (effect.type) {
      case 'tycoon_bonus':
        if (effect.stat === 'all_quality') {
          allQualityAdd += effect.value
        } else if (effect.stat === 'income_mult') {
          incomeMult += effect.value
        } else if (effect.stat === 'project_speed') {
          // project_speed increases effective qualityPerWeek — treated as quality add
          allQualityAdd += effect.value * 0.5
        } else {
          const genreId = STAT_TO_GENRE[effect.stat]
          if (genreId) {
            genreQualityAdd[genreId] = (genreQualityAdd[genreId] ?? 0) + effect.value
          }
        }
        break
      case 'project_bonus':
        genreQualityAdd[effect.genre] = (genreQualityAdd[effect.genre] ?? 0) + effect.value
        break
      case 'bug_reduce':
        bugQualityAdd += effect.value * 0.5  // half weight vs explicit quality bonuses
        break
      case 'salary_reduce':
        salaryReduction += effect.value
        break
      case 'crisis_reduce':
        crisisReduction += effect.value
        break
      case 'crisis_duration_reduce':
        crisisDurReduction += effect.value
        break
      case 'reputation_bonus':
        reputationBonus += effect.value
        break
      case 'relationship_gain':
        relationshipMult += effect.value
        break
      // social_unlock and starting_money are handled elsewhere
    }
  }

  const baseQualityAdd = allQualityAdd + bugQualityAdd

  return {
    qualityMultForGenre(genreId: string): number {
      return 1.0 + baseQualityAdd + (genreQualityAdd[genreId] ?? 0)
    },
    incomeMult,
    salaryReduction:         Math.min(salaryReduction,    0.50),
    crisisReduction:         Math.min(crisisReduction,    0.50),
    crisisDurationReduction: Math.min(crisisDurReduction, 0.75),
    reputationBonus,
    relationshipGainMult: relationshipMult,
  }
}
