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

      {/* Layer 9: UI overlay — logo + menu (Task 4) */}
    </div>
  )
}
