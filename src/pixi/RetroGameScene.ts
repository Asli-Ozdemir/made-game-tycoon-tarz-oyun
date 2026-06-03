// src/pixi/RetroGameScene.ts
import { Application, Graphics, Text, TextStyle } from 'pixi.js'

const STYLE_SCORE   = new TextStyle({ fontFamily: 'monospace', fontSize: 14, fill: '#ffffff', fontWeight: 'bold' })
const STYLE_LABEL   = new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: '#88bbcc' })
const STYLE_DIVIDER = new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: '#3a4a50' })

export interface RetroGameSceneOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  gameType: 'pong' | 'space_invaders' | 'breakout'
  arcId: 'arc_glory' | 'arc_denial' | 'arc_truth'
  onComplete: (winner: 'player' | 'rex') => void
}

// ─── Pong state ───────────────────────────────────────────────────────────────

interface PongState {
  ballX: number
  ballY: number
  ballVX: number
  ballVY: number
  playerY: number   // left paddle center
  rexY:    number   // right paddle center
  playerScore: number
  rexScore:    number
  waitFrames: number
}

// ─── Space Invaders state ─────────────────────────────────────────────────────

interface Invader {
  alive: boolean
  x: number
  y: number
}

interface Bullet {
  x: number
  y: number
  active: boolean
}

interface SpaceState {
  playerX: number
  playerBullet: Bullet
  rexX: number
  rexBullet: Bullet
  playerInvaders: Invader[]
  rexInvaders:    Invader[]
  invaderDir:     1 | -1
  invaderMoveFrame: number
  rexShootCooldown: number
  autoShootInterval: number
}

// ─── Breakout state ───────────────────────────────────────────────────────────

interface Brick {
  alive: boolean
  x: number
  y: number
}

interface BreakoutState {
  playerPaddleX: number
  rexPaddleX:    number
  playerBallX: number
  playerBallY: number
  playerBallVX: number
  playerBallVY: number
  rexBallX: number
  rexBallY: number
  rexBallVX: number
  rexBallVY: number
  playerBricks: Brick[]
  rexBricks:    Brick[]
  playerLaunched: boolean
  rexLaunched:    boolean
  launchTimer:    number
}

export class RetroGameScene {
  private app:      Application
  private opts:     RetroGameSceneOptions
  private destroyed = false
  private finished  = false

  // Rex AI speed factor per arc
  private rexSpeed: number

  // Input state
  private keysDown = new Set<string>()

  // Game-specific state
  private pong:   PongState   | null = null
  private space:  SpaceState  | null = null
  private brkout: BreakoutState | null = null

  private constructor(app: Application, opts: RetroGameSceneOptions) {
    this.app  = app
    this.opts = opts
    // Arc-based Rex speed: arc_glory=0.6, arc_denial=0.7, arc_truth=0.5
    this.rexSpeed = opts.arcId === 'arc_glory' ? 0.6 : opts.arcId === 'arc_denial' ? 0.7 : 0.5
  }

  static async create(opts: RetroGameSceneOptions): Promise<RetroGameScene> {
    const app = new Application()
    await app.init({
      canvas:          opts.canvas,
      width:           opts.width,
      height:          opts.height,
      backgroundColor: 0x050c10,
      antialias:       false,
    })
    const scene = new RetroGameScene(app, opts)
    scene._init()
    return scene
  }

  private _halfW() { return this.opts.width  / 2 }
  private _H()     { return this.opts.height }

  private _init() {
    switch (this.opts.gameType) {
      case 'pong':           this._initPong();    break
      case 'space_invaders': this._initSpace();   break
      case 'breakout':       this._initBreakout();break
    }
    this.opts.canvas.addEventListener('keydown',  this._onKeyDown)
    this.opts.canvas.addEventListener('keyup',    this._onKeyUp)
    // Also listen on window since canvas may not receive key events directly
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup',   this._onKeyUp)
    this.app.ticker.add(this._tick)
    this._render()
  }

  // ─── Pong init ─────────────────────────────────────────────────────────────

  private _initPong() {
    const W  = this._halfW()
    const H  = this._H()
    this.pong = {
      ballX:       W,     // center of whole canvas
      ballY:       H / 2,
      ballVX:      3.5,
      ballVY:      2.5,
      playerY:     H / 2,
      rexY:        H / 2,
      playerScore: 0,
      rexScore:    0,
      waitFrames:  0,
    }
  }

  // ─── Space Invaders init ───────────────────────────────────────────────────

  private _buildInvaderGrid(offsetX: number): Invader[] {
    const cols = 5, rows = 3
    const inv: Invader[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        inv.push({ alive: true, x: offsetX + 20 + c * 22, y: 30 + r * 20 })
      }
    }
    return inv
  }

  private _initSpace() {
    const HW = this._halfW()
    const interval = this.opts.arcId === 'arc_glory' ? 90 : this.opts.arcId === 'arc_denial' ? 120 : 60
    this.space = {
      playerX: HW / 2,
      playerBullet: { x: 0, y: 0, active: false },
      rexX: HW + HW / 2,
      rexBullet: { x: 0, y: 0, active: false },
      playerInvaders: this._buildInvaderGrid(0),
      rexInvaders:    this._buildInvaderGrid(HW),
      invaderDir:   1,
      invaderMoveFrame: 0,
      rexShootCooldown: interval,
      autoShootInterval: interval,
    }
  }

  // ─── Breakout init ─────────────────────────────────────────────────────────

  private _buildBrickGrid(offsetX: number): Brick[] {
    const cols = 6, rows = 4
    const bricks: Brick[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({ alive: true, x: offsetX + 6 + c * 22, y: 20 + r * 16 })
      }
    }
    return bricks
  }

  private _initBreakout() {
    const HW = this._halfW()
    const H  = this._H()
    this.brkout = {
      playerPaddleX: HW / 2,
      rexPaddleX:    HW + HW / 2,
      playerBallX: HW / 2,
      playerBallY: H - 40,
      playerBallVX: 2.5,
      playerBallVY: -3,
      rexBallX: HW + HW / 2,
      rexBallY: H - 40,
      rexBallVX: -2.5,
      rexBallVY: -3,
      playerBricks: this._buildBrickGrid(0),
      rexBricks:    this._buildBrickGrid(HW),
      playerLaunched: false,
      rexLaunched:    false,
      launchTimer:    60,   // 1 second @ 60fps
    }
  }

  // ─── Key handlers ─────────────────────────────────────────────────────────

  private _onKeyDown = (e: KeyboardEvent) => {
    this.keysDown.add(e.code)
  }

  private _onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code)
  }

  // ─── Main tick ─────────────────────────────────────────────────────────────

  private _tick = () => {
    if (this.destroyed || this.finished) return
    switch (this.opts.gameType) {
      case 'pong':           this._tickPong();    break
      case 'space_invaders': this._tickSpace();   break
      case 'breakout':       this._tickBreakout();break
    }
    this._render()
  }

  // ─── Pong tick ─────────────────────────────────────────────────────────────

  private _tickPong() {
    const p = this.pong!
    const W = this.opts.width
    const H = this._H()
    const PADDLE_H = 60
    const PADDLE_SPEED = 4
    const BALL_R = 5
    const SCORE_WIN = 5

    if (p.waitFrames > 0) { p.waitFrames--; return }

    // Player input (W/S or ArrowUp/ArrowDown)
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) {
      p.playerY = Math.max(PADDLE_H / 2, p.playerY - PADDLE_SPEED)
    }
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) {
      p.playerY = Math.min(H - PADDLE_H / 2, p.playerY + PADDLE_SPEED)
    }

    // Rex AI: track ball with speed factor
    const rexTarget = p.ballY
    const rexDiff   = rexTarget - p.rexY
    p.rexY += Math.sign(rexDiff) * Math.min(Math.abs(rexDiff), PADDLE_SPEED * this.rexSpeed)
    p.rexY = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, p.rexY))

    // Ball movement
    p.ballX += p.ballVX
    p.ballY += p.ballVY

    // Top/bottom bounce
    if (p.ballY - BALL_R <= 0) { p.ballY = BALL_R; p.ballVY = Math.abs(p.ballVY) }
    if (p.ballY + BALL_R >= H) { p.ballY = H - BALL_R; p.ballVY = -Math.abs(p.ballVY) }

    // Player paddle (left side, x=12)
    const playerPX = 12
    if (p.ballX - BALL_R <= playerPX + 8 && p.ballVX < 0) {
      if (Math.abs(p.ballY - p.playerY) < PADDLE_H / 2 + BALL_R) {
        p.ballVX = Math.abs(p.ballVX) * 1.05
        p.ballX = playerPX + 8 + BALL_R
      }
    }

    // Rex paddle (right side, x=W-12)
    const rexPX = W - 12
    if (p.ballX + BALL_R >= rexPX - 8 && p.ballVX > 0) {
      if (Math.abs(p.ballY - p.rexY) < PADDLE_H / 2 + BALL_R) {
        p.ballVX = -Math.abs(p.ballVX) * 1.05
        p.ballX = rexPX - 8 - BALL_R
      }
    }

    // Score points
    if (p.ballX < 0) {
      p.rexScore++
      this._resetBall(p, W, H, 1)
    }
    if (p.ballX > W) {
      p.playerScore++
      this._resetBall(p, W, H, -1)
    }

    // Win check
    if (p.playerScore >= SCORE_WIN) this._finish('player')
    if (p.rexScore    >= SCORE_WIN) this._finish('rex')
  }

  private _resetBall(p: PongState, W: number, H: number, dirX: number) {
    p.ballX = W / 2
    p.ballY = H / 2
    p.ballVX = 3.5 * dirX
    p.ballVY = 2.5 * (Math.random() > 0.5 ? 1 : -1)
    p.waitFrames = 60
  }

  // ─── Space Invaders tick ───────────────────────────────────────────────────

  private _tickSpace() {
    const s = this.space!
    const HW = this._halfW()
    const H  = this._H()
    const SHIP_SPEED = 3
    const BULLET_SPEED = 5

    // Player movement
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
      s.playerX = Math.max(12, s.playerX - SHIP_SPEED)
    }
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
      s.playerX = Math.min(HW - 12, s.playerX + SHIP_SPEED)
    }

    // Player shoot
    if (this.keysDown.has('Space') && !s.playerBullet.active) {
      s.playerBullet = { x: s.playerX, y: H - 30, active: true }
    }

    // Update player bullet
    if (s.playerBullet.active) {
      s.playerBullet.y -= BULLET_SPEED
      if (s.playerBullet.y < 0) s.playerBullet.active = false
      // Check hits on player's invaders
      for (const inv of s.playerInvaders) {
        if (!inv.alive) continue
        if (Math.abs(s.playerBullet.x - inv.x) < 10 && Math.abs(s.playerBullet.y - inv.y) < 8) {
          inv.alive = false
          s.playerBullet.active = false
          break
        }
      }
    }

    // Rex auto-shoot
    s.rexShootCooldown--
    if (s.rexShootCooldown <= 0) {
      s.rexShootCooldown = s.autoShootInterval
      if (!s.rexBullet.active) {
        s.rexBullet = { x: s.rexX, y: H - 30, active: true }
      }
    }

    // Update rex bullet
    if (s.rexBullet.active) {
      s.rexBullet.y -= BULLET_SPEED
      if (s.rexBullet.y < 0) s.rexBullet.active = false
      for (const inv of s.rexInvaders) {
        if (!inv.alive) continue
        if (Math.abs(s.rexBullet.x - inv.x) < 10 && Math.abs(s.rexBullet.y - inv.y) < 8) {
          inv.alive = false
          s.rexBullet.active = false
          break
        }
      }
    }

    // Move invaders
    s.invaderMoveFrame++
    if (s.invaderMoveFrame % 20 === 0) {
      const allAlive = [...s.playerInvaders, ...s.rexInvaders].filter(i => i.alive)
      let hitWall = false
      for (const inv of allAlive) {
        const nx = inv.x + s.invaderDir * 4
        if (nx < 4 || nx > this.opts.width - 4) { hitWall = true; break }
      }
      if (hitWall) {
        s.invaderDir = (s.invaderDir === 1 ? -1 : 1) as 1 | -1
        for (const inv of allAlive) inv.y += 8
      } else {
        for (const inv of allAlive) inv.x += s.invaderDir * 4
      }
    }

    // Win check
    if (s.playerInvaders.every(i => !i.alive)) this._finish('player')
    if (s.rexInvaders.every(i => !i.alive))    this._finish('rex')
  }

  // ─── Breakout tick ─────────────────────────────────────────────────────────

  private _tickBreakout() {
    const b = this.brkout!
    const HW = this._halfW()
    const H  = this._H()
    const PADDLE_W = 48
    const PADDLE_SPEED = 4
    const BALL_R = 5

    // Launch timer
    if (b.launchTimer > 0) {
      b.launchTimer--
      if (b.launchTimer === 0) {
        b.playerLaunched = true
        b.rexLaunched    = true
      }
    }

    // Player paddle
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
      b.playerPaddleX = Math.max(PADDLE_W / 2, b.playerPaddleX - PADDLE_SPEED)
    }
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
      b.playerPaddleX = Math.min(HW - PADDLE_W / 2, b.playerPaddleX + PADDLE_SPEED)
    }

    // Rex AI paddle: track its ball
    if (b.rexLaunched) {
      const rexDiff = b.rexBallX - b.rexPaddleX
      b.rexPaddleX += Math.sign(rexDiff) * Math.min(Math.abs(rexDiff), PADDLE_SPEED * this.rexSpeed)
      b.rexPaddleX = Math.max(HW + PADDLE_W / 2, Math.min(this.opts.width - PADDLE_W / 2, b.rexPaddleX))
    }

    // Player ball
    if (b.playerLaunched) {
      b.playerBallX += b.playerBallVX
      b.playerBallY += b.playerBallVY
      // Walls
      if (b.playerBallX - BALL_R <= 0)    { b.playerBallX = BALL_R;    b.playerBallVX = Math.abs(b.playerBallVX) }
      if (b.playerBallX + BALL_R >= HW)   { b.playerBallX = HW - BALL_R; b.playerBallVX = -Math.abs(b.playerBallVX) }
      if (b.playerBallY - BALL_R <= 0)    { b.playerBallY = BALL_R;    b.playerBallVY = Math.abs(b.playerBallVY) }
      // Paddle bounce
      const pPaddleY = H - 20
      if (b.playerBallY + BALL_R >= pPaddleY && b.playerBallVY > 0 &&
          Math.abs(b.playerBallX - b.playerPaddleX) < PADDLE_W / 2 + BALL_R) {
        b.playerBallVY = -Math.abs(b.playerBallVY)
        b.playerBallY = pPaddleY - BALL_R
      }
      // Ball out
      if (b.playerBallY > H + 20) {
        b.playerBallX = b.playerPaddleX
        b.playerBallY = H - 40
        b.playerBallVX = 2.5 * (Math.random() > 0.5 ? 1 : -1)
        b.playerBallVY = -3
      }
      // Brick collisions
      for (const brick of b.playerBricks) {
        if (!brick.alive) continue
        if (Math.abs(b.playerBallX - (brick.x + 10)) < 10 + BALL_R &&
            Math.abs(b.playerBallY - (brick.y + 6))  <  6 + BALL_R) {
          brick.alive = false
          b.playerBallVY *= -1
          break
        }
      }
    }

    // Rex ball
    if (b.rexLaunched) {
      b.rexBallX += b.rexBallVX
      b.rexBallY += b.rexBallVY
      if (b.rexBallX - BALL_R <= HW)   { b.rexBallX = HW + BALL_R;       b.rexBallVX = Math.abs(b.rexBallVX) }
      if (b.rexBallX + BALL_R >= this.opts.width) { b.rexBallX = this.opts.width - BALL_R; b.rexBallVX = -Math.abs(b.rexBallVX) }
      if (b.rexBallY - BALL_R <= 0)    { b.rexBallY = BALL_R;    b.rexBallVY = Math.abs(b.rexBallVY) }
      const rPaddleY = H - 20
      if (b.rexBallY + BALL_R >= rPaddleY && b.rexBallVY > 0 &&
          Math.abs(b.rexBallX - b.rexPaddleX) < 24 + BALL_R) {
        b.rexBallVY = -Math.abs(b.rexBallVY)
        b.rexBallY = rPaddleY - BALL_R
      }
      if (b.rexBallY > H + 20) {
        b.rexBallX = b.rexPaddleX
        b.rexBallY = H - 40
        b.rexBallVX = -2.5 * (Math.random() > 0.5 ? 1 : -1)
        b.rexBallVY = -3
      }
      for (const brick of b.rexBricks) {
        if (!brick.alive) continue
        if (Math.abs(b.rexBallX - (brick.x + 10)) < 10 + BALL_R &&
            Math.abs(b.rexBallY - (brick.y + 6))  <  6 + BALL_R) {
          brick.alive = false
          b.rexBallVY *= -1
          break
        }
      }
    }

    // Win check
    if (b.playerBricks.every(br => !br.alive)) this._finish('player')
    if (b.rexBricks.every(br => !br.alive))    this._finish('rex')
  }

  // ─── Finish ────────────────────────────────────────────────────────────────

  private _finish(winner: 'player' | 'rex') {
    if (this.finished) return
    this.finished = true
    this._render()
    this.opts.onComplete(winner)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  private _render() {
    if (this.destroyed) return
    const W = this.opts.width
    const H = this._H()
    this.app.stage.removeChildren()

    // Background
    const bg = new Graphics()
    bg.rect(0, 0, W, H).fill({ color: 0x050c10 })
    this.app.stage.addChild(bg)

    // Center divider
    const div = new Graphics()
    div.moveTo(W / 2, 0).lineTo(W / 2, H)
    div.stroke({ width: 2, color: 0x334455, alpha: 0.8 })
    this.app.stage.addChild(div)

    // Labels
    const lblP = new Text({ text: 'PLAYER', style: STYLE_LABEL })
    lblP.x = 10; lblP.y = 10
    this.app.stage.addChild(lblP)
    const lblR = new Text({ text: 'REX', style: STYLE_LABEL })
    lblR.x = W / 2 + 10; lblR.y = 10
    this.app.stage.addChild(lblR)

    switch (this.opts.gameType) {
      case 'pong':           this._renderPong(W, H);    break
      case 'space_invaders': this._renderSpace(W, H);   break
      case 'breakout':       this._renderBreakout(W, H);break
    }

    void STYLE_DIVIDER
  }

  private _renderPong(W: number, H: number) {
    if (!this.pong) return
    const p = this.pong
    const PADDLE_H = 60
    const PADDLE_W = 8

    // Scores
    const scoreText = new Text({ text: `${p.playerScore}  ·  ${p.rexScore}`, style: STYLE_SCORE })
    scoreText.anchor.set(0.5, 0)
    scoreText.x = W / 2; scoreText.y = 10
    this.app.stage.addChild(scoreText)

    // Player paddle (left)
    const pp = new Graphics()
    pp.rect(8, p.playerY - PADDLE_H / 2, PADDLE_W, PADDLE_H).fill({ color: 0x44aaff })
    this.app.stage.addChild(pp)

    // Rex paddle (right)
    const rp = new Graphics()
    rp.rect(W - 8 - PADDLE_W, p.rexY - PADDLE_H / 2, PADDLE_W, PADDLE_H).fill({ color: 0xff6644 })
    this.app.stage.addChild(rp)

    // Ball
    const ball = new Graphics()
    ball.circle(p.ballX, p.ballY, 5).fill({ color: 0xffffff })
    this.app.stage.addChild(ball)
  }

  private _renderSpace(W: number, H: number) {
    if (!this.space) return
    const s = this.space

    // Invaders
    for (const inv of s.playerInvaders) {
      if (!inv.alive) continue
      const g = new Graphics()
      g.rect(inv.x - 8, inv.y - 6, 16, 12).fill({ color: 0x44cc88 })
      this.app.stage.addChild(g)
    }
    for (const inv of s.rexInvaders) {
      if (!inv.alive) continue
      const g = new Graphics()
      g.rect(inv.x - 8, inv.y - 6, 16, 12).fill({ color: 0xff6644 })
      this.app.stage.addChild(g)
    }

    // Player ship
    const ps = new Graphics()
    ps.rect(s.playerX - 10, H - 36, 20, 14).fill({ color: 0x44aaff })
    this.app.stage.addChild(ps)

    // Rex ship
    const rs = new Graphics()
    rs.rect(s.rexX - 10, H - 36, 20, 14).fill({ color: 0xff6644 })
    this.app.stage.addChild(rs)

    // Bullets
    if (s.playerBullet.active) {
      const pb = new Graphics()
      pb.rect(s.playerBullet.x - 2, s.playerBullet.y - 6, 4, 12).fill({ color: 0xffffff })
      this.app.stage.addChild(pb)
    }
    if (s.rexBullet.active) {
      const rb = new Graphics()
      rb.rect(s.rexBullet.x - 2, s.rexBullet.y - 6, 4, 12).fill({ color: 0xffaa44 })
      this.app.stage.addChild(rb)
    }

    // Score counts
    const pAlive = s.playerInvaders.filter(i => i.alive).length
    const rAlive = s.rexInvaders.filter(i => i.alive).length
    const scoreTxt = new Text({
      text: `LEFT: ${pAlive}  ·  LEFT: ${rAlive}`,
      style: STYLE_SCORE,
    })
    scoreTxt.anchor.set(0.5, 0)
    scoreTxt.x = W / 2; scoreTxt.y = 10
    this.app.stage.addChild(scoreTxt)

    void H
  }

  private _renderBreakout(W: number, H: number) {
    if (!this.brkout) return
    const b = this.brkout
    const PADDLE_W = 48
    const PADDLE_H = 8

    // Player bricks
    for (const brick of b.playerBricks) {
      if (!brick.alive) continue
      const g = new Graphics()
      g.rect(brick.x, brick.y, 20, 12).fill({ color: 0x44aaff, alpha: 0.8 })
        .stroke({ width: 1, color: 0x88ccff })
      this.app.stage.addChild(g)
    }

    // Rex bricks
    for (const brick of b.rexBricks) {
      if (!brick.alive) continue
      const g = new Graphics()
      g.rect(brick.x, brick.y, 20, 12).fill({ color: 0xff6644, alpha: 0.8 })
        .stroke({ width: 1, color: 0xffaa88 })
      this.app.stage.addChild(g)
    }

    // Player paddle
    const pp = new Graphics()
    pp.rect(b.playerPaddleX - PADDLE_W / 2, H - 22, PADDLE_W, PADDLE_H).fill({ color: 0x44aaff })
    this.app.stage.addChild(pp)

    // Rex paddle
    const rp = new Graphics()
    rp.rect(b.rexPaddleX - PADDLE_W / 2, H - 22, PADDLE_W, PADDLE_H).fill({ color: 0xff6644 })
    this.app.stage.addChild(rp)

    // Player ball
    if (b.playerLaunched) {
      const pb = new Graphics()
      pb.circle(b.playerBallX, b.playerBallY, 5).fill({ color: 0xffffff })
      this.app.stage.addChild(pb)
    }

    // Rex ball
    if (b.rexLaunched) {
      const rb = new Graphics()
      rb.circle(b.rexBallX, b.rexBallY, 5).fill({ color: 0xffcc88 })
      this.app.stage.addChild(rb)
    }

    // Brick counts
    const pLeft = b.playerBricks.filter(br => br.alive).length
    const rLeft = b.rexBricks.filter(br => br.alive).length
    const scoreTxt = new Text({
      text: `BRICKS: ${pLeft}  ·  BRICKS: ${rLeft}`,
      style: STYLE_SCORE,
    })
    scoreTxt.anchor.set(0.5, 0)
    scoreTxt.x = W / 2; scoreTxt.y = 10
    this.app.stage.addChild(scoreTxt)
  }

  // ─── Destroy ───────────────────────────────────────────────────────────────

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.opts.canvas.removeEventListener('keydown', this._onKeyDown)
    this.opts.canvas.removeEventListener('keyup',   this._onKeyUp)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup',   this._onKeyUp)
    this.app.ticker.remove(this._tick)
    this.app.destroy()
  }
}
