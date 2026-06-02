// src/pixi/FightScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'

export interface FightSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  onFightEnd: (playerWon: boolean) => void
}

export class FightScene {
  private app: Application
  private options: FightSceneOptions
  private destroyed = false
  private _keyHandler?: (e: KeyboardEvent) => void
  private _enemyTimer: ReturnType<typeof setInterval> | null = null

  private _playerHealth = 3
  private _enemyHealth = 3
  private readonly ENEMY_ATTACK_INTERVAL_MS = 2500

  private constructor(app: Application, options: FightSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: FightSceneOptions): Promise<FightScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x100808,
      antialias: true,
    })
    const scene = new FightScene(app, options)
    scene._startEnemyTimer()
    scene._setupInput()
    scene._render()
    return scene
  }

  private _render() {
    const { app } = this
    const { width, height } = this.options
    app.stage.removeChildren()

    // ── Arkaplan ──────────────────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x100808, alpha: 1 })
    app.stage.addChild(bg)

    // ── Başlık ────────────────────────────────────────────────────────────
    const titleStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ff4444' })
    const titleText = new Text({ text: '⚠ KAVGA', style: titleStyle })
    titleText.anchor.set(0.5, 0)
    titleText.x = width / 2
    titleText.y = 12
    app.stage.addChild(titleText)

    // ── Oyuncu sağlık barı (sol) ───────────────────────────────────────────
    this._drawHealthBar(40, height - 60, 120, 'OYUNCU', this._playerHealth, 0x44cc44)

    // ── Düşman sağlık barı (sağ) ──────────────────────────────────────────
    this._drawHealthBar(width - 160, height - 60, 120, 'DÜŞMAN', this._enemyHealth, 0xcc4444)

    // ── Figürler ──────────────────────────────────────────────────────────
    this._drawFigure(width * 0.28, height * 0.45, 0x4488ff, false)  // oyuncu
    this._drawFigure(width * 0.72, height * 0.45, 0xff4444, true)   // düşman

    // ── Kontrol ipucu ─────────────────────────────────────────────────────
    const hintStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#4a4a60' })
    const hintText = new Text({ text: 'Z / Sol Tık = Yumruk', style: hintStyle })
    hintText.anchor.set(0.5, 0)
    hintText.x = width / 2
    hintText.y = height - 22
    app.stage.addChild(hintText)

  }

  private _drawHealthBar(x: number, y: number, barWidth: number, label: string, health: number, color: number) {
    const { app } = this
    const barH = 12
    const maxHealth = 3

    const labelStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#888888' })
    const labelText = new Text({ text: label, style: labelStyle })
    labelText.x = x
    labelText.y = y - 16
    app.stage.addChild(labelText)

    // Arkaplan
    const barBg = new Graphics()
    barBg.roundRect(x, y, barWidth, barH, 3).fill({ color: 0x221111, alpha: 1 })
    app.stage.addChild(barBg)

    // Dolu kısım
    const fillW = (health / maxHealth) * barWidth
    if (fillW > 0) {
      const barFill = new Graphics()
      barFill.roundRect(x, y, fillW, barH, 3).fill({ color, alpha: 1 })
      app.stage.addChild(barFill)
    }

    // Sayı
    const numStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#cccccc' })
    const numText = new Text({ text: `${health}/3`, style: numStyle })
    numText.x = x + barWidth + 6
    numText.y = y
    app.stage.addChild(numText)
  }

  private _drawFigure(cx: number, cy: number, color: number, isEnemy: boolean) {
    const { app } = this
    const fig = new Graphics()
    // Kafa
    fig.circle(cx, cy - 28, 14).fill({ color, alpha: 0.9 })
    // Gövde
    fig.rect(cx - 10, cy - 14, 20, 30).fill({ color, alpha: 0.9 })
    // Kollar
    fig.rect(cx - 22, cy - 12, 12, 8).fill({ color, alpha: 0.7 })
    fig.rect(cx + 10, cy - 12, 12, 8).fill({ color, alpha: 0.7 })
    // Bacaklar
    fig.rect(cx - 10, cy + 16, 8, 20).fill({ color, alpha: 0.9 })
    fig.rect(cx + 2, cy + 16, 8, 20).fill({ color, alpha: 0.9 })
    app.stage.addChild(fig)

    if (isEnemy) {
      const nameStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#ff8888' })
      const nameText = new Text({ text: 'DÜŞMAN', style: nameStyle })
      nameText.anchor.set(0.5, 0)
      nameText.x = cx
      nameText.y = cy + 42
      app.stage.addChild(nameText)
    }
  }

  private _playerPunch() {
    if (this.destroyed || this._enemyHealth <= 0) return
    this._enemyHealth = Math.max(0, this._enemyHealth - 1)
    this._render()
    if (this._enemyHealth <= 0) {
      this._end(true)
    }
  }

  private _enemyPunch() {
    if (this.destroyed || this._playerHealth <= 0) return
    this._playerHealth = Math.max(0, this._playerHealth - 1)
    this._render()
    if (this._playerHealth <= 0) {
      this._end(false)
    }
  }

  private _end(playerWon: boolean) {
    this._stopEnemyTimer()
    if (this.destroyed) return
    this.destroyed = true
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.options.onFightEnd(playerWon)
  }

  private _startEnemyTimer() {
    this._enemyTimer = setInterval(() => {
      if (!this.destroyed) this._enemyPunch()
    }, this.ENEMY_ATTACK_INTERVAL_MS)
  }

  private _stopEnemyTimer() {
    if (this._enemyTimer !== null) {
      clearInterval(this._enemyTimer)
      this._enemyTimer = null
    }
  }

  private _setupInput() {
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    const onKey = (e: KeyboardEvent) => {
      if (this.destroyed) return
      if (e.key === 'z' || e.key === 'Z') this._playerPunch()
    }
    window.addEventListener('keydown', onKey)
    this._keyHandler = onKey

    // Click/tap punch — registered once here, not in _render()
    this.app.stage.eventMode = 'static'
    this.app.stage.on('pointerdown', () => {
      if (this.destroyed) return
      this._playerPunch()
    })
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this._stopEnemyTimer()
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.app.destroy()
  }
}
