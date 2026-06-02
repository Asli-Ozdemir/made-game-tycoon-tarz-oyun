// src/store/__tests__/fishingStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useFishingStore } from '../fishingStore'
import { useIdeaSeedStore } from '../ideaSeedStore'
import { useLifePathStore } from '../lifePathStore'
import { FISHING_SESSIONS } from '@/data/fishingSessions'

// ─── Reset helper ─────────────────────────────────────────────────────────────

function resetAll() {
  useFishingStore.setState({
    completedSessions: [],
    activeSession: null,
    phase: 'idle',
    currentCastIndex: 0,
    selectedSpotId: null,
    selectedLureId: null,
    catchLog: [],
    unlockedFragments: [],
    storyBeatIndex: 0,
  })
  useIdeaSeedStore.setState(s => ({ seeds: { ...s.seeds, nostalji: 0, hikaye: 0 } }))
  useLifePathStore.setState({ progress: { hirs: 0, huzur: 0, emek: 0 }, activePathId: null })
}

// ─── Jigging phase helper ─────────────────────────────────────────────────────

function reachJigging(sessionId = 'fishing_01') {
  useFishingStore.getState().startSession(sessionId)
  useFishingStore.getState().advanceFromBriefing()
  // fishing_05 and fishing_06 and fishing_08 don't have open_water
  const spotId = ['fishing_05', 'fishing_06', 'fishing_08'].includes(sessionId)
    ? 'rocky_edge'
    : 'open_water'
  useFishingStore.getState().selectSpot(spotId)
  useFishingStore.getState().selectLure('live_bait')
  // phase is now 'jigging'
}

beforeEach(resetAll)

// ─── startSession ─────────────────────────────────────────────────────────────

describe('fishingStore — startSession', () => {
  it('sets activeSession.id and phase becomes briefing', () => {
    useFishingStore.getState().startSession('fishing_01')
    const s = useFishingStore.getState()
    expect(s.activeSession?.id).toBe('fishing_01')
    expect(s.phase).toBe('briefing')
  })

  it('resets currentCastIndex, catchLog, and unlockedFragments on start', () => {
    // Pre-dirty the store
    useFishingStore.setState({ currentCastIndex: 5, catchLog: [{castIndex:0, spotId:'open_water', lureId:'live_bait', species:'mackerel'}], unlockedFragments: ['frag_x'] })
    useFishingStore.getState().startSession('fishing_01')
    const s = useFishingStore.getState()
    expect(s.currentCastIndex).toBe(0)
    expect(s.catchLog).toEqual([])
    expect(s.unlockedFragments).toEqual([])
  })

  it('does nothing for unknown session id', () => {
    useFishingStore.getState().startSession('fishing_99')
    expect(useFishingStore.getState().activeSession).toBeNull()
    expect(useFishingStore.getState().phase).toBe('idle')
  })

  it('does nothing when a session is already active', () => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.getState().startSession('fishing_02')
    expect(useFishingStore.getState().activeSession?.id).toBe('fishing_01')
  })
})

// ─── advanceFromBriefing ──────────────────────────────────────────────────────

describe('fishingStore — advanceFromBriefing', () => {
  it('briefing → spot_select', () => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.getState().advanceFromBriefing()
    expect(useFishingStore.getState().phase).toBe('spot_select')
  })

  it('does nothing when not in briefing phase', () => {
    useFishingStore.setState({
      activeSession: FISHING_SESSIONS[0], phase: 'spot_select',
      completedSessions: [], currentCastIndex: 0,
      selectedSpotId: null, selectedLureId: null,
      catchLog: [], unlockedFragments: [], storyBeatIndex: 0,
    })
    useFishingStore.getState().advanceFromBriefing()
    expect(useFishingStore.getState().phase).toBe('spot_select') // unchanged
  })
})

// ─── selectSpot ───────────────────────────────────────────────────────────────

describe('fishingStore — selectSpot', () => {
  beforeEach(() => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.getState().advanceFromBriefing()
    // now in spot_select
  })

  it('sets selectedSpotId and phase → lure_select', () => {
    useFishingStore.getState().selectSpot('open_water')
    const s = useFishingStore.getState()
    expect(s.selectedSpotId).toBe('open_water')
    expect(s.phase).toBe('lure_select')
  })

  it('does nothing for a spot not in the session', () => {
    useFishingStore.getState().selectSpot('pier_tip') // not in fishing_01
    expect(useFishingStore.getState().selectedSpotId).toBeNull()
    expect(useFishingStore.getState().phase).toBe('spot_select')
  })

  it('does nothing when not in spot_select phase', () => {
    // Force to lure_select phase
    useFishingStore.setState(s => ({ ...s, phase: 'lure_select' }))
    useFishingStore.getState().selectSpot('open_water')
    // selectedSpotId was already null; phase still lure_select
    expect(useFishingStore.getState().phase).toBe('lure_select')
    expect(useFishingStore.getState().selectedSpotId).toBeNull()
  })
})

// ─── selectLure ───────────────────────────────────────────────────────────────

describe('fishingStore — selectLure', () => {
  beforeEach(() => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.getState().advanceFromBriefing()
    useFishingStore.getState().selectSpot('open_water')
    // now in lure_select
  })

  it('sets selectedLureId and phase → jigging', () => {
    useFishingStore.getState().selectLure('live_bait')
    const s = useFishingStore.getState()
    expect(s.selectedLureId).toBe('live_bait')
    expect(s.phase).toBe('jigging')
  })

  it('does nothing for an unknown lure id', () => {
    useFishingStore.getState().selectLure('magic_lure')
    expect(useFishingStore.getState().selectedLureId).toBeNull()
    expect(useFishingStore.getState().phase).toBe('lure_select')
  })

  it('does nothing when not in lure_select phase', () => {
    useFishingStore.setState(s => ({ ...s, phase: 'spot_select' }))
    useFishingStore.getState().selectLure('live_bait')
    expect(useFishingStore.getState().phase).toBe('spot_select')
    expect(useFishingStore.getState().selectedLureId).toBeNull()
  })
})

// ─── advanceCast ──────────────────────────────────────────────────────────────

describe('fishingStore — advanceCast', () => {
  it('increments currentCastIndex', () => {
    reachJigging()
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().currentCastIndex).toBe(1)
  })

  it('records catch in catchLog when caught=true', () => {
    reachJigging()
    useFishingStore.getState().advanceCast(true, 'mackerel')
    const { catchLog } = useFishingStore.getState()
    expect(catchLog).toHaveLength(1)
    expect(catchLog[0].species).toBe('mackerel')
  })

  it('does not add to catchLog when caught=false', () => {
    reachJigging()
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().catchLog).toHaveLength(0)
  })

  it('clears selectedSpotId and selectedLureId after cast', () => {
    reachJigging()
    useFishingStore.getState().advanceCast(false)
    const s = useFishingStore.getState()
    expect(s.selectedSpotId).toBeNull()
    expect(s.selectedLureId).toBeNull()
  })

  it('phase → story_beat when more casts remain', () => {
    // fishing_01 has castCount=3; after first cast nextIndex=1 < 3
    reachJigging('fishing_01')
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().phase).toBe('story_beat')
  })

  it('phase → result on last cast', () => {
    // fishing_01 castCount=3; we need to be at castIndex=2 before the last advance
    reachJigging('fishing_01')
    // cast 0 → story_beat
    useFishingStore.getState().advanceCast(false)
    // choose dialogue to go back to spot_select
    useFishingStore.getState().chooseDialogue('c_01_1a')
    // select spot + lure again
    useFishingStore.getState().selectSpot('open_water')
    useFishingStore.getState().selectLure('live_bait')
    // cast 1 → story_beat
    useFishingStore.getState().advanceCast(false)
    useFishingStore.getState().chooseDialogue('c_01_2a')
    // select spot + lure again
    useFishingStore.getState().selectSpot('open_water')
    useFishingStore.getState().selectLure('live_bait')
    // cast 2 → result (last cast, nextIndex=3 >= 3)
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().phase).toBe('result')
  })

  it('does nothing when not in jigging phase', () => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.getState().advanceFromBriefing()
    // phase is spot_select, not jigging
    useFishingStore.getState().advanceCast(false)
    expect(useFishingStore.getState().currentCastIndex).toBe(0)
  })
})

// ─── chooseDialogue ───────────────────────────────────────────────────────────

describe('fishingStore — chooseDialogue', () => {
  // Reach story_beat: fishing_01 castCount=3, first cast leaves nextIndex=1 < 3
  function reachStoryBeat() {
    reachJigging('fishing_01')
    useFishingStore.getState().advanceCast(false)
    // phase is now story_beat
  }

  it('unlocks fragment when choice has fragmentId', () => {
    reachStoryBeat()
    useFishingStore.getState().chooseDialogue('c_01_1b') // fragmentId: 'frag_lighthouse_01'
    expect(useFishingStore.getState().unlockedFragments).toContain('frag_lighthouse_01')
  })

  it('does not unlock when fragmentId is null', () => {
    reachStoryBeat()
    useFishingStore.getState().chooseDialogue('c_01_1a') // fragmentId: null
    expect(useFishingStore.getState().unlockedFragments).toHaveLength(0)
  })

  it('advances storyBeatIndex', () => {
    reachStoryBeat()
    expect(useFishingStore.getState().storyBeatIndex).toBe(0)
    useFishingStore.getState().chooseDialogue('c_01_1a')
    expect(useFishingStore.getState().storyBeatIndex).toBe(1)
  })

  it('does not add duplicate fragment', () => {
    reachStoryBeat()
    useFishingStore.getState().chooseDialogue('c_01_1b') // unlocks frag_lighthouse_01
    // Manually force back to story_beat with same beat (simulate)
    useFishingStore.setState(s => ({ ...s, phase: 'story_beat', storyBeatIndex: 0 }))
    useFishingStore.getState().chooseDialogue('c_01_1b')
    expect(useFishingStore.getState().unlockedFragments.filter(f => f === 'frag_lighthouse_01')).toHaveLength(1)
  })

  it('phase → spot_select after choice', () => {
    reachStoryBeat()
    useFishingStore.getState().chooseDialogue('c_01_1a')
    expect(useFishingStore.getState().phase).toBe('spot_select')
  })

  it('does nothing for unknown choiceId', () => {
    reachStoryBeat()
    useFishingStore.getState().chooseDialogue('c_unknown_99')
    expect(useFishingStore.getState().phase).toBe('story_beat')
    expect(useFishingStore.getState().storyBeatIndex).toBe(0)
  })

  it('does nothing when not in story_beat phase', () => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.getState().advanceFromBriefing()
    // phase is spot_select
    useFishingStore.getState().chooseDialogue('c_01_1a')
    expect(useFishingStore.getState().storyBeatIndex).toBe(0)
  })
})

// ─── endSession ───────────────────────────────────────────────────────────────

describe('fishingStore — endSession', () => {
  function forceResult(sessionId: string, catches: number, fragments: string[] = []) {
    const session = FISHING_SESSIONS.find(s => s.id === sessionId)!
    const catchLog = Array.from({ length: catches }, (_, i) => ({
      castIndex: i,
      spotId: 'open_water',
      lureId: 'live_bait',
      species: 'mackerel',
    }))
    useFishingStore.setState({
      activeSession: session,
      phase: 'result',
      completedSessions: [],
      currentCastIndex: session.castCount,
      selectedSpotId: null,
      selectedLureId: null,
      catchLog,
      unlockedFragments: fragments,
      storyBeatIndex: 0,
    })
  }

  it('0 catches → nostalji+1, hikaye+0, huzur+1', () => {
    forceResult('fishing_01', 0)
    const result = useFishingStore.getState().endSession()
    expect(result).not.toBeNull()
    expect(result!.nostaljiSeeds).toBe(1)
    expect(result!.hikayeSeeds).toBe(0)
    expect(result!.progress).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(1)
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(0)
    expect(useLifePathStore.getState().progress.huzur).toBe(1)
  })

  it('1–2 catches → nostalji+2, hikaye+1(+frags), huzur+3', () => {
    forceResult('fishing_01', 1)
    const result = useFishingStore.getState().endSession()
    expect(result!.nostaljiSeeds).toBe(2)
    expect(result!.hikayeSeeds).toBe(1)
    expect(result!.progress).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(2)
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(1)
    expect(useLifePathStore.getState().progress.huzur).toBe(3)
  })

  it('3+ catches → nostalji+3, hikaye+2(+frags), huzur+5', () => {
    forceResult('fishing_01', 3)
    const result = useFishingStore.getState().endSession()
    expect(result!.nostaljiSeeds).toBe(3)
    expect(result!.hikayeSeeds).toBe(2)
    expect(result!.progress).toBe(5)
    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(2)
    expect(useLifePathStore.getState().progress.huzur).toBe(5)
  })

  it('fragment count adds to hikaye', () => {
    forceResult('fishing_01', 1, ['frag_a', 'frag_b'])
    const result = useFishingStore.getState().endSession()
    // 1 catch → base hikaye=1, +2 fragments = 3
    expect(result!.hikayeSeeds).toBe(3)
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(3)
  })

  it('adds to completedSessions and resets activeSession and catchLog', () => {
    forceResult('fishing_01', 2)
    useFishingStore.getState().endSession()
    const s = useFishingStore.getState()
    expect(s.completedSessions).toContain('fishing_01')
    expect(s.activeSession).toBeNull()
    expect(s.catchLog).toEqual([])
    expect(s.phase).toBe('idle')
  })

  it('returns null when phase is not result', () => {
    useFishingStore.getState().startSession('fishing_01')
    // phase is briefing
    const result = useFishingStore.getState().endSession()
    expect(result).toBeNull()
  })
})

// ─── session10 bonus ──────────────────────────────────────────────────────────

describe('fishingStore — session10 arc bonus', () => {
  it('endSession with fishing_10 active adds hikaye+5 bonus on top of base reward', () => {
    const session10 = FISHING_SESSIONS.find(s => s.id === 'fishing_10')!
    useFishingStore.setState({
      activeSession: session10,
      phase: 'result',
      completedSessions: [],
      currentCastIndex: session10.castCount,
      selectedSpotId: null,
      selectedLureId: null,
      catchLog: [], // 0 catches → base hikaye=0, +5 bonus = 5
      unlockedFragments: [],
      storyBeatIndex: 0,
    })
    const result = useFishingStore.getState().endSession()
    expect(result).not.toBeNull()
    expect(result!.hikayeSeeds).toBe(5)  // 0 base + 5 bonus
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(5)
  })
})

// ─── reset ────────────────────────────────────────────────────────────────────

describe('fishingStore — reset', () => {
  it('clears all state including completedSessions and sets phase to idle', () => {
    useFishingStore.getState().startSession('fishing_01')
    useFishingStore.setState(s => ({ ...s, completedSessions: ['fishing_01'] }))
    useFishingStore.getState().reset()
    const s = useFishingStore.getState()
    expect(s.activeSession).toBeNull()
    expect(s.phase).toBe('idle')
    expect(s.completedSessions).toEqual([])
    expect(s.currentCastIndex).toBe(0)
    expect(s.catchLog).toEqual([])
    expect(s.unlockedFragments).toEqual([])
    expect(s.selectedSpotId).toBeNull()
    expect(s.selectedLureId).toBeNull()
    expect(s.storyBeatIndex).toBe(0)
  })
})
