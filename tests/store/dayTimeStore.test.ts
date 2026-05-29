import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDayTimeStore } from '@/store/dayTimeStore'

const RESET = { hour: 9, minute: 0, minuteFraction: 0, dayOfWeek: 1, weekNumber: 1, isPaused: false, onWeeklyTick: null }

beforeEach(() => {
  useDayTimeStore.setState(RESET)
})

describe('advanceRealSeconds', () => {
  it('30 gerçek saniye = 15 oyun dakikası (120s/saat)', () => {
    useDayTimeStore.getState().advanceRealSeconds(30)
    const s = useDayTimeStore.getState()
    expect(s.hour).toBe(9)
    expect(s.minute).toBe(15)
  })

  it('120 gerçek saniye = 1 oyun saati', () => {
    useDayTimeStore.getState().advanceRealSeconds(120)
    expect(useDayTimeStore.getState().hour).toBe(10)
    expect(useDayTimeStore.getState().minute).toBe(0)
  })

  it('isPaused iken zaman ilerlemez', () => {
    useDayTimeStore.setState({ isPaused: true })
    useDayTimeStore.getState().advanceRealSeconds(120)
    expect(useDayTimeStore.getState().hour).toBe(9)
  })

  it('saat 23 e gelip aşınca endDay çağrılır', () => {
    useDayTimeStore.setState({ hour: 23, minute: 59 })
    useDayTimeStore.getState().advanceRealSeconds(120) // 1 saat → 24:59 → endDay
    expect(useDayTimeStore.getState().hour).toBe(9) // gün sıfırlandı
  })

  it('küçük deltalar birikip dakika oluşturur', () => {
    // 120 × 1 gerçek saniye = 60 oyun dakikası = 1 oyun saati
    for (let i = 0; i < 120; i++) {
      useDayTimeStore.getState().advanceRealSeconds(1)
    }
    expect(useDayTimeStore.getState().hour).toBe(10)
    expect(useDayTimeStore.getState().minute).toBe(0)
  })
})

describe('endDay', () => {
  it('dayOfWeek 1 artırır ve saati sıfırlar', () => {
    useDayTimeStore.getState().endDay()
    const s = useDayTimeStore.getState()
    expect(s.dayOfWeek).toBe(2)
    expect(s.hour).toBe(9)
    expect(s.minute).toBe(0)
  })

  it('7. günde dayOfWeek 1 e döner ve weekNumber artar', () => {
    useDayTimeStore.setState({ dayOfWeek: 7 })
    useDayTimeStore.getState().endDay()
    const s = useDayTimeStore.getState()
    expect(s.dayOfWeek).toBe(1)
    expect(s.weekNumber).toBe(2)
  })

  it('7. günde onWeeklyTick callback i çağırır', () => {
    const cb = vi.fn()
    useDayTimeStore.setState({ dayOfWeek: 7, onWeeklyTick: cb })
    useDayTimeStore.getState().endDay()
    expect(cb).toHaveBeenCalledOnce()
  })

  it('7. günden önce onWeeklyTick çağrılmaz', () => {
    const cb = vi.fn()
    useDayTimeStore.setState({ dayOfWeek: 3, onWeeklyTick: cb })
    useDayTimeStore.getState().endDay()
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('setIsPaused', () => {
  it('pause durumunu toggle eder', () => {
    useDayTimeStore.getState().setIsPaused(true)
    expect(useDayTimeStore.getState().isPaused).toBe(true)
    useDayTimeStore.getState().setIsPaused(false)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })
})
