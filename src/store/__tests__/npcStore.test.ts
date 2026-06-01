import { describe, it, expect, beforeEach } from 'vitest'
import { useNPCStore } from '../npcStore'

beforeEach(() => {
  useNPCStore.setState(s => ({
    npcs: Object.fromEntries(
      Object.keys(s.npcs).map(id => [id, { relationship: 0, seenDialogueIds: [] }])
    ),
    gainMultipliers: Object.fromEntries(Object.keys(s.npcs).map(id => [id, 1.0])),
  }))
})

describe('npcStore — gainMultiplier', () => {
  it('başlangıçta tüm NPC gainMultiplier 1.0', () => {
    const { gainMultipliers } = useNPCStore.getState()
    expect(gainMultipliers['marcus']).toBe(1.0)
    expect(gainMultipliers['theo']).toBe(1.0)
  })

  it('completeDialogue multiplier 1.0 iken normal bonus uygular', () => {
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(10)
  })

  it('completeDialogue multiplier 0.5 iken yarı bonus uygular', () => {
    useNPCStore.setState(s => ({
      gainMultipliers: { ...s.gainMultipliers, marcus: 0.5 },
    }))
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(5)
  })

  it('completeDialogue her çağrıda multiplier +0.05 artarak 1.0 yaklaşır', () => {
    useNPCStore.setState(s => ({
      gainMultipliers: { ...s.gainMultipliers, marcus: 0.5 },
    }))
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.55)
  })

  it('completeDialogue multiplier 1.0 üzerine çıkmaz', () => {
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(1.0)
  })

  it('penalizeNpc relationship −20 yapar', () => {
    useNPCStore.setState(s => ({
      npcs: { ...s.npcs, marcus: { relationship: 60, seenDialogueIds: [] } },
    }))
    useNPCStore.getState().penalizeNpc('marcus')
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBe(40)
  })

  it('penalizeNpc gainMultiplier 0.5 yapar', () => {
    useNPCStore.getState().penalizeNpc('marcus')
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.5)
  })

  it('penalizeNpc relationship 0 altına inmez', () => {
    useNPCStore.getState().penalizeNpc('marcus')
    expect(useNPCStore.getState().npcs['marcus'].relationship).toBeGreaterThanOrEqual(0)
  })

  it('aynı dialogue tekrar oynanırsa multiplier artmaz', () => {
    useNPCStore.setState(s => ({
      gainMultipliers: { ...s.gainMultipliers, marcus: 0.5 },
    }))
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10)
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 10) // tekrar
    expect(useNPCStore.getState().gainMultipliers['marcus']).toBe(0.55) // sadece bir kez artar
  })
})
