import { create } from 'zustand'
import { computeWeeklyCosts } from '@/engine/economyEngine'
import { getSkillBonuses } from '@/engine/skillEffectEngine'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useProjectStore } from '@/store/projectStore'
import { useTimeStore } from '@/store/timeStore'
import { useNewsStore } from '@/store/newsStore'
import { nanoid } from 'nanoid'

const SEASON_INDEX: Record<string, number> = {
  ilkbahar: 0,
  yaz:      1,
  sonbahar: 2,
  kış:      3,
}

export interface SaleEvent {
  id:            string
  week:          number
  durationWeeks: number
  active:        boolean
}

interface EconomyStoreState {
  lastWeeklyCost:        number
  loan:                  number
  loanWeeksLeft:         number
  isInCrisis:            boolean
  crisisWeeksLeft:       number
  isBankrupt:            boolean
  saleEvents:            SaleEvent[]
  nextSaleWeek:          number
  pendingSaleEventModal: boolean

  computeAndApplyCosts: () => void
  takeLoan:             (amount: number, weeks: number) => void
  tickLoan:             () => void
  checkCrisis:          () => void
  tickCrisis:           () => void
  declareBankruptcy:    () => void
  scheduleSaleEvent:    () => void
  activateSaleEvent:    () => void
  deactivateSaleEvent:  () => void
  closeSaleEventModal:  () => void
  reset:                () => void
}

export const useEconomyStore = create<EconomyStoreState>((set, get) => ({
  lastWeeklyCost:        0,
  loan:                  0,
  loanWeeksLeft:         0,
  isInCrisis:            false,
  crisisWeeksLeft:       0,
  isBankrupt:            false,
  saleEvents:            [],
  nextSaleWeek:          13,
  pendingSaleEventModal: false,

  computeAndApplyCosts: () => {
    const employeeCount = useEmployeeStore.getState().employees.length
    const tickCount     = useTimeStore.getState().tickCount
    const publishedProjects = useProjectStore.getState().projects
      .filter(p => p.status === 'yayinlandi' && p.publishTickCount !== null)
      .map(p => ({ weeksPublished: tickCount - (p.publishTickCount ?? 0) }))

    const { crisisReduction } = getSkillBonuses()
    const { total } = computeWeeklyCosts(employeeCount, publishedProjects)
    const reduced   = Math.round(total * (1 - crisisReduction))
    if (reduced > 0) useGameStore.getState().addMoney(-reduced)
    set({ lastWeeklyCost: reduced })
  },

  takeLoan: (amount, weeks) => {
    useGameStore.getState().addMoney(amount)
    set({ loan: amount, loanWeeksLeft: weeks })
  },

  tickLoan: () => {
    const { loan, loanWeeksLeft } = get()
    if (loanWeeksLeft <= 0) return
    const payment = Math.ceil(loan / loanWeeksLeft)
    useGameStore.getState().addMoney(-payment)
    const newWeeksLeft = loanWeeksLeft - 1
    const newLoan = newWeeksLeft === 0 ? 0 : loan - payment
    set({ loanWeeksLeft: newWeeksLeft, loan: newLoan })
  },

  checkCrisis: () => {
    const money = useGameStore.getState().money
    const { isInCrisis } = get()
    if (money < 0 && !isInCrisis) {
      const { crisisDurationReduction } = getSkillBonuses()
      const weeks = Math.max(1, Math.round(4 * (1 - crisisDurationReduction)))
      set({ isInCrisis: true, crisisWeeksLeft: weeks })
    } else if (money >= 0 && isInCrisis) {
      set({ isInCrisis: false, crisisWeeksLeft: 0 })
    }
  },

  tickCrisis: () => {
    const { isInCrisis, crisisWeeksLeft } = get()
    if (!isInCrisis) return
    const next = crisisWeeksLeft - 1
    if (next <= 0) {
      get().declareBankruptcy()
    } else {
      set({ crisisWeeksLeft: next })
    }
  },

  declareBankruptcy: () => set({ isBankrupt: true }),

  scheduleSaleEvent: () => {
    const tickCount        = useTimeStore.getState().tickCount
    const { nextSaleWeek } = get()
    // 3 hafta önce haber
    const weeksUntilSale = nextSaleWeek - tickCount
    if (weeksUntilSale >= 3 && weeksUntilSale < 4) {
      const date = useTimeStore.getState().date
      useNewsStore.getState().addItem({
        type:   'random_event',
        rivalId: null,
        text:   'Platform İndirim Etkinliği 3 hafta sonra başlıyor!',
        year:   date.year,
        season: SEASON_INDEX[date.season] ?? 0,
      })
    }
  },

  activateSaleEvent: () => {
    const tickCount                     = useTimeStore.getState().tickCount
    const { nextSaleWeek, saleEvents }  = get()
    if (tickCount < nextSaleWeek) return
    // Zaten aktif event varsa tekrar açma
    if (saleEvents.some(e => e.active)) return
    const newEvent: SaleEvent = {
      id:            nanoid(),
      week:          tickCount,
      durationWeeks: 2,
      active:        true,
    }
    set({
      saleEvents:            [...saleEvents, newEvent],
      nextSaleWeek:          tickCount + 13,
      pendingSaleEventModal: true,
    })
  },

  deactivateSaleEvent: () => {
    const tickCount       = useTimeStore.getState().tickCount
    const { saleEvents }  = get()
    let expired = false
    const updated = saleEvents.map(e => {
      if (e.active && tickCount >= e.week + e.durationWeeks) {
        expired = true
        return { ...e, active: false }
      }
      return e
    })
    if (expired) {
      useProjectStore.getState().clearSaleParticipation()
      set({ saleEvents: updated })
    }
  },

  closeSaleEventModal: () => set({ pendingSaleEventModal: false }),

  reset: () => set({
    lastWeeklyCost:        0,
    loan:                  0,
    loanWeeksLeft:         0,
    isInCrisis:            false,
    crisisWeeksLeft:       0,
    isBankrupt:            false,
    saleEvents:            [],
    nextSaleWeek:          13,
    pendingSaleEventModal: false,
  }),
}))
