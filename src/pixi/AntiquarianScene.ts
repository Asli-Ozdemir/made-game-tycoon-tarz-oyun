// src/pixi/AntiquarianScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { AntiquarianShift } from '@/data/antiquarianShifts'
import type { BookIdentification, ShiftPhase } from '@/store/antiquarianStore'

// ─── Static styles ────────────────────────────────────────────────────────────
const STYLE_HEADER      = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#c8a96e' })
const STYLE_SUBTITLE    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#7a6a50' })
const STYLE_TITLE       = new TextStyle({ fontFamily: 'monospace', fontSize: 14, fill: '#f0e6cc' })
const STYLE_BODY        = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#9090b0' })
const STYLE_HINT        = new TextStyle({ fontFamily: 'monospace', fontSize: 9,  fill: '#3a3a50' })
const STYLE_BTN_NORMAL  = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#8080c0' })
const STYLE_BTN_PRIMARY = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#44cc88' })
const STYLE_BTN_CANCEL  = new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: '#cc4444' })
const STYLE_SELECTED    = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#44ccff' })
const STYLE_REQ_DONE    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#448844' })
const STYLE_REQ_OPEN    = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#8080a0' })

export interface AntiquarianSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  shift: AntiquarianShift
  onAdvanceFromBriefing: () => void
  onSelectLocation:      (locationId: string) => void
  onCollectBook:         (bookId: string) => void
  onUncollectBook:       (bookId: string) => void
  onAdvanceToIdentify:   () => void
  onIdentifyBook:        (bookId: string, data: BookIdentification) => void
  onAdvanceToMatch:      () => void
  onMatchBook:           (requestId: string, bookId: string) => void
  onShiftEnd:            () => void
}

export class AntiquarianScene {
  private app: Application
  private options: AntiquarianSceneOptions
  private destroyed = false

  // Internal phase state (mirrors store)
  private _phase: ShiftPhase = 'briefing'
  private _selectedLocation: string | null = null
  private _collectedBooks: string[] = []
  private _identifications: Record<string, BookIdentification> = {}
  private _currentIdentifyIdx = 0
  private _matches: Record<string, string> = {}       // requestId → bookId
  private _selectedRequestId: string | null = null    // for match phase UX
  private _pendingIdent: Partial<BookIdentification> = {}

  private readonly MAX_BACKPACK = 6

  private constructor(app: Application, options: AntiquarianSceneOptions) {
    this.app = app
    this.options = options
  }

  static async create(options: AntiquarianSceneOptions): Promise<AntiquarianScene> {
    const app = new Application()
    await app.init({
      canvas: options.canvas,
      width:  options.width,
      height: options.height,
      backgroundColor: 0x0a0805,
      antialias: true,
    })
    const scene = new AntiquarianScene(app, options)
    scene._render()
    return scene
  }

  // ─── Phase transitions (called by external controller + internally) ─────────

  advanceFromBriefing() {
    if (this.destroyed || this._phase !== 'briefing') return
    this._phase = 'search'
    this.options.onAdvanceFromBriefing()
    this._render()
  }

  selectLocation(locationId: string) {
    if (this.destroyed) return
    this._selectedLocation = locationId
    this.options.onSelectLocation(locationId)
    this._render()
  }

  collectBook(bookId: string) {
    if (this.destroyed) return
    if (this._collectedBooks.length >= this.MAX_BACKPACK) return
    if (this._collectedBooks.includes(bookId)) return
    this._collectedBooks.push(bookId)
    this.options.onCollectBook(bookId)
    this._render()
  }

  uncollectBook(bookId: string) {
    if (this.destroyed) return
    this._collectedBooks = this._collectedBooks.filter(b => b !== bookId)
    this.options.onUncollectBook(bookId)
    this._render()
  }

  advanceToIdentify() {
    if (this.destroyed || this._phase !== 'search') return
    if (!this._selectedLocation || this._collectedBooks.length === 0) return
    this._phase = 'identify'
    this._currentIdentifyIdx = 0
    this._pendingIdent = {}
    this.options.onAdvanceToIdentify()
    this._render()
  }

  submitIdentification() {
    if (this.destroyed || this._phase !== 'identify') return
    const bookId = this._collectedBooks[this._currentIdentifyIdx]
    if (!bookId) return
    const shift = this.options.shift
    // Check period options are available
    const data: BookIdentification = {
      condition: (this._pendingIdent.condition ?? 'fair'),
      period:    (this._pendingIdent.period    ?? shift.locations.flatMap(l => l.books).find(b => b.id === bookId)?.correctPeriod ?? ''),
      ...(shift.hasAuthenticity ? { authentic: this._pendingIdent.authentic ?? true } : {}),
    }
    this._identifications[bookId] = data
    this.options.onIdentifyBook(bookId, data)
    if (this._currentIdentifyIdx < this._collectedBooks.length - 1) {
      this._currentIdentifyIdx++
      this._pendingIdent = {}
    }
    this._render()
  }

  advanceToMatch() {
    if (this.destroyed || this._phase !== 'identify') return
    const allDone = this._collectedBooks.every(id => this._identifications[id] !== undefined)
    if (!allDone) return
    this._phase = 'match'
    this.options.onAdvanceToMatch()
    this._render()
  }

  private _doMatch(requestId: string) {
    if (this.destroyed) return
    if (this._selectedRequestId === null) {
      // Select this request
      this._selectedRequestId = requestId
    } else if (this._selectedRequestId === requestId) {
      // Deselect
      this._selectedRequestId = null
    } else {
      // Already have a selected request — re-select this one
      this._selectedRequestId = requestId
    }
    this._render()
  }

  private _assignBookToSelected(bookId: string) {
    if (this.destroyed || this._selectedRequestId === null) return
    this._matches[this._selectedRequestId] = bookId
    this.options.onMatchBook(this._selectedRequestId, bookId)
    this._selectedRequestId = null
    this._render()
  }

  private _endShift() {
    if (this.destroyed) return
    this.options.onShiftEnd()
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  private _render() {
    if (this.destroyed) return
    const { app } = this
    const { width, height } = this.options
    app.stage.removeChildren()

    // Background
    const bg = new Graphics()
    bg.rect(0, 0, width, height).fill({ color: 0x0a0805, alpha: 1 })
    app.stage.addChild(bg)

    if      (this._phase === 'briefing') this._renderBriefing()
    else if (this._phase === 'search')   this._renderSearch()
    else if (this._phase === 'identify') this._renderIdentify()
    else if (this._phase === 'match')    this._renderMatch()
  }

  // ─── Briefing phase ───────────────────────────────────────────────────────────
  private _renderBriefing() {
    const { app } = this
    const { width, height, shift } = this.options

    // Header bar
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: `📚 Marcus's Briefing`, style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    // Briefing notes
    shift.briefingNotes.forEach((note, i) => {
      const noteText = new Text({ text: `"${note}"`, style: STYLE_SUBTITLE })
      noteText.x = 16
      noteText.y = 50 + i * 18
      app.stage.addChild(noteText)
    })

    // Requests list
    const listY = 50 + shift.briefingNotes.length * 18 + 20
    const listTitle = new Text({ text: "Today's requests:", style: STYLE_TITLE })
    listTitle.x = 16
    listTitle.y = listY
    app.stage.addChild(listTitle)

    shift.requests.forEach((req, i) => {
      const hint = req.extraHint ? `  (${req.extraHint})` : ''
      const line = `${i + 1}. ${req.type} — ${req.period} — ${req.condition}${hint}`
      const reqText = new Text({ text: line, style: STYLE_BODY })
      reqText.x = 24
      reqText.y = listY + 24 + i * 18
      app.stage.addChild(reqText)
    })

    // Begin Search button
    const btnY = height - 52
    const btnX = width / 2 - 80
    const btnBg = new Graphics()
    btnBg.roundRect(btnX, btnY, 160, 36, 6)
      .fill({ color: 0x0a1a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x44aa66, alpha: 0.9 })
    btnBg.eventMode = 'static'
    btnBg.cursor = 'pointer'
    btnBg.on('pointerdown', () => { if (!this.destroyed) this.advanceFromBriefing() })
    app.stage.addChild(btnBg)
    const btnText = new Text({ text: 'Head Out', style: STYLE_BTN_PRIMARY })
    btnText.anchor.set(0.5, 0.5)
    btnText.x = btnX + 80
    btnText.y = btnY + 18
    app.stage.addChild(btnText)

    // Hint
    const hint = new Text({ text: 'Memorize the requests — list hidden during search', style: STYLE_HINT })
    hint.anchor.set(0.5, 0)
    hint.x = width / 2
    hint.y = height - 18
    app.stage.addChild(hint)
  }

  // ─── Search phase ─────────────────────────────────────────────────────────────
  private _renderSearch() {
    if (!this._selectedLocation) {
      this._renderLocationSelect()
    } else {
      this._renderBookGrid()
    }
  }

  private _renderLocationSelect() {
    const { app } = this
    const { width, height, shift } = this.options

    const titleText = new Text({ text: 'Choose a location to search', style: STYLE_TITLE })
    titleText.anchor.set(0.5, 0)
    titleText.x = width / 2
    titleText.y = 20
    app.stage.addChild(titleText)

    const CARD_W = 200
    const CARD_H = 100
    const total  = shift.locations.length
    const totalW = total * CARD_W + (total - 1) * 16
    const startX = (width - totalW) / 2

    shift.locations.forEach((loc, i) => {
      const cx = startX + i * (CARD_W + 16)
      const cy = (height - CARD_H) / 2

      const card = new Graphics()
      card.roundRect(cx, cy, CARD_W, CARD_H, 8)
        .fill({ color: 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: 0x665533, alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => { if (!this.destroyed) this.selectLocation(loc.id) })
      app.stage.addChild(card)

      const locTitle = new Text({ text: loc.name, style: STYLE_TITLE })
      locTitle.anchor.set(0.5, 0)
      locTitle.x = cx + CARD_W / 2
      locTitle.y = cy + 16
      app.stage.addChild(locTitle)

      const bookCount = new Text({ text: `${loc.books.length} items`, style: STYLE_BODY })
      bookCount.anchor.set(0.5, 0)
      bookCount.x = cx + CARD_W / 2
      bookCount.y = cy + 46
      app.stage.addChild(bookCount)
    })
  }

  private _renderBookGrid() {
    const { app } = this
    const { width, height, shift } = this.options
    const loc = shift.locations.find(l => l.id === this._selectedLocation)
    if (!loc) return

    // Header
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: `📍 ${loc.name}  —  Backpack: ${this._collectedBooks.length}/${this.MAX_BACKPACK}`, style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    // Book grid
    const CARD_W = 190
    const CARD_H = 68
    const COLS   = Math.floor((width - 16) / (CARD_W + 8))
    const MARGIN = 8

    loc.books.forEach((book, i) => {
      const col  = i % COLS
      const row  = Math.floor(i / COLS)
      const bx   = 8 + col * (CARD_W + MARGIN)
      const by   = 46 + row * (CARD_H + MARGIN)
      const collected = this._collectedBooks.includes(book.id)

      const card = new Graphics()
      card.roundRect(bx, by, CARD_W, CARD_H, 6)
        .fill({ color: collected ? 0x0a1a0a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: collected ? 0x44aa66 : 0x443322, alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => {
        if (this.destroyed) return
        if (collected) {
          this.uncollectBook(book.id)
        } else {
          this.collectBook(book.id)
        }
      })
      app.stage.addChild(card)

      const descText = new Text({ text: book.description, style: STYLE_BODY })
      descText.x = bx + 8
      descText.y = by + 8
      app.stage.addChild(descText)

      if (collected) {
        const badge = new Text({ text: '✓ packed', style: STYLE_REQ_DONE })
        badge.x = bx + 8
        badge.y = by + CARD_H - 20
        app.stage.addChild(badge)
      }
    })

    // Inspect button
    if (this._collectedBooks.length > 0) {
      const btnX = width / 2 - 90
      const btnY = height - 46
      const btnBg = new Graphics()
      btnBg.roundRect(btnX, btnY, 180, 34, 6)
        .fill({ color: 0x0a1a0a, alpha: 1 })
        .stroke({ width: 1.5, color: 0x44aa66, alpha: 0.9 })
      btnBg.eventMode = 'static'
      btnBg.cursor = 'pointer'
      btnBg.on('pointerdown', () => { if (!this.destroyed) this.advanceToIdentify() })
      app.stage.addChild(btnBg)
      const btnText = new Text({ text: `Inspect Collection (${this._collectedBooks.length})`, style: STYLE_BTN_PRIMARY })
      btnText.anchor.set(0.5, 0.5)
      btnText.x = btnX + 90
      btnText.y = btnY + 17
      app.stage.addChild(btnText)
    }
  }

  // ─── Identify phase ───────────────────────────────────────────────────────────
  private _renderIdentify() {
    const { app } = this
    const { width, height, shift } = this.options
    const bookId   = this._collectedBooks[this._currentIdentifyIdx]
    const allBooks = shift.locations.flatMap(l => l.books)
    const bookData = allBooks.find(b => b.id === bookId)
    if (!bookData) return

    const alreadyDone = this._identifications[bookId] !== undefined

    // Header
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const progress = `${this._currentIdentifyIdx + 1} / ${this._collectedBooks.length}`
    const headerText = new Text({ text: `🔍 Identify — ${progress}`, style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    // Book description card
    const cardW = width - 32
    const descBg = new Graphics()
    descBg.roundRect(16, 46, cardW, 56, 8)
      .fill({ color: 0x120e08, alpha: 1 })
      .stroke({ width: 1, color: 0x443322, alpha: 0.8 })
    app.stage.addChild(descBg)
    const descText = new Text({ text: bookData.description, style: STYLE_BODY })
    descText.x = 26
    descText.y = 60
    app.stage.addChild(descText)

    // Condition selector
    const conditions: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['poor', 'fair', 'good', 'excellent']
    const condY = 116
    const condLabel = new Text({ text: 'Condition:', style: STYLE_SUBTITLE })
    condLabel.x = 16
    condLabel.y = condY
    app.stage.addChild(condLabel)

    const condBtnW = Math.floor((width - 32 - (conditions.length - 1) * 8) / conditions.length)
    conditions.forEach((cond, i) => {
      const bx = 16 + i * (condBtnW + 8)
      const by = condY + 18
      const sel = (this._pendingIdent.condition ?? this._identifications[bookId]?.condition) === cond

      const btn = new Graphics()
      btn.roundRect(bx, by, condBtnW, 30, 5)
        .fill({ color: sel ? 0x0a1a2a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: sel ? 0x44ccff : 0x333355, alpha: 0.9 })
      btn.eventMode = 'static'
      btn.cursor = 'pointer'
      btn.on('pointerdown', () => {
        if (this.destroyed) return
        this._pendingIdent = { ...this._pendingIdent, condition: cond }
        this._render()
      })
      app.stage.addChild(btn)

      const btnText = new Text({ text: cond, style: sel ? STYLE_SELECTED : STYLE_BTN_NORMAL })
      btnText.anchor.set(0.5, 0.5)
      btnText.x = bx + condBtnW / 2
      btnText.y = by + 15
      app.stage.addChild(btnText)
    })

    // Period selector — derive unique periods from all books in shift
    const allPeriods = [...new Set(allBooks.map(b => b.correctPeriod))].sort()
    const periodY = condY + 66
    const periodLabel = new Text({ text: 'Period:', style: STYLE_SUBTITLE })
    periodLabel.x = 16
    periodLabel.y = periodY
    app.stage.addChild(periodLabel)

    const perBtnW = Math.floor((width - 32 - (allPeriods.length - 1) * 8) / allPeriods.length)
    allPeriods.forEach((period, i) => {
      const bx = 16 + i * (perBtnW + 8)
      const by = periodY + 18
      const sel = (this._pendingIdent.period ?? this._identifications[bookId]?.period) === period

      const btn = new Graphics()
      btn.roundRect(bx, by, perBtnW, 30, 5)
        .fill({ color: sel ? 0x0a1a2a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: sel ? 0x44ccff : 0x333355, alpha: 0.9 })
      btn.eventMode = 'static'
      btn.cursor = 'pointer'
      btn.on('pointerdown', () => {
        if (this.destroyed) return
        this._pendingIdent = { ...this._pendingIdent, period }
        this._render()
      })
      app.stage.addChild(btn)

      const btnText = new Text({ text: period, style: sel ? STYLE_SELECTED : STYLE_BTN_NORMAL })
      btnText.anchor.set(0.5, 0.5)
      btnText.x = bx + perBtnW / 2
      btnText.y = by + 15
      app.stage.addChild(btnText)
    })

    // Confirm / Next button
    const hasPendingOrDone =
      (this._pendingIdent.condition !== undefined && this._pendingIdent.period !== undefined) ||
      alreadyDone

    if (hasPendingOrDone) {
      const isLast = this._currentIdentifyIdx === this._collectedBooks.length - 1
      const allIdentified = this._collectedBooks.every(id => this._identifications[id] !== undefined)
      const btnLabel = isLast && allIdentified ? 'Proceed to Matching →' : 'Next Book →'
      const btnAction = isLast && allIdentified
        ? () => { this.submitIdentification(); this.advanceToMatch() }
        : () => { this.submitIdentification() }

      const btnX = width / 2 - 100
      const btnY = height - 46
      const confirmBg = new Graphics()
      confirmBg.roundRect(btnX, btnY, 200, 34, 6)
        .fill({ color: 0x0a1a0a, alpha: 1 })
        .stroke({ width: 1.5, color: 0x44cc88, alpha: 0.9 })
      confirmBg.eventMode = 'static'
      confirmBg.cursor = 'pointer'
      confirmBg.on('pointerdown', () => { if (!this.destroyed) btnAction() })
      app.stage.addChild(confirmBg)
      const confirmText = new Text({ text: btnLabel, style: STYLE_BTN_PRIMARY })
      confirmText.anchor.set(0.5, 0.5)
      confirmText.x = btnX + 100
      confirmText.y = btnY + 17
      app.stage.addChild(confirmText)
    }
  }

  // ─── Match phase ──────────────────────────────────────────────────────────────
  private _renderMatch() {
    const { app } = this
    const { width, height, shift } = this.options

    // Header
    const headerBg = new Graphics()
    headerBg.rect(0, 0, width, 38).fill({ color: 0x120e08, alpha: 1 })
    app.stage.addChild(headerBg)
    const headerText = new Text({ text: '📦 Match Books to Requests', style: STYLE_HEADER })
    headerText.x = 14
    headerText.y = 11
    app.stage.addChild(headerText)

    const colW   = (width - 32) / 2
    const leftX  = 8
    const rightX = width / 2 + 4

    // Left column: requests
    const reqTitle = new Text({ text: 'Requests', style: STYLE_SUBTITLE })
    reqTitle.x = leftX + 4
    reqTitle.y = 46
    app.stage.addChild(reqTitle)

    const allBooks = shift.locations.flatMap(l => l.books)
    shift.requests.forEach((req, i) => {
      const ry = 66 + i * 52
      const matchedBookId = this._matches[req.id]
      const matchedBook   = matchedBookId ? allBooks.find(b => b.id === matchedBookId) : null
      const isSelected    = this._selectedRequestId === req.id

      const card = new Graphics()
      card.roundRect(leftX, ry, colW - 4, 46, 6)
        .fill({ color: isSelected ? 0x0a1a2a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: isSelected ? 0x44ccff : (matchedBook ? 0x44aa66 : 0x443322), alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => { if (!this.destroyed) this._doMatch(req.id) })
      app.stage.addChild(card)

      const reqText = new Text({ text: `${req.type} (${req.period}, ${req.condition})`, style: isSelected ? STYLE_SELECTED : STYLE_REQ_OPEN })
      reqText.x = leftX + 8
      reqText.y = ry + 6
      app.stage.addChild(reqText)

      if (matchedBook) {
        const matchText = new Text({ text: `↳ ${matchedBook.description.slice(0, 32)}…`, style: STYLE_REQ_DONE })
        matchText.x = leftX + 8
        matchText.y = ry + 24
        app.stage.addChild(matchText)
      }
    })

    // Right column: collected books
    const bookTitle = new Text({ text: 'Your Collection', style: STYLE_SUBTITLE })
    bookTitle.x = rightX + 4
    bookTitle.y = 46
    app.stage.addChild(bookTitle)

    this._collectedBooks.forEach((bookId, i) => {
      const bookData = allBooks.find(b => b.id === bookId)
      if (!bookData) return
      const by = 66 + i * 52
      const ident = this._identifications[bookId]
      const isAssigned = Object.values(this._matches).includes(bookId)

      const card = new Graphics()
      card.roundRect(rightX, by, colW - 4, 46, 6)
        .fill({ color: isAssigned ? 0x0a1a0a : 0x120e08, alpha: 1 })
        .stroke({ width: 1.5, color: isAssigned ? 0x448844 : 0x443322, alpha: 0.9 })
      card.eventMode = 'static'
      card.cursor = 'pointer'
      card.on('pointerdown', () => {
        if (this.destroyed) return
        if (this._selectedRequestId !== null) {
          this._assignBookToSelected(bookId)
        }
      })
      app.stage.addChild(card)

      const bookText = new Text({ text: bookData.description.slice(0, 36), style: STYLE_BODY })
      bookText.x = rightX + 8
      bookText.y = by + 6
      app.stage.addChild(bookText)

      if (ident) {
        const identText = new Text({ text: `${ident.condition} · ${ident.period}`, style: STYLE_SUBTITLE })
        identText.x = rightX + 8
        identText.y = by + 24
        app.stage.addChild(identText)
      }
    })

    // Complete shift button
    const btnX = width / 2 - 90
    const btnY = height - 46
    const btnBg = new Graphics()
    btnBg.roundRect(btnX, btnY, 180, 34, 6)
      .fill({ color: 0x0a1a0a, alpha: 1 })
      .stroke({ width: 1.5, color: 0x44cc88, alpha: 0.9 })
    btnBg.eventMode = 'static'
    btnBg.cursor = 'pointer'
    btnBg.on('pointerdown', () => { if (!this.destroyed) this._endShift() })
    app.stage.addChild(btnBg)
    const btnText = new Text({ text: 'Complete Shift', style: STYLE_BTN_PRIMARY })
    btnText.anchor.set(0.5, 0.5)
    btnText.x = btnX + 90
    btnText.y = btnY + 17
    app.stage.addChild(btnText)

    // Hint
    const hint = new Text({ text: 'Select a request, then click a book to assign it', style: STYLE_HINT })
    hint.anchor.set(0.5, 0)
    hint.x = width / 2
    hint.y = height - 18
    app.stage.addChild(hint)
  }

  // ─── Destroy ─────────────────────────────────────────────────────────────────
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.app.destroy()
  }
}
