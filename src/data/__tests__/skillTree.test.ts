// src/data/__tests__/skillTree.test.ts
import { describe, it, expect } from 'vitest'
import { SKILL_NODES } from '../skillTree'

describe('skillTree node definitions', () => {
  it('33 node tanımlanmış olmalı', () => {
    expect(SKILL_NODES).toHaveLength(33)
  })

  it('her node benzersiz id taşımalı', () => {
    const ids = SKILL_NODES.map(n => n.id)
    expect(new Set(ids).size).toBe(33)
  })

  it('tier dağılımı doğru olmalı', () => {
    const counts = [1,2,3,4,5].map(t => SKILL_NODES.filter(n => n.tier === t).length)
    expect(counts).toEqual([7, 8, 8, 6, 4])
  })

  it('her dependsOn referansı var olan bir node id olmalı', () => {
    const ids = new Set(SKILL_NODES.map(n => n.id))
    for (const node of SKILL_NODES) {
      for (const dep of node.dependsOn) {
        expect(ids.has(dep), `${node.id} → ${dep} yok`).toBe(true)
      }
    }
  })

  it('T1 node bağımlılığı olmamalı', () => {
    const t1 = SKILL_NODES.filter(n => n.tier === 1)
    for (const n of t1) expect(n.dependsOn).toHaveLength(0)
  })

  it('T5 lifePathLock veya undefined olmalı', () => {
    const valid = new Set(['hirs', 'huzur', 'emek', undefined])
    const t5 = SKILL_NODES.filter(n => n.tier === 5)
    for (const n of t5) expect(valid.has(n.lifePathLock)).toBe(true)
  })
})
