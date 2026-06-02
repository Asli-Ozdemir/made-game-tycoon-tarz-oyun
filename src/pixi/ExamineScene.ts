// src/pixi/ExamineScene.ts
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'
import type { EvidenceNode, ExamineItem } from '@/data/detectiveCases'

export interface ExamineSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  evidenceNode: EvidenceNode
  onItemFound: (itemId: string) => void
  onClose: () => void
}

export class ExamineScene {
  private app: Application
  private options: ExamineSceneOptions
  private destroyed = false
  private _keyHandler?: (e: KeyboardEvent) => void
  private _detailContainer: Container | null = null

  private constructor(app: Application, options: ExamineSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: ExamineSceneOptions): Promise<ExamineScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: 0x060408,
      antialias: true,
    })
    const scene = new ExamineScene(app, options)
    scene.render()
    return scene
  }

  private render() {
    const { app, options } = this
    const { width, height, evidenceNode } = options
    app.stage.removeChildren()
    this._detailContainer = null

    // ── Arkaplan ──────────────────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x060408, alpha: 1 })
    // Vinyette
    bg.circle(width / 2, height / 2, Math.max(width, height) * 0.7)
      .fill({ color: 0x000000, alpha: 0 })
    app.stage.addChild(bg)

    // ── Nesne alanı (merkez panel) ────────────────────────────────────────
    const panelW = width * 0.6
    const panelH = height * 0.55
    const panelX = (width - panelW) / 2
    const panelY = height * 0.12

    const panel = new Graphics()
    panel.roundRect(panelX, panelY, panelW, panelH, 8)
      .fill({ color: 0x0d0a08, alpha: 1 })
      .stroke({ width: 1.5, color: 0x443322, alpha: 0.8 })
    app.stage.addChild(panel)

    // ── Kanıt başlığı ─────────────────────────────────────────────────────
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: '#ffcc88',
    })
    const title = new Text({ text: evidenceNode.label, style: titleStyle })
    title.x = panelX + 12
    title.y = panelY - 22
    app.stage.addChild(title)

    // ── Açıklama ──────────────────────────────────────────────────────────
    const descStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: '#7070a0',
      wordWrap: true,
      wordWrapWidth: panelW - 24,
    })
    const desc = new Text({ text: evidenceNode.description, style: descStyle })
    desc.x = panelX + 12
    desc.y = panelY + panelH + 10
    app.stage.addChild(desc)

    // ── Tıklanabilir noktalar (examineItems) ──────────────────────────────
    const items = evidenceNode.examineItems ?? []
    items.forEach((item) => {
      const cx = panelX + item.xNorm * panelW
      const cy = panelY + item.yNorm * panelH

      const hotspot = new Graphics()
      hotspot.circle(0, 0, item.radius)
        .fill({ color: 0xff6644, alpha: 0.15 })
        .stroke({ width: 1.5, color: 0xff6644, alpha: 0.8 })
      hotspot.x = cx
      hotspot.y = cy
      hotspot.eventMode = 'static'
      hotspot.cursor = 'pointer'

      // Pulsing inner dot
      const dot = new Graphics()
      dot.circle(0, 0, 4).fill({ color: 0xff8866, alpha: 1 })
      hotspot.addChild(dot)

      // Label
      const labelStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#ff8866' })
      const label = new Text({ text: item.label, style: labelStyle })
      label.anchor.set(0.5, 0)
      label.x = 0
      label.y = item.radius + 4
      hotspot.addChild(label)

      hotspot.on('pointerdown', () => {
        if (this.destroyed) return
        this.showItemDetail(item)
        options.onItemFound(item.id)
      })

      app.stage.addChild(hotspot)
    })

    // ── ESC ipucu ─────────────────────────────────────────────────────────
    const escStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#3a3a60' })
    const escHint = new Text({ text: '[ESC] geri', style: escStyle })
    escHint.x = width - escHint.width - 12
    escHint.y = 10
    app.stage.addChild(escHint)

    // ── Klavye ESC dinleyici ──────────────────────────────────────────────
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.destroyed) {
        options.onClose()
      }
    }
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    window.addEventListener('keydown', onKey)
    this._keyHandler = onKey
  }

  private showItemDetail(item: ExamineItem) {
    const { app, options: { width, height } } = this

    // Remove previous detail if present
    if (this._detailContainer) {
      app.stage.removeChild(this._detailContainer)
      this._detailContainer = null
    }

    const container = new Container()

    const bg = new Graphics()
    bg.roundRect(20, height - 110, width - 40, 90, 6)
      .fill({ color: 0x000000, alpha: 0.85 })
      .stroke({ width: 1, color: 0x2a2a60, alpha: 1 })
    container.addChild(bg)

    const titleStyle = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffcc88' })
    const t = new Text({ text: item.label, style: titleStyle })
    t.x = 32
    t.y = height - 100
    container.addChild(t)

    const descStyle = new TextStyle({
      fontFamily: 'monospace', fontSize: 10, fill: '#8080c0',
      wordWrap: true, wordWrapWidth: width - 80,
    })
    const d = new Text({ text: item.description, style: descStyle })
    d.x = 32
    d.y = height - 82
    container.addChild(d)

    app.stage.addChild(container)
    this._detailContainer = container
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler)
    this.app.destroy()
  }
}
