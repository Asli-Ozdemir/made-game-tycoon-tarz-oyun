// src/store/__tests__/detectiveStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useDetectiveStore } from '../detectiveStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const CASE_ID = 'case_01'
const CULPRIT = 'suspect_mete'
const INNOCENT = 'suspect_dilara'

beforeEach(() => {
  useDetectiveStore.setState({
    activeCase: null,
    dayCount: 0,
    collectedEvidence: [],
    chainPosition: null,
    completedCases: [],
  })
  useIdeaSeedStore.setState(s => ({
    seeds: { ...s.seeds, analiz: 0 },
  }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('detectiveStore — startCase', () => {
  it('aktif vakayı set eder ve gün sayacını başlatır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    const s = useDetectiveStore.getState()
    expect(s.activeCase?.id).toBe(CASE_ID)
    expect(s.dayCount).toBe(1)
    expect(s.collectedEvidence).toEqual([])
    expect(s.chainPosition).toBeNull()
  })

  it('zaten aktif vaka varken yeni vaka başlatmaz', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().startCase('case_02')
    expect(useDetectiveStore.getState().activeCase?.id).toBe(CASE_ID)
  })

  it('bilinmeyen case_id ile startCase hiçbir şey yapmaz', () => {
    useDetectiveStore.getState().startCase('case_999')
    expect(useDetectiveStore.getState().activeCase).toBeNull()
  })
})

describe('detectiveStore — collectEvidence', () => {
  it('kanıt toplanınca collectedEvidence listesine eklenir', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().collectedEvidence).toContain('ev_canta')
  })

  it('aynı kanıt iki kez eklenemez', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().collectedEvidence.filter(e => e === 'ev_canta')).toHaveLength(1)
  })

  it('aktif vaka yokken collectEvidence hiçbir şey yapmaz', () => {
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().collectedEvidence).toHaveLength(0)
  })

  it('ev_canta toplanınca chainPosition suspect_dilara olur', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().chainPosition).toBe('suspect_dilara')
  })

  it('ev_sigara toplanınca chainPosition suspect_mete olur', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_sigara')
    expect(useDetectiveStore.getState().chainPosition).toBe('suspect_mete')
  })

  it('aynı kanıt tekrar toplanınca chainPosition son değerde kalır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().chainPosition).toBe('suspect_dilara')
    useDetectiveStore.getState().collectEvidence('ev_canta')
    expect(useDetectiveStore.getState().chainPosition).toBe('suspect_dilara')
  })
})

describe('detectiveStore — advanceDay', () => {
  it('gün sayacını artırır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().advanceDay()
    expect(useDetectiveStore.getState().dayCount).toBe(2)
  })

  it('aktif vaka yokken advanceDay hiçbir şey yapmaz', () => {
    useDetectiveStore.getState().advanceDay()
    expect(useDetectiveStore.getState().dayCount).toBe(0)
  })
})

describe('detectiveStore — makeAccusation', () => {
  it('doğru suçlu ile correct döner ve analiz tohumu verir', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBe('correct')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(3)
  })

  it('doğru suçlu son günde correct döner ve 2 tohum verir', () => {
    useDetectiveStore.getState().startCase(CASE_ID) // dayLimit=4
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay() // dayCount=4 = dayLimit
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBe('correct')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(2)
  })

  it('yanlış suçlu ile wrong döner ve 1 tohum verir', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    const result = useDetectiveStore.getState().makeAccusation(INNOCENT)
    expect(result).toBe('wrong')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(1)
  })

  it('gün limiti dolduğunda timeout döner', () => {
    useDetectiveStore.getState().startCase(CASE_ID) // dayLimit=4
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay()
    useDetectiveStore.getState().advanceDay() // dayCount=5 > dayLimit=4
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBe('timeout')
    expect(useIdeaSeedStore.getState().seeds.analiz).toBe(1)
  })

  it('doğru suçlama emek progressi artırır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(useLifePathStore.getState().progress.emek).toBe(12)
  })

  it('yanlış suçlama emek progressi az artırır (+3)', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().makeAccusation(INNOCENT)
    expect(useLifePathStore.getState().progress.emek).toBe(3)
  })

  it('makeAccusation sonrası vaka tamamlanmış sayılır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(useDetectiveStore.getState().completedCases).toContain(CASE_ID)
    expect(useDetectiveStore.getState().activeCase).toBeNull()
  })

  it('aktif vaka yokken makeAccusation null döner', () => {
    const result = useDetectiveStore.getState().makeAccusation(CULPRIT)
    expect(result).toBeNull()
  })
})

describe('detectiveStore — reset', () => {
  it('tüm state sıfırlanır', () => {
    useDetectiveStore.getState().startCase(CASE_ID)
    useDetectiveStore.getState().collectEvidence('ev_canta')
    useDetectiveStore.getState().reset()
    const s = useDetectiveStore.getState()
    expect(s.activeCase).toBeNull()
    expect(s.dayCount).toBe(0)
    expect(s.collectedEvidence).toEqual([])
    expect(s.chainPosition).toBeNull()
    expect(s.completedCases).toEqual([])
  })
})
