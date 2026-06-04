import { describe, it, expect, beforeEach } from 'vitest'
import { useNPCStore } from '../npcStore'

beforeEach(() => {
  useNPCStore.setState({
    npcs: { iris: { relationship: 10, seenDialogueIds: [] } },
    gainMultipliers: { iris: 1.0 },
  })
})

describe('npcStore.adjustRelationship', () => {
  it('ilişkiyi delta kadar değiştirir', () => {
    useNPCStore.getState().adjustRelationship('iris', 5)
    expect(useNPCStore.getState().getRelationship('iris')).toBe(15)
  })
  it('0–100 arasında clamp eder', () => {
    useNPCStore.getState().adjustRelationship('iris', -50)
    expect(useNPCStore.getState().getRelationship('iris')).toBe(0)
    useNPCStore.getState().adjustRelationship('iris', 999)
    expect(useNPCStore.getState().getRelationship('iris')).toBe(100)
  })
})
