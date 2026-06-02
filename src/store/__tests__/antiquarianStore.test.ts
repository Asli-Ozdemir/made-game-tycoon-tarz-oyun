// src/store/__tests__/antiquarianStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAntiquarianStore } from '../antiquarianStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'
import { ANTIQUARIAN_SHIFTS } from '@/data/antiquarianShifts'
import type { BookIdentification } from '../antiquarianStore'

const SHIFT_ID = 'antiq_shift_01'
const LOC_ID   = 'old_tower'

// antiq_shift_01 values (from antiquarianShifts.ts)
const REQ_1 = 'req_s1_1'   // leather journal, 1800s, good
const REQ_2 = 'req_s1_2'   // poetry collection, early 1900s, fair
const REQ_3 = 'req_s1_3'   // field guide, 1800s, good
const REQ_4 = 'req_s1_4'   // travel diary, late 1800s, excellent

const BOOK_1 = 's1_b1'  // matches REQ_1, correctCondition:'good', correctPeriod:'1800s'
const BOOK_2 = 's1_b2'  // matches REQ_2, correctCondition:'fair', correctPeriod:'early 1900s'
const BOOK_3 = 's1_b3'  // matches REQ_3, correctCondition:'good', correctPeriod:'1800s'
const BOOK_4 = 's1_b4'  // matches REQ_4, correctCondition:'excellent', correctPeriod:'late 1800s'
const BOOK_D = 's1_b5'  // distractor — no matchesRequest

const ID_1_CORRECT: BookIdentification = { condition: 'good',      period: '1800s'       }
const ID_1_WRONG:   BookIdentification = { condition: 'poor',      period: '1800s'       } // wrong condition
const ID_2_CORRECT: BookIdentification = { condition: 'fair',      period: 'early 1900s' }
const ID_3_CORRECT: BookIdentification = { condition: 'good',      period: '1800s'       }
const ID_4_CORRECT: BookIdentification = { condition: 'excellent', period: 'late 1800s'  }

beforeEach(() => {
  useAntiquarianStore.setState({
    activeShift: null,
    phase: 'briefing',
    selectedLocation: null,
    collectedBooks: [],
    identifications: {},
    matches: {},
    mistakes: 0,
    completedShifts: [],
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, nostalji: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
})

// ─── startShift ───────────────────────────────────────────────────────────────

describe('antiquarianStore — startShift', () => {
  it('sets activeShift and phase to briefing', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    const s = useAntiquarianStore.getState()
    expect(s.activeShift?.id).toBe(SHIFT_ID)
    expect(s.phase).toBe('briefing')
    expect(s.collectedBooks).toEqual([])
    expect(s.mistakes).toBe(0)
  })

  it('does nothing for unknown shift id', () => {
    useAntiquarianStore.getState().startShift('antiq_shift_999')
    expect(useAntiquarianStore.getState().activeShift).toBeNull()
  })

  it('does nothing when a shift is already active', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().startShift('antiq_shift_02')
    expect(useAntiquarianStore.getState().activeShift?.id).toBe(SHIFT_ID)
  })
})

// ─── advanceFromBriefing ──────────────────────────────────────────────────────

describe('antiquarianStore — advanceFromBriefing', () => {
  it('briefing → search', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    expect(useAntiquarianStore.getState().phase).toBe('search')
  })

  it('does nothing when not in briefing phase', () => {
    useAntiquarianStore.setState({ activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'search', selectedLocation: null, collectedBooks: [], identifications: {}, matches: {}, mistakes: 0, completedShifts: [] })
    useAntiquarianStore.getState().advanceFromBriefing()
    expect(useAntiquarianStore.getState().phase).toBe('search') // unchanged
  })
})

// ─── selectLocation ───────────────────────────────────────────────────────────

describe('antiquarianStore — selectLocation', () => {
  it('sets selectedLocation', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    expect(useAntiquarianStore.getState().selectedLocation).toBe(LOC_ID)
  })

  it('does nothing for a location not in the active shift', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation('nonexistent_loc')
    expect(useAntiquarianStore.getState().selectedLocation).toBeNull()
  })
})

// ─── collectBook / uncollectBook ──────────────────────────────────────────────

describe('antiquarianStore — collectBook', () => {
  beforeEach(() => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
  })

  it('adds book to collectedBooks', () => {
    useAntiquarianStore.getState().collectBook(BOOK_1)
    expect(useAntiquarianStore.getState().collectedBooks).toContain(BOOK_1)
  })

  it('does not add the same book twice', () => {
    useAntiquarianStore.getState().collectBook(BOOK_1)
    useAntiquarianStore.getState().collectBook(BOOK_1)
    expect(useAntiquarianStore.getState().collectedBooks.filter(b => b === BOOK_1)).toHaveLength(1)
  })

  it('does not exceed capacity of 6', () => {
    const bookIds = ['s1_b1','s1_b2','s1_b3','s1_b4','s1_b5','s1_b6','s1_b7']
    for (const id of bookIds) useAntiquarianStore.getState().collectBook(id)
    expect(useAntiquarianStore.getState().collectedBooks).toHaveLength(6)
  })

  it('does nothing for book not in selected location', () => {
    useAntiquarianStore.getState().collectBook('totally_unknown_book')
    expect(useAntiquarianStore.getState().collectedBooks).toHaveLength(0)
  })
})

describe('antiquarianStore — uncollectBook', () => {
  it('removes book from collectedBooks', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    useAntiquarianStore.getState().collectBook(BOOK_1)
    useAntiquarianStore.getState().uncollectBook(BOOK_1)
    expect(useAntiquarianStore.getState().collectedBooks).not.toContain(BOOK_1)
  })
})

// ─── advanceToIdentify ────────────────────────────────────────────────────────

describe('antiquarianStore — advanceToIdentify', () => {
  it('search (with location + books) → identify', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    useAntiquarianStore.getState().collectBook(BOOK_1)
    useAntiquarianStore.getState().advanceToIdentify()
    expect(useAntiquarianStore.getState().phase).toBe('identify')
  })

  it('does nothing when no location is selected', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().advanceToIdentify()
    expect(useAntiquarianStore.getState().phase).toBe('search')
  })

  it('does nothing when no books are collected', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().advanceFromBriefing()
    useAntiquarianStore.getState().selectLocation(LOC_ID)
    // no collectBook call
    useAntiquarianStore.getState().advanceToIdentify()
    expect(useAntiquarianStore.getState().phase).toBe('search')
  })
})

// ─── identifyBook ─────────────────────────────────────────────────────────────

describe('antiquarianStore — identifyBook', () => {
  it('stores identification for a collected book', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: {}, matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().identifyBook(BOOK_1, ID_1_CORRECT)
    expect(useAntiquarianStore.getState().identifications[BOOK_1]).toEqual(ID_1_CORRECT)
  })

  it('does nothing for a book not in collectedBooks', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: {}, matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().identifyBook('s1_b99', ID_1_CORRECT)
    expect(useAntiquarianStore.getState().identifications['s1_b99']).toBeUndefined()
  })
})

// ─── advanceToMatch ───────────────────────────────────────────────────────────

describe('antiquarianStore — advanceToMatch', () => {
  it('identify → match when all collected books are identified', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: { [BOOK_1]: ID_1_CORRECT },
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().advanceToMatch()
    expect(useAntiquarianStore.getState().phase).toBe('match')
  })

  it('does nothing when some collected books are not yet identified', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'identify',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1, BOOK_2],
      identifications: { [BOOK_1]: ID_1_CORRECT },  // BOOK_2 missing
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().advanceToMatch()
    expect(useAntiquarianStore.getState().phase).toBe('identify')
  })
})

// ─── matchBook ────────────────────────────────────────────────────────────────

describe('antiquarianStore — matchBook', () => {
  it('stores request → book match', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'match',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: { [BOOK_1]: ID_1_CORRECT },
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().matchBook(REQ_1, BOOK_1)
    expect(useAntiquarianStore.getState().matches[REQ_1]).toBe(BOOK_1)
  })

  it('does nothing for unknown requestId', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'match',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: { [BOOK_1]: ID_1_CORRECT },
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().matchBook('req_unknown', BOOK_1)
    expect(useAntiquarianStore.getState().matches['req_unknown']).toBeUndefined()
  })

  it('does nothing for book not in collectedBooks', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'match',
      selectedLocation: LOC_ID, collectedBooks: [BOOK_1],
      identifications: { [BOOK_1]: ID_1_CORRECT },
      matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().matchBook(REQ_1, BOOK_2)
    expect(useAntiquarianStore.getState().matches[REQ_1]).toBeUndefined()
  })
})

// ─── endShift ─────────────────────────────────────────────────────────────────

describe('antiquarianStore — endShift', () => {
  it('0–1 mistakes → 3 nostalji seeds, +5 huzur, cross-store updated', () => {
    // Perfect run: all 4 requests satisfied, all identified correctly
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0],
      phase: 'match',
      selectedLocation: LOC_ID,
      collectedBooks: [BOOK_1, BOOK_2, BOOK_3, BOOK_4],
      identifications: {
        [BOOK_1]: ID_1_CORRECT,
        [BOOK_2]: ID_2_CORRECT,
        [BOOK_3]: ID_3_CORRECT,
        [BOOK_4]: ID_4_CORRECT,
      },
      matches: { [REQ_1]: BOOK_1, [REQ_2]: BOOK_2, [REQ_3]: BOOK_3, [REQ_4]: BOOK_4 },
      mistakes: 0,
      completedShifts: [],
    })
    const result = useAntiquarianStore.getState().endShift()
    expect(result?.seeds).toBe(3)
    expect(result?.progress).toBe(5)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(3)
    expect(useLifePathStore.getState().progress.huzur).toBe(5)
  })

  it('2–3 mistakes → 2 seeds, +3 huzur', () => {
    // 2 wrong identifications, all matched
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0],
      phase: 'match',
      selectedLocation: LOC_ID,
      collectedBooks: [BOOK_1, BOOK_2, BOOK_3, BOOK_4],
      identifications: {
        [BOOK_1]: ID_1_WRONG,     // wrong condition → 1 mistake
        [BOOK_2]: ID_2_CORRECT,
        [BOOK_3]: ID_3_CORRECT,
        [BOOK_4]: ID_4_CORRECT,
      },
      matches: { [REQ_1]: BOOK_1, [REQ_2]: BOOK_2, [REQ_3]: BOOK_3 }, // REQ_4 unmatched → 1 mistake
      mistakes: 0,
      completedShifts: [],
    })
    const result = useAntiquarianStore.getState().endShift()
    expect(result?.seeds).toBe(2)
    expect(result?.progress).toBe(3)
  })

  it('4+ mistakes → 1 seed, +1 huzur', () => {
    // 4 unmatched requests
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0],
      phase: 'match',
      selectedLocation: LOC_ID,
      collectedBooks: [BOOK_D],
      identifications: { [BOOK_D]: { condition: 'fair', period: '1920s' } },
      matches: {},
      mistakes: 0,
      completedShifts: [],
    })
    const result = useAntiquarianStore.getState().endShift()
    expect(result?.seeds).toBe(1)
    expect(result?.progress).toBe(1)
  })

  it('adds to completedShifts and resets active state', () => {
    useAntiquarianStore.setState({
      activeShift: ANTIQUARIAN_SHIFTS[0], phase: 'match',
      selectedLocation: LOC_ID, collectedBooks: [],
      identifications: {}, matches: {}, mistakes: 0, completedShifts: [],
    })
    useAntiquarianStore.getState().endShift()
    const s = useAntiquarianStore.getState()
    expect(s.completedShifts).toContain(SHIFT_ID)
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('briefing')
    expect(s.collectedBooks).toEqual([])
    expect(s.identifications).toEqual({})
    expect(s.matches).toEqual({})
  })

  it('returns null when no active shift', () => {
    expect(useAntiquarianStore.getState().endShift()).toBeNull()
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('antiquarianStore — reset', () => {
  it('clears all state', () => {
    useAntiquarianStore.getState().startShift(SHIFT_ID)
    useAntiquarianStore.getState().endShift()
    useAntiquarianStore.getState().reset()
    const s = useAntiquarianStore.getState()
    expect(s.activeShift).toBeNull()
    expect(s.phase).toBe('briefing')
    expect(s.collectedBooks).toEqual([])
    expect(s.completedShifts).toEqual([])
  })
})
