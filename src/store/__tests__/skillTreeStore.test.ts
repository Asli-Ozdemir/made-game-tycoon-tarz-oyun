import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillTreeStore } from '../skillTreeStore'
import { useIdeaSeedStore } from '../ideaSeedStore'

beforeEach(() => {
  useSkillTreeStore.setState({ unlockedNodeIds: [] })
  useIdeaSeedStore.setState({
    seeds: { nostalji: 10, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10 },
  })
})

describe('skillTreeStore', () => {
  it('başlangıçta hiçbir node açık değil', () => {
    expect(useSkillTreeStore.getState().unlockedNodeIds).toHaveLength(0)
  })

  it('T1 node canUnlock — seed varsa true döner', () => {
    expect(useSkillTreeStore.getState().canUnlock('nos_t1')).toBe(true)
  })

  it('T1 node canUnlock — seed yoksa false döner', () => {
    useIdeaSeedStore.setState({ seeds: { nostalji: 0, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10 } })
    expect(useSkillTreeStore.getState().canUnlock('nos_t1')).toBe(false)
  })

  it('T2 node canUnlock — bağımlı T1 açık değilse false döner', () => {
    expect(useSkillTreeStore.getState().canUnlock('nos_t2')).toBe(false)
  })

  it('T2 node canUnlock — bağımlı T1 açılınca true döner', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().canUnlock('nos_t2')).toBe(true)
  })

  it('unlockNode seed harcar', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(9)
  })

  it('unlockNode node id ekler', () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().unlockedNodeIds).toContain('nos_t1')
  })

  it('canUnlock false iken unlockNode hiçbir şey yapmaz', () => {
    useIdeaSeedStore.setState({ seeds: { nostalji: 0, hikaye: 10, kaos: 10, zaman_yonetimi: 10, analiz: 10, sosyallik: 10, game_history: 10 } })
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().unlockedNodeIds).toHaveLength(0)
  })

  it("getNodeState: locked — T2 bağımlılık eksik", () => {
    expect(useSkillTreeStore.getState().getNodeState('nos_t2')).toBe('locked')
  })

  it("getNodeState: unlockable — bağımlılıklar açık, seed yeterli", () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().getNodeState('nos_t2')).toBe('unlockable')
  })

  it("getNodeState: active — node açılmış", () => {
    useSkillTreeStore.getState().unlockNode('nos_t1')
    expect(useSkillTreeStore.getState().getNodeState('nos_t1')).toBe('active')
  })

  it('lifePathLock: hayat yolu null iken T5 locked', () => {
    useSkillTreeStore.setState({ unlockedNodeIds: ['kaos_t1','kaos_t2','kaos2_t2','kaos_t3','kaos_t4'] })
    expect(useSkillTreeStore.getState().getNodeState('t5_hirs')).toBe('locked')
  })
})
