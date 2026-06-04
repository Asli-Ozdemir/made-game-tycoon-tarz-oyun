import { describe, it, expect, beforeEach } from 'vitest'
import { useInterviewStore } from './interviewStore'
import { useGameStore } from './gameStore'
import { useNPCStore } from './npcStore'

beforeEach(() => {
  useInterviewStore.setState({ pending: null, pendingRevenue: 0, lastInterviewPublishCount: null })
  useGameStore.setState({ money: 50000, reputation: 20, totalPublished: 0 })
  useNPCStore.setState({ npcs: { iris: { relationship: 10, seenDialogueIds: [] } }, gainMultipliers: { iris: 1.0 } })
})

describe('interviewStore', () => {
  it('düşük rastgele değerde röportaj tetikler (acclaim)', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.0)
    expect(useInterviewStore.getState().pending).not.toBeNull()
    expect(useInterviewStore.getState().pending?.reporter).toBe('iris')
  })

  it('yüksek rastgele değerde tetiklemez', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.99)
    expect(useInterviewStore.getState().pending).toBeNull()
  })

  it('üst üste iki yayında ikincisini engeller (cooldown)', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.0)
    useInterviewStore.getState().dismiss()
    useInterviewStore.getState().rollInterview('acclaim', 2, 50000, 0.0)
    expect(useInterviewStore.getState().pending).toBeNull()
  })

  it('cevap itibar + Iris ilişkisi + para uygular', () => {
    useInterviewStore.getState().rollInterview('acclaim', 1, 50000, 0.0)
    useInterviewStore.getState().answer(1)
    expect(useGameStore.getState().reputation).toBe(18)        // 20 - 2
    expect(useGameStore.getState().money).toBe(53000)          // 50000 + 50000*0.06
    expect(useNPCStore.getState().getRelationship('iris')).toBe(8)  // 10 - 2
    expect(useInterviewStore.getState().pending).toBeNull()
  })
})
