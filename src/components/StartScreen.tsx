import { useEffect, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import logoSrc from '@/assets/icons/logo_magenta_reach.png'

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
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0a0510' }}>

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
          <button onClick={() => setOverlay('new')}
            style={{ padding: '6px 24px', border: '1px solid rgba(220,55,115,0.5)', color: '#f0a0c0', background: 'rgba(192,24,95,0.08)', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, borderRadius: 2, cursor: 'pointer' }}>
            NEW GAME
          </button>
          <button onClick={() => hasSave ? setOverlay('continue') : undefined} disabled={!hasSave}
            style={{ padding: '6px 24px', border: `1px solid ${hasSave ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`, color: hasSave ? '#aaaacc' : '#444458', background: 'transparent', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, borderRadius: 2, cursor: hasSave ? 'pointer' : 'default' }}>
            CONTINUE
          </button>
          <button onClick={() => window.close()}
            style={{ padding: '4px 24px', border: 'none', color: '#666688', background: 'transparent', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, cursor: 'pointer' }}>
            EXIT
          </button>
        </div>
      </div>

      {/* Slot picker */}
      {overlay !== 'none' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,2,15,0.85)' }}
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
                    }}
                  >
                    <div style={{ color: '#888899', fontFamily: 'monospace', fontSize: 8, letterSpacing: 2 }}>SLOT {slot.slotId}</div>
                    {slot.isEmpty ? (
                      <div style={{ color: isDisabled ? '#333344' : '#f0a0c0', fontFamily: 'monospace', fontSize: 10 }}>
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
