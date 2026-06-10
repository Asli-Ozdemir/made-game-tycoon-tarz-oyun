// src/components/SkillTreeCanvas.tsx
import { useEffect, useRef } from 'react'
import { Application, Graphics, Container } from 'pixi.js'
import { SKILL_NODES, type SkillNode } from '@/data/skillTree'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useObjectiveStore } from '@/store/objectiveStore'
import { useLifePathStore } from '@/store/lifePathStore'
import { PATH_THRESHOLD } from '@/data/lifePathData'
import type { LifePath } from '@/data/skillTree'

const CW = 760
const CH = 540
const CX = CW / 2
const CY = CH / 2

const TIER_R = [0, 110, 200, 300, 400, 490]

function getNodeAngle(node: SkillNode): number {
  const zones: Record<string, number> = {
    nos_t1:        -2.4,
    nos2_t1:       -1.8,
    hik_t1:        -0.6,
    hik2_t1:       -1.2,
    kaos_t1:        1.8,
    zmn_t1:         2.4,
    nos_t2:        -2.5,
    hik_t2:        -1.0,
    kaos_t2:        2.0,
    zmn_t2:         2.8,
    nos_hik_t2:    -1.7,
    kaos2_t2:       1.4,
    zmn2_t2:        2.3,
    nos_t3:        -2.6,
    hik_t3:        -0.8,
    kaos_t3:        1.6,
    zmn_t3:         2.6,
    nos_kaos_t3:    1.0,
    hik_zmn_t3:    -0.3,
    mix_t3:        -1.4,
    nos_t4:        -2.4,
    hik_t4:        -0.9,
    kaos_t4:        1.8,
    zmn_t4:         2.5,
    nos_hik_t4:    -1.6,
    kaos_zmn_t4:    2.1,
    sos_t1:         3.05,
    sos_t2:         3.00,
    sos_t3:         2.95,
    gh_t1:          0.45,
    gh_t2:          0.50,
    gh_t3:          0.55,
    t5_hirs:        Math.PI,
    t5_huzur:      -Math.PI / 2,
    t5_emek:        0,
    t5_notr:        Math.PI / 2,
  }
  return zones[node.id] ?? 0
}

function getNodePos(node: SkillNode): { x: number; y: number } {
  const r = TIER_R[node.tier]
  const a = getNodeAngle(node)
  return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r }
}

function drawBranch(
  g: Graphics,
  x: number, y: number,
  angle: number, len: number, depth: number,
  active: boolean
) {
  if (depth === 0 || len < 3) return
  const ex = x + Math.cos(angle) * len
  const ey = y + Math.sin(angle) * len

  g.moveTo(x, y).lineTo(ex, ey).stroke({
    width: active ? Math.max(0.5, depth * 0.5) : 0.4,
    color: active ? 0x4ab8ff : 0x1a2444,
    alpha: active ? 0.65 - depth * 0.05 : 0.2,
  })

  if (depth === 1) {
    g.circle(ex, ey, active ? 2.5 : 1.5)
      .fill({ color: active ? 0xff9900 : 0x1e2a40, alpha: active ? 1 : 0.35 })
  }

  const sp = 0.35 + depth * 0.05
  drawBranch(g, ex, ey, angle - sp, len * 0.65, depth - 1, active)
  drawBranch(g, ex, ey, angle + sp, len * 0.63, depth - 1, active)
  if (depth > 2) drawBranch(g, ex, ey, angle, len * 0.55, depth - 2, active)
}

function drawNeuron(
  g: Graphics,
  cx: number, cy: number,
  R: number,
  state: 'locked' | 'unlockable' | 'active'
) {
  const active     = state !== 'locked'
  const unlockable = state === 'unlockable'

  // Dendritler
  const dendAngles = [-2.3, -1.6, -0.8, 0.5, 2.6, 3.4, Math.PI - 0.2, Math.PI + 0.4]
  for (const a of dendAngles) {
    drawBranch(g, cx, cy, a, R * 1.6, 3, active)
  }

  // Soma — 5 loblu yapı
  const lobeAngles = [0, Math.PI*2/5, Math.PI*4/5, Math.PI*6/5, Math.PI*8/5]
  const lobeR      = R * 0.52
  const lobeDist   = R * 0.52

  for (const a of lobeAngles) {
    const lx = cx + Math.cos(a) * lobeDist
    const ly = cy + Math.sin(a) * lobeDist
    g.circle(lx, ly, lobeR)
      .fill({ color: active ? 0x122a50 : 0x060d1a })
      .stroke({ width: active ? 2 : 1, color: active ? (unlockable ? 0x4488cc : 0xe07020) : 0x1e2a44 })
  }

  // Merkez
  g.circle(cx, cy, R * 0.55)
    .fill({ color: active ? 0x112040 : 0x08121e })
    .stroke({ width: active ? 2.5 : 1, color: active ? 0xe07020 : 0x1e2a44 })

  // Çekirdek
  if (active) {
    g.circle(cx, cy, R * 0.22).fill(0xffaa00)
    g.circle(cx - R * 0.08, cy - R * 0.09, R * 0.08).fill(0xffffff)
  } else {
    g.circle(cx, cy, R * 0.22).fill(0x1a2038)
    g.circle(cx, cy, R * 0.10).fill(0x252040)
  }

  if (unlockable) {
    g.circle(cx, cy, R * 0.60)
      .stroke({ width: 1.5, color: 0x60a5fa, alpha: 0.5 })
  }
}

function drawAxon(
  g: Graphics,
  x1: number, y1: number,
  x2: number, y2: number,
  active: boolean
) {
  const dx  = x2 - x1
  const dy  = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return

  const nx = dy / len
  const ny = -dx / len

  if (!active) {
    g.moveTo(x1, y1).lineTo(x2, y2)
      .stroke({ width: 1, color: 0x1a1840, alpha: 0.2 })
    return
  }

  g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 3, color: 0x1a5090, alpha: 0.9 })

  const segCount = Math.max(2, Math.floor(len / 22))
  for (let s = 0; s < segCount; s++) {
    const t0 = (s + 0.1) / segCount
    const t1 = (s + 0.9) / segCount
    const sx0 = x1 + dx * t0, sy0 = y1 + dy * t0
    const sx1 = x1 + dx * t1, sy1 = y1 + dy * t1
    g.moveTo(sx0 + nx * 6, sy0 + ny * 6)
      .lineTo(sx1 + nx * 6, sy1 + ny * 6)
      .lineTo(sx1 - nx * 6, sy1 - ny * 6)
      .lineTo(sx0 - nx * 6, sy0 - ny * 6)
      .fill({ color: s % 2 === 0 ? 0xff8800 : 0x2288cc, alpha: 0.85 })
  }

  g.circle(x2, y2, 5).fill(0xff8800)
  g.circle(x2, y2, 2).fill(0xffee00)
}

const ARC_R = 345

const PATH_ARC_CONFIGS: { path: LifePath; startAngle: number; endAngle: number; color: number }[] = [
  { path: 'huzur', startAngle: -2.8, endAngle: -0.3, color: 0x4488cc },
  { path: 'hirs',  startAngle:  1.2, endAngle:  3.6, color: 0xff6644 },
  { path: 'emek',  startAngle:  0.2, endAngle:  1.1, color: 0x88cc44 },
]

function drawPathArcs(
  g: Graphics,
  progress: Record<LifePath, number>,
  activePathId: LifePath | null
) {
  for (const arc of PATH_ARC_CONFIGS) {
    const pct      = Math.min(1, (progress[arc.path] ?? 0) / PATH_THRESHOLD)
    const isActive = activePathId === arc.path
    const span     = arc.endAngle - arc.startAngle

    // Boş track
    g.arc(CX, CY, ARC_R, arc.startAngle, arc.endAngle)
      .stroke({ width: 5, color: 0x1a1a2e, alpha: 0.5 })

    if (pct > 0) {
      const fillEnd = arc.startAngle + span * pct
      g.arc(CX, CY, ARC_R, arc.startAngle, fillEnd)
        .stroke({
          width: isActive ? 7 : 5,
          color: arc.color,
          alpha: isActive ? 1.0 : 0.65,
        })

      // Aktif yol: threshold noktasında parlak işaret
      if (isActive && pct >= 1) {
        const tx = CX + Math.cos(arc.endAngle) * ARC_R
        const ty = CY + Math.sin(arc.endAngle) * ARC_R
        g.circle(tx, ty, 5).fill({ color: arc.color, alpha: 0.9 })
        g.circle(tx, ty, 8).stroke({ width: 1.5, color: arc.color, alpha: 0.4 })
      }
    }
  }
}

interface Props {
  onHover: (node: SkillNode | null) => void
}

export default function SkillTreeCanvas({ onHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef    = useRef<Application | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    let destroyed = false

    const app = new Application()
    appRef.current = app

    app.init({
      canvas:          canvasRef.current,
      width:           CW,
      height:          CH,
      backgroundColor: 0x030208,
      antialias:       true,
    }).then(() => {
      if (destroyed) return
      renderTree(app)
    })

    const unsub = useSkillTreeStore.subscribe(() => {
      if (appRef.current && !destroyed) renderTree(appRef.current)
    })

    const unsubPath = useLifePathStore.subscribe(() => {
      if (appRef.current && !destroyed) renderTree(appRef.current)
    })

    return () => {
      destroyed = true
      unsub()
      unsubPath()
      app.destroy()
    }
  }, [])

  function renderTree(app: Application) {
    app.stage.removeChildren()

    const bg = new Graphics()
    for (let i = 0; i < 150; i++) {
      const sx = ((i * 4621 + 999) % CW)
      const sy = ((i * 7919 + 333) % CH)
      bg.circle(sx, sy, 0.8)
        .fill({ color: 0xc8d4ff, alpha: ((i * 37) % 40) / 100 + 0.04 })
    }
    app.stage.addChild(bg)

    // Yol yayları (arkaplan üstü, nöronların altı)
    const arcLayer = new Graphics()
    const { progress, activePathId } = useLifePathStore.getState()
    drawPathArcs(arcLayer, progress, activePathId)
    app.stage.addChild(arcLayer)

    const positions = new Map<string, { x: number; y: number }>()
    for (const node of SKILL_NODES) {
      positions.set(node.id, getNodePos(node))
    }

    const getNodeState = useSkillTreeStore.getState().getNodeState
    const unlockNode   = useSkillTreeStore.getState().unlockNode

    // Akson katmanı
    const axonLayer = new Graphics()
    for (const node of SKILL_NODES) {
      const pos = positions.get(node.id)!
      for (const depId of node.dependsOn) {
        const depPos = positions.get(depId)
        if (!depPos) continue
        const nodeActive = getNodeState(node.id) === 'active'
        const depActive  = getNodeState(depId) === 'active'
        drawAxon(axonLayer, depPos.x, depPos.y, pos.x, pos.y, nodeActive && depActive)
      }
    }
    app.stage.addChild(axonLayer)

    // Nöron katmanı
    for (const node of SKILL_NODES) {
      const { x, y } = positions.get(node.id)!
      const state = getNodeState(node.id)
      const R     = node.tier === 5 ? 22 : 16 + (5 - node.tier) * 1.5

      const container = new Container()
      container.eventMode = 'static'
      container.cursor    = state !== 'locked' ? 'pointer' : 'default'

      // Hit area merkez etrafında daire
      const hitR = R * 2.8
      container.hitArea = {
        contains(hx: number, hy: number) {
          return Math.sqrt((hx - x) ** 2 + (hy - y) ** 2) < hitR
        },
      } as any

      const g = new Graphics()
      drawNeuron(g, x, y, R, state)
      container.addChild(g)

      const capturedNode = node
      container.on('pointerover', () => onHover(capturedNode))
      container.on('pointerout',  () => onHover(null))
      container.on('pointertap',  () => {
        if (state === 'unlockable') {
          unlockNode(capturedNode.id)
          useObjectiveStore.getState().completeDemoStep('sleep_spend')
        }
      })

      app.stage.addChild(container)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
