// src/store/__tests__/pubStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePubStore } from '../pubStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const SHIFT_ID  = 'pub_shift_01'
const TABLE_1   = 'table_1'
const TABLE_2   = 'table_2'
const TABLE_3   = 'table_3'

// pub_shift_01 correctOrder değerleri (pubShifts.ts'den)
const CORRECT_T1: string[] = ['Bira', 'Şarap']
const WRONG_T1:   string[] = ['Şarap', 'Bira']   // ters = yanlış
const CORRECT_T2: string[] = ['Fıstıksız Meze', 'Meze']
const CORRECT_T3: string[] = ['Kola']

beforeEach(() => {
  usePubStore.setState({
    activeShift: null,
    tableStates: {},
    mistakes: 0,
    completedShifts: [],
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, zaman_yonetimi: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('pubStore — startShift', () => {
  it('aktif vardiyayı set eder, her masa için tableState oluşturur', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    const s = usePubStore.getState()
    expect(s.activeShift?.id).toBe(SHIFT_ID)
    expect(s.tableStates[TABLE_1].status).toBe('waiting')
    expect(s.tableStates[TABLE_1].servedOrder).toBeNull()
    expect(s.tableStates[TABLE_1].revealedRequests).toBe(false)
    expect(s.tableStates[TABLE_2].status).toBe('waiting')
    expect(s.tableStates[TABLE_3].status).toBe('waiting')
    expect(s.mistakes).toBe(0)
  })

  it('bilinmeyen shift_id ile hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift('pub_shift_999')
    expect(usePubStore.getState().activeShift).toBeNull()
  })

  it('aktif vardiya varken yeni vardiya başlatmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().startShift('pub_shift_02')
    expect(usePubStore.getState().activeShift?.id).toBe(SHIFT_ID)
  })
})

describe('pubStore — interactTable', () => {
  it('revealedRequests: true yapar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().interactTable(TABLE_2)
    expect(usePubStore.getState().tableStates[TABLE_2].revealedRequests).toBe(true)
  })

  it('aktif vardiya yokken hiçbir şey yapmaz', () => {
    usePubStore.getState().interactTable(TABLE_1)
    expect(usePubStore.getState().tableStates[TABLE_1]).toBeUndefined()
  })
})

describe('pubStore — submitOrder', () => {
  it('status: waiting → cooking olur, servedOrder set edilir', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_1].status).toBe('cooking')
    expect(s.tableStates[TABLE_1].servedOrder).toEqual(CORRECT_T1)
  })

  it('status: waiting değilse hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)   // cooking
    usePubStore.getState().submitOrder(TABLE_1, WRONG_T1)     // ignored
    expect(usePubStore.getState().tableStates[TABLE_1].servedOrder).toEqual(CORRECT_T1)
  })
})

describe('pubStore — markReady', () => {
  it('status: cooking → ready olur', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    usePubStore.getState().markReady(TABLE_1)
    expect(usePubStore.getState().tableStates[TABLE_1].status).toBe('ready')
  })

  it('status: cooking değilse hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().markReady(TABLE_1)   // still 'waiting'
    expect(usePubStore.getState().tableStates[TABLE_1].status).toBe('waiting')
  })
})

describe('pubStore — deliverOrder', () => {
  it('status: ready ise → served olur, mistakes artmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    usePubStore.getState().markReady(TABLE_1)
    usePubStore.getState().deliverOrder(TABLE_1)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_1].status).toBe('served')
    expect(s.mistakes).toBe(0)
  })

  it('status: ready değilse hiçbir şey yapmaz', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().deliverOrder(TABLE_1)
    expect(usePubStore.getState().tableStates[TABLE_1].status).toBe('waiting')
  })
})

describe('pubStore — wrongDelivery', () => {
  it('status → waiting, servedOrder null, mistakes artar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, WRONG_T1)
    usePubStore.getState().markReady(TABLE_1)
    usePubStore.getState().wrongDelivery(TABLE_1)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_1].status).toBe('waiting')
    expect(s.tableStates[TABLE_1].servedOrder).toBeNull()
    expect(s.mistakes).toBe(1)
  })

  it('aktif vardiya yokken hiçbir şey yapmaz', () => {
    usePubStore.getState().wrongDelivery(TABLE_1)
    expect(usePubStore.getState().mistakes).toBe(0)
  })
})

describe('pubStore — failTable', () => {
  it('status → failed, mistakes artar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_3)
    const s = usePubStore.getState()
    expect(s.tableStates[TABLE_3].status).toBe('failed')
    expect(s.mistakes).toBe(1)
  })
})

describe('pubStore — endShift', () => {
  it('0-1 hata → 3 tohum, +5 emek, cross-store güncellenir', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().submitOrder(TABLE_1, CORRECT_T1)
    usePubStore.getState().markReady(TABLE_1)
    usePubStore.getState().deliverOrder(TABLE_1)   // 0 hata
    const result = usePubStore.getState().endShift()
    expect(result?.seeds).toBe(3)
    expect(result?.progress).toBe(5)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(5)
  })

  it('2-3 hata → 2 tohum, +3 emek', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_1)   // 1 hata
    usePubStore.getState().failTable(TABLE_2)   // 2 hata
    const result = usePubStore.getState().endShift()
    expect(result?.seeds).toBe(2)
    expect(result?.progress).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.zaman_yonetimi).toBe(2)
    expect(useLifePathStore.getState().progress.emek).toBe(3)
  })

  it('4+ hata → 1 tohum, +1 emek', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_1)
    usePubStore.getState().failTable(TABLE_2)
    usePubStore.getState().failTable(TABLE_3)
    usePubStore.getState().wrongDelivery(TABLE_1)  // mistake 4
    const result = usePubStore.getState().endShift()
    expect(result?.seeds).toBe(1)
    expect(result?.progress).toBe(1)
  })

  it('endShift completedShifts\'e ekler, activeShift null yapar', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().endShift()
    const s = usePubStore.getState()
    expect(s.completedShifts).toContain(SHIFT_ID)
    expect(s.activeShift).toBeNull()
    expect(s.tableStates).toEqual({})
    expect(s.mistakes).toBe(0)
  })

  it('aktif vardiya yokken null döner', () => {
    const result = usePubStore.getState().endShift()
    expect(result).toBeNull()
  })
})

describe('pubStore — reset', () => {
  it('tüm state sıfırlanır', () => {
    usePubStore.getState().startShift(SHIFT_ID)
    usePubStore.getState().failTable(TABLE_1)
    usePubStore.getState().endShift()           // completedShifts'e eklendi
    usePubStore.getState().reset()
    const s = usePubStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.tableStates).toEqual({})
    expect(s.mistakes).toBe(0)
    expect(s.completedShifts).toEqual([])
  })
})
