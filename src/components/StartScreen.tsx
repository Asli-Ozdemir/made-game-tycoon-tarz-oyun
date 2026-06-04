import { useEffect, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import logoSrc from '@/assets/icons/logo_magenta_reach.png'

// ── Static data ─────────────────────────────────────────

const STARS = [
  { top: '8%',  left: '14%', size: 2, dur: '3.2s', delay: '0.0s' },
  { top: '13%', left: '55%', size: 1, dur: '2.1s', delay: '0.7s' },
  { top: '6%',  left: '78%', size: 2, dur: '3.8s', delay: '1.4s' },
  { top: '18%', left: '32%', size: 1, dur: '2.5s', delay: '0.3s' },
  { top: '10%', left: '67%', size: 1, dur: '4.0s', delay: '1.1s' },
  { top: '5%',  left: '89%', size: 2, dur: '2.8s', delay: '0.9s' },
  { top: '20%', left: '8%',  size: 1, dur: '3.5s', delay: '0.5s' },
  { top: '3%',  left: '46%', size: 1, dur: '2.3s', delay: '1.8s' },
]

const RAIN_DROPS = Array.from({ length: 18 }, (_, i) => ({
  left:     `${(i * 5.5 + 2) % 100}%`,
  height:   `${8 + (i % 7)}px`,
  duration: `${0.6 + (i % 5) * 0.1}s`,
  delay:    `${((i * 0.17) % 1.0).toFixed(2)}s`,
}))

const BUILDINGS = [
  { right: '6%',  height: 90,  width: 14, color: '#c0185f' },
  { right: '11%', height: 130, width: 18, color: '#9b30ff' },
  { right: '17%', height: 70,  width: 12, color: '#c0185f' },
  { right: '22%', height: 155, width: 22, color: '#9b30ff' },
  { right: '28%', height: 95,  width: 14, color: '#c0185f' },
  { right: '33%', height: 60,  width: 10, color: '#9b30ff' },
]

// ── Component ────────────────────────────────────────────

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
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1b2a4a 0%, #2e3f6e 18%, #4a2060 42%, #6b1a3a 62%, #3d1a06 80%, #2a0f04 100%)',
        animation: 'titleFadeIn 1s forwards',
      }}
    >
      {/* Layer 1: Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            animation: `twinkle ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* Layer 2: City skyline (right, blurred, faded) */}
      <div className="absolute inset-0" style={{ opacity: 0.28, filter: 'blur(1px)' }}>
        {BUILDINGS.map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              right: b.right,
              height: b.height,
              width: b.width,
              background: b.color,
            }}
          />
        ))}
      </div>

      {/* Layer 3: Fog band over city */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '22%',
          height: 60,
          background: 'linear-gradient(transparent, rgba(46,26,68,0.6))',
        }}
      />

      {/* Layer 4: Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '22%', background: '#1a0804' }}
      />

      {/* Layer 5: Foreground hill */}
      <div
        className="absolute bottom-0"
        style={{
          left: 0, width: '55%', height: '24%',
          background: '#150602',
          clipPath: 'ellipse(55% 100% at 30% 100%)',
        }}
      />

      {/* Layer 6: Tree silhouettes */}
      <div className="absolute" style={{ bottom: '22%', left: '18%', width: 12, height: 44, background: '#120500', clipPath: 'polygon(50% 0%, 100% 55%, 75% 55%, 75% 100%, 25% 100%, 25% 55%, 0% 55%)' }} />
      <div className="absolute" style={{ bottom: '22%', left: '22%', width: 9,  height: 34, background: '#120500', clipPath: 'polygon(50% 0%, 100% 55%, 75% 55%, 75% 100%, 25% 100%, 25% 55%, 0% 55%)', opacity: 0.7 }} />

      {/* Layer 7: Garage */}
      <div className="absolute" style={{ bottom: '22%', left: '7%' }}>
        {/* Roof */}
        <div style={{ width: 64, height: 22, background: '#200a02', clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)', marginBottom: -1 }} />
        {/* Body */}
        <div style={{ width: 54, height: 44, background: '#2a0f04', borderRadius: '2px 2px 0 0', margin: '0 auto', position: 'relative' }}>
          {/* Window with pulse glow */}
          <div
            style={{
              position: 'absolute', bottom: 0,
              left: '50%', transform: 'translateX(-50%)',
              width: 22, height: 30,
              background: 'rgba(255, 180, 60, 0.32)',
              borderRadius: 1,
              animation: 'garageLight 2.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Layer 8: Rain drops */}
      {RAIN_DROPS.map((r, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: r.left, top: 0,
            width: 1, height: r.height,
            background: 'linear-gradient(transparent, #a0c4ff)',
            animation: `fall ${r.duration} linear infinite`,
            animationDelay: r.delay,
          }}
        />
      ))}

      {/* Layer 9: UI overlay — logo + menu */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ zIndex: 10, marginTop: '-4%' }}
      >
        {/* Pixel art logo */}
        <img
          src={logoSrc}
          alt="Magenta Reach"
          style={{ imageRendering: 'pixelated', width: 384, height: 108 }}
        />

        {/* Menu buttons */}
        <div className="flex flex-col items-center mt-8" style={{ gap: 8 }}>
          {/* NEW GAME */}
          <button
            onClick={() => setOverlay('new')}
            style={{
              padding: '6px 24px',
              border: '1px solid rgba(220,55,115,0.5)',
              color: '#f0a0c0',
              background: 'rgba(192,24,95,0.08)',
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: 3,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(220,55,115,1)'
              e.currentTarget.style.boxShadow = '0 0 10px rgba(192,24,95,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(220,55,115,0.5)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            NEW GAME
          </button>

          {/* CONTINUE */}
          <button
            onClick={() => hasSave && setOverlay('continue')}
            disabled={!hasSave}
            style={{
              padding: '6px 24px',
              border: '1px solid rgba(255,255,255,0.15)',
              color: hasSave ? '#aaaacc' : '#444458',
              background: 'transparent',
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: 3,
              borderRadius: 2,
              cursor: hasSave ? 'pointer' : 'default',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!hasSave) return
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          >
            CONTINUE
          </button>

          {/* EXIT */}
          <button
            onClick={() => window.close()}
            style={{
              padding: '4px 24px',
              border: 'none',
              color: '#666688',
              background: 'transparent',
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: 3,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9999aa' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666688' }}
          >
            EXIT
          </button>
        </div>
      </div>

      {/* Slot picker overlay */}
      {overlay !== 'none' && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 20, background: 'rgba(5,2,15,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOverlay('none') }}
        >
          <div
            className="flex flex-col items-center gap-6"
            style={{ padding: 32 }}
          >
            <div style={{ color: '#c8a87a', fontFamily: 'monospace', fontSize: 10, letterSpacing: 4, opacity: 0.7 }}>
              {overlay === 'new' ? 'SELECT SLOT' : 'LOAD GAME'}
            </div>

            <div className="flex gap-4">
              {slots.map((slot) => {
                const isDisabled = overlay === 'continue' && slot.isEmpty
                return (
                  <button
                    key={slot.slotId}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return
                      overlay === 'new'
                        ? handleNewGame(slot.slotId)
                        : handleContinue(slot.slotId)
                    }}
                    style={{
                      width: 140,
                      padding: '16px 12px',
                      background: 'rgba(20,10,40,0.9)',
                      border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.06)' : 'rgba(192,24,95,0.4)'}`,
                      borderRadius: 4,
                      cursor: isDisabled ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 6,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) e.currentTarget.style.borderColor = 'rgba(192,24,95,0.9)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) e.currentTarget.style.borderColor = 'rgba(192,24,95,0.4)'
                    }}
                  >
                    <div style={{ color: '#888899', fontFamily: 'monospace', fontSize: 8, letterSpacing: 2 }}>
                      SLOT {slot.slotId}
                    </div>
                    {slot.isEmpty ? (
                      <div style={{ color: isDisabled ? '#333344' : '#f0a0c0', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
                        {isDisabled ? '— empty —' : '+ new game'}
                      </div>
                    ) : (
                      <>
                        <div style={{ color: '#e8d5b0', fontFamily: 'monospace', fontSize: 10 }}>{slot.label}</div>
                        <div style={{ color: '#665544', fontFamily: 'monospace', fontSize: 8 }}>
                          {new Date(slot.savedAt).toLocaleDateString('en-GB')}
                        </div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setOverlay('none')}
              style={{ color: '#444455', fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              BACK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
