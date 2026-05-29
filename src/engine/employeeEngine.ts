import { FIRST_NAMES, LAST_NAMES, LIFE_EVENT_DESCRIPTIONS } from '@/data/employeeNames'
import { SKILL_CAPS } from '@/data/courses'
import type { Employee, EmployeePersonality, LifeEvent, LifeEventType, SkillKey } from '@/types/employee'

const PERSONALITIES: EmployeePersonality[] = ['odakli', 'yaratici', 'sosyal', 'rekabetci', 'sakin']

const ALL_SKILLS: SkillKey[] = ['programming', 'design', 'sound', 'management']

const TRAIT_FOR_SKILL: Record<SkillKey, string> = {
  programming: 'kod_ustasi',
  design:      'gorsel_deha',
  sound:       'ses_buyucusu',
  management:  'ekip_lideri',
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function randInt(r: number, min: number, max: number): number {
  return Math.floor(r * (max - min + 1)) + min
}

export function generateCandidates(seed: number, count: number = 4): Employee[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (offset: number) => seededRandom(seed + i * 100 + offset)
    const firstName = FIRST_NAMES[Math.floor(r(1) * FIRST_NAMES.length)]
    const lastName  = LAST_NAMES[Math.floor(r(2) * LAST_NAMES.length)]
    const skills = {
      programming: randInt(r(4), 1, 10),
      design:      randInt(r(5), 1, 10),
      sound:       randInt(r(6), 1, 10),
      management:  randInt(r(7), 1, 10),
    }
    const avgSkill = (skills.programming + skills.design + skills.sound) / 3
    return {
      id: `candidate-${seed}-${i}`,
      name: `${firstName} ${lastName}`,
      skills,
      salary: Math.round(avgSkill * 200) + 500,
      loyalty: 80,
      energy: 100,
      personality: PERSONALITIES[Math.floor(r(3) * PERSONALITIES.length)],
      assignedProjectId: null,
      xp: { programming: 0, design: 0, sound: 0, management: 0 },
      activeCourseId: null,
      traits: [],
    }
  })
}

export function computeProjectBonus(assignedEmployees: Employee[]): number {
  return assignedEmployees.reduce((sum, emp) => {
    const tm = (skill: SkillKey) =>
      emp.traits.includes(TRAIT_FOR_SKILL[skill]) ? 1.5 : 1.0
    const prog   = emp.skills.programming * tm('programming')
    const design = emp.skills.design      * tm('design')
    const sound  = emp.skills.sound       * tm('sound')
    const skillAvg = (prog + design + sound) / 3
    return sum + (skillAvg / 10) * 2 * (emp.energy / 100)
  }, 0)
}

const LIFE_EVENT_TYPES: LifeEventType[] = ['hasta', 'rakip_teklif', 'kisisel_kriz', 'dogum_gunu']

const LIFE_EVENT_DELTAS: Record<LifeEventType, { loyalty: number; energy: number }> = {
  hasta:        { loyalty:   0, energy: -60 },
  rakip_teklif: { loyalty: -20, energy:   0 },
  kisisel_kriz: { loyalty: -10, energy: -30 },
  dogum_gunu:   { loyalty: +15, energy: +20 },
}

export function rollLifeEvents(employees: Employee[], seed: number): LifeEvent[] {
  const events: LifeEvent[] = []
  employees.forEach((emp, i) => {
    const chance = seededRandom(seed + i * 17 + 3)
    if (chance > 0.10) return  // ~10% chance per employee per week

    const typeRoll = seededRandom(seed + i * 17 + 7)
    const type = LIFE_EVENT_TYPES[Math.floor(typeRoll * LIFE_EVENT_TYPES.length)]
    const d = LIFE_EVENT_DELTAS[type]
    const newLoyalty = Math.max(0, emp.loyalty + d.loyalty)

    events.push({
      id: `event-${seed}-${i}`,
      type,
      employeeId: emp.id,
      employeeName: emp.name,
      description: LIFE_EVENT_DESCRIPTIONS[type](emp.name),
      loyaltyDelta: d.loyalty,
      energyDelta: d.energy,
      quitsJob: type === 'rakip_teklif' && newLoyalty <= 0,
    })
  })
  return events
}

export function tickEmployeeXp(
  employee: Employee,
  caps: Record<SkillKey, number>
): Record<SkillKey, number> {
  if (!employee.assignedProjectId) return { ...employee.xp }
  const dominantSkill = ALL_SKILLS.reduce<SkillKey>((best, s) =>
    employee.skills[s] > employee.skills[best] ? s : best,
    ALL_SKILLS[0]
  )
  const newXp = { ...employee.xp }
  for (const skill of ALL_SKILLS) {
    if (employee.skills[skill] >= caps[skill]) continue
    newXp[skill] += skill === dominantSkill ? 2 : 1
  }
  return newXp
}

export function applyXpGains(
  employee: Employee,
  newXp: Record<SkillKey, number>,
  caps: Record<SkillKey, number>
): { updatedEmployee: Employee; leveledSkills: SkillKey[] } {
  const updatedSkills = { ...employee.skills }
  const updatedXp = { ...newXp }
  const leveledSkills: SkillKey[] = []
  for (const skill of ALL_SKILLS) {
    while (
      updatedXp[skill] >= updatedSkills[skill] * 10 &&
      updatedSkills[skill] < caps[skill]
    ) {
      updatedXp[skill] -= updatedSkills[skill] * 10
      updatedSkills[skill] += 1
      leveledSkills.push(skill)
    }
  }
  return {
    updatedEmployee: { ...employee, skills: updatedSkills, xp: updatedXp },
    leveledSkills,
  }
}
