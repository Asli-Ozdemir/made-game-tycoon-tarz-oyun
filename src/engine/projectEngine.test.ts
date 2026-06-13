// src/engine/projectEngine.test.ts
import { describe, it, expect } from 'vitest'
import { createProject } from './projectEngine'
import { EMPTY_AXES } from './qualityAxes'

describe('createProject axes init', () => {
  it('yeni proje sıfır eksenlerle başlar', () => {
    const p = createProject({
      name: 'Test', genreId: 'rpg', topicId: 'uzay', platformId: 'pc',
      scope: 'kucuk', startDate: { year: 2000, season: 'ilkbahar', week: 1 },
    })
    expect(p.axes).toEqual(EMPTY_AXES)
  })
})
