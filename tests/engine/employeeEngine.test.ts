import { describe, it, expect } from 'vitest'
import { generateCandidates, computeProjectBonus } from '@/engine/employeeEngine'
import type { Employee } from '@/types/employee'

const baseEmployee: Employee = {
  id: 'emp-1',
  name: 'Test Kişi',
  skills: { programming: 5, design: 5, sound: 5, management: 5 },
  salary: 2000,
  loyalty: 80,
  energy: 100,
  personality: 'odakli',
  assignedProjectId: null,
}

describe('generateCandidates', () => {
  it('verilen sayıda aday üretir', () => {
    const candidates = generateCandidates(42, 4)
    expect(candidates).toHaveLength(4)
  })

  it('her adayın gerekli alanları var', () => {
    const [c] = generateCandidates(42, 1)
    expect(c.id).toBeTruthy()
    expect(c.name).toContain(' ')
    expect(c.skills.programming).toBeGreaterThanOrEqual(1)
    expect(c.skills.programming).toBeLessThanOrEqual(10)
    expect(c.salary).toBeGreaterThan(0)
    expect(c.loyalty).toBe(80)
    expect(c.energy).toBe(100)
    expect(c.assignedProjectId).toBeNull()
  })

  it('aynı seed her zaman aynı adayları üretir', () => {
    const a = generateCandidates(99, 4)
    const b = generateCandidates(99, 4)
    expect(a[0].name).toBe(b[0].name)
    expect(a[0].skills.programming).toBe(b[0].skills.programming)
  })

  it('farklı seedler farklı adaylar üretir', () => {
    const a = generateCandidates(1, 4)
    const b = generateCandidates(2, 4)
    expect(a[0].name).not.toBe(b[0].name)
  })
})

describe('computeProjectBonus', () => {
  it('boş liste için 0 döner', () => {
    expect(computeProjectBonus([])).toBe(0)
  })

  it('tek çalışan için pozitif bonus döner', () => {
    const bonus = computeProjectBonus([baseEmployee])
    expect(bonus).toBeGreaterThan(0)
  })

  it('daha fazla çalışan daha yüksek bonus verir', () => {
    const one = computeProjectBonus([baseEmployee])
    const two = computeProjectBonus([baseEmployee, baseEmployee])
    expect(two).toBeGreaterThan(one)
  })

  it('düşük enerji bonusu azaltır', () => {
    const full  = computeProjectBonus([{ ...baseEmployee, energy: 100 }])
    const tired = computeProjectBonus([{ ...baseEmployee, energy: 50 }])
    expect(tired).toBeLessThan(full)
  })
})
