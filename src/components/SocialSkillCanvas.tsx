// src/components/SocialSkillCanvas.tsx
import { useEffect, useRef } from 'react'
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'
import { SOCIAL_SKILLS } from '@/data/socialSkills'
import { useSocialSkillStore } from '@/store/socialSkillStore'
import type { SocialSkill, SocialSkillTier } from '@/data/socialSkills'

const CW = 760
const CH = 540
const CX = CW / 2
const CY = CH / 2

// 4 yetenek, 4 ana yön (üst/sağ/alt/sol)
const SKILL_ANGLES: Record<string, number> = {
  sicakkanlilik: -Math.PI / 2,   // üst
  capkinlik:      0,              // sağ
  dostluk:        Math.PI / 2,   // alt
  sogukkanlilik:  Math.PI,       // sol
}

// Her tier için merkeze olan mesafe
const TIER_R = [0, 90, 170, 255, 340, 420]

// Yetenek renkleri
const SKILL_COLORS: Record<string, number> = {
  sicakkanlilik: 0xff6644,  // turuncu — sıcak
  capkinlik:     0xff4488,  // pembe — romantik
  dostluk:       0x44aaff,  // mavi — sakin/güven
  sogukkanlilik: 0x88ddcc,  // buz mavisi — soğuk
}

const STYLE_LABEL = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#8899aa', align: 'center' })
const STYLE_NAME  = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#ccddee', align: 'center', fontWeight: 'bold' })
const STYLE_TIER  = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#556677', align: 'center' })

interface HoverInfo {
  skill:  SocialSkill
  tier:   SocialSkillTier
  active: boolean
  xp:     number
}

interface Props {
  onHover: (info: HoverInfo | null) => void
}

function drawSocialNeuron(
  g: Graphics,
  cx: number, cy: number, R: number,
  color: number,
  state: 'locked' | 'active' | 'current',
) {
  const isActive  = state !== 'locked'
  const isCurrent = state === 'current'

  // Dendrit kolları
  const angles = [-2.1, -1.2, -0.3, 0.6, 1.5, 2.4, 3.3, -3.0]
  for (const a of angles) {
    const len  = R * 1.5
    const ex   = cx + Math.cos(a) * len
    const ey   = cy + Math.sin(a) * len
    g.moveTo(cx, cy).lineTo(ex, ey).stroke({
      width: isActive ? 1.2 : 0.5,
      color: isActive ? color : 0x1a2030,
      alpha: isActive ? 0.5 : 0.15,
    })
    // Uç tomurcuk
    g.circle(ex, ey, isActive ? 2 : 1.2)
      .fill({ color: isActive ? color : 0x1a2030, alpha: isActive ? 0.7 : 0.2 })
  }

  // Soma çekirdeği
  g.circle(cx, cy, R)
    .fill({ color: isActive ? 0x0e1e30 : 0x060c14 })
    .stroke({ width: isActive ? 2 : 1, color: isActive ? color : 0x1e2a40 })

  if (isActive) {
    g.circle(cx, cy, R * 0.55).fill({ color, alpha: 0.18 })
    g.circle(cx, cy, R * 0.28).fill({ color, alpha: 0.85 })
  } else {
    g.circle(cx, cy, R * 0.28).fill({ color: 0x141c28 })
  }

  if (isCurrent) {
    g.circle(cx, cy, R + 5).stroke({ width: 2, color, alpha: 0.45 })
  }
}

function drawAxonLine(
  g: Graphics,
  x1: number, y1: number,
  x2: number, y2: number,
  color: number,
  active: boolean,
) {
  if (!active) {
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 1, color: 0x1a1840, alpha: 0.18 })
    return
  }
  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 2.5, color, alpha: 0.7 })

  // Sinyal pulsları
  const dx  = x2 - x1
  const dy  = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const nx  = dy / len
  const ny  = -dx / len
  const seg = Math.max(2, Math.floor(len / 24))
  for (let s = 0; s < seg; s++) {
    const t0 = (s + 0.15) / seg
    const t1 = (s + 0.85) / seg
    const sx0 = x1 + dx * t0, sy0 = y1 + dy * t0
    const sx1 = x1 + dx * t1, sy1 = y1 + dy * t1
    g.moveTo(sx0 + nx * 5, sy0 + ny * 5)
      .lineTo(sx1 + nx * 5, sy1 + ny * 5)
      .lineTo(sx1 - nx * 5, sy1 - ny * 5)
      .lineTo(sx0 - nx * 5, sy0 - ny * 5)
      .fill({ color: s % 2 === 0 ? color : 0x2a3a5a, alpha: 0.7 })
  }
  g.circle(x2, y2, 4).fill({ color, alpha: 0.9 })
}

export default function SocialSkillCanvas({ onHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef    = useRef<Application | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    let destroyed = false
    let initDone  = false

    const app = new Application()
    appRef.current = app

    app.init({
      canvas:          canvasRef.current,
      width:           CW,
      height:          CH,
      backgroundColor: 0x030208,
      antialias:       true,
    }).then(() => {
      initDone = true
      if (destroyed) { app.destroy(); return }
      renderCanvas(app)
    })

    const unsub = useSocialSkillStore.subscribe(() => {
      if (appRef.current && !destroyed) renderCanvas(appRef.current)
    })

    return () => {
      destroyed = true
      unsub()
      if (initDone) app.destroy()
    }
  }, [])

  function renderCanvas(app: Application) {
    app.stage.removeChildren()

    // Yıldız arka planı
    const bg = new Graphics()
    for (let i = 0; i < 130; i++) {
      const sx = ((i * 5237 + 771) % CW)
      const sy = ((i * 8311 + 419) % CH)
      bg.circle(sx, sy, 0.7)
        .fill({ color: 0xd0e0ff, alpha: ((i * 41) % 38) / 100 + 0.03 })
    }
    app.stage.addChild(bg)

    // Merkez hub
    const hub = new Graphics()
    hub.circle(CX, CY, 14).fill({ color: 0x0e1628 }).stroke({ width: 1.5, color: 0x334466, alpha: 0.6 })
    hub.circle(CX, CY, 6).fill({ color: 0x223355, alpha: 0.8 })
    app.stage.addChild(hub)

    const store     = useSocialSkillStore.getState()
    const axonLayer = new Graphics()
    app.stage.addChild(axonLayer)

    for (const skill of SOCIAL_SKILLS) {
      const angle    = SKILL_ANGLES[skill.id] ?? 0
      const color    = SKILL_COLORS[skill.id] ?? 0x4488cc
      const tierNow  = store.getTier(skill.id)
      const xpNow    = store.getXP(skill.id)

      // Axon zinciri (merkez → T1 → T2 … → T5)
      let prevX = CX
      let prevY = CY
      for (const t of skill.tiers) {
        const r  = TIER_R[t.tier]
        const tx = CX + Math.cos(angle) * r
        const ty = CY + Math.sin(angle) * r
        const bothActive = t.tier <= tierNow && t.tier - 1 <= tierNow
        drawAxonLine(axonLayer, prevX, prevY, tx, ty, color, bothActive)
        prevX = tx
        prevY = ty
      }

      // Yetenek isim etiketi (son tier ötesine)
      const labelR  = TIER_R[5] + 28
      const labelX  = CX + Math.cos(angle) * labelR
      const labelY  = CY + Math.sin(angle) * labelR
      const nameText = new Text({ text: skill.name.toUpperCase(), style: STYLE_NAME })
      nameText.anchor.set(0.5, 0.5)
      nameText.x = labelX
      nameText.y = labelY
      app.stage.addChild(nameText)

      // XP bilgisi
      const nextTier = skill.tiers.find(t => t.tier === tierNow + 1)
      const xpLabel  = nextTier
        ? `${xpNow} / ${nextTier.xpRequired} xp`
        : tierNow === 5 ? 'Usta' : '0 / 5 xp'
      const xpText = new Text({ text: xpLabel, style: STYLE_LABEL })
      xpText.anchor.set(0.5, 0.5)
      xpText.x = labelX
      xpText.y = labelY + 14
      app.stage.addChild(xpText)

      // Tier nöronları
      for (const t of skill.tiers) {
        const r  = TIER_R[t.tier]
        const nx = CX + Math.cos(angle) * r
        const ny = CY + Math.sin(angle) * r
        const R  = 13 + (5 - t.tier) * 1.2

        const state: 'locked' | 'active' | 'current' =
          t.tier <= tierNow ? 'active' :
          t.tier === tierNow + 1 ? 'current' :
          'locked'

        const g = new Graphics()
        drawSocialNeuron(g, nx, ny, R, color, state)

        // Tier numarası
        const tLabel = new Text({ text: `T${t.tier}`, style: STYLE_TIER })
        tLabel.anchor.set(0.5, 0.5)
        tLabel.x = nx
        tLabel.y = ny

        // Hit area + hover
        const container = new Container()
        container.eventMode = 'static'
        container.cursor    = 'pointer'
        container.hitArea   = {
          contains(hx: number, hy: number) {
            return Math.sqrt((hx - nx) ** 2 + (hy - ny) ** 2) < R * 2.5
          },
        } as any

        container.addChild(g)
        container.addChild(tLabel)

        const capturedSkill = skill
        const capturedTier  = t
        container.on('pointerover', () => onHover({
          skill:  capturedSkill,
          tier:   capturedTier,
          active: state === 'active',
          xp:     xpNow,
        }))
        container.on('pointerout', () => onHover(null))

        app.stage.addChild(container)
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
