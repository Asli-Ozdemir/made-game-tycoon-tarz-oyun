import { useEffect, useRef, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import { useGameStore } from '@/store/gameStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import logoSrc from '@/assets/icons/logo_magenta_reach.png'
import bgSrc   from '@/assets/icons/title_screen_bg.png'

// ── Star positions — matched to actual stars in Giriş Ekranı.png ──
const STARS = [
  { left: '54%', top:  '6%', durMs: 2800, delayMs:    0, size: 6 },  // bright center star
  { left: '12%', top: '10%', durMs: 3200, delayMs:  600, size: 4 },
  { left: '30%', top:  '5%', durMs: 2400, delayMs: 1200, size: 4 },
  { left: '68%', top:  '8%', durMs: 3600, delayMs:  300, size: 5 },
  { left: '82%', top: '14%', durMs: 2100, delayMs: 1500, size: 4 },
  { left: '45%', top: '18%', durMs: 3900, delayMs:  800, size: 3 },
  { left: '20%', top: '22%', durMs: 2600, delayMs: 2000, size: 3 },
  { left: '76%', top: '20%', durMs: 3100, delayMs:  400, size: 4 },
  { left: '91%', top:  '9%', durMs: 2900, delayMs: 1700, size: 3 },
  { left: '60%', top: '25%', durMs: 3400, delayMs:  950, size: 3 },
]

// ── Rain drops ───────────────────────────────────────────────────
const RAIN_DROPS = Array.from({ length: 28 }, (_, i) => ({
  left:    `${(i * 3.6 + 1) % 100}%`,
  width:   i % 3 === 0 ? 3 : 2,
  height:  22 + (i % 7) * 5,
  durMs:   Math.round((1200 + (i % 6) * 280)),   // 1200–2600 ms (was 480–1200)
  delayMs: Math.round((i * 280) % 2400),
}))

// ── River shimmer streaks (light glints sweeping across water) ───
const SHIMMER_LINES = [
  { top: '62%', left: '12%', width: '20%', durMs: 4800, delayMs:    0 },
  { top: '65%', left: '12%', width: '16%', durMs: 5500, delayMs: 1400 },
  { top: '68%', left: '12%', width: '22%', durMs: 4200, delayMs: 2800 },
  { top: '71%', left: '12%', width: '18%', durMs: 5100, delayMs:  700 },
  { top: '74%', left: '12%', width: '24%', durMs: 4600, delayMs: 3500 },
  { top: '78%', left: '12%', width: '17%', durMs: 5800, delayMs: 1900 },
  { top: '63%', left: '38%', width: '18%', durMs: 5000, delayMs: 2400 },
  { top: '67%', left: '38%', width: '14%', durMs: 5600, delayMs: 1000 },
  { top: '72%', left: '38%', width: '20%', durMs: 4400, delayMs: 3800 },
  { top: '76%', left: '38%', width: '16%', durMs: 5300, delayMs: 3000 },
]

// ── River flow bands — absolute coords in main wrapper, same structure as shimmer ─
// River area: left 10%–82%, top 57%–90%
const FLOW_BANDS = [
  { top: '58%', height: 8,  durMs: 4200, delayMs:    0 },
  { top: '61%', height: 5,  durMs: 5000, delayMs: 1200 },
  { top: '64%', height: 9,  durMs: 3800, delayMs: 2500 },
  { top: '67%', height: 5,  durMs: 4600, delayMs:  600 },
  { top: '70%', height: 4,  durMs: 5200, delayMs: 3200 },
  { top: '73%', height: 8,  durMs: 4000, delayMs: 1800 },
  { top: '76%', height: 4,  durMs: 4800, delayMs: 2900 },
  { top: '79%', height: 6,  durMs: 4400, delayMs:  400 },
  { top: '82%', height: 4,  durMs: 5600, delayMs: 3600 },
  { top: '59%', height: 3,  durMs: 4900, delayMs: 2000 },
  { top: '65%', height: 3,  durMs: 5300, delayMs: 1500 },
  { top: '72%', height: 3,  durMs: 4100, delayMs: 3100 },
]

// ── Component ────────────────────────────────────────────────────
export default function StartScreen() {
  const slots              = useSaveStore((s) => s.slots)
  const setActiveSlot      = useSaveStore((s) => s.setActiveSlot)
  const setShowStartScreen = useSaveStore((s) => s.setShowStartScreen)
  const load               = useSaveStore((s) => s.load)
  const initSlots          = useSaveStore((s) => s.initSlots)

  const [overlay, setOverlay] = useState<'none' | 'new' | 'continue'>('none')

  const starRefs     = useRef<(HTMLDivElement | null)[]>([])
  const rainRefs     = useRef<(HTMLDivElement | null)[]>([])
  const shimmerRefs  = useRef<(HTMLDivElement | null)[]>([])
  const flowRefs     = useRef<(HTMLDivElement | null)[]>([])
  const glowRef      = useRef<HTMLDivElement | null>(null)
  const wrapRef      = useRef<HTMLDivElement | null>(null)

  useEffect(() => { initSlots() }, [initSlots])

  // WAAPI — runs independently of CSS cascade & prefers-reduced-motion
  useEffect(() => {
    const anims: Animation[] = []

    const wa = (el: Element, kf: Keyframe[], opts: KeyframeAnimationOptions) => {
      if (typeof el.animate === 'function') anims.push(el.animate(kf, opts))
    }

    // Wrapper fade-in
    if (wrapRef.current)
      wa(wrapRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards', easing: 'ease-out' })

    // Stars twinkle
    starRefs.current.forEach((el, i) => {
      if (!el) return
      const { durMs, delayMs } = STARS[i]
      wa(el, [{ opacity: 0.15 }, { opacity: 1 }, { opacity: 0.15 }],
        { duration: durMs, delay: delayMs, iterations: Infinity, easing: 'ease-in-out' })
    })

    // Rain drops fall
    rainRefs.current.forEach((el, i) => {
      if (!el) return
      const { durMs, delayMs } = RAIN_DROPS[i]
      wa(el,
        [
          { transform: 'translateY(-40px)', opacity: 0 },
          { opacity: 0.75, offset: 0.06 },
          { opacity: 0.75, offset: 0.94 },
          { transform: 'translateY(102vh)', opacity: 0 },
        ],
        { duration: durMs, delay: delayMs, iterations: Infinity, easing: 'linear' })
    })

    // River shimmer streaks — short glints sweeping left→right
    shimmerRefs.current.forEach((el, i) => {
      if (!el) return
      const { durMs, delayMs } = SHIMMER_LINES[i]
      wa(el,
        [
          { transform: 'translateX(-110%)', opacity: 0 },
          { opacity: 0.5,  offset: 0.12 },
          { opacity: 0.5,  offset: 0.88 },
          { transform: 'translateX(220%)', opacity: 0 },
        ],
        { duration: durMs, delay: delayMs, iterations: Infinity, easing: 'linear' })
    })

    // River flow bands — identical WAAPI pattern to shimmer (which works)
    flowRefs.current.forEach((el, i) => {
      if (!el) return
      const { durMs, delayMs } = FLOW_BANDS[i]
      wa(el,
        [
          { transform: 'translateX(-115%)', opacity: 0 },
          { opacity: 0.8,  offset: 0.12 },
          { opacity: 0.8,  offset: 0.88 },
          { transform: 'translateX(130%)', opacity: 0 },
        ],
        { duration: durMs, delay: delayMs, iterations: Infinity, easing: 'linear' })
    })

    // River glow pulse
    if (glowRef.current)
      wa(glowRef.current, [{ opacity: 0.1 }, { opacity: 0.4 }, { opacity: 0.1 }],
        { duration: 4000, iterations: Infinity, easing: 'ease-in-out' })

    return () => anims.forEach(a => a.cancel())
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

      {/* Background */}
      <img src={bgSrc} alt="" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover',
      }} />

      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          ref={el => { starRefs.current[i] = el }}
          style={{
            position: 'absolute', top: s.top, left: s.left,
            width: s.size, height: s.size, borderRadius: '50%',
            background: '#ffffff',
            boxShadow: `0 0 ${s.size * 2}px ${s.size}px rgba(255,255,255,0.6)`,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* River shimmer streaks — thin glints sweeping across water */}
      {SHIMMER_LINES.map((sh, i) => (
        <div
          key={i}
          ref={el => { shimmerRefs.current[i] = el }}
          style={{
            position: 'absolute',
            top: sh.top, left: sh.left,
            width: sh.width, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(220,245,255,0.75), rgba(255,255,255,0.9), rgba(220,245,255,0.75), transparent)',
            borderRadius: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* River area glow */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: '60%', left: '15%',
          width: '55%', height: '28%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(70,150,220,0.18), transparent 70%)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* River flow bands — direct absolute children (same structure as shimmer/rain) */}
      {FLOW_BANDS.map((fb, i) => (
        <div
          key={i}
          ref={el => { flowRefs.current[i] = el }}
          style={{
            position: 'absolute',
            top: fb.top,
            left: '10%',
            width: '72%',
            height: fb.height,
            background: 'linear-gradient(90deg, transparent 0%, rgba(140,220,255,0.7) 20%, rgba(210,248,255,0.95) 50%, rgba(140,220,255,0.7) 80%, transparent 100%)',
            borderRadius: fb.height,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Rain drops — vertical, falling top→bottom */}
      {RAIN_DROPS.map((r, i) => (
        <div
          key={i}
          ref={el => { rainRefs.current[i] = el }}
          style={{
            position: 'absolute', top: 0,
            left: r.left,
            width: r.width,
            height: r.height,
            background: 'linear-gradient(to bottom, transparent, rgba(180,210,255,0.85))',
            borderRadius: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Logo — upper sky area */}
      <img
        src={logoSrc}
        alt="Magenta Reach"
        style={{
          position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
          top: '8%',
          imageRendering: 'pixelated',
          width: 320, height: 90,
          maxWidth: '55vw',
          objectFit: 'contain',
          zIndex: 10,
          filter: 'drop-shadow(0 0 14px rgba(255,45,155,0.65))',
        }}
      />

      {/* Menu buttons */}
      <div style={{
        position: 'absolute',
        left: '50%', transform: 'translateX(-50%)',
        top: '22%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
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
  const borderBase = isMagenta ? 'rgba(220,55,115,0.5)' : 'rgba(255,255,255,0.15)'
  const borderHov  = isMagenta ? 'rgba(220,55,115,1)'   : 'rgba(255,255,255,0.4)'
  const textColor  = disabled ? '#444458' : isMagenta ? '#ffffff' : '#aaaacc'
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
