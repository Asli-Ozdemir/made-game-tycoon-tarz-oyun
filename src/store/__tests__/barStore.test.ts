// src/store/__tests__/barStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBarStore } from '../barStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'

const SHIFT_ID = 'shift_01'

const GUEST_OK       = 'guest_ayse_01'
const GUEST_DRUNK    = 'guest_mehmet_01'
const GUEST_BANNED   = 'guest_volkan_01'

beforeEach(() => {
  useBarStore.setState({
    activeShift: null,
    currentGuestIndex: 0,
    doorDecisions: {},
    wrongDecisions: 0,
    activeIncident: null,
    currentTensionStep: 0,
    tensionLevel: 50,
    incidentOutcome: null,
    fightActive: false,
    playerHealth: 3,
    completedShifts: [],
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, kaos: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

describe('barStore — startShift', () => {
  it('aktif vardiyayı set eder, sayaçları sıfırlar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    const s = useBarStore.getState()
    expect(s.activeShift?.id).toBe(SHIFT_ID)
    expect(s.currentGuestIndex).toBe(0)
    expect(s.wrongDecisions).toBe(0)
    expect(s.doorDecisions).toEqual({})
  })

  it('bilinmeyen shift_id ile hiçbir şey yapmaz', () => {
    useBarStore.getState().startShift('shift_999')
    expect(useBarStore.getState().activeShift).toBeNull()
  })

  it('aktif vardiya varken yeni vardiya başlatmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().startShift('shift_02')
    expect(useBarStore.getState().activeShift?.id).toBe(SHIFT_ID)
  })
})

describe('barStore — makeGuestDecision', () => {
  it('doğru karar (admit için ok misafir) wrongDecisions artırmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    expect(useBarStore.getState().wrongDecisions).toBe(0)
    expect(useBarStore.getState().doorDecisions[GUEST_OK]).toBe('admit')
  })

  it('sarhoş misafiri içeri alınca wrongDecisions artar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_DRUNK, 'admit')
    expect(useBarStore.getState().wrongDecisions).toBe(1)
  })

  it('yasak listedeki misafiri içeri alınca wrongDecisions artar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_BANNED, 'admit')
    expect(useBarStore.getState().wrongDecisions).toBe(1)
  })

  it('ok misafiri reddetmek wrongDecisions artırır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'reject')
    expect(useBarStore.getState().wrongDecisions).toBe(1)
  })

  it('her karar currentGuestIndex\'i bir artırır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    expect(useBarStore.getState().currentGuestIndex).toBe(1)
  })
})

describe('barStore — triggerIncident', () => {
  it('olay başlatınca activeIncident set edilir, tensionLevel 50\'ye sıfırlanır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    const s = useBarStore.getState()
    expect(s.activeIncident?.id).toBe('inc_tartisma_01')
    expect(s.tensionLevel).toBe(50)
    expect(s.currentTensionStep).toBe(0)
  })

  it('bilinmeyen incident id ile hiçbir şey yapmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_unknown')
    expect(useBarStore.getState().activeIncident).toBeNull()
  })
})

describe('barStore — chooseTensionOption', () => {
  it('negatif delta gerginliği düşürür', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    // step[0] option[0] delta = -25 → 50 - 25 = 25
    useBarStore.getState().chooseTensionOption(0)
    expect(useBarStore.getState().tensionLevel).toBe(25)
  })

  it('pozitif delta gerginliği artırır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    // step[0] option[2] delta = +30 → 50 + 30 = 80
    useBarStore.getState().chooseTensionOption(2)
    expect(useBarStore.getState().tensionLevel).toBe(80)
  })

  it('gerginlik 0\'a inince olay diyalogla kapanır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(0)  // 25
    useBarStore.getState().chooseTensionOption(0)  // 0 veya daha az → kapanır
    const s = useBarStore.getState()
    expect(s.activeIncident).toBeNull()
    expect(s.incidentOutcome).toBe('dialogue')
  })

  it('gerginlik 100\'e çıkınca fightActive true olur', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)  // 80
    useBarStore.getState().chooseTensionOption(2)  // >= 100 → fight
    expect(useBarStore.getState().fightActive).toBe(true)
    expect(useBarStore.getState().playerHealth).toBe(3)
  })

  it('aktif olay yokken chooseTensionOption hiçbir şey yapmaz', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    const before = useBarStore.getState().tensionLevel
    useBarStore.getState().chooseTensionOption(0)
    expect(useBarStore.getState().tensionLevel).toBe(before)
  })
})

describe('barStore — endFight', () => {
  it('playerWon=true → incidentOutcome won_fight, fightActive false', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(true)
    const s = useBarStore.getState()
    expect(s.fightActive).toBe(false)
    expect(s.incidentOutcome).toBe('won_fight')
    expect(s.activeIncident).toBeNull()
  })

  it('playerWon=false → incidentOutcome lost_fight', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(false)
    expect(useBarStore.getState().incidentOutcome).toBe('lost_fight')
  })
})

describe('barStore — endShift', () => {
  it('sorunsuz gece (0 hata, dialogue) → 3 tohum, +12 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(0)  // 25
    useBarStore.getState().chooseTensionOption(0)  // <= 0 → dialogue
    const result = useBarStore.getState().endShift()
    expect(result?.seeds).toBe(3)
    expect(result?.progress).toBe(12)
    expect(useIdeaSeedStore.getState().seeds.kaos).toBe(3)
    expect(useLifePathStore.getState().progress.emek).toBe(12)
  })

  it('kavga kazanıldı → 2 tohum, +8 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(true)
    const result = useBarStore.getState().endShift()
    expect(result?.seeds).toBe(2)
    expect(result?.progress).toBe(8)
  })

  it('kavga kaybedildi → 1 tohum, +3 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().triggerIncident('inc_tartisma_01')
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().chooseTensionOption(2)
    useBarStore.getState().endFight(false)
    const result = useBarStore.getState().endShift()
    expect(result?.seeds).toBe(1)
    expect(result?.progress).toBe(3)
  })

  it('≥3 yanlış karar → 1 tohum, +3 emek', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_DRUNK, 'admit')
    useBarStore.getState().makeGuestDecision(GUEST_BANNED, 'admit')
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'reject')
    const result = useBarStore.getState().endShift()
    expect(result?.seeds).toBe(1)
    expect(result?.progress).toBe(3)
  })

  it('endShift vardiyayı completedShifts\'e ekler, activeShift null yapar', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().endShift()
    const s = useBarStore.getState()
    expect(s.completedShifts).toContain(SHIFT_ID)
    expect(s.activeShift).toBeNull()
  })

  it('aktif vardiya yokken endShift null döner', () => {
    const result = useBarStore.getState().endShift()
    expect(result).toBeNull()
  })
})

describe('barStore — reset', () => {
  it('tüm state sıfırlanır', () => {
    useBarStore.getState().startShift(SHIFT_ID)
    useBarStore.getState().makeGuestDecision(GUEST_OK, 'admit')
    useBarStore.getState().reset()
    const s = useBarStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.currentGuestIndex).toBe(0)
    expect(s.wrongDecisions).toBe(0)
    expect(s.doorDecisions).toEqual({})
    expect(s.activeIncident).toBeNull()
    expect(s.incidentOutcome).toBeNull()
    expect(s.fightActive).toBe(false)
    expect(s.playerHealth).toBe(3)
    expect(s.completedShifts).toEqual([])
  })
})
