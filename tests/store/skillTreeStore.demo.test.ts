import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))

import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'

beforeEach(() => {
  useSkillTreeStore.setState({ unlockedNodeIds: [], selectedLifePath: null })
  useIdeaSeedStore.setState({
    seeds: { nostalji: 10, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10, hukuk: 10 },
  })
})

describe('DEMO_MODE=true — skillTreeStore tier kapısı', () => {
  it('T1 node açılabilir', () => {
    expect(useSkillTreeStore.getState().canUnlock('nos_t1')).toBe(true)
  })

  it('T2 node bağımlılığı karşılansa bile demoda kilitli', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().canUnlock('nos_t2')).toBe(false)
  })

  it('unlockNode T2 node\'u demoda açmaz', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    useSkillTreeStore.getState().unlockNode('nos_t2')
    expect(useSkillTreeStore.getState().unlockedNodeIds).toEqual(['nos_t1'])
  })
})
