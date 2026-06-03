// src/pixi/ArcadeShiftScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { BrokenMachine } from '@/data/arcadeShifts'

const STYLE_LABEL  = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#88bbcc' })
const STYLE_TIMER  = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#ffffff', fontWeight: 'bold' })
const STYLE_STATUS = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#44cc88' })
const STYLE_BROKEN = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#ff6666' })
const STYLE_PUZZLE = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffffff' })
const STYLE_HINT   = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#3a4a50' })

export interface ArcadeShiftSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  brokenMachines: BrokenMachine[]
  timeLimitSecs: number
  onShiftEnd: (repairScore: number) => void
}

type RepairPhase = 'none' | 'cable' | 'parts'

interface MachineState {
  id: string
  label: string
  puzzleType: 'cable' | 'parts'
  repaired: boolean
  col: number
  row: number
  x: number
  y: number
}

interface CableState {
  machineId: string
  selectedEndpoint: 'A' | 'B' | null
  connected: boolean
  lineDrawn: boolean
}

interface PartsState {
  machineId: string
  options: string[]
  correctIndex: number
  shakeTarget: number | null
  shakeFrames: number
  solved: boolean
}

const MACHINE_W = 70
const MACHINE_H = 50
const MACHINE_COLS = 3
const MACHINE_PAD_X = 18
const MACHINE_PAD_Y = 14

export class ArcadeShiftScene {
  private app:      Application
  private opts:     ArcadeShiftSceneOptions
  private destroyed = false

  private timeLeft:    number
  private lastTs:      number = 0
  private ended:       boolean = false

  private machines:    MachineState[]
  private pulseFrame:  number = 0

  private repairPhase: RepairPhase = 'none'
  private cableState:  CableState | null = null
  private partsState:  PartsState | null = null

  private constructor(app: Application, opts: ArcadeShiftSceneOptions) {
    this.app       = app
    this.opts      = opts
    this.timeLeft  = opts.timeLimitSecs
    this.machines  = this._buildMachineStates()
  }

  static async create(opts: ArcadeShiftSceneOptions): Promise<ArcadeShiftScene> {
    const app = new Application()
    await app.init({
      canvas:          opts.canvas,
      width:           opts.width,
      height:          opts.height,
      backgroundColor: 0x0d1b2a,
      antialias:       true,
    })
    const scene = new ArcadeShiftScene(app, opts)
    scene._init()
    return scene
  }

  private _buildMachineStates(): MachineState[] {
    const brokenSet = new Set(this.opts.brokenMachines.map(m => m.id))
    // Build a list of all machine slots (6 total, broken ones + filler slots)
    const totalSlots = Math.max(6, this.opts.brokenMachines.length)
    const states: MachineState[] = []

    // Place broken machines first
    this.opts.brokenMachines.forEach((bm, i) => {
      const col = i % MACHINE_COLS
      const row = Math.floor(i / MACHINE_COLS)
      states.push({
        id: bm.id,
        label: bm.label,
        puzzleType: bm.puzzleType,
        repaired: false,
        col, row,
        x: this._machineX(col),
        y: this._machineY(row),
      })
    })

    // Fill remaining slots with non-interactive machines
    const fillerCount = totalSlots - this.opts.brokenMachines.length
    for (let i = 0; i < fillerCount; i++) {
      const idx = this.opts.brokenMachines.length + i
      const col = idx % MACHINE_COLS
      const row = Math.floor(idx / MACHINE_COLS)
      states.push({
        id: `filler_${i}`,
        label: `Machine ${idx + 1}`,
        puzzleType: 'cable',
        repaired: true,   // filler = already working
        col, row,
        x: this._machineX(col),
        y: this._machineY(row),
      })
    }

    void brokenSet
    return states
  }

  private _machineX(col: number): number {
    const gridW = MACHINE_COLS * MACHINE_W + (MACHINE_COLS - 1) * MACHINE_PAD_X
    const startX = (this.opts.width - gridW) / 2
    return startX + col * (MACHINE_W + MACHINE_PAD_X)
  }

  private _machineY(row: number): number {
    return 60 + row * (MACHINE_H + MACHINE_PAD_Y)
  }

  private _init() {
    this.lastTs = performance.now()
    this.opts.canvas.addEventListener('pointerdown', this._onClick)
    this.app.ticker.add(this._tick)
    this._render()
  }

  private _onClick = (e: PointerEvent) => {
    if (this.destroyed || this.ended) return
    const rect = this.opts.canvas.getBoundingClientRect()
    const scaleX = this.opts.width  / rect.width
    const scaleY = this.opts.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top)  * scaleY

    if (this.repairPhase === 'none') {
      this._handleMachineClick(mx, my)
    } else if (this.repairPhase === 'cable' && this.cableState) {
      this._handleCableClick(mx, my)
    } else if (this.repairPhase === 'parts' && this.partsState) {
      this._handlePartsClick(mx, my)
    }
    this._render()
  }

  private _handleMachineClick(mx: number, my: number) {
    for (const m of this.machines) {
      if (m.repaired) continue
      if (mx >= m.x && mx <= m.x + MACHINE_W && my >= m.y && my <= m.y + MACHINE_H) {
        this._openRepair(m)
        return
      }
    }
  }

  private _openRepair(m: MachineState) {
    if (m.puzzleType === 'cable') {
      this.repairPhase = 'cable'
      this.cableState = {
        machineId: m.id,
        selectedEndpoint: null,
        connected: false,
        lineDrawn: false,
      }
    } else {
      this.repairPhase = 'parts'
      const correctIndex = Math.floor(Math.random() * 3)
      this.partsState = {
        machineId: m.id,
        options: ['Part A', 'Part B', 'Part C'],
        correctIndex,
        shakeTarget: null,
        shakeFrames: 0,
        solved: false,
      }
    }
  }

  // Cable overlay: two endpoints A and B drawn in overlay area
  // Endpoint A at overlay_x=80, y=overlay_y+60
  // Endpoint B at overlay_x=220, y=overlay_y+60
  private _cableOverlayBounds() {
    const ox = (this.opts.width - 320) / 2
    const oy = (this.opts.height - 160) / 2
    return { ox, oy, ow: 320, oh: 160 }
  }

  private _handleCableClick(mx: number, my: number) {
    if (!this.cableState) return
    const { ox, oy } = this._cableOverlayBounds()

    const ax = ox + 80
    const ay = oy + 80
    const bx = ox + 240
    const by = oy + 80
    const radius = 20

    const hitA = Math.hypot(mx - ax, my - ay) <= radius
    const hitB = Math.hypot(mx - bx, my - by) <= radius

    // Close button top-right corner
    const closeX = ox + 310
    const closeY = oy + 10
    if (Math.abs(mx - closeX) < 16 && Math.abs(my - closeY) < 16) {
      this.repairPhase = 'none'
      this.cableState  = null
      return
    }

    if (this.cableState.selectedEndpoint === null) {
      if (hitA) this.cableState.selectedEndpoint = 'A'
      else if (hitB) this.cableState.selectedEndpoint = 'B'
    } else {
      const wasA = this.cableState.selectedEndpoint === 'A'
      if ((wasA && hitB) || (!wasA && hitA)) {
        this.cableState.connected = true
        this.cableState.lineDrawn = true
        // Mark repaired after brief animation (handled in tick)
      } else {
        this.cableState.selectedEndpoint = null
      }
    }
  }

  private _partsOverlayBounds() {
    const ox = (this.opts.width - 320) / 2
    const oy = (this.opts.height - 180) / 2
    return { ox, oy, ow: 320, oh: 180 }
  }

  private _handlePartsClick(mx: number, my: number) {
    if (!this.partsState) return
    const { ox, oy } = this._partsOverlayBounds()

    // Close button
    const closeX = ox + 310
    const closeY = oy + 10
    if (Math.abs(mx - closeX) < 16 && Math.abs(my - closeY) < 16) {
      this.repairPhase = 'none'
      this.partsState  = null
      return
    }

    // 3 option buttons: stacked vertically
    for (let i = 0; i < 3; i++) {
      const bx = ox + 40
      const by = oy + 60 + i * 36
      const bw = 240
      const bh = 28
      if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
        if (i === this.partsState.correctIndex) {
          this.partsState.solved = true
          // completion handled in tick
        } else {
          this.partsState.shakeTarget  = i
          this.partsState.shakeFrames = 18
        }
        return
      }
    }
  }

  private _tick = () => {
    if (this.destroyed || this.ended) return

    const now = performance.now()
    const dt  = (now - this.lastTs) / 1000
    this.lastTs = now

    this.pulseFrame++

    // Advance timer
    this.timeLeft -= dt
    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this._finishShift()
      return
    }

    // Cable puzzle: if connected, complete repair after 30 frames
    if (this.repairPhase === 'cable' && this.cableState?.connected) {
      this._completeRepair(this.cableState.machineId)
      this.repairPhase = 'none'
      this.cableState  = null
    }

    // Parts puzzle: if solved, complete repair
    if (this.repairPhase === 'parts' && this.partsState?.solved) {
      this._completeRepair(this.partsState.machineId)
      this.repairPhase = 'none'
      this.partsState  = null
    }

    // Shake countdown
    if (this.partsState && this.partsState.shakeFrames > 0) {
      this.partsState.shakeFrames--
      if (this.partsState.shakeFrames === 0) this.partsState.shakeTarget = null
    }

    this._render()
  }

  private _completeRepair(machineId: string) {
    const m = this.machines.find(m => m.id === machineId)
    if (m) m.repaired = true
  }

  private _finishShift() {
    if (this.ended) return
    this.ended = true
    const total   = this.opts.brokenMachines.length
    const repaired = this.machines.filter(m =>
      this.opts.brokenMachines.some(bm => bm.id === m.id) && m.repaired
    ).length
    const score = total === 0 ? 100 : Math.round((repaired / total) * 100)
    this._render()
    this.opts.onShiftEnd(score)
  }

  private _render() {
    if (this.destroyed) return
    const { app } = this
    const W = this.opts.width
    const H = this.opts.height
    app.stage.removeChildren()

    this._drawBackground(W, H)
    this._drawTimerBar(W)
    this._drawMachines()
    this._drawInstructions(W, H)

    if (this.repairPhase === 'cable' && this.cableState) {
      this._drawCableOverlay(W, H)
    } else if (this.repairPhase === 'parts' && this.partsState) {
      this._drawPartsOverlay(W, H)
    }
  }

  private _drawBackground(W: number, H: number) {
    const bg = new Graphics()
    bg.rect(0, 0, W, H).fill({ color: 0x0d1b2a })
    this.app.stage.addChild(bg)
  }

  private _drawTimerBar(W: number) {
    const ratio     = Math.max(0, this.timeLeft / this.opts.timeLimitSecs)
    const barW      = W - 20
    const barH      = 10
    const barX      = 10
    const barY      = 8
    const color     = ratio < 0.2 ? 0xff3333 : 0x44aaff
    const lowAlpha  = ratio < 0.2 && (this.pulseFrame % 20 < 10) ? 0.5 : 1.0

    const bg = new Graphics()
    bg.rect(barX, barY, barW, barH).fill({ color: 0x1a2a3a })
    this.app.stage.addChild(bg)

    const fill = new Graphics()
    fill.rect(barX, barY, barW * ratio, barH).fill({ color, alpha: lowAlpha })
    this.app.stage.addChild(fill)

    const secsLabel = new Text({ text: `${Math.ceil(this.timeLeft)}s`, style: STYLE_TIMER })
    secsLabel.x = barX + barW + 4
    secsLabel.y = barY - 1
    this.app.stage.addChild(secsLabel)
  }

  private _drawMachines() {
    for (const m of this.machines) {
      const isBroken   = !m.repaired && this.opts.brokenMachines.some(bm => bm.id === m.id)
      const pulse      = (Math.sin(this.pulseFrame * 0.12) + 1) / 2

      const bg = new Graphics()
      if (isBroken) {
        const borderColor = 0xff3333
        bg.rect(m.x - 2, m.y - 2, MACHINE_W + 4, MACHINE_H + 4)
          .fill({ color: borderColor, alpha: 0.15 + pulse * 0.25 })
        bg.rect(m.x - 2, m.y - 2, MACHINE_W + 4, MACHINE_H + 4)
          .stroke({ width: 2, color: borderColor, alpha: 0.6 + pulse * 0.4 })
      } else {
        bg.rect(m.x, m.y, MACHINE_W, MACHINE_H)
          .fill({ color: m.repaired ? 0x1a3a2a : 0x1a2a3a })
          .stroke({ width: 1, color: m.repaired ? 0x44cc88 : 0x2a4a5a })
      }
      this.app.stage.addChild(bg)

      const inner = new Graphics()
      inner.rect(m.x + 4, m.y + 4, MACHINE_W - 8, MACHINE_H - 8)
        .fill({ color: isBroken ? 0x2a1a1a : (m.repaired ? 0x0d2a1a : 0x0d1a2a) })
      this.app.stage.addChild(inner)

      const lbl = new Text({ text: m.label, style: isBroken ? STYLE_BROKEN : STYLE_STATUS })
      lbl.x = m.x + 4
      lbl.y = m.y + 6
      this.app.stage.addChild(lbl)

      if (isBroken) {
        const fixHint = new Text({ text: 'CLICK TO FIX', style: STYLE_HINT })
        fixHint.x = m.x + 4
        fixHint.y = m.y + MACHINE_H - 16
        this.app.stage.addChild(fixHint)
      } else if (m.repaired && this.opts.brokenMachines.some(bm => bm.id === m.id)) {
        const ok = new Text({ text: '✓ FIXED', style: STYLE_STATUS })
        ok.x = m.x + 4
        ok.y = m.y + MACHINE_H - 16
        this.app.stage.addChild(ok)
      }
    }
  }

  private _drawInstructions(W: number, H: number) {
    const broken  = this.opts.brokenMachines.filter(bm => {
      const m = this.machines.find(m => m.id === bm.id)
      return m && !m.repaired
    }).length
    const total   = this.opts.brokenMachines.length
    const repaired = total - broken

    const txt = new Text({
      text: `Machines: ${repaired}/${total} repaired  ·  Click broken machine to fix`,
      style: STYLE_LABEL,
    })
    txt.x = 10
    txt.y = H - 20
    this.app.stage.addChild(txt)
  }

  private _drawCableOverlay(W: number, H: number) {
    if (!this.cableState) return
    const { ox, oy, ow, oh } = this._cableOverlayBounds()

    // Dim background
    const dim = new Graphics()
    dim.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.6 })
    this.app.stage.addChild(dim)

    // Panel
    const panel = new Graphics()
    panel.rect(ox, oy, ow, oh)
      .fill({ color: 0x0d1b2a })
      .stroke({ width: 2, color: 0x44aaff, alpha: 0.8 })
    this.app.stage.addChild(panel)

    // Title
    const title = new Text({ text: 'Cable Repair — Connect A to B', style: STYLE_PUZZLE })
    title.x = ox + 16
    title.y = oy + 14
    this.app.stage.addChild(title)

    const ax = ox + 80
    const ay = oy + 80
    const bx = ox + 240
    const by = oy + 80

    // Draw line if connected
    if (this.cableState.lineDrawn) {
      const line = new Graphics()
      line.moveTo(ax, ay).lineTo(bx, by)
      line.stroke({ width: 3, color: 0x44cc88 })
      this.app.stage.addChild(line)
    }

    // Endpoints
    const endA = new Graphics()
    const selA = this.cableState.selectedEndpoint === 'A'
    endA.circle(ax, ay, 18).fill({ color: selA ? 0x44aaff : 0x224466 })
      .stroke({ width: 2, color: selA ? 0x88ddff : 0x44aaff })
    this.app.stage.addChild(endA)
    const lblA = new Text({ text: 'A', style: STYLE_PUZZLE })
    lblA.anchor.set(0.5, 0.5)
    lblA.x = ax
    lblA.y = ay
    this.app.stage.addChild(lblA)

    const endB = new Graphics()
    const selB = this.cableState.selectedEndpoint === 'B'
    endB.circle(bx, by, 18).fill({ color: selB ? 0x44aaff : 0x224466 })
      .stroke({ width: 2, color: selB ? 0x88ddff : 0x44aaff })
    this.app.stage.addChild(endB)
    const lblB = new Text({ text: 'B', style: STYLE_PUZZLE })
    lblB.anchor.set(0.5, 0.5)
    lblB.x = bx
    lblB.y = by
    this.app.stage.addChild(lblB)

    // Hint
    const hint = new Text({
      text: this.cableState.selectedEndpoint ? 'Now click the other endpoint' : 'Click endpoint A or B to start',
      style: STYLE_HINT,
    })
    hint.x = ox + 16
    hint.y = oy + oh - 20
    this.app.stage.addChild(hint)

    // Close button
    this._drawCloseButton(ox + 295, oy + 10)

    void H
  }

  private _drawPartsOverlay(W: number, H: number) {
    if (!this.partsState) return
    const { ox, oy, ow, oh } = this._partsOverlayBounds()

    // Dim background
    const dim = new Graphics()
    dim.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.6 })
    this.app.stage.addChild(dim)

    // Panel
    const panel = new Graphics()
    panel.rect(ox, oy, ow, oh)
      .fill({ color: 0x0d1b2a })
      .stroke({ width: 2, color: 0x44aaff, alpha: 0.8 })
    this.app.stage.addChild(panel)

    // Title
    const title = new Text({ text: 'Parts Repair — Select correct part', style: STYLE_PUZZLE })
    title.x = ox + 16
    title.y = oy + 14
    this.app.stage.addChild(title)

    // Options
    const optLabels = ['Capacitor 10µF', 'Resistor 220Ω', 'Fuse 2A']
    for (let i = 0; i < 3; i++) {
      const bx = ox + 40
      const by = oy + 60 + i * 36
      const bw = 240
      const bh = 28

      const shaking = this.partsState.shakeTarget === i && this.partsState.shakeFrames > 0
      const shakeOff = shaking ? Math.sin(this.partsState.shakeFrames * 1.2) * 5 : 0

      const btn = new Graphics()
      btn.rect(bx + shakeOff, by, bw, bh)
        .fill({ color: shaking ? 0x3a1a1a : 0x1a2a3a })
        .stroke({ width: 1, color: shaking ? 0xff3333 : 0x44aaff })
      this.app.stage.addChild(btn)

      const lbl = new Text({ text: optLabels[i] ?? this.partsState.options[i], style: STYLE_PUZZLE })
      lbl.x = bx + shakeOff + 10
      lbl.y = by + 6
      this.app.stage.addChild(lbl)
    }

    // Close button
    this._drawCloseButton(ox + 295, oy + 10)

    void W; void H
  }

  private _drawCloseButton(x: number, y: number) {
    const btn = new Graphics()
    btn.circle(x, y, 10).fill({ color: 0x3a1a1a }).stroke({ width: 1, color: 0xff5555 })
    this.app.stage.addChild(btn)
    const lbl = new Text({ text: '✕', style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#ff5555' }) })
    lbl.anchor.set(0.5, 0.5)
    lbl.x = x
    lbl.y = y
    this.app.stage.addChild(lbl)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.opts.canvas.removeEventListener('pointerdown', this._onClick)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
