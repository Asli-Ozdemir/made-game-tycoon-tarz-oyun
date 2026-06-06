import { useEffect, useRef, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import { useGameStore } from '@/store/gameStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import logoSrc   from '@/assets/icons/logo_magenta_reach.png'
import waterLoop from '@/assets/icons/water_loop.mp4'

export default function StartScreen() {
  const slots              = useSaveStore((s) => s.slots)
  const setActiveSlot      = useSaveStore((s) => s.setActiveSlot)
  const setShowStartScreen = useSaveStore((s) => s.setShowStartScreen)
  const load               = useSaveStore((s) => s.load)
  const initSlots          = useSaveStore((s) => s.initSlots)

  const [overlay, setOverlay] = useState<'none' | 'new' | 'continue'>('none')
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const vidRef  = useRef<HTMLVideoElement | null>(null)

  useEffect(() => { initSlots() }, [initSlots])

  useEffect(() => {
    if (wrapRef.current && typeof wrapRef.current.animate === 'function')
      wrapRef.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards', easing: 'ease-out' })
  }, [])


  async function handleContinue(slotId: 1 | 2 | 3) {
    await load(slotId)
    setShowStartScreen(false)
  }

  function handleNewGame(slotId: 1 | 2 | 3) {
    setActiveSlot(slotId)
    setShowStartScreen(false)
    useCutsceneStore.getState().startCutsceneForce('kovulma')
    useGameStore.getState().setGamePhase('intro')
  }

  const hasSave = slots.some((s) => !s.isEmpty)

  return (
    <div ref={wrapRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden', opacity: 0 }}>

      {/* Background video */}
      <video ref={vidRef} src={waterLoop} autoPlay loop muted playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
      />

      {/* Logo */}
      <img
        src={logoSrc}
        alt="Magenta Reach"
        style={{
          position: 'absolute',
          right: '17%',
          top: '6%',
          imageRendering: 'pixelated',
          width: 280, height: 79,
          maxWidth: '45vw',
          objectFit: 'contain',
          zIndex: 10,
          filter: 'drop-shadow(0 0 16px rgba(255,45,155,0.8))',
        }}
      />

      {/* Menu buttons */}
      <div style={{
        position: 'absolute',
        right: '18%',
        top: '24%',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
        zIndex: 10,
        whiteSpace: 'nowrap',
      }}>
        <MenuButton onClick={() => setOverlay('new')} color="magenta">NEW GAME</MenuButton>
        <MenuButton onClick={() => hasSave ? setOverlay('continue') : undefined} color="white" disabled={!hasSave}>CONTINUE</MenuButton>
        <button
          onClick={() => window.close()}
          style={{ padding: '4px 24px', border: 'none', color: '#666688', background: 'transparent', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#9999aa' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#666688' }}
        >EXIT</button>
      </div>

      {/* Slot picker */}
      {overlay !== 'none' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,2,15,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOverlay('none') }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 32 }}>
            <div style={{ color: '#c8a87a', fontFamily: 'monospace', fontSize: 10, letterSpacing: 4, opacity: 0.7 }}>
              {overlay === 'new' ? 'SELECT SLOT' : 'LOAD GAME'}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {slots.map((slot) => {
                const isDisabled = overlay === 'continue' && slot.isEmpty
                return (
                  <button
                    key={slot.slotId}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return
                      overlay === 'new' ? handleNewGame(slot.slotId) : handleContinue(slot.slotId)
                    }}
                    style={{
                      width: 140, padding: '16px 12px',
                      background: 'rgba(20,10,40,0.9)',
                      border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.06)' : 'rgba(192,24,95,0.4)'}`,
                      borderRadius: 4, cursor: isDisabled ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = 'rgba(192,24,95,0.9)' }}
                    onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = 'rgba(192,24,95,0.4)' }}
                  >
                    <div style={{ color: '#888899', fontFamily: 'monospace', fontSize: 8, letterSpacing: 2 }}>SLOT {slot.slotId}</div>
                    {slot.isEmpty ? (
                      <div style={{ color: isDisabled ? '#333344' : '#f0a0c0', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
                        {isDisabled ? '— empty —' : '+ new game'}
                      </div>
                    ) : (
                      <>
                        <div style={{ color: '#e8d5b0', fontFamily: 'monospace', fontSize: 10 }}>{slot.label}</div>
                        <div style={{ color: '#665544', fontFamily: 'monospace', fontSize: 8 }}>{new Date(slot.savedAt).toLocaleDateString('en-GB')}</div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setOverlay('none')}
              style={{ color: '#444455', fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
              BACK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MenuButton ───────────────────────────────────────────────────
function MenuButton({ children, onClick, color, disabled = false }: {
  children: React.ReactNode
  onClick?: () => void
  color: 'magenta' | 'white'
  disabled?: boolean
}) {
  const isMagenta  = color === 'magenta'
  const borderBase = isMagenta ? 'rgba(240,60,130,0.85)' : 'rgba(255,255,255,0.4)'
  const borderHov  = isMagenta ? 'rgba(255,80,160,1)'    : 'rgba(255,255,255,0.9)'
  const textColor  = disabled ? '#444458' : isMagenta ? '#ffffff' : '#ddddff'
  const bgBase     = isMagenta && !disabled ? 'rgba(192,24,95,0.25)' : 'rgba(0,0,0,0.25)'
  const bgHov      = isMagenta && !disabled ? 'rgba(192,24,95,0.45)' : 'rgba(255,255,255,0.08)'
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: '8px 32px',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : borderBase}`,
        color: textColor,
        background: bgBase,
        fontFamily: 'monospace', fontSize: 12, letterSpacing: 4,
        borderRadius: 2, cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        textShadow: isMagenta && !disabled ? '0 0 8px rgba(255,100,180,0.8)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor  = borderHov
        e.currentTarget.style.background   = bgHov
        e.currentTarget.style.boxShadow    = isMagenta
          ? '0 0 16px rgba(220,40,120,0.5)'
          : '0 0 10px rgba(255,255,255,0.15)'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = borderBase
        e.currentTarget.style.background  = bgBase
        e.currentTarget.style.boxShadow   = 'none'
      }}
    >{children}</button>
  )
}
