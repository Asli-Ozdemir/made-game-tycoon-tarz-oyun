import type { LifeStage } from '@/types/lifeEvent'

export const START_YEAR = 2000

export function ageFromBirthYear(birthYear: number, currentYear: number): number {
  return currentYear - birthYear
}

export function yearsElapsed(currentYear: number): number {
  return currentYear - START_YEAR
}

export function stageForAge(age: number): LifeStage {
  if (age <= 12) return 'cocuk'
  if (age <= 17) return 'ergen'
  if (age <= 29) return 'genc_yetiskin'
  if (age <= 59) return 'yetiskin'
  return 'yasli'
}
