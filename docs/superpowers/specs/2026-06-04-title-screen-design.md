# Title Screen — Design Spec
_2026-06-04_

## Overview

Full-screen cinematic title screen for **Magenta Reach**. Displayed before the game starts (when `gameState === 'title'`). Pure React + Tailwind CSS + CSS keyframe animations — no canvas, no Pixi.js.

---

## Visual Layers (bottom → top)

| # | Layer | Implementation | Animation |
|---|-------|---------------|-----------|
| 1 | Sky gradient | CSS `background` on root div | Static |
| 2 | Stars (6–8 dots) | Absolute-positioned `<div>` elements | `twinkle` keyframe — opacity 0.3↔1.0, staggered `animation-delay` |
| 3 | City skyline | Absolute divs, right side, `opacity: 0.25`, `filter: blur(1px)` | Static |
| 4 | Fog band | Absolute gradient overlay above city | Static |
| 5 | Ground + tree silhouettes | Absolute divs, clip-path shapes | Static |
| 6 | Garage | Absolute div, left-center of foreground | Window: `pulse` keyframe — `box-shadow` glow intensity |
| 7 | Rain drops | 18 absolute `<div>` elements, thin (1px wide, 8–14px tall) | `fall` keyframe — `translateY`, staggered delay + randomized duration (0.6–1.0s) |
| 8 | UI overlay | Centered flex column — logo + menu | `fadeIn` on mount (1s) |

---

## Background Gradient

```css
background: linear-gradient(
  160deg,
  #1b2a4a 0%,    /* deep navy — top sky */
  #2e3f6e 18%,   /* blue-grey */
  #4a2060 42%,   /* deep purple */
  #6b1a3a 62%,   /* dark magenta */
  #3d1a06 80%,   /* warm brown — horizon */
  #2a0f04 100%   /* deep amber-dark — ground */
);
```

---

## Animations

### `twinkle` (stars)
```css
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 1.0; }
}
```
6–8 star divs, 2×2px or 1×1px, white/warm-white, `animation-duration: 2–4s`, unique `animation-delay` per star.

### `pulse` (garage light)
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 10px #ffaa33, 0 0 20px #ff880033; }
  50%       { box-shadow: 0 0 18px #ffcc44, 0 0 36px #ffaa3366; }
}
```
`animation-duration: 2.5s`, `animation-timing-function: ease-in-out`.

### `fall` (rain)
```css
@keyframes fall {
  from { transform: translateY(-20px); opacity: 0; }
  10%  { opacity: 0.25; }
  90%  { opacity: 0.25; }
  to   { transform: translateY(100vh); opacity: 0; }
}
```
18 rain divs, `width: 1px`, `height: 8–14px`, `background: linear-gradient(transparent, #a0c4ff)`, scattered across full width, `animation-duration: 0.6–1.0s`, `animation-iteration-count: infinite`, unique `animation-delay`.

### `fadeIn` (full screen on mount)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
Applied to root div, `animation-duration: 1s`, `animation-fill-mode: forwards`, runs once.

---

## UI Overlay

Centered `flex-col` div, `z-index: 10`, positioned at vertical center (slightly above mid — ~45% from top).

### Logo
```tsx
<img
  src={logoMagentaReach}
  alt="Magenta Reach"
  style={{ imageRendering: 'pixelated', width: 384, height: 108 }}
/>
```
Scale: 6× original (64×18 → 384×108 px). Import from `@/assets/icons/logo_magenta_reach.png`.

### Menu Buttons
Three ghost-style buttons stacked vertically, `gap: 8px`, centered:

| Button | Default style | Hover style |
|--------|--------------|-------------|
| NEW GAME | `border: 1px solid rgba(220,55,115,0.5)`, text `#f0a0c0` | border opacity → 1.0, subtle magenta glow |
| CONTINUE | `border: 1px solid rgba(255,255,255,0.15)`, text `#aaaacc` | border opacity → 0.4 |
| EXIT | no border, text `#666688` | text → `#9999aa` |

Font: monospace, `font-size: 11px`, `letter-spacing: 3px`. Padding: `6px 24px`.

CONTINUE is disabled (greyed, `cursor: default`, no hover) when no save exists — check via `useSaveStore`.

---

## Component Structure

```
src/components/StartScreen.tsx   ← replace existing (slot picker logic korunur)
src/assets/icons/
  logo_magenta_reach.png         ← already exists
  logo_magenta_reach.aseprite    ← already exists
```

`StartScreen` mevcut component'ın yerini alır — `App.tsx:168`'deki `if (showStartScreen) return <StartScreen />` gate'i değişmez.

Mevcut slot-picker logic (`handleNewGame`, `handleContinue`, `initSlots`) korunur. Yeni tasarım bu logic'in üzerine sinematik arka plan ve pixel art logo ekler.

**Slot seçimi**: NEW GAME veya CONTINUE tıklanınca ekranın üstünde küçük bir slot overlay açılır (mevcut slot picker UI'ı buraya taşınır). Title screen'in ana görünümü sade kalır.

`hasSave`: `slots.some(s => s.exists)` ile hesaplanır, CONTINUE butonu buna göre enabled/disabled.

---

## Out of Scope

- Background music / ambient sound
- Settings menu
- Credits screen
- Animated parallax scrolling (stars/layers moving independently)
