// src/components/CutscenePlayer.tsx
import { useEffect, useState } from 'react'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { CUTSCENES } from '@/data/cutscenes'
import type { CutsceneFrame } from '@/types/cutscene'

// Placeholder metinlerdeki {{playerName}} ve {{studioName}} yerlerine gerçek değerleri koy
function replacePlaceholders(text: string, name: string, studioName: string): string {
  return text
    .replace(/\{\{playerName\}\}/g, name || 'Sen')
    .replace(/\{\{studioName\}\}/g, studioName || 'Stüdyon')
}

// CSS pixel art arka planları
function SceneBackground({ type }: { type: CutsceneFrame['background'] }) {
  const gridTexture = {
    backgroundImage:
      'repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(0,0,0,0.12) 8px),' +
      'repeating-linear-gradient(90deg,transparent,transparent 7px,rgba(0,0,0,0.12) 8px)',
  } as const

  if (type === 'office') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a0505 0%,#2d0d0d 50%,#1a0505 100%)', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
        {/* Pencere */}
        <div style={{ position: 'absolute', top: 40, left: 60, width: 80, height: 100, background: '#0a1520', border: '4px solid #5a3a2a' }}>
          <div style={{ width: '100%', height: '50%', borderBottom: '4px solid #5a3a2a', background: '#0e2035' }} />
        </div>
        {/* Masa */}
        <div style={{ position: 'absolute', bottom: 90, left: '20%', right: '10%', height: 12, background: '#5a3010', borderTop: '4px solid #7a4a20' }} />
        <div style={{ position: 'absolute', bottom: 78, left: '22%', width: 10, height: 14, background: '#4a2010' }} />
        <div style={{ position: 'absolute', bottom: 78, right: '13%', width: 10, height: 14, background: '#4a2010' }} />
      </div>
    )
  }

  if (type === 'bedroom') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#050518 0%,#0a0a2d 50%,#050518 100%)', imageRendering: 'pixelated' }}>
        <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
        {/* Ay ışıklı pencere */}
        <div style={{ position: 'absolute', top: 30, right: 80, width: 70, height: 90, background: '#0a1530', border: '4px solid #2a2a5a' }}>
          <div style={{ width: '100%', height: '50%', borderBottom: '4px solid #2a2a5a', background: '#0d1f45' }} />
        </div>
        {/* Yatak */}
        <div style={{ position: 'absolute', bottom: 90, left: '15%', width: '40%', height: 16, background: '#3a2a1a', borderTop: '4px solid #5a3a2a' }} />
        <div style={{ position: 'absolute', bottom: 104, left: '15%', width: 24, height: 28, background: '#4a3a2a', border: '4px solid #5a3a2a' }} />
      </div>
    )
  }

  // studio
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#020210 0%,#050520 50%,#020210 100%)', imageRendering: 'pixelated' }}>
      <div style={{ position: 'absolute', inset: 0, ...gridTexture }} />
      {/* Bilgisayar ekranı parıltısı */}
      <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 130, height: 90, background: '#0a1540', border: '4px solid #1a2a6a', boxShadow: '0 0 40px #1a3a8a' }}>
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0d1f55 0%,#1a3a8a 100%)', opacity: 0.8 }} />
      </div>
      {/* Masa */}
      <div style={{ position: 'absolute', bottom: 90, left: '10%', right: '10%', height: 12, background: '#1a1a3a', borderTop: '4px solid #2a2a5a' }} />
    </div>
  )
}

// CSS pixel silüet avatar
function PixelAvatar({ isPlayer }: { isPlayer: boolean }) {
  const bodyColor  = isPlayer ? '#3a5a8a' : '#5a2a2a'
  const headColor  = isPlayer ? '#4a6a9a' : '#6a3a3a'
  const borderColor = '#c8a050'

  return (
    <div style={{
      width: 44,
      height: 44,
      border: `2px solid ${borderColor}`,
      borderRadius: 0,
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
      background: '#1a1a1a',
      imageRendering: 'pixelated',
    }}>
      {/* Gövde */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 22, height: 18, background: bodyColor }} />
      {/* Baş */}
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, background: headColor, borderRadius: '50%' }} />
    </div>
  )
}

export default function CutscenePlayer() {
  const {
    activeCutscene,
    frameIndex,
    lineIndex,
    displayedText,
    isTyping,
    isTransitioning,
    isEnding,
    advance,
    nextFrame,
    endCutscene,
    skip,
  } = useCutsceneStore()

  const playerName  = useCharacterStore((s) => s.name)
  const studioName  = useCharacterStore((s) => s.studioName)

  // Siyah overlay opacity'si: 1 = tam siyah, 0 = sahne görünür
  const [blackOpacity, setBlackOpacity] = useState(1)

  // İlk açılış: siyahtan fade-in
  useEffect(() => {
    const t = setTimeout(() => setBlackOpacity(0), 50)
    return () => clearTimeout(t)
  }, [])

  // Frame geçişi: isTransitioning → fade-out → nextFrame → fade-in
  useEffect(() => {
    if (!isTransitioning) return
    setBlackOpacity(1)
    const t = setTimeout(() => {
      nextFrame()
      setBlackOpacity(0)
    }, 200)
    return () => clearTimeout(t)
  }, [isTransitioning, nextFrame])

  // Sahne bitişi: isEnding → fade-out → endCutscene
  useEffect(() => {
    if (!isEnding) return
    setBlackOpacity(1)
    const t = setTimeout(() => endCutscene(), 400)
    return () => clearTimeout(t)
  }, [isEnding, endCutscene])

  // Typewriter: her 30ms'de bir karakter ekle
  useEffect(() => {
    if (!isTyping || !activeCutscene) return
    const id = setInterval(() => {
      const state = useCutsceneStore.getState()
      if (!state.isTyping || !state.activeCutscene) { clearInterval(id); return }
      const def = CUTSCENES[state.activeCutscene]
      const fullText = def.frames[state.frameIndex].lines[state.lineIndex].text
      if (state.displayedText.length >= fullText.length) {
        useCutsceneStore.getState().finishTyping()
        clearInterval(id)
        return
      }
      useCutsceneStore.getState().tick(fullText[state.displayedText.length])
    }, 30)
    return () => clearInterval(id)
  }, [isTyping, activeCutscene])

  // Klavye: Space / Enter → advance
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  if (!activeCutscene) return null

  const def          = CUTSCENES[activeCutscene]
  const currentFrame = def.frames[frameIndex]
  const currentLine  = currentFrame.lines[lineIndex]
  const isPlayer     = currentLine.speaker.includes('{{playerName}}')
  const speakerName  = replacePlaceholders(currentLine.speaker, playerName, studioName)
  const lineText     = replacePlaceholders(displayedText, playerName, studioName)

  function handleSkip() {
    setBlackOpacity(1)
    setTimeout(() => skip(), 400)
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={advance}
    >
      {/* Sahne arka planı */}
      <SceneBackground type={currentFrame.background} />

      {/* Atla butonu */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSkip() }}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(0,0,0,0.5)', color: '#ccc',
          border: '1px solid #555', padding: '4px 10px',
          fontSize: 12, cursor: 'pointer', zIndex: 10,
          fontFamily: 'monospace',
        }}
      >
        Atla &gt;&gt;
      </button>

      {/* Diyalog kutusu */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#faf0d8',
        borderTop: '3px solid #c8a050',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        minHeight: 72,
        zIndex: 10,
      }}>
        <PixelAvatar isPlayer={isPlayer} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#7a4a1e', marginBottom: 4, fontFamily: 'monospace' }}>
            {speakerName}
          </div>
          <div style={{ fontSize: 13, color: '#3a2a1a', fontFamily: 'monospace', lineHeight: 1.5 }}>
            {lineText}
            {isTyping && <span style={{ animation: 'none' }}>_</span>}
          </div>
        </div>
        {!isTyping && (
          <div style={{ fontSize: 16, color: '#9a7a4a', alignSelf: 'flex-end' }}>▶</div>
        )}
      </div>

      {/* Siyah overlay — fade geçişleri için */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        opacity: blackOpacity,
        transition: 'opacity 400ms ease',
        pointerEvents: 'none',
        zIndex: 20,
      }} />
    </div>
  )
}
