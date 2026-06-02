// src/pixi/DoorScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { Guest } from '@/data/barShifts'

const STYLE_RULE  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffaa44' })
const STYLE_NAME  = new TextStyle({ fontFamily: 'monospace', fontSize: 16, fill: '#ffeecc' })
const STYLE_VIP   = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#ffd700' })
const STYLE_BAN   = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#ff4444' })
const STYLE_ADMIT = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#44cc44' })
const STYLE_REJECT= new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#cc4444' })

export interface DoorSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  guest: Guest
  nightRule: string
  onAdmit: () => void
  onReject: () => void
}

export class DoorScene {
  private app: Application
  private options: DoorSceneOptions
  private destroyed = false
  private _keyHandler?: (e: KeyboardEvent) => void

  private constructor(app: Application, options: DoorSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: DoorSceneOptions): Promise<DoorScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x08060a,
      antialias: true,
    })
    const scene = new DoorScene(app, options)
    scene.render()
    return scene
  }

  private render() {
    const { app, options } = this
    const { width, height, guest, nightRule } = options
    app.stage.removeChildren()

    // ── Arkaplan ──────────────────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x08060a, alpha: 1 })
    app.stage.addChild(bg)

    // ── Gece Kuralı (üst) ─────────────────────────────────────────────────
    const ruleBg = new Graphics()
    ruleBg.rect(0, 0, width, 36).fill({ color: 0x1a0a00, alpha: 1 })
    app.stage.addChild(ruleBg)

    const ruleText = new Text({ text: `Gece Kuralı: ${nightRule}`, style: STYLE_RULE })
    ruleText.x = 12
    ruleText.y = 10
    app.stage.addChild(ruleText)

    // ── Misafir Kartı ─────────────────────────────────────────────────────
    const cardW = width * 0.55
    const cardH = height * 0.55
    const cardX = (width - cardW) / 2
    const cardY = height * 0.12

    const card = new Graphics()
    card.roundRect(cardX, cardY, cardW, cardH, 8)
      .fill({ color: 0x12100a, alpha: 1 })
      .stroke({ width: 1.5, color: guest.isBlacklisted ? 0xaa2222 : 0x443322, alpha: 0.9 })
    app.stage.addChild(card)

    // İsim
    const nameText = new Text({ text: guest.name, style: STYLE_NAME })
    nameText.x = cardX + 16
    nameText.y = cardY + 14
    app.stage.addChild(nameText)

    // VIP rozeti
    if (guest.isVip) {
      const vipText = new Text({ text: '★ VIP', style: STYLE_VIP })
      vipText.x = cardX + cardW - 52
      vipText.y = cardY + 16
      app.stage.addChild(vipText)
    }

    // Yasak rozeti
    if (guest.isBlacklisted) {
      const banText = new Text({ text: '⚠ YASAK LİSTE', style: STYLE_BAN })
      banText.x = cardX + 16
      banText.y = cardY + 38
      app.stage.addChild(banText)
    }

    // Görünüm ipuçları
    const cueStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#8080a0', wordWrap: true, wordWrapWidth: cardW - 32 })
    const cueText = new Text({ text: guest.visualCues.join('\n'), style: cueStyle })
    cueText.x = cardX + 16
    cueText.y = cardY + (guest.isBlacklisted ? 60 : 44)
    app.stage.addChild(cueText)

    // ── Karar Butonları ────────────────────────────────────────────────────
    const btnY = cardY + cardH + 24
    const btnW = cardW * 0.42
    const btnH = 40

    // İçeri Al butonu
    const admitBg = new Graphics()
    admitBg.roundRect(cardX, btnY, btnW, btnH, 6)
      .fill({ color: 0x0a2a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x228822, alpha: 0.9 })
    admitBg.eventMode = 'static'
    admitBg.cursor = 'pointer'
    admitBg.on('pointerdown', () => {
      if (this.destroyed) return
      options.onAdmit()
    })
    app.stage.addChild(admitBg)

    const admitText = new Text({ text: 'İçeri Al  [A]', style: STYLE_ADMIT })
    admitText.anchor.set(0.5, 0.5)
    admitText.x = cardX + btnW / 2
    admitText.y = btnY + btnH / 2
    app.stage.addChild(admitText)

    // Reddet butonu
    const rejectBg = new Graphics()
    rejectBg.roundRect(cardX + cardW - btnW, btnY, btnW, btnH, 6)
      .fill({ color: 0x2a0a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x882222, alpha: 0.9 })
    rejectBg.eventMode = 'static'
    rejectBg.cursor = 'pointer'
    rejectBg.on('pointerdown', () => {
      if (this.destroyed) return
      options.onReject()
    })
    app.stage.addChild(rejectBg)

    const rejectText = new Text({ text: 'Reddet  [D]', style: STYLE_REJECT })
    rejectText.anchor.set(0.5, 0.5)
    rejectText.x = cardX + cardW - btnW / 2
    rejectText.y = btnY + btnH / 2
    app.stage.addChild(rejectText)

    // ── Klavye kısayolları ─────────────────────────────────────────────────
    const onKey = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.key === 'a' || e.key === 'A') options.onAdmit()
      if (e.key === 'd' || e.key === 'D') options.onReject()
    }
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    window.addEventListener('keydown', onKey)
    this._keyHandler = onKey
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.app.destroy()
  }
}
