import { describe, it, expect } from 'vitest'
import {
  computeBaseCurve,
  computeNormalizedShares,
  computePlatformShareMultiplier,
  decayReactiveDelta,
} from '@/engine/marketEngine'

describe('computeBaseCurve', () => {
  it('yıl 1: PC=60, Konsol=30, Mobil=10', () => {
    const r = computeBaseCurve(1)
    expect(r.pc).toBe(60)
    expect(r.konsol).toBe(30)
    expect(r.mobil).toBe(10)
  })

  it('yıl 5: PC=50, Konsol=30, Mobil=20', () => {
    const r = computeBaseCurve(5)
    expect(r.pc).toBe(50)
    expect(r.konsol).toBe(30)
    expect(r.mobil).toBe(20)
  })

  it('yıl 10: PC=40, Konsol=28, Mobil=32', () => {
    const r = computeBaseCurve(10)
    expect(r.pc).toBe(40)
    expect(r.konsol).toBe(28)
    expect(r.mobil).toBe(32)
  })

  it('yıl 15: yıl 10 sonrası sabit kalır', () => {
    const r10 = computeBaseCurve(10)
    const r15 = computeBaseCurve(15)
    expect(r15.pc).toBe(r10.pc)
    expect(r15.konsol).toBe(r10.konsol)
    expect(r15.mobil).toBe(r10.mobil)
  })
})

describe('computeNormalizedShares', () => {
  it('toplam her zaman 100', () => {
    const base = { pc: 50, konsol: 30, mobil: 20 }
    const deltas = { pc: 5, konsol: -3, mobil: 8 }
    const result = computeNormalizedShares(base, deltas)
    const total = result.pc + result.konsol + result.mobil
    expect(Math.abs(total - 100)).toBeLessThan(0.01)
  })

  it('delta clamp ±15 korunur — delta 20 verilince clamp 15 uygulanır', () => {
    const base = { pc: 50, konsol: 30, mobil: 20 }
    const deltas = { pc: 20, konsol: -20, mobil: 0 }
    const result = computeNormalizedShares(base, deltas)
    expect(Math.abs(result.pc + result.konsol + result.mobil - 100)).toBeLessThan(0.01)
    // pc: clamp(50+15,5,80)=65, konsol: clamp(30-15,5,80)=15, mobil: clamp(20+0,5,80)=20
    // total=100, pc=65%, konsol=15%, mobil=20%
    expect(result.pc).toBeCloseTo(65, 1)
  })
})

describe('computePlatformShareMultiplier', () => {
  it('pay=60 → >1.0', () => {
    expect(computePlatformShareMultiplier(60)).toBeGreaterThan(1.0)
  })

  it('pay=15 → <1.0', () => {
    expect(computePlatformShareMultiplier(15)).toBeLessThan(1.0)
  })

  it('pay=35 → 1.0', () => {
    expect(computePlatformShareMultiplier(35)).toBe(1.0)
  })
})

describe('decayReactiveDelta', () => {
  it('delta=10 → 8 (%20 sönümleme)', () => {
    expect(decayReactiveDelta(10)).toBe(8)
  })

  it('delta=0.3 → 0 (eşik altında)', () => {
    expect(decayReactiveDelta(0.3)).toBe(0)
  })
})
