// src/pixi/FishingScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { JiggingProfile } from '@/data/fishingSessions'

const STYLE_LABEL   = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#88bbcc' })
const STYLE_HINT    = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#3a4a50' })
const STYLE_REMY    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#c8a96e' })
const STYLE_SPECIES = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#44dd88', fontWeight: 'bold' })
const STYLE_MISS    = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#dd4444', fontWeight: 'bold' })

export interface FishingSceneOptions {
  canvas:         HTMLCanvasElement
  width:          number
  height:         number
  spotLabel:      string
  lureLabel:      string
  jiggingProfile: JiggingProfile
  targetSpecies:  string[]    // empty = nothing will bite (wrong lure/spot combo)
  onCastResult:   (result: { caught: boolean; species: string | null }) => void
}

type ScenePhase = 'idle' | 'jigging' | 'bite_anim' | 'reeling' | 'cast_done'

export class FishingScene {
  private app:      Application
  private opts:     FishingSceneOptions
  private destroyed = false

  // Internal mechanic state
  private phase:          ScenePhase = 'idle'
  private interestBar:    number = 0
  private tensionBar:     number = 50
  private sweetSpotFrames: number = 0

  // Lure animation
  private lureY:       number = 0
  private lureVelocity: number = 0
  private lureBaseY:   number = 0

  // Fish shadow
  private fishX: number = 0
  private fishY: number = 0
  private fishVisible: boolean = false

  // Water wave
  private waveOffset: number = 0

  // Timestamps for jigging rhythm
  private lastJigTs: number = 0

  // Bite animation timer
  private biteFrames: number = 0

  // Result display timer
  private resultFrames: number = 0
  private resultCaught: boolean = false
  private resultSpecies: string = ''

  private constructor(app: Application, opts: FishingSceneOptions) {
    this.app  = app
    this.opts = opts
  }

  static async create(opts: FishingSceneOptions): Promise<FishingScene> {
    const app = new Application()
    await app.init({
      canvas:          opts.canvas,
      width:           opts.width,
      height:          opts.height,
      backgroundColor: 0x0a1520,
      antialias:       true,
    })
    const scene = new FishingScene(app, opts)
    scene._init()
    return scene
  }

  private _init() {
    const H = this.opts.height
    this.lureBaseY = H * 0.72
    this.lureY     = this.lureBaseY
    this.fishX = -40
    this.fishY = this.lureBaseY + 10

    this.opts.canvas.addEventListener('pointerdown', this._onJig)
    this.opts.canvas.addEventListener('wheel', this._onWheel, { passive: true })

    this.app.ticker.add(this._tick)
    this._render()
  }

  private _onJig = (e: PointerEvent) => {
    if (this.destroyed) return
    if (e.button !== 0) return
    if (this.phase !== 'idle' && this.phase !== 'jigging') return
    if (this.phase === 'idle') this.phase = 'jigging'

    this.lureVelocity = -14

    const now = performance.now()
    const { optimalIntervalMs, toleranceMs } = this.opts.jiggingProfile
    if (this.lastJigTs > 0) {
      const interval  = now - this.lastJigTs
      const deviation = Math.abs(interval - optimalIntervalMs)
      if (deviation <= toleranceMs) {
        this.interestBar = Math.min(100, this.interestBar + 8)
      } else if (interval < optimalIntervalMs - toleranceMs) {
        this.interestBar = Math.max(0, this.interestBar - 5)
      }
    } else {
      this.interestBar = Math.min(100, this.interestBar + 2)
    }
    this.lastJigTs = now

    if (this.interestBar >= 100 && this.opts.targetSpecies.length > 0) {
      this._triggerBite()
    }
    this._render()
  }

  private _onWheel = (e: WheelEvent) => {
    if (this.destroyed) return
    if (this.phase !== 'reeling') return
    this.tensionBar += e.deltaY * 0.12
    this.tensionBar = Math.max(0, Math.min(100, this.tensionBar))
    if (this.tensionBar > 82) {
      this._endCast(false, 'broke')
    }
    this._render()
  }

  private _triggerBite() {
    this.phase      = 'bite_anim'
    this.biteFrames = 0
    this.tensionBar = 50
    this.sweetSpotFrames = 0
  }

  private _tick = () => {
    if (this.destroyed) return

    this.waveOffset += 0.04

    const gravity = 0.8
    this.lureVelocity += gravity
    this.lureY += this.lureVelocity
    if (this.lureY > this.lureBaseY) {
      this.lureY = this.lureBaseY
      this.lureVelocity *= -0.35
    }

    if (this.phase === 'jigging') {
      const now = performance.now()
      const msSinceJig = now - this.lastJigTs
      if (msSinceJig > this.opts.jiggingProfile.optimalIntervalMs + this.opts.jiggingProfile.toleranceMs) {
        this.interestBar = Math.max(0, this.interestBar - 1.5)
      }
      this.fishVisible = this.interestBar > 40 && this.opts.targetSpecies.length > 0
      if (this.fishVisible) {
        const targetX = this.opts.width * 0.5
        const targetY = this.lureY + 8
        this.fishX += (targetX - this.fishX) * 0.04
        this.fishY += (targetY - this.fishY) * 0.04
      }
    }

    if (this.phase === 'bite_anim') {
      this.biteFrames++
      if (this.biteFrames > 50) {
        this.phase = 'reeling'
        this.tensionBar = 50
        this.sweetSpotFrames = 0
      }
    }

    if (this.phase === 'reeling') {
      this.tensionBar += (50 - this.tensionBar) * 0.015
      this.tensionBar = Math.max(0, Math.min(100, this.tensionBar))

      const inSweet = this.tensionBar >= 35 && this.tensionBar <= 65
      if (inSweet) {
        this.sweetSpotFrames++
        if (this.sweetSpotFrames >= 90) {
          const species = this.opts.targetSpecies[
            Math.floor(Math.random() * this.opts.targetSpecies.length)
          ]
          this._endCast(true, species)
          return
        }
      } else {
        this.sweetSpotFrames = Math.max(0, this.sweetSpotFrames - 2)
      }

      if (this.tensionBar < 18) {
        this._endCast(false, 'escaped')
      }
    }

    if (this.phase === 'cast_done') {
      this.resultFrames++
      if (this.resultFrames > 80) {
        this.opts.onCastResult({
          caught:  this.resultCaught,
          species: this.resultCaught ? this.resultSpecies : null,
        })
        return
      }
    }

    this._render()
  }

  private _endCast(caught: boolean, speciesOrReason: string) {
    this.phase = 'cast_done'
    this.resultCaught  = caught
    this.resultSpecies = caught ? speciesOrReason : ''
    this.resultFrames  = 0
    this.fishVisible   = false
    this._render()
  }

  private _render() {
    if (this.destroyed) return
    const { app } = this
    const W = this.opts.width
    const H = this.opts.height
    app.stage.removeChildren()

    this._drawBackground(W, H)
    this._drawWater(W, H)
    this._drawPier(W, H)
    this._drawRemy(W, H)
    this._drawLine(W, H)
    this._drawLure(W, H)
    if (this.fishVisible) this._drawFishShadow()
    this._drawUI(W, H)
  }

  private _drawBackground(W: number, H: number) {
    const sky = new Graphics()
    sky.rect(0, 0, W, H * 0.55).fill({ color: 0x0a1a2a })
    this.app.stage.addChild(sky)
    const horizon = new Graphics()
    horizon.rect(0, H * 0.52, W, H * 0.08).fill({ color: 0x1a3a4a })
    this.app.stage.addChild(horizon)
  }

  private _drawWater(W: number, H: number) {
    const water = new Graphics()
    water.rect(0, H * 0.58, W, H * 0.42).fill({ color: 0x0d2535 })
    this.app.stage.addChild(water)
    const wave = new Graphics()
    wave.moveTo(0, H * 0.58)
    for (let x = 0; x <= W; x += 8) {
      const y = H * 0.58 + Math.sin((x * 0.03) + this.waveOffset) * 3
      wave.lineTo(x, y)
    }
    wave.stroke({ width: 1.5, color: 0x2a6080, alpha: 0.8 })
    this.app.stage.addChild(wave)
  }

  private _drawPier(W: number, H: number) {
    const pier = new Graphics()
    pier.rect(0, H * 0.62, W * 0.4, H * 0.38).fill({ color: 0x2a1a08 })
    for (let i = 0; i < 8; i++) {
      const plankY = H * 0.62 + i * 18
      pier.moveTo(0, plankY).lineTo(W * 0.4, plankY)
    }
    pier.stroke({ width: 1, color: 0x3a2a12, alpha: 0.6 })
    this.app.stage.addChild(pier)
  }

  private _drawRemy(W: number, H: number) {
    const body = new Graphics()
    body.roundRect(W * 0.12, H * 0.52, 26, 42, 4).fill({ color: 0x1a2a30 })
    this.app.stage.addChild(body)
    const head = new Graphics()
    head.circle(W * 0.125 + 13, H * 0.52 - 10, 10).fill({ color: 0x2a3a40 })
    this.app.stage.addChild(head)
    const rod = new Graphics()
    rod.moveTo(W * 0.125 + 13, H * 0.52 + 10)
    rod.lineTo(W * 0.55, H * 0.50)
    rod.stroke({ width: 2, color: 0x8b6914 })
    this.app.stage.addChild(rod)
    const label = new Text({ text: 'Remy', style: STYLE_REMY })
    label.x = W * 0.06
    label.y = H * 0.42
    this.app.stage.addChild(label)
  }

  private _drawLine(W: number, H: number) {
    const rodTipX = W * 0.55
    const rodTipY = H * 0.50
    const line = new Graphics()
    if (this.phase === 'reeling') {
      line.moveTo(rodTipX, rodTipY)
      line.lineTo(W * 0.55, this.lureY)
      const tensionAlpha = (this.tensionBar - 35) / 30
      const tensionColor = tensionAlpha > 0.5 ? 0xff6666 : 0xaaddff
      line.stroke({ width: 2, color: tensionColor, alpha: 0.9 })
    } else {
      line.moveTo(rodTipX, rodTipY)
      line.quadraticCurveTo(W * 0.53, H * 0.62, W * 0.55, this.lureY)
      line.stroke({ width: 1.5, color: 0x88aacc, alpha: 0.7 })
    }
    this.app.stage.addChild(line)
  }

  private _drawLure(W: number, H: number) {
    const lure = new Graphics()
    if (this.phase === 'bite_anim') {
      const pulse = (this.biteFrames % 12) / 12
      lure.circle(W * 0.55, this.lureY, 8 + pulse * 6).fill({ color: 0xffdd44, alpha: 0.9 - pulse * 0.4 })
    } else {
      lure.circle(W * 0.55, this.lureY, 5).fill({ color: 0xddaa44, alpha: 0.85 })
    }
    this.app.stage.addChild(lure)
  }

  private _drawFishShadow() {
    const fish = new Graphics()
    fish.ellipse(this.fishX, this.fishY, 22, 10).fill({ color: 0x224455, alpha: 0.5 })
    this.app.stage.addChild(fish)
  }

  private _drawUI(W: number, H: number) {
    const infoText = new Text({
      text: `${this.opts.spotLabel} · ${this.opts.lureLabel}`,
      style: STYLE_LABEL,
    })
    infoText.x = 10
    infoText.y = 10
    this.app.stage.addChild(infoText)

    if (this.phase === 'jigging' || this.phase === 'idle') {
      this._drawRhythmIndicator(W, H)
    }

    const barX = W - 22
    const barTop = 40
    const barH = H * 0.5

    if (this.phase === 'jigging' || this.phase === 'idle') {
      this._drawVerticalBar(barX, barTop, barH, this.interestBar / 100, 0x44cc88, 'INTEREST')
    } else if (this.phase === 'reeling') {
      const sweetY1 = barTop + barH * (1 - 65 / 100)
      const sweetY2 = barTop + barH * (1 - 35 / 100)
      const sweet = new Graphics()
      sweet.rect(barX - 2, sweetY1, 18, sweetY2 - sweetY1).fill({ color: 0x44cc88, alpha: 0.15 })
      this.app.stage.addChild(sweet)
      this._drawVerticalBar(barX, barTop, barH, this.tensionBar / 100, 0x44aaff, 'TENSION')
    }

    if (this.phase === 'idle') {
      const hint = new Text({ text: `Click to jig  ·  ${this.opts.jiggingProfile.rhythmLabel}`, style: STYLE_HINT })
      hint.anchor.set(0.5, 0)
      hint.x = W / 2
      hint.y = H - 18
      this.app.stage.addChild(hint)
    } else if (this.phase === 'reeling') {
      const hint = new Text({ text: 'Scroll to reel · keep tension in the green zone', style: STYLE_HINT })
      hint.anchor.set(0.5, 0)
      hint.x = W / 2
      hint.y = H - 18
      this.app.stage.addChild(hint)
      const prog = this.sweetSpotFrames / 90
      const arc = new Graphics()
      arc.arc(W * 0.55, this.lureY - 22, 14, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2)
      arc.stroke({ width: 3, color: 0x44cc88, alpha: 0.8 })
      this.app.stage.addChild(arc)
    } else if (this.phase === 'cast_done') {
      const resultTxt = new Text({
        text: this.resultCaught ? `${this.resultSpecies.toUpperCase()}!` : 'GOT AWAY...',
        style: this.resultCaught ? STYLE_SPECIES : STYLE_MISS,
      })
      resultTxt.anchor.set(0.5, 0.5)
      resultTxt.x = W / 2
      resultTxt.y = H * 0.35
      this.app.stage.addChild(resultTxt)
    }
  }

  private _drawRhythmIndicator(W: number, H: number) {
    const { optimalIntervalMs, toleranceMs, rhythmLabel } = this.opts.jiggingProfile
    const now = performance.now()
    const elapsed = this.lastJigTs > 0 ? now - this.lastJigTs : optimalIntervalMs
    const ratio = Math.min(elapsed / (optimalIntervalMs + toleranceMs), 1)

    const x = 8
    const y = 40
    const barW = 12
    const barH = H * 0.4

    // Background
    const bg = new Graphics()
    bg.rect(x, y, barW, barH).fill({ color: 0x0a1520, alpha: 0.8 })
    bg.stroke({ width: 1, color: 0x224455, alpha: 0.6 })
    this.app.stage.addChild(bg)

    // Optimal zone (green band)
    const zoneTop = barH * (1 - Math.min((optimalIntervalMs + toleranceMs) / (optimalIntervalMs + toleranceMs * 2), 1))
    const zoneBot = barH * (1 - Math.max((optimalIntervalMs - toleranceMs) / (optimalIntervalMs + toleranceMs * 2), 0))
    const zone = new Graphics()
    zone.rect(x + 1, y + zoneTop, barW - 2, zoneBot - zoneTop).fill({ color: 0x44cc88, alpha: 0.25 })
    this.app.stage.addChild(zone)

    // Cursor (where elapsed time currently is)
    const cursorY = y + barH * (1 - ratio)
    const inZone = elapsed >= optimalIntervalMs - toleranceMs && elapsed <= optimalIntervalMs + toleranceMs
    const cursor = new Graphics()
    cursor.rect(x + 1, cursorY - 2, barW - 2, 4).fill({ color: inZone ? 0x44cc88 : 0xaaaaaa, alpha: 0.9 })
    this.app.stage.addChild(cursor)

    // Label
    const lbl = new Text({ text: 'RHYTHM', style: STYLE_HINT })
    lbl.anchor.set(0.5, 0)
    lbl.x = x + barW / 2
    lbl.y = y + barH + 4
    this.app.stage.addChild(lbl)

    // Rhythm label below
    const rlbl = new Text({ text: rhythmLabel, style: STYLE_HINT })
    rlbl.anchor.set(0.5, 0)
    rlbl.x = x + barW / 2 + 10
    rlbl.y = y + barH + 16
    this.app.stage.addChild(rlbl)
  }

  private _drawVerticalBar(x: number, y: number, h: number, fillRatio: number, color: number, label: string) {
    const bg = new Graphics()
    bg.rect(x, y, 14, h).fill({ color: 0x0a1520, alpha: 0.8 })
    bg.stroke({ width: 1, color: 0x224455, alpha: 0.6 })
    this.app.stage.addChild(bg)
    const fillH = h * fillRatio
    const bar = new Graphics()
    bar.rect(x + 1, y + h - fillH, 12, fillH).fill({ color, alpha: 0.85 })
    this.app.stage.addChild(bar)
    const lbl = new Text({ text: label, style: STYLE_HINT })
    lbl.anchor.set(0.5, 0)
    lbl.x = x + 7
    lbl.y = y + h + 4
    this.app.stage.addChild(lbl)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.opts.canvas.removeEventListener('pointerdown', this._onJig)
    this.opts.canvas.removeEventListener('wheel', this._onWheel)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
