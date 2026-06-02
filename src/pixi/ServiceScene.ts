// src/pixi/ServiceScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { PubShift, Table } from '@/data/pubShifts'
import type { TableStatus } from '@/store/pubStore'

// ─── Statik stiller ────────────────────────────────────────────────────────────
const STYLE_HEADER        = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ffaa44' })
const STYLE_TABLE_TITLE   = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ffeecc' })
const STYLE_CUSTOMER      = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#8080a0' })
const STYLE_STATUS        = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#4a4a60' })
const STYLE_READY         = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#44ff88' })
const STYLE_FAILED        = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#ff4444' })
const STYLE_REQUEST_KNOWN = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#ff8844' })
const STYLE_PANEL_TITLE   = new TextStyle({ fontFamily: 'monospace', fontSize: 13, fill: '#ffeecc' })
const STYLE_BTN_NORMAL    = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#8080c0' })
const STYLE_BTN_SELECTED  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#44ccff' })
const STYLE_CONFIRM       = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#44cc44' })
const STYLE_CANCEL        = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#cc4444' })
const STYLE_HINT          = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#3a3a50' })

// ─── Durum renkleri ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<TableStatus, number> = {
  waiting:  0x1a1a2e,
  ordered:  0x1a1a2e,
  cooking:  0x1a1200,
  ready:    0x0a1a0a,
  served:   0x0a2a0a,
  failed:   0x2a0a0a,
}

const STATUS_BORDER: Record<TableStatus, number> = {
  waiting:  0x334466,
  ordered:  0x334466,
  cooking:  0x664400,
  ready:    0x44cc44,
  served:   0x228822,
  failed:   0x882222,
}

const DEFAULT_COOKING_DELAY_MS           = 4000
const WRONG_DELIVERY_PATIENCE_PENALTY_MS = 8000

export interface ServiceSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  shift: PubShift
  cookingDelayMs?: number
  onInteractTable: (tableId: string) => void
  onSubmitOrder:   (tableId: string, order: string[]) => void
  onMarkReady:     (tableId: string) => void
  onDeliverOrder:  (tableId: string) => void
  onWrongDelivery: (tableId: string) => void
  onFailTable:     (tableId: string) => void
  onShiftEnd:      () => void
}

interface InternalTable {
  tableId: string
  status: TableStatus
  servedOrder: string[] | null
  revealedRequests: boolean
  patienceStart: number
  patiencePenaltyMs: number
  patienceTimer: ReturnType<typeof setInterval> | null
  cookingTimer:  ReturnType<typeof setTimeout>  | null
}

export class ServiceScene {
  private app: Application
  private options: ServiceSceneOptions
  private destroyed = false

  private _tables: Record<string, InternalTable> = {}
  private _activeOrderTable: string | null = null
  private _pendingSelections: Record<number, string> = {}

  private readonly _cookingDelayMs: number

  private constructor(app: Application, options: ServiceSceneOptions) {
    this.app = app
    this.options = options
    this._cookingDelayMs = options.cookingDelayMs ?? DEFAULT_COOKING_DELAY_MS
  }

  static async create(options: ServiceSceneOptions): Promise<ServiceScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width:  options.width,
      height: options.height,
      backgroundColor: 0x06050a,
      antialias: true,
    })
    const scene = new ServiceScene(app, options)
    scene._initTables()
    scene._render()
    return scene
  }

  // ─── Masa başlatma ──────────────────────────────────────────────────────────
  private _initTables() {
    const now = Date.now()
    for (const table of this.options.shift.tables) {
      this._tables[table.id] = {
        tableId: table.id,
        status: 'waiting',
        servedOrder: null,
        revealedRequests: false,
        patienceStart: now,
        patiencePenaltyMs: 0,
        patienceTimer: setInterval(() => this._tickPatience(table.id), 100),
        cookingTimer: null,
      }
    }
  }

  // ─── Sabır zamanlayıcısı ────────────────────────────────────────────────────
  private _tickPatience(tableId: string) {
    if (this.destroyed) return
    const t = this._tables[tableId]
    if (!t || t.status === 'served' || t.status === 'failed') return

    const tableData = this.options.shift.tables.find(x => x.id === tableId)
    if (!tableData) return

    const elapsed = Date.now() - t.patienceStart + t.patiencePenaltyMs
    if (elapsed >= tableData.patienceMs) {
      this._doFailTable(tableId)
    } else {
      this._render()
    }
  }

  private _doFailTable(tableId: string) {
    const t = this._tables[tableId]
    if (!t || t.status === 'served' || t.status === 'failed') return
    this._stopPatienceTimer(tableId)
    this._stopCookingTimer(tableId)
    t.status = 'failed'
    this.options.onFailTable(tableId)
    this._render()
    this._checkShiftEnd()
  }

  private _stopPatienceTimer(tableId: string) {
    const t = this._tables[tableId]
    if (t?.patienceTimer !== null) {
      clearInterval(t.patienceTimer!)
      t.patienceTimer = null
    }
  }

  private _stopCookingTimer(tableId: string) {
    const t = this._tables[tableId]
    if (t?.cookingTimer !== null) {
      clearTimeout(t.cookingTimer!)
      t.cookingTimer = null
    }
  }

  // ─── Pişirme zamanlayıcısı ──────────────────────────────────────────────────
  private _startCookingTimer(tableId: string) {
    const t = this._tables[tableId]
    if (!t) return
    t.cookingTimer = setTimeout(() => {
      if (this.destroyed) return
      t.status = 'ready'
      t.cookingTimer = null
      this.options.onMarkReady(tableId)
      this._render()
    }, this._cookingDelayMs)
  }

  // ─── Masa tıklama ───────────────────────────────────────────────────────────
  private _onTableClick(tableId: string) {
    if (this.destroyed) return
    const t = this._tables[tableId]
    if (!t) return
    if (t.status === 'served' || t.status === 'failed') return
    if (t.status === 'ready') { this._doDeliver(tableId); return }
    if (t.status === 'cooking') return

    if (!t.revealedRequests) {
      t.revealedRequests = true
      this.options.onInteractTable(tableId)
      this._render()
      return
    }

    this._openOrderPanel(tableId)
  }

  // ─── Sipariş paneli ─────────────────────────────────────────────────────────
  private _openOrderPanel(tableId: string) {
    const tableData = this.options.shift.tables.find(t => t.id === tableId)
    if (!tableData) return
    this._activeOrderTable = tableId
    this._pendingSelections = {}
    tableData.customers.forEach((_, i) => {
      this._pendingSelections[i] = tableData.orderOptions[i][0]
    })
    this._render()
  }

  private _closeOrderPanel() {
    this._activeOrderTable = null
    this._pendingSelections = {}
    this._render()
  }

  private _confirmOrder() {
    const tableId = this._activeOrderTable
    if (!tableId) return
    const tableData = this.options.shift.tables.find(t => t.id === tableId)
    if (!tableData) return

    const order = tableData.customers.map((_, i) =>
      this._pendingSelections[i] ?? tableData.orderOptions[i][0]
    )
    const t = this._tables[tableId]
    t.status = 'cooking'
    t.servedOrder = order
    this.options.onSubmitOrder(tableId, order)
    this._startCookingTimer(tableId)
    this._closeOrderPanel()
  }

  // ─── Teslimat ───────────────────────────────────────────────────────────────
  private _doDeliver(tableId: string) {
    const t = this._tables[tableId]
    const tableData = this.options.shift.tables.find(x => x.id === tableId)
    if (!t || !tableData || t.status !== 'ready') return

    const isCorrect =
      t.servedOrder !== null &&
      t.servedOrder.length === tableData.correctOrder.length &&
      t.servedOrder.every((item, i) => item === tableData.correctOrder[i])

    if (isCorrect) {
      this._stopPatienceTimer(tableId)
      t.status = 'served'
      this.options.onDeliverOrder(tableId)
      this._render()
      this._checkShiftEnd()
    } else {
      t.status = 'waiting'
      t.servedOrder = null
      t.patiencePenaltyMs += WRONG_DELIVERY_PATIENCE_PENALTY_MS
      this.options.onWrongDelivery(tableId)
      this._render()
    }
  }

  // ─── Vardiya bitiş kontrolü ─────────────────────────────────────────────────
  private _checkShiftEnd() {
    const allDone = Object.values(this._tables).every(
      t => t.status === 'served' || t.status === 'failed'
    )
    if (allDone) this.options.onShiftEnd()
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  private _render() {
    if (this.destroyed) return
    const { app } = this
    const { width, height, shift } = this.options
    app.stage.removeChildren()

    // Arkaplan
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x06050a, alpha: 1 })
    app.stage.addChild(bg)

    // Üst brifing notu
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 36).fill({ color: 0x100a00, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: `☕ ${shift.briefingNotes[0]}`, style: STYLE_HEADER })
    headerText.x = 12
    headerText.y = 10
    app.stage.addChild(headerText)

    // Masa kartları
    shift.tables.forEach((table, idx) => {
      this._renderTableCard(table, idx, shift.tables.length)
    })

    // İpucu
    const hintText = new Text({ text: 'Tıkla: Sipariş al   |   Yeşil kart: Servis et', style: STYLE_HINT })
    hintText.anchor.set(0.5, 0)
    hintText.x = width / 2
    hintText.y = height - 20
    app.stage.addChild(hintText)

    // Sipariş paneli (açıksa üste çiz)
    if (this._activeOrderTable !== null) this._renderOrderPanel()
  }

  // ─── Masa kartı ─────────────────────────────────────────────────────────────
  private _renderTableCard(table: Table, index: number, totalTables: number) {
    const { app } = this
    const { width, height } = this.options
    const CARD_W = 210
    const CARD_H = 185
    const MARGIN = 14

    let cardX: number, cardY: number

    if (totalTables <= 3) {
      const totalW = totalTables * CARD_W + (totalTables - 1) * MARGIN
      cardX = (width - totalW) / 2 + index * (CARD_W + MARGIN)
      cardY = 46 + (height - 46 - 30 - CARD_H) / 2
    } else {
      const col = index % 2
      const row = Math.floor(index / 2)
      const gridW = 2 * CARD_W + MARGIN
      const gridH = 2 * CARD_H + MARGIN
      cardX = (width - gridW) / 2 + col * (CARD_W + MARGIN)
      cardY = 46 + (height - 46 - 30 - gridH) / 2 + row * (CARD_H + MARGIN)
    }

    const t = this._tables[table.id]
    if (!t) return

    const card = new Graphics()
    card.roundRect(cardX, cardY, CARD_W, CARD_H, 8)
      .fill({ color: STATUS_COLORS[t.status], alpha: 1 })
      .stroke({ width: 1.5, color: STATUS_BORDER[t.status], alpha: 0.9 })
    card.eventMode = 'static'
    card.cursor = 'pointer'
    card.on('pointerdown', () => this._onTableClick(table.id))
    app.stage.addChild(card)

    // Masa başlığı
    const titleText = new Text({ text: `Masa ${index + 1}`, style: STYLE_TABLE_TITLE })
    titleText.x = cardX + 10
    titleText.y = cardY + 10
    app.stage.addChild(titleText)

    // Durum rozeti
    let statusLabel = ''
    let statusStyle = STYLE_STATUS
    if      (t.status === 'cooking') { statusLabel = '🍳 Pişiyor…';        statusStyle = STYLE_STATUS }
    else if (t.status === 'ready')   { statusLabel = '✓ Hazır — Tıkla!';  statusStyle = STYLE_READY  }
    else if (t.status === 'served')  { statusLabel = '✓ Servis edildi';    statusStyle = STYLE_READY  }
    else if (t.status === 'failed')  { statusLabel = '✗ Sabır tükendi';    statusStyle = STYLE_FAILED }

    if (statusLabel) {
      const statusText = new Text({ text: statusLabel, style: statusStyle })
      statusText.x = cardX + CARD_W - statusText.width - 10
      statusText.y = cardY + 12
      app.stage.addChild(statusText)
    }

    // Müşteri isimleri
    const names = table.customers.map(c => c.name).join(', ')
    const namesText = new Text({ text: names, style: STYLE_CUSTOMER })
    namesText.x = cardX + 10
    namesText.y = cardY + 32
    app.stage.addChild(namesText)

    // Brifingde bilinen özel istekler
    const knownRequests = table.customers.flatMap(c =>
      c.specialRequests.filter(r => !r.revealedOnInteraction).map(r => `⚠ ${r.description}`)
    )
    if (knownRequests.length > 0) {
      const reqText = new Text({ text: knownRequests.join('\n'), style: STYLE_REQUEST_KNOWN })
      reqText.x = cardX + 10
      reqText.y = cardY + 50
      app.stage.addChild(reqText)
    }

    // Masaya gidince ortaya çıkan istekler
    if (t.revealedRequests) {
      const hiddenRequests = table.customers.flatMap(c =>
        c.specialRequests.filter(r => r.revealedOnInteraction).map(r => `💬 ${r.description}`)
      )
      hiddenRequests.forEach((req, i) => {
        const reqText = new Text({ text: req, style: STYLE_REQUEST_KNOWN })
        reqText.x = cardX + 10
        reqText.y = cardY + 50 + knownRequests.length * 14 + i * 14
        app.stage.addChild(reqText)
      })
    }

    // Sabır barı
    this._renderPatienceBar(cardX, cardY + CARD_H - 22, CARD_W, table, t)
  }

  // ─── Sabır barı ─────────────────────────────────────────────────────────────
  private _renderPatienceBar(x: number, y: number, barW: number, table: Table, t: InternalTable) {
    const { app } = this
    const barH = 10

    const barBg = new Graphics()
    barBg.roundRect(x + 8, y, barW - 16, barH, 3).fill({ color: 0x1a1a1a, alpha: 1 })
    app.stage.addChild(barBg)

    if (t.status === 'served' || t.status === 'failed') return

    const elapsed = Date.now() - t.patienceStart + t.patiencePenaltyMs
    const ratio   = Math.min(1, elapsed / table.patienceMs)
    const fillW   = (barW - 16) * (1 - ratio)

    if (fillW > 0) {
      const r = Math.round(ratio * 255)
      const g = Math.round((1 - ratio) * 200)
      const color = (r << 16) | (g << 8)
      const barFill = new Graphics()
      barFill.roundRect(x + 8, y, fillW, barH, 3).fill({ color, alpha: 1 })
      app.stage.addChild(barFill)
    }
  }

  // ─── Sipariş seçim paneli ───────────────────────────────────────────────────
  private _renderOrderPanel() {
    const { app } = this
    const { width, height, shift } = this.options
    const tableId   = this._activeOrderTable!
    const tableData = shift.tables.find(t => t.id === tableId)
    if (!tableData) return

    // Karartma overlay
    const overlay = new Graphics()
    overlay.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.65 })
    overlay.eventMode = 'static'
    app.stage.addChild(overlay)

    // Panel
    const panelW = Math.min(460, width - 40)
    const panelH = 80 + tableData.customers.length * 80 + 60
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    const panel = new Graphics()
    panel.roundRect(panelX, panelY, panelW, panelH, 10)
      .fill({ color: 0x0e0c14, alpha: 1 })
      .stroke({ width: 1.5, color: 0x554477, alpha: 0.9 })
    app.stage.addChild(panel)

    const panelTitle = new Text({
      text: `Sipariş Ver — Masa ${shift.tables.indexOf(tableData) + 1}`,
      style: STYLE_PANEL_TITLE,
    })
    panelTitle.anchor.set(0.5, 0)
    panelTitle.x = panelX + panelW / 2
    panelTitle.y = panelY + 14
    app.stage.addChild(panelTitle)

    // Her müşteri için seçenek butonları
    tableData.customers.forEach((customer, custIdx) => {
      const rowY = panelY + 44 + custIdx * 80

      const custLabel = new Text({ text: `${customer.name}:`, style: STYLE_CUSTOMER })
      custLabel.x = panelX + 16
      custLabel.y = rowY
      app.stage.addChild(custLabel)

      const options = tableData.orderOptions[custIdx]
      const btnW = Math.floor((panelW - 32 - (options.length - 1) * 8) / options.length)

      options.forEach((opt, optIdx) => {
        const btnX      = panelX + 16 + optIdx * (btnW + 8)
        const btnY      = rowY + 20
        const isSelected = this._pendingSelections[custIdx] === opt

        const btnBg = new Graphics()
        btnBg.roundRect(btnX, btnY, btnW, 32, 5)
          .fill({ color: isSelected ? 0x1a1040 : 0x0e0c14, alpha: 1 })
          .stroke({ width: 1.5, color: isSelected ? 0x44ccff : 0x333355, alpha: 0.9 })
        btnBg.eventMode = 'static'
        btnBg.cursor = 'pointer'
        btnBg.on('pointerdown', () => {
          if (this.destroyed) return
          this._pendingSelections[custIdx] = opt
          this._render()
        })
        app.stage.addChild(btnBg)

        const btnText = new Text({ text: opt, style: isSelected ? STYLE_BTN_SELECTED : STYLE_BTN_NORMAL })
        btnText.anchor.set(0.5, 0.5)
        btnText.x = btnX + btnW / 2
        btnText.y = btnY + 16
        app.stage.addChild(btnText)
      })
    })

    // İptal / Onayla butonları
    const actionY   = panelY + panelH - 46
    const cancelX   = panelX + panelW / 2 - 100
    const confirmX  = panelX + panelW / 2 + 10

    const cancelBg = new Graphics()
    cancelBg.roundRect(cancelX, actionY, 88, 34, 6)
      .fill({ color: 0x2a0a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x882222, alpha: 0.9 })
    cancelBg.eventMode = 'static'
    cancelBg.cursor = 'pointer'
    cancelBg.on('pointerdown', () => { if (!this.destroyed) this._closeOrderPanel() })
    app.stage.addChild(cancelBg)
    const cancelText = new Text({ text: 'İptal', style: STYLE_CANCEL })
    cancelText.anchor.set(0.5, 0.5)
    cancelText.x = cancelX + 44
    cancelText.y = actionY + 17
    app.stage.addChild(cancelText)

    const confirmBg = new Graphics()
    confirmBg.roundRect(confirmX, actionY, 88, 34, 6)
      .fill({ color: 0x0a2a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x228822, alpha: 0.9 })
    confirmBg.eventMode = 'static'
    confirmBg.cursor = 'pointer'
    confirmBg.on('pointerdown', () => { if (!this.destroyed) this._confirmOrder() })
    app.stage.addChild(confirmBg)
    const confirmText = new Text({ text: 'Onayla', style: STYLE_CONFIRM })
    confirmText.anchor.set(0.5, 0.5)
    confirmText.x = confirmX + 44
    confirmText.y = actionY + 17
    app.stage.addChild(confirmText)
  }

  // ─── Destroy ────────────────────────────────────────────────────────────────
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    for (const tableId of Object.keys(this._tables)) {
      this._stopPatienceTimer(tableId)
      this._stopCookingTimer(tableId)
    }
    this.app.destroy()
  }
}
