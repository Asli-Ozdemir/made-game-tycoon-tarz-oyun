// src/pixi/RaftScene.ts
import { Application, Graphics, Text, TextStyle, Ticker } from 'pixi.js'
import type { RaftObstacle } from '@/data/nehirShifts'

const WORLD_SCALE   = 5      // world width = canvas.width * WORLD_SCALE
const SCROLL_SPEED  = 1.8    // world-pixels per 60fps frame
const RAFT_RADIUS   = 14
const PADDLE_FORCE  = 4.5
const FRICTION      = 0.86
const CURRENT_SCALE = 0.07
const ROCK_RADIUS   = 13
const HIT_WINDOW    = 28     // world-pixels: obstacle active zone half-width

const STYLE_UI     = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#88bbcc' })
const STYLE_WARN   = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ff4444' })
const STYLE_DONE   = new TextStyle({ fontFamily: 'monospace', fontSize: 18, fill: '#ffffff', fontWeight: 'bold' })
const STYLE_LABEL  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#4a7a8a' })

export interface RaftSceneOptions {
  canvas:        HTMLCanvasElement
  width:         number
  height:        number
  obstacles:     RaftObstacle[]
  currentForce:  number
  currentShifts: number[]
  timeLimitSecs: number
  onComplete:    (result: { damage: number; timeLeft: number }) => void
}

export class RaftScene {
  private app:       Application
  private opts:      RaftSceneOptions
  private destroyed  = false

  // River layout (set in _init)
  private riverTop:  number = 0
  private riverBot:  number = 0
  private totalWidth:number = 0

  // Physics state
  private scrollX:    number = 0
  private raftY:      number = 0
  private raftVY:     number = 0
  private currentDir: number = 1   // +1 pushes toward riverBot, -1 toward riverTop
  private damage:     number = 0
  private elapsed:    number = 0   // seconds
  private done:       boolean = false

  // Obstacles: track which have been resolved (hit or safely passed)
  private resolvedObstacles = new Set<number>()

  // Wave animation
  private waveOffset: number = 0

  private constructor(app: Application, opts: RaftSceneOptions) {
    this.app  = app
    this.opts = opts
  }

  static async create(opts: RaftSceneOptions): Promise<RaftScene> {
    const app = new Application()
    await app.init({
      canvas:          opts.canvas,
      width:           opts.width,
      height:          opts.height,
      backgroundColor: 0x070e17,
      antialias:       true,
    })
    const scene = new RaftScene(app, opts)
    scene._init()
    return scene
  }

  private _init() {
    const { width, height } = this.opts
    this.totalWidth = width * WORLD_SCALE
    this.riverTop   = height * 0.27
    this.riverBot   = height * 0.73
    this.raftY      = (this.riverTop + this.riverBot) / 2

    window.addEventListener('keydown', this._onKey)
    this.app.ticker.add(this._tick)
    this._render()
  }

  private _onKey = (e: KeyboardEvent) => {
    if (this.destroyed || this.done) return
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') this.raftVY -= PADDLE_FORCE
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.raftVY += PADDLE_FORCE
  }

  private _tick = (ticker: Ticker) => {
    if (this.destroyed || this.done) return

    const dt = ticker.deltaTime   // normalized to 60fps
    this.elapsed += ticker.deltaMS / 1000
    this.waveOffset += 0.04 * dt

    // Current direction shifts at specified xNorm crossings
    const prevNorm = (this.scrollX) / this.totalWidth
    const nextScrollX = this.scrollX + SCROLL_SPEED * dt
    const nextNorm = nextScrollX / this.totalWidth
    for (const shiftNorm of this.opts.currentShifts) {
      if (prevNorm < shiftNorm && nextNorm >= shiftNorm) {
        this.currentDir *= -1
      }
    }

    // Physics
    this.raftVY += this.opts.currentForce * this.currentDir * CURRENT_SCALE * dt
    this.raftVY *= FRICTION
    const margin = RAFT_RADIUS + 3
    this.raftY = Math.max(
      this.riverTop + margin,
      Math.min(this.riverBot - margin, this.raftY + this.raftVY),
    )

    this.scrollX = nextScrollX

    // Collision
    this._checkObstacles()

    // Timer expiry
    if (this.elapsed >= this.opts.timeLimitSecs) {
      this._finish(0)
      return
    }

    // Finish line
    if (this.scrollX >= this.totalWidth) {
      this._finish(Math.max(0, this.opts.timeLimitSecs - this.elapsed))
      return
    }

    this._render()
  }

  private _checkObstacles() {
    const { width } = this.opts
    const riverH    = this.riverBot - this.riverTop
    const raftWorldX = this.scrollX + width * 0.2

    this.opts.obstacles.forEach((obs, idx) => {
      if (this.resolvedObstacles.has(idx)) return

      const obsWorldX = obs.xNorm * this.totalWidth
      if (Math.abs(raftWorldX - obsWorldX) > HIT_WINDOW) return

      // Within hit window
      const obsY = obs.yNorm * riverH + this.riverTop
      let hit = false

      if (obs.type === 'rock') {
        hit = Math.abs(this.raftY - obsY) < ROCK_RADIUS + RAFT_RADIUS
      } else if (obs.type === 'narrows') {
        const gapH      = (obs.width ?? 0.35) * riverH
        const gapTop    = obsY - gapH / 2
        const gapBottom = obsY + gapH / 2
        hit = this.raftY < gapTop + RAFT_RADIUS || this.raftY > gapBottom - RAFT_RADIUS
      } else if (obs.type === 'debris') {
        const debrisY = obsY + Math.sin(this.elapsed * 2.2) * riverH * 0.14
        hit = Math.abs(this.raftY - debrisY) < RAFT_RADIUS + 9
      }

      this.resolvedObstacles.add(idx)
      if (hit) this._takeDamage()
    })
  }

  private _takeDamage() {
    this.damage++
    if (this.damage >= 3) this._finish(0)
  }

  private _finish(timeLeft: number) {
    if (this.done) return
    this.done = true
    this._render()
    setTimeout(() => {
      if (!this.destroyed) {
        this.opts.onComplete({ damage: this.damage, timeLeft })
      }
    }, 700)
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  private _render() {
    if (this.destroyed) return
    const W = this.opts.width
    const H = this.opts.height
    this.app.stage.removeChildren()

    this._drawSky(W, H)
    this._drawSilhouette(W)
    this._drawRiver(W)
    this._drawCurrentLines(W)
    this._drawObstacles(W)
    this._drawRaft(W)
    this._drawUI(W, H)

    if (this.done) this._drawDoneOverlay(W, H)
  }

  private _drawSky(W: number, H: number) {
    const sky = new Graphics()
    sky.rect(0, 0, W, this.riverTop).fill({ color: 0x0a1a2a })
    // Warm horizon band
    sky.rect(0, this.riverTop - H * 0.06, W, H * 0.07).fill({ color: 0x1a2a3a })
    this.app.stage.addChild(sky)
  }

  private _drawSilhouette(W: number) {
    const trees = new Graphics()
    const baseY = this.riverTop
    for (let x = -10; x < W + 10; x += 28) {
      const treeH = 12 + Math.sin(x * 0.18 + this.scrollX * 0.0008) * 7
      // Trunk
      trees.rect(x + 3, baseY - treeH, 6, treeH).fill({ color: 0x0a150a })
      // Crown
      trees.circle(x + 6, baseY - treeH - 6, 8).fill({ color: 0x0d190d })
    }
    this.app.stage.addChild(trees)
  }

  private _drawRiver(W: number) {
    const riverH = this.riverBot - this.riverTop
    const river  = new Graphics()
    river.rect(0, this.riverTop, W, riverH).fill({ color: 0x0d2535 })
    // Bank lines
    river.rect(0, this.riverTop,      W, 3).fill({ color: 0x1a3a4a })
    river.rect(0, this.riverBot - 3,  W, 3).fill({ color: 0x1a3a4a })
    // Ground strips
    river.rect(0, 0,              W, this.riverTop).fill({ color: 0x080e08 })
    river.rect(0, this.riverBot,  W, this.opts.height - this.riverBot).fill({ color: 0x080e08 })
    this.app.stage.addChild(river)
  }

  private _drawCurrentLines(W: number) {
    const riverH   = this.riverBot - this.riverTop
    const lines    = new Graphics()
    const lineCount = 5
    for (let i = 0; i < lineCount; i++) {
      const yBase   = this.riverTop + (riverH / lineCount) * i + riverH / (lineCount * 2)
      const xOffset = (this.scrollX * 0.4 + i * 55) % (W + 60)
      lines.moveTo(W - xOffset,      yBase)
           .lineTo(W - xOffset + 35, yBase)
           .stroke({ width: 1, color: 0x1e4a60, alpha: 0.55 })
    }
    this.app.stage.addChild(lines)
  }

  private _drawObstacles(W: number) {
    const riverH = this.riverBot - this.riverTop
    const g      = new Graphics()

    this.opts.obstacles.forEach((obs, idx) => {
      const obsWorldX = obs.xNorm * this.totalWidth
      const screenX   = obsWorldX - this.scrollX
      if (screenX < -60 || screenX > W + 60) return

      const obsY = obs.yNorm * riverH + this.riverTop
      const resolved = this.resolvedObstacles.has(idx)
      const dimColor = resolved ? 0x1a1a1a : undefined

      if (obs.type === 'rock') {
        g.circle(screenX, obsY, ROCK_RADIUS)
         .fill({ color: dimColor ?? 0x374151 })
        g.circle(screenX, obsY, ROCK_RADIUS)
         .stroke({ width: 1.5, color: 0x4a5568 })
        // Highlight glint
        if (!resolved) {
          g.circle(screenX - 4, obsY - 4, 3).fill({ color: 0x5a6a78 })
        }

      } else if (obs.type === 'narrows') {
        const gapH      = (obs.width ?? 0.35) * riverH
        const gapTop    = obsY - gapH / 2
        const gapBottom = obsY + gapH / 2
        const barrierColor = dimColor ?? 0x4a5568
        // Top barrier
        g.rect(screenX - 5, this.riverTop, 10, gapTop - this.riverTop)
         .fill({ color: barrierColor })
        // Bottom barrier
        g.rect(screenX - 5, gapBottom, 10, this.riverBot - gapBottom)
         .fill({ color: barrierColor })
        // Gap indicator
        if (!resolved) {
          g.moveTo(screenX, gapTop)
           .lineTo(screenX, gapBottom)
           .stroke({ width: 1, color: 0x88aacc, alpha: 0.3 })
        }

      } else if (obs.type === 'debris') {
        const debrisY = obsY + Math.sin(this.elapsed * 2.2) * riverH * 0.14
        g.rect(screenX - 9, debrisY - 5, 18, 10)
         .fill({ color: dimColor ?? 0x6b4c2a })
        g.rect(screenX - 9, debrisY - 5, 18, 10)
         .stroke({ width: 1, color: 0x8b6914 })
        // Motion lines
        if (!resolved) {
          g.moveTo(screenX - 13, debrisY)
           .lineTo(screenX - 9,  debrisY)
           .stroke({ width: 1, color: 0x4a3a1a, alpha: 0.5 })
        }
      }
    })

    this.app.stage.addChild(g)
  }

  private _drawRaft(W: number) {
    const screenX = W * 0.2
    const g       = new Graphics()

    // Raft body
    g.rect(screenX - 22, this.raftY - 8, 44, 16).fill({ color: 0x8b6914 })
    g.rect(screenX - 22, this.raftY - 8, 44, 16).stroke({ width: 1, color: 0xb8860b })

    // Log planks
    for (let i = -16; i <= 18; i += 9) {
      g.moveTo(screenX + i, this.raftY - 8)
       .lineTo(screenX + i, this.raftY + 8)
       .stroke({ width: 1, color: 0x6b5010, alpha: 0.45 })
    }

    // Paddle silhouette
    g.rect(screenX + 18, this.raftY - 14, 3, 12).fill({ color: 0x5a4010 })

    this.app.stage.addChild(g)
  }

  private _drawUI(W: number, H: number) {
    // ── Damage hearts (top-left) ───────────────────────────────────────────────
    const hearts = new Graphics()
    const heartPad  = 16
    for (let i = 0; i < 3; i++) {
      const x = 10 + i * heartPad
      const y = 10
      const lost = i < this.damage
      hearts.circle(x + 4,  y + 3,  4).fill({ color: lost ? 0x2a1010 : 0xcc2222 })
      hearts.circle(x + 10, y + 3,  4).fill({ color: lost ? 0x2a1010 : 0xcc2222 })
      hearts.rect(  x,      y + 5, 14, 7).fill({ color: lost ? 0x2a1010 : 0xcc2222 })
    }
    this.app.stage.addChild(hearts)

    // ── Timer (top-right) ──────────────────────────────────────────────────────
    const remaining = Math.max(0, this.opts.timeLimitSecs - this.elapsed)
    const mins      = Math.floor(remaining / 60)
    const secs      = Math.floor(remaining % 60)
    const timerStr  = `${mins}:${secs.toString().padStart(2, '0')}`
    const timerStyle = remaining < 10 ? STYLE_WARN : STYLE_UI
    const timerText  = new Text({ text: timerStr, style: timerStyle })
    timerText.x = W - 52
    timerText.y = 8
    this.app.stage.addChild(timerText)

    // ── Progress bar (bottom) ──────────────────────────────────────────────────
    const prog   = Math.min(1, this.scrollX / this.totalWidth)
    const barW   = W - 20
    const barG   = new Graphics()
    barG.rect(10, H - 16, barW, 6).fill({ color: 0x0f1f2a })
    barG.rect(10, H - 16, barW * prog, 6).fill({ color: 0x3a7a9a })
    this.app.stage.addChild(barG)

    // Controls hint (very subtle, shown briefly)
    if (this.elapsed < 3) {
      const hint = new Text({ text: '← A  steer up   D →  steer down', style: STYLE_LABEL })
      hint.x = W / 2 - hint.width / 2
      hint.y = H - 34
      this.app.stage.addChild(hint)
    }
  }

  private _drawDoneOverlay(W: number, H: number) {
    const overlay = new Graphics()
    overlay.rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.5 })
    this.app.stage.addChild(overlay)

    const msg     = this.damage >= 3 ? 'Raft Sank' : 'Shore Reached'
    const msgText = new Text({ text: msg, style: STYLE_DONE })
    msgText.x = W / 2 - msgText.width / 2
    msgText.y = H / 2 - 14
    this.app.stage.addChild(msgText)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    window.removeEventListener('keydown', this._onKey)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
