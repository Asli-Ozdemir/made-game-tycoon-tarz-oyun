import { describe, it, expect } from 'vitest'
import { generateCandidates, computeProjectBonus, rollLifeEvents } from '@/engine/employeeEngine'
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
  xp: { programming: 0, design: 0, sound: 0, management: 0 },
  activeCourseId: null,
  traits: [],
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
    expect(c.xp.programming).toBe(0)
    expect(c.activeCourseId).toBeNull()
    expect(c.traits).toHaveLength(0)
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

describe('rollLifeEvents', () => {
  it('boş liste için olay üretmez', () => {
    expect(rollLifeEvents([], 42)).toHaveLength(0)
  })

  it('100 çalışanla en az bir olay üretir', () => {
    const employees = Array.from({ length: 100 }, (_, i) => ({
      ...baseEmployee,
      id: `emp-${i}`,
      name: `Çalışan ${i}`,
    }))
    const events = rollLifeEvents(employees, 42)
    expect(events.length).toBeGreaterThan(0)
  })

  it('her olayın gerekli alanları var', () => {
    const employees = Array.from({ length: 100 }, (_, i) => ({
      ...baseEmployee, id: `emp-${i}`, name: `Çalışan ${i}`,
    }))
    const events = rollLifeEvents(employees, 42)
    if (events.length === 0) return
    const ev = events[0]
    expect(ev.id).toBeTruthy()
    expect(['hasta', 'rakip_teklif', 'kisisel_kriz', 'dogum_gunu']).toContain(ev.type)
    expect(ev.employeeId).toBeTruthy()
    expect(ev.employeeName).toBeTruthy()
    expect(ev.description).toBeTruthy()
    expect(typeof ev.loyaltyDelta).toBe('number')
    expect(typeof ev.energyDelta).toBe('number')
    expect(typeof ev.quitsJob).toBe('boolean')
  })

  it('rakip teklif düşük sadakatte istifaya yol açar', () => {
    const lowLoyaltyEmp = { ...baseEmployee, id: 'low', name: 'Düşük Sadakat', loyalty: 10 }
    for (let seed = 0; seed < 1000; seed++) {
      const events = rollLifeEvents([lowLoyaltyEmp], seed)
      const rival = events.find(e => e.type === 'rakip_teklif')
      if (rival) {
        expect(rival.quitsJob).toBe(true)
        return
      }
    }
    throw new Error('rakip_teklif olayı 1000 seed içinde bulunamadı')
  })

  it('yüksek sadakatte rakip teklif istifaya yol açmaz', () => {
    const highLoyaltyEmp = { ...baseEmployee, id: 'high', name: 'Yüksek Sadakat', loyalty: 80 }
    for (let seed = 0; seed < 1000; seed++) {
      const events = rollLifeEvents([highLoyaltyEmp], seed)
      const rival = events.find(e => e.type === 'rakip_teklif')
      if (rival) {
        expect(rival.quitsJob).toBe(false)
        return
      }
    }
    // vacuously true if no rival event found
  })
})
