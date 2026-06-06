import { describe, it, expect, beforeEach } from 'vitest'
import { useLifeStore } from '@/store/lifeStore'
import { useEmployeeStore } from '@/store/employeeStore'

beforeEach(() => {
  useLifeStore.getState().reset()
  useEmployeeStore.setState({ candidates: [] })
})

describe('Tessa reşit → işe alınabilir (varsayılan LIFE_EVENTS)', () => {
  it('2004 (yaş 18) → hireable rolü + employeeStore adayı belirir', () => {
    useLifeStore.getState().advanceYear(2004)
    expect(useLifeStore.getState().hasRole('tessa', 'hireable')).toBe(true)
    const cand = useEmployeeStore.getState().candidates.find((c) => c.id === 'npc-tessa')
    expect(cand).toBeDefined()
    expect(cand?.name).toBe('Tessa')
    expect(cand!.skills.programming).toBeGreaterThan(cand!.skills.design)
  })

  it('2003 (yaş 17) → henüz reşit değil', () => {
    useLifeStore.getState().advanceYear(2003)
    expect(useLifeStore.getState().hasRole('tessa', 'hireable')).toBe(false)
    expect(useEmployeeStore.getState().candidates.find((c) => c.id === 'npc-tessa')).toBeUndefined()
  })

  it('aday bir kez eklenir (tekrar advanceYear çoğaltmaz)', () => {
    useLifeStore.getState().advanceYear(2004)
    useLifeStore.getState().advanceYear(2010)
    const matches = useEmployeeStore.getState().candidates.filter((c) => c.id === 'npc-tessa')
    expect(matches).toHaveLength(1)
  })
})

describe('Bea 18 → mural bayrağı', () => {
  it('2003 (yaş 18) → bea_mural_yapildi flag', () => {
    useLifeStore.getState().advanceYear(2003)
    expect(useLifeStore.getState().hasFlag('bea_mural_yapildi')).toBe(true)
  })
  it('2002 (yaş 17) → henüz değil', () => {
    useLifeStore.getState().advanceYear(2002)
    expect(useLifeStore.getState().hasFlag('bea_mural_yapildi')).toBe(false)
  })
})
