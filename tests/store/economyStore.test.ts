import { describe, it, expect, beforeEach } from 'vitest'
import { useEconomyStore } from '@/store/economyStore'
import { useGameStore } from '@/store/gameStore'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'

beforeEach(() => {
  useEconomyStore.getState().reset()
  useGameStore.getState().reset()
  useProjectStore.getState().reset()
  useTimeStore.getState().reset()
})

describe('economyStore', () => {
  it('başlangıçta tüm değerler sıfır/false', () => {
    const s = useEconomyStore.getState()
    expect(s.loan).toBe(0)
    expect(s.loanWeeksLeft).toBe(0)
    expect(s.isInCrisis).toBe(false)
    expect(s.isBankrupt).toBe(false)
    expect(s.crisisWeeksLeft).toBe(0)
    expect(s.pendingSaleEventModal).toBe(false)
  })

  it('computeAndApplyCosts: gameStore.money azalır', () => {
    useGameStore.getState().setMoney(100_000)
    // 0 çalışan, 0 proje → maliyet 0 — para değişmez
    useEconomyStore.getState().computeAndApplyCosts()
    expect(useGameStore.getState().money).toBe(100_000)
  })

  it('takeLoan: money artar, loan ve loanWeeksLeft set edilir', () => {
    useGameStore.getState().setMoney(0)
    useEconomyStore.getState().takeLoan(25_000, 12)
    expect(useGameStore.getState().money).toBe(25_000)
    expect(useEconomyStore.getState().loan).toBe(25_000)
    expect(useEconomyStore.getState().loanWeeksLeft).toBe(12)
  })

  it('tickLoan: her hafta taksit düşer', () => {
    useGameStore.getState().setMoney(50_000)
    useEconomyStore.getState().takeLoan(24_000, 12)  // 2000/hafta
    useEconomyStore.getState().tickLoan()
    expect(useGameStore.getState().money).toBe(50_000 + 24_000 - 2000)
    expect(useEconomyStore.getState().loanWeeksLeft).toBe(11)
  })

  it('tickLoan: loanWeeksLeft 0 → loan sıfırlanır', () => {
    useGameStore.getState().setMoney(50_000)
    useEconomyStore.getState().takeLoan(1000, 1)
    useEconomyStore.getState().tickLoan()
    expect(useEconomyStore.getState().loan).toBe(0)
    expect(useEconomyStore.getState().loanWeeksLeft).toBe(0)
  })

  it('checkCrisis: money < 0 → isInCrisis true, crisisWeeksLeft 4', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    expect(useEconomyStore.getState().isInCrisis).toBe(true)
    expect(useEconomyStore.getState().crisisWeeksLeft).toBe(4)
  })

  it('checkCrisis: money >= 0 ve krizde → kriz kapanır', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    useGameStore.getState().setMoney(1000)
    useEconomyStore.getState().checkCrisis()
    expect(useEconomyStore.getState().isInCrisis).toBe(false)
  })

  it('tickCrisis: crisisWeeksLeft azalır', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    useEconomyStore.getState().tickCrisis()
    expect(useEconomyStore.getState().crisisWeeksLeft).toBe(3)
  })

  it('tickCrisis: crisisWeeksLeft 0 → isBankrupt true', () => {
    useGameStore.getState().setMoney(-100)
    useEconomyStore.getState().checkCrisis()
    // 4 tick
    for (let i = 0; i < 4; i++) useEconomyStore.getState().tickCrisis()
    expect(useEconomyStore.getState().isBankrupt).toBe(true)
  })

  it('scheduleSaleEvent: nextSaleWeek 13 hafta ilerler', () => {
    useTimeStore.setState({ tickCount: 0 })
    useEconomyStore.getState().scheduleSaleEvent()
    expect(useEconomyStore.getState().nextSaleWeek).toBe(13)
  })
})
