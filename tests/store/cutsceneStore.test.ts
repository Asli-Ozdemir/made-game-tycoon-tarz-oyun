// tests/store/cutsceneStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useCharacterStore } from '@/store/characterStore'
import { getCutsceneFrames } from '@/data/cutscenes'

function resetAll() {
  useCutsceneStore.getState().reset()
  useDayTimeStore.getState().reset()
  useCharacterStore.setState({ background: 'kk_uzmani' })
}

beforeEach(resetAll)

describe('cutsceneStore — 4C', () => {
  it('başlangıçta resolutionChoice null', () => {
    expect(useCutsceneStore.getState().resolutionChoice).toBeNull()
  })

  it('startCutsceneForce seen kontrolü yapmadan sahneyi açar', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['nexus_meeting']) })
    useCutsceneStore.getState().startCutsceneForce('nexus_meeting')
    expect(useCutsceneStore.getState().activeCutscene).toBe('nexus_meeting')
  })

  it('nexus_notice aktif arkaplana göre doğru varyantı oynatır', () => {
    useCharacterStore.setState({ background: 'eski_ceo' })
    const expected = getCutsceneFrames('nexus_notice', { background: 'eski_ceo' })[0].lines[0].text
    useCutsceneStore.getState().startCutsceneForce('nexus_notice')
    useCutsceneStore.getState().finishTyping()
    expect(useCutsceneStore.getState().displayedText).toBe(expected)
  })

  it('nexus_resolution resolutionChoice\'a göre doğru finali oynatır', () => {
    useCutsceneStore.getState().setResolutionChoice('forgive')
    const expected = getCutsceneFrames('nexus_resolution', { background: 'kk_uzmani', choice: 'forgive' })[0].lines[0].text
    useCutsceneStore.getState().startCutsceneForce('nexus_resolution')
    useCutsceneStore.getState().finishTyping()
    expect(useCutsceneStore.getState().displayedText).toBe(expected)
  })

  it('advance son frame son satırda isEnding set eder (nexus_meeting tek frame)', () => {
    useCutsceneStore.getState().startCutsceneForce('nexus_meeting')
    const frames = getCutsceneFrames('nexus_meeting', { background: 'kk_uzmani' })
    useCutsceneStore.setState({ frameIndex: 0, lineIndex: frames[0].lines.length - 1, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isEnding).toBe(true)
  })

  it('endCutscene resolutionChoice\'u temizler', () => {
    useCutsceneStore.getState().setResolutionChoice('destroy')
    useCutsceneStore.getState().startCutsceneForce('nexus_resolution')
    useCutsceneStore.setState({ isEnding: true })
    useCutsceneStore.getState().endCutscene()
    expect(useCutsceneStore.getState().resolutionChoice).toBeNull()
  })

  it('reset resolutionChoice\'u temizler', () => {
    useCutsceneStore.getState().setResolutionChoice('merge')
    useCutsceneStore.getState().reset()
    expect(useCutsceneStore.getState().resolutionChoice).toBeNull()
  })
})
