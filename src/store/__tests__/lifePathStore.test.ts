// src/store/__tests__/lifePathStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useLifePathStore } from '../lifePathStore'
import { useSkillTreeStore } from '../skillTreeStore'
import { useNPCStore } from '../npcStore'

beforeEach(() => {
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
  useSkillTreeStore.setState({ selectedLifePath: null, unlockedNodeIds: [] })
  useNPCStore.setState(s => ({
    npcs: Object.fromEntries(
      Object.keys(s.npcs).map(id => [id, { relationship: 50, seenDialogueIds: [] }])
    ),
    gainMultipliers: Object.fromEntries(Object.keys(s.npcs).map(id => [id, 1.0])),
  }))
})

describe('lifePathStore — serbest faz', () => {
  it('başlangıçta tüm progress sıfır', () => {
    const { progress, activePathId } = useLifePathStore.getState()
    expect(progress).toEqual({ hirs: 0, huzur: 0, emek: 0 })
    expect(activePathId).toBeNull()
  })

  it('serbest fazda tüm yollar birikim yapabilir', () => {
    useLifePathStore.getState().addProgress('huzur', 30)
    useLifePathStore.getState().addProgress('hirs', 20)
    const { progress } = useLifePathStore.getState()
    expect(progress.huzur).toBe(30)
    expect(progress.hirs).toBe(20)
  })
})

describe('lifePathStore — threshold ve kilitleme', () => {
  it('threshold aşılınca activePathId set edilir', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    expect(useLifePathStore.getState().activePathId).toBe('huzur')
  })

  it('threshold aşılınca skillTreeStore.selectedLifePath güncellenir', () => {
    useLifePathStore.getState().addProgress('emek', 100)
    expect(useSkillTreeStore.getState().selectedLifePath).toBe('emek')
  })

  it('kilitli fazda aktif olmayan yol birikim yapamaz', () => {
    useLifePathStore.getState().addProgress('huzur', 100)   // kilitlendi
    useLifePathStore.getState().addProgress('hirs', 50)     // farklı yol → reddedilmeli
    expect(useLifePathStore.getState().progress.hirs).toBe(0)
  })

  it('kilitli fazda aktif yol birikim yapmaya devam eder (max 100)', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().addProgress('huzur', 10)    // max 100
    expect(useLifePathStore.getState().progress.huzur).toBe(100)
  })
})

describe('lifePathStore — switchPath', () => {
  it('switchPath activePathId ve selectedLifePath değiştirir', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    expect(useLifePathStore.getState().activePathId).toBe('emek')
    expect(useSkillTreeStore.getState().selectedLifePath).toBe('emek')
  })

  it('switchPath eski yolun progress kısmını siler (−40)', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    expect(useLifePathStore.getState().progress.huzur).toBe(60)
  })

  it('switchPath eski yol NPC ilişkisini düşürür (−20)', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    // huzur NPC'leri: marcus, remy — relationship 50 → 30
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(30)
    expect(useNPCStore.getState().npcs['remy'].relationship).toBe(30)
  })

  it('switchPath eski yol NPC gainMultiplier 0.5 olur', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('emek')
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.5)
    expect(useNPCStore.getState().gainMultipliers['remy']).toBe(0.5)
  })

  it('switchPath aktif yol ile aynı yola geçmeye izin vermez', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().switchPath('huzur')          // no-op
    expect(useLifePathStore.getState().activePathId).toBe('huzur')
  })

  it('reset her şeyi sıfırlar', () => {
    useLifePathStore.getState().addProgress('huzur', 100)
    useLifePathStore.getState().reset()
    expect(useLifePathStore.getState().activePathId).toBeNull()
    expect(useSkillTreeStore.getState().selectedLifePath).toBeNull()
  })
})
