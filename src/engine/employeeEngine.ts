import { FIRST_NAMES, LAST_NAMES } from '@/data/employeeNames'
import type { Employee, EmployeePersonality } from '@/types/employee'

const PERSONALITIES: EmployeePersonality[] = ['odakli', 'yaratici', 'sosyal', 'rekabetci', 'sakin']

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
    }
  })
}

export function computeProjectBonus(assignedEmployees: Employee[]): number {
  return assignedEmployees.reduce((sum, emp) => {
    const skillAvg = (emp.skills.programming + emp.skills.design + emp.skills.sound) / 3
    return sum + (skillAvg / 10) * 2 * (emp.energy / 100)
  }, 0)
}
