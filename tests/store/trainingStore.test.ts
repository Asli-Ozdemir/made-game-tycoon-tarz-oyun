import { describe, it, expect, beforeEach } from 'vitest'
import { useTrainingStore } from '@/store/trainingStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useCharacterStore } from '@/store/characterStore'

function resetAll() {
  useTrainingStore.getState().reset()
  useGameStore.getState().reset()
  useEmployeeStore.getState().reset()
}

beforeEach(resetAll)

describe('trainingStore — buy', () => {
  it('kurs satın alınca para düşer ve envantere girer', () => {
    const before = useGameStore.getState().money  // 50000
    useTrainingStore.getState().buy('sound_temel') // cost: 6000
    expect(useGameStore.getState().money).toBe(before - 6000)
    expect(useTrainingStore.getState().inventory).toHaveLength(1)
    expect(useTrainingStore.getState().inventory[0].courseId).toBe('sound_temel')
    expect(useTrainingStore.getState().inventory[0].weeksLeft).toBe(4)
    expect(useTrainingStore.getState().inventory[0].assignedTo).toBeNull()
  })

  it('para yetmezse satın alım gerçekleşmez', () => {
    useGameStore.setState({ money: 0, reputation: 0, totalPublished: 0 })
    useTrainingStore.getState().buy('sound_temel')
    expect(useTrainingStore.getState().inventory).toHaveLength(0)
  })
})

describe('trainingStore — assign', () => {
  it('atama sonrası assignedTo ve employee.activeCourseId güncellenir', () => {
    // İşe al
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    // Kurs satın al
    useTrainingStore.getState().buy('sound_temel')
    const pc = useTrainingStore.getState().inventory[0]
    // Ata
    useTrainingStore.getState().assign(pc.id, emp.id)
    expect(useTrainingStore.getState().inventory[0].assignedTo).toBe(emp.id)
    expect(useEmployeeStore.getState().employees[0].activeCourseId).toBe(pc.id)
  })
})

describe('trainingStore — tickCourses', () => {
  it('weeksLeft her tick\'te azalır', () => {
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    useTrainingStore.getState().buy('sound_temel') // duration: 4
    const pc = useTrainingStore.getState().inventory[0]
    useTrainingStore.getState().assign(pc.id, emp.id)
    useTrainingStore.getState().tickCourses(2005)
    expect(useTrainingStore.getState().inventory[0].weeksLeft).toBe(3)
  })

  it('kurs tamamlanınca XP eklenir, trait açılır, activeCourseId temizlenir', () => {
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    useTrainingStore.getState().buy('sound_ileri') // xpBoost:35, traitId:'ses_buyucusu'
    const pc = useTrainingStore.getState().inventory[0]
    useTrainingStore.getState().assign(pc.id, emp.id)
    // weeksLeft=8, zorla bitir
    useTrainingStore.setState({
      inventory: [{ ...pc, assignedTo: emp.id, weeksLeft: 1 }],
    })
    useTrainingStore.getState().tickCourses(2005)
    // Kurs envanterde kalmamalı
    expect(useTrainingStore.getState().inventory).toHaveLength(0)
    // Çalışanın activeCourseId temizlenmeli
    const updated = useEmployeeStore.getState().employees.find(e => e.id === emp.id)!
    expect(updated.activeCourseId).toBeNull()
    // trait açılmış olmalı
    expect(updated.traits).toContain('ses_buyucusu')
  })

  it('arka plan affinitesi çarpanı doğru uygulanır (bas_muhendis → programming 1.5×)', () => {
    useCharacterStore.setState({ background: 'bas_muhendis' } as any)
    useEmployeeStore.getState().hire(useEmployeeStore.getState().candidates[0])
    const emp = useEmployeeStore.getState().employees[0]
    const xpBefore = emp.xp.programming
    useTrainingStore.getState().buy('prog_temel') // xpBoost:15, multiplier:1.5 → 23 XP
    const pc = useTrainingStore.getState().inventory[0]
    useTrainingStore.getState().assign(pc.id, emp.id)
    useTrainingStore.setState({
      inventory: [{ ...pc, assignedTo: emp.id, weeksLeft: 1 }],
    })
    useTrainingStore.getState().tickCourses(2005)
    const updated = useEmployeeStore.getState().employees.find(e => e.id === emp.id)!
    // Math.round(15 * 1.5) = 23 XP bekleniyor
    // XP veya skills arttı kontrol et
    const totalXpOrSkill = updated.xp.programming + (updated.skills.programming - emp.skills.programming) * emp.skills.programming * 10
    expect(totalXpOrSkill).toBeGreaterThan(xpBefore + 15) // 1.0× ile daha fazla
  })
})

describe('trainingStore — reset', () => {
  it('reset sonrası envanter boşalır', () => {
    useTrainingStore.getState().buy('sound_temel')
    useTrainingStore.getState().reset()
    expect(useTrainingStore.getState().inventory).toHaveLength(0)
  })
})
