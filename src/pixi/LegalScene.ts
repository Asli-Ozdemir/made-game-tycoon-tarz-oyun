// src/pixi/LegalScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
import type { LegalTurn, ArgumentCard } from '@/data/lawyerShifts'

export class LegalScene {
  private _app!: Application
  private _turns: LegalTurn[] = []
  private _cards: ArgumentCard[] = []
  private _usedCardIds: string[] = []
  private _totalPower = 0
  private _currentTurnIdx = 0
  private _timerHandle: ReturnType<typeof setInterval> | null = null
  private _timerRemaining = 0
  private _timerBar!: Graphics
  private _statementText!: Text
  private _hintText!: Text
  private _cardGraphics: Map<string, Graphics> = new Map()

  onSessionEnd!: (argumentScore: number, usedCardIds: string[]) => void

  private constructor() {}

  static async create(
    canvas: HTMLCanvasElement,
    turns: LegalTurn[],
    cards: ArgumentCard[],
    opponentName: string,
    onSessionEnd: (argumentScore: number, usedCardIds: string[]) => void,
  ): Promise<LegalScene> {
    const scene = new LegalScene()
    scene._app = new Application()
    await scene._app.init({
      canvas,
      width:      canvas.clientWidth  || 800,
      height:     canvas.clientHeight || 500,
      background: 0x0d0d1a,
      antialias:  false,
    })
    scene._turns        = turns
    scene._cards        = cards
    scene.onSessionEnd  = onSessionEnd
    scene._setup(opponentName)
    return scene
  }

  private _setup(opponentName: string): void {
    const { width, height } = this._app.screen
    const splitX = Math.floor(width * 0.6)

    // Backgrounds
    const leftBg  = new Graphics().rect(0,      0, splitX,         height).fill(0x1a1a2e)
    const rightBg = new Graphics().rect(splitX, 0, width - splitX, height).fill(0x16213e)
    const divider = new Graphics().rect(splitX - 1, 0, 2,          height).fill(0x3a3a5a)
    this._app.stage.addChild(leftBg, rightBg, divider)

    // Panel labels
    const labelStyle = new TextStyle({ fill: 0x6666aa, fontSize: 10, fontFamily: 'monospace' })
    const leftLbl  = new Text({ text: 'TOPLANTI ODASI', style: labelStyle })
    leftLbl.x = 12; leftLbl.y = 8
    const rightLbl = new Text({ text: 'MASANIZ', style: labelStyle })
    rightLbl.x = splitX + 12; rightLbl.y = 8

    // Clara figure
    const claraFig = new Graphics().rect(32, 80, 44, 72).fill(0x2a4066)
    const claraLbl = new Text({ text: 'Clara', style: new TextStyle({ fill: 0x6699cc, fontSize: 10, fontFamily: 'monospace' }) })
    claraLbl.x = 40; claraLbl.y = 156

    // Opponent figure
    const oppFig = new Graphics().rect(splitX - 84, 80, 44, 72).fill(0x5a2222)
    const oppLbl = new Text({ text: opponentName, style: new TextStyle({ fill: 0xcc6666, fontSize: 10, fontFamily: 'monospace' }) })
    oppLbl.x = splitX - 84; oppLbl.y = 156

    // Statement text
    this._statementText = new Text({
      text: '',
      style: new TextStyle({
        fill: 0xccccdd, fontSize: 12, fontFamily: 'monospace',
        wordWrap: true, wordWrapWidth: splitX - 160, lineHeight: 18,
      }),
    })
    this._statementText.x = 100; this._statementText.y = 100

    // Hint text
    this._hintText = new Text({
      text: '',
      style: new TextStyle({ fill: 0x888844, fontSize: 10, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: splitX - 40 }),
    })
    this._hintText.x = 16; this._hintText.y = height - 30

    this._app.stage.addChild(leftLbl, rightLbl, claraFig, claraLbl, oppFig, oppLbl, this._statementText, this._hintText)

    // Timer bar — hidden by default
    this._timerBar = new Graphics()
    this._timerBar.visible = false
    this._app.stage.addChild(this._timerBar)

    // Card grid
    this._buildCardGrid(splitX, width, height)

    // Start first turn
    this._showTurn(0)
  }

  private _buildCardGrid(splitX: number, width: number, _height: number): void {
    const cardW = Math.floor((width - splitX - 40) / 2) - 8
    const cardH = 64
    const gap   = 8
    const cols  = 2
    const startX = splitX + 16
    const startY = 28

    this._cards.forEach((card, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x   = startX + col * (cardW + gap)
      const y   = startY + row * (cardH + gap)

      const g = new Graphics()
      g.rect(0, 0, cardW, cardH).fill(0x262640).stroke({ color: 0x4a4a7a, width: 1 })
      g.x = x; g.y = y
      g.interactive = true
      g.cursor = 'pointer'

      const typeColors: Record<ArgumentCard['type'], number> = {
        legal:      0x6699ff,
        technical:  0x66dd99,
        emotional:  0xff9966,
        procedural: 0xdddd66,
      }

      const typeDot = new Graphics().circle(cardW - 10, 10, 5).fill(typeColors[card.type])
      const lbl = new Text({
        text: card.label,
        style: new TextStyle({ fill: 0xddddff, fontSize: 9, fontFamily: 'monospace', wordWrap: true, wordWrapWidth: cardW - 20 }),
      })
      lbl.x = 4; lbl.y = 4
      const pwr = new Text({
        text: `★${card.power}`,
        style: new TextStyle({ fill: 0xffcc44, fontSize: 10, fontFamily: 'monospace' }),
      })
      pwr.x = cardW - 26; pwr.y = cardH - 16

      g.addChild(typeDot, lbl, pwr)
      g.on('pointerdown', () => this._onCardClick(card.id))

      this._app.stage.addChild(g)
      this._cardGraphics.set(card.id, g)
    })
  }

  private _onCardClick(cardId: string): void {
    if (this._usedCardIds.includes(cardId)) return
    const card = this._cards.find(c => c.id === cardId)
    if (!card) return

    this._usedCardIds.push(cardId)
    this._totalPower += card.power

    const g = this._cardGraphics.get(cardId)
    if (g) { g.tint = 0x444455; g.interactive = false; g.cursor = 'default' }

    this._clearTimer()
    this._nextTurn()
  }

  private _showTurn(index: number): void {
    if (index >= this._turns.length) {
      this._endSession()
      return
    }
    const turn = this._turns[index]
    this._statementText.text = turn.opponentStatement
    this._hintText.text = turn.hint ?? ''

    if (turn.isCritical) {
      this._startTimer(8)
    }
  }

  private _nextTurn(): void {
    this._currentTurnIdx++
    this._showTurn(this._currentTurnIdx)
  }

  private _startTimer(seconds: number): void {
    this._timerRemaining = seconds
    this._timerBar.visible = true
    this._drawTimerBar(1.0)

    this._timerHandle = setInterval(() => {
      this._timerRemaining -= 0.1
      const ratio = Math.max(0, this._timerRemaining / seconds)
      this._drawTimerBar(ratio)
      if (this._timerRemaining <= 0) {
        this._clearTimer()
        this._nextTurn()
      }
    }, 100)
  }

  private _drawTimerBar(ratio: number): void {
    const { width } = this._app.screen
    const color = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xcccc44 : 0xcc4444
    this._timerBar.clear().rect(0, 0, Math.floor(width * ratio), 5).fill(color)
  }

  private _clearTimer(): void {
    if (this._timerHandle !== null) {
      clearInterval(this._timerHandle)
      this._timerHandle = null
    }
    this._timerBar.visible = false
  }

  private _endSession(): void {
    const maxPower = this._turns.length * 5
    const argumentScore = maxPower === 0
      ? 0
      : Math.min(100, Math.round(this._totalPower / maxPower * 100))
    this.onSessionEnd(argumentScore, [...this._usedCardIds])
  }

  destroy(): void {
    this._clearTimer()
    this._cardGraphics.clear()
    this._app.destroy()
  }
}
