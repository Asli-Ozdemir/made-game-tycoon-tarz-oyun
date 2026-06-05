import { useEffect, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import logoSrc from '@/assets/icons/logo_magenta_reach.png'
import bgSrc   from '@/assets/icons/title_screen.png'

// ── Animated overlay data ────────────────────────────────────────
// Star positions match title_screen_create.lua STARS array (px/320, px/180 → %)
const STARS = [
  { left:  '6%', top:  '4%', dur: '3.2s', delay: '0.0s' },
  { left: '27%', top:  '8%', dur: '2.1s', delay: '0.7s' },
  { left: '44%', top:  '3%', dur: '3.8s', delay: '1.4s' },
  { left: '61%', top: '12%', dur: '2.5s', delay: '0.3s' },
  { left: '81%', top:  '7%', dur: '4.0s', delay: '1.1s' },
  { left: '95%', top: '16%', dur: '2.8s', delay: '0.9s' },
  { left: '17%', top: '19%', dur: '3.5s', delay: '0.5s' },
  { left: '38%', top: '23%', dur: '2.3s', delay: '1.8s' },
  { left: '72%', top: '10%', dur: '2.9s', delay: '0.4s' },
  { left: '88%', top: '22%', dur: '3.6s', delay: '1.2s' },
]

const RAIN_DROPS = Array.from({ length: 32 }, (_, i) => {
  const dur   = (0.45 + (i % 6) * 0.11).toFixed(2)
  const delay = ((i * 0.14) % 1.2).toFixed(2)
  return {
    left:      `${(i * 3.2 + 1) % 100}%`,
    height:    18 + (i % 8) * 3,
    animation: `fall ${dur}s linear ${delay}s infinite`,
  }
})

// ── Component ────────────────────────────────────────────────────
export default function StartScreen() {
  const slots              = useSaveStore((s) => s.slots)
  const setActiveSlot      = useSaveStore((s) => s.setActiveSlot)
  const setShowStartScreen = useSaveStore((s) => s.setShowStartScreen)
  const load               = useSaveStore((s) => s.load)
  const initSlots          = useSaveStore((s) => s.initSlots)

  const [overlay, setOverlay] = useState<'none' | 'new' | 'continue'>('none')

  useEffect(() => { initSlots() }, [initSlots])

  async function handleContinue(slotId: 1 | 2 | 3) {
    await load(slotId)
    setShowStartScreen(false)
  }

  function handleNewGame(slotId: 1 | 2 | 3) {
    setActiveSlot(slotId)
    setShowStartScreen(false)
  }

  const hasSave = slots.some((s) => !s.isEmpty)

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', animation: 'titleFadeIn 1s forwards' }}>

      {/* Background: Aseprite pixel art PNG (320×180) */}
      <img
        src={bgSrc}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'fill',
        }}
      />

      {/* Animated star twinkle — positions match stars layer */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', top: s.top, left: s.left,
          width: 2, height: 2, borderRadius: '50%',
          background: '#ffffff',
          animation: `twinkle ${s.dur} ease-in-out ${s.delay} infinite`,
        }} />
      ))}

      {/* House window glow — house left:10-25%, top:44-75% on 320×180 canvas */}
      <div style={{
        position: 'absolute',
        left: '14%',
        top: '46%',
        width: 16, height: 12,
        background: 'rgba(255,190,70,0.0)',
        boxShadow: '0 0 12px 5px rgba(255,180,60,0.32)',
        borderRadius: 2,
        animation: 'garageLight 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: '11%',
        top: '46%',
        width: 12, height: 10,
        background: 'rgba(255,180,60,0.0)',
        boxShadow: '0 0 8px 3px rgba(255,180,60,0.25)',
        borderRadius: 1,
        animation: 'garageLight 2.5s ease-in-out 0.4s infinite',
        pointerEvents: 'none',
      }} />

      {/* Rain drops */}
      {RAIN_DROPS.map((r, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0,
          left: r.left, width: 1, height: r.height,
          background: 'linear-gradient(transparent, rgba(160,196,255,0.6))',
          animation: r.animation,
        }} />
      ))}

      {/* Logo + menu */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}>
        <img
          src={logoSrc}
          alt="Magenta Reach"
          style={{ imageRendering: 'pixelated', width: 384, height: 108, maxWidth: '80vw', objectFit: 'contain' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 8 }}>
          <MenuButton onClick={() => setOverlay('new')} color="magenta">NEW GAME</MenuButton>
          <MenuButton onClick={() => hasSave ? setOverlay('continue') : undefined} color="white" disabled={!hasSave}>CONTINUE</MenuButton>
          <button
            onClick={() => window.close()}
            style={{ padding: '4px 24px', border: 'none', color: '#666688', background: 'transparent', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9999aa' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666688' }}
          >EXIT</button>
        </div>
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
  const borderBase = isMagenta ? 'rgba(220,55,115,0.5)' : 'rgba(255,255,255,0.15)'
  const borderHov  = isMagenta ? 'rgba(220,55,115,1)'   : 'rgba(255,255,255,0.4)'
  const textColor  = disabled ? '#444458' : isMagenta ? '#f0a0c0' : '#aaaacc'
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: '6px 24px',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : borderBase}`,
        color: textColor,
        background: isMagenta && !disabled ? 'rgba(192,24,95,0.08)' : 'transparent',
        fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
        borderRadius: 2, cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = borderHov
        if (isMagenta) e.currentTarget.style.boxShadow = '0 0 10px rgba(192,24,95,0.35)'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = borderBase
        e.currentTarget.style.boxShadow   = 'none'
      }}
    >{children}</button>
  )
}
