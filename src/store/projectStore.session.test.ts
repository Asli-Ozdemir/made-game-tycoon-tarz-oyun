// src/store/projectStore.session.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { createProject } from '@/engine/projectEngine'

function freshProject() {
  return createProject({
    name: 'P', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
    scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
  })
}

describe('projectStore seans mutator\'ları', () => {
  beforeEach(() => {
    useProjectStore.getState().reset()
    useProjectStore.setState({ pendingCarryQuality: 0 })
  })

  it('advanceWeeks haftaları artırır, totalWeeks\'i aşmaz', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().advanceWeeks(p.id, 2)
    expect(useProjectStore.getState().projects[0].weeksElapsed).toBe(2)
    useProjectStore.getState().advanceWeeks(p.id, 999)
    expect(useProjectStore.getState().projects[0].weeksElapsed).toBe(p.totalWeeks)
  })

  it('applyFocusAxis ekseni günceller ve qualityPoints\'e net katkı ekler', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().applyFocusAxis(p.id, 'gameplay')
    const updated = useProjectStore.getState().projects[0]
    expect(updated.axes!.gameplay).toBe(15)
    expect(updated.qualityPoints).toBe(15) // 0 → +15 (drain 0'dan, net +15)
  })

  it('applySparkQuality qualityPoints\'e sabit ekler', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().applySparkQuality(p.id, 15)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(15)
  })

  it('applyBugPenalty qualityPoints\'i düşürür, 0\'ın altına inmez', () => {
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    useProjectStore.getState().applyBugPenalty(p.id, 10)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(0)
  })

  it('pendingCarryQuality yeni projeye eklenir ve sıfırlanır', () => {
    useProjectStore.getState().setPendingCarry(10)
    const p = freshProject()
    useProjectStore.getState().addProject(p)
    expect(useProjectStore.getState().projects[0].qualityPoints).toBe(10)
    expect(useProjectStore.getState().pendingCarryQuality).toBe(0)
  })
})
