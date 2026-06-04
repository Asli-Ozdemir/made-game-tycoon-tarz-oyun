import { describe, it, expect } from 'vitest'
import { scoreToBand, VERDICT, hashSeed, seededRandom } from './mediaOutlets'

describe('mediaOutlets', () => {
  it('scoreToBand doğru bant döndürür', () => {
    expect(scoreToBand(90)).toBe('acclaim')
    expect(scoreToBand(85)).toBe('acclaim')
    expect(scoreToBand(70)).toBe('approval')
    expect(scoreToBand(55)).toBe('mixed')
    expect(scoreToBand(30)).toBe('pan')
  })

  it('her bandın bir verdict etiketi var', () => {
    expect(VERDICT.acclaim).toBeTruthy()
    expect(VERDICT.pan).toBeTruthy()
  })

  it('hashSeed deterministik ve negatif değil', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0)
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'))
  })

  it('seededRandom 0–1 arası ve deterministik', () => {
    const r = seededRandom(42)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
    expect(seededRandom(42)).toBe(r)
  })
})
