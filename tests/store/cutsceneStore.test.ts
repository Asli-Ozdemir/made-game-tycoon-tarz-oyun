// tests/store/cutsceneStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useDayTimeStore } from '@/store/dayTimeStore'

function resetAll() {
  useCutsceneStore.setState({
    activeCutscene:  null,
    frameIndex:      0,
    lineIndex:       0,
    displayedText:   '',
    isTyping:        false,
    isTransitioning: false,
    isEnding:        false,
    seenCutscenes:   new Set(),
  })
  useDayTimeStore.getState().reset()
}

beforeEach(resetAll)

describe('cutsceneStore', () => {
  it('başlangıç state\'i doğru', () => {
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(false)
    expect(s.isTransitioning).toBe(false)
    expect(s.isEnding).toBe(false)
    expect(s.seenCutscenes.size).toBe(0)
  })

  it('startCutscene sahneyi başlatır ve index\'leri sıfırlar', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBe('kovulma')
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(true)
  })

  it('startCutscene oyunu duraklatır', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    expect(useDayTimeStore.getState().isPaused).toBe(true)
  })

  it('startCutscene seenCutscenes\'te varsa hiçbir şey yapmaz', () => {
    useCutsceneStore.setState({ seenCutscenes: new Set(['kovulma']) })
    useCutsceneStore.getState().startCutscene('kovulma')
    expect(useCutsceneStore.getState().activeCutscene).toBeNull()
  })

  it('advance — isTyping true\'yken finishTyping çağırır', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ displayedText: 'kısa', isTyping: true })
    useCutsceneStore.getState().advance()
    const s = useCutsceneStore.getState()
    expect(s.isTyping).toBe(false)
    expect(s.displayedText).not.toBe('kısa')
  })

  it('advance — sonraki satıra geçer', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isTyping: false })
    useCutsceneStore.getState().advance()
    const s = useCutsceneStore.getState()
    expect(s.lineIndex).toBe(1)
    expect(s.displayedText).toBe('')
    expect(s.isTyping).toBe(true)
  })

  it('advance — son satırda frame geçişini başlatır', () => {
    // kovulma kk_uzmani frame 0 = 7 satır (index 0..6) → son satır index 6
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ lineIndex: 6, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isTransitioning).toBe(true)
    expect(useCutsceneStore.getState().frameIndex).toBe(0)
  })

  it('nextFrame — frameIndex\'i artırır ve isTransitioning\'i temizler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ lineIndex: 2, isTyping: false, isTransitioning: true })
    useCutsceneStore.getState().nextFrame()
    const s = useCutsceneStore.getState()
    expect(s.frameIndex).toBe(1)
    expect(s.lineIndex).toBe(0)
    expect(s.isTransitioning).toBe(false)
    expect(s.isTyping).toBe(true)
    expect(s.displayedText).toBe('')
  })

  it('advance — son frame\'in son satırında isEnding\'i set eder', () => {
    // kovulma kk_uzmani son frame = index 3 (coast), 5 satır (index 0..4)
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ frameIndex: 3, lineIndex: 4, isTyping: false })
    useCutsceneStore.getState().advance()
    expect(useCutsceneStore.getState().isEnding).toBe(true)
    expect(useCutsceneStore.getState().activeCutscene).toBe('kovulma')
  })

  it('endCutscene — sahneyi kapatır ve seenCutscenes\'e ekler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.setState({ isEnding: true })
    useCutsceneStore.getState().endCutscene()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.has('kovulma')).toBe(true)
    expect(s.isEnding).toBe(false)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('skip — sahneyi kapatır, seenCutscenes\'e ekler, oyunu devam ettirir', () => {
    useCutsceneStore.getState().startCutscene('ilk_yayin')
    useCutsceneStore.getState().skip()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.has('ilk_yayin')).toBe(true)
    expect(useDayTimeStore.getState().isPaused).toBe(false)
  })

  it('reset — tüm state\'i ve seenCutscenes\'i temizler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().skip()
    useCutsceneStore.getState().reset()
    const s = useCutsceneStore.getState()
    expect(s.activeCutscene).toBeNull()
    expect(s.seenCutscenes.size).toBe(0)
    expect(s.frameIndex).toBe(0)
    expect(s.lineIndex).toBe(0)
  })

  it('tick — displayedText\'e karakter ekler', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().tick('M')
    useCutsceneStore.getState().tick('e')
    useCutsceneStore.getState().tick('r')
    expect(useCutsceneStore.getState().displayedText).toBe('Mer')
  })

  it('finishTyping — mevcut satırın tüm metnini gösterir', () => {
    useCutsceneStore.getState().startCutscene('kovulma')
    useCutsceneStore.getState().finishTyping()
    const s = useCutsceneStore.getState()
    expect(s.displayedText).toBe('Otur, {{playerName}}. Uzun tutmayacağım.')
    expect(s.isTyping).toBe(false)
  })
})
