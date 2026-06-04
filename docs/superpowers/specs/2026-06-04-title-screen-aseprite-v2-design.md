# Title Screen — Aseprite MCP Background Design

## Goal

Create a 683×384 layered Aseprite file for the Magenta Reach title screen background. Export as flat PNG, wire into StartScreen.tsx. CSS overlays (rain, star twinkle, glow, bench, bridge, logo, menu) stay in React code.

## Canvas

- **Size:** 683×384 px
- **Display:** 2× scale on 1366×768 (CSS `imageRendering: pixelated`, `objectFit: fill`)
- **Format:** RGB (no alpha in background PNG)

## Drawing Approach

One Lua script per layer via Aseprite MCP `aseprite_run_lua_script`. The `.aseprite` file stays open in Aseprite after each step so the result can be reviewed visually. If a layer looks wrong, that layer is cleared and redrawn — other layers are unaffected.

## Layer Stack (bottom to top)

| # | Layer name | Content |
|---|---|---|
| 1 | `sky` | Gradient fill — 6 stops navy→purple→magenta→brown |
| 2 | `stars` | ~10 static white pixel dots in upper half |
| 3 | `buildings` | Right-side city silhouette, layer opacity 28% |
| 4 | `fog` | Semi-transparent purple-ish band y=270–298 |
| 5 | `ground` | Solid dark fill y=299–383 |
| 6 | `river` | Winding bezier strip, passes through (362,334) |
| 7 | `hill` | Asymmetric dark ellipse, bottom-left corner |
| 8 | `trees` | 4 pine tree silhouettes, x=14–26% |
| 9 | `house` | Pixel art house/garage — gabled roof, chimney, side door, windows, garage door |

## Color Palette

### Sky gradient stops
| Position | Hex |
|---|---|
| 0% | `#1b2a4a` |
| 18% | `#2e3f6e` |
| 42% | `#4a2060` |
| 62% | `#6b1a3a` |
| 80% | `#3d1a06` |
| 100% | `#2a0f04` |

### Scene colors
| Element | Color |
|---|---|
| Ground | `#1a0804` |
| Hill | `#150402` |
| Trees | `#120300` |
| House body | `#2e1104` |
| Roof | `#1e0802` |
| Garage door | `#3a1508` |
| River (deep) | `#1c4199` |
| River (surface) | `#4090ee` |
| River (shimmer) | `#a0d2ff` |
| City buildings | `#c0185f` (magenta) + `#9b30ff` (purple), layer opacity 28% |
| Window glow (baked) | `#5a3712` (subtle warm; CSS glow animates on top) |

## Star Positions

Baked into `stars` layer AND matched by CSS twinkle divs:

| Canvas (x,y) | CSS left | CSS top |
|---|---|---|
| (55, 31) | 8% | 8% |
| (188, 50) | 28% | 13% |
| (266, 23) | 39% | 6% |
| (109, 69) | 16% | 18% |
| (229, 38) | 34% | 10% |
| (304, 19) | 45% | 5% |
| (27, 77) | 4% | 20% |
| (157, 11) | 23% | 3% |
| (239, 58) | 35% | 15% |
| (314, 35) | 46% | 9% |

## Key Coordinates

| Element | Canvas coords |
|---|---|
| Ground top edge | y = 299 |
| River keypoint (left:53%, bottom:13%) | x = 362, y = 334 |
| House left edge | x = 34 |
| House body top | y = 239 |
| House body W×H | 90×60 px |
| Roof top | y = 206 |
| Chimney left | x = 97 |

## Output Files

| File | How |
|---|---|
| `assets/title_bg.aseprite` | Created by MCP, editable source |
| `assets/title_bg.png` | Flat export (merge all layers) |
| `src/assets/icons/title_bg.png` | Copy for Vite import |

## CSS Overlays (not in Aseprite file)

These stay in `src/components/StartScreen.tsx`:

- **Rain drops** — 32 divs, `fall` CSS animation
- **Star twinkle** — 10 divs, `twinkle` CSS animation (positions match `stars` layer)
- **Garage window glow** — 2 divs, `garageLight` CSS animation + `boxShadow`
- **bench_figure.png** — `left: calc(23% - 72px)`, `bottom: calc(32% - 54px)`, 144×108 display
- **bridge.png** — `left: calc(48% - 144px)`, `bottom: calc(13% - 10px)`, 288×84 display
- **Logo** — `src/assets/icons/logo_magenta_reach.png` (already in project)
- **Menu buttons** — NEW GAME, CONTINUE, EXIT, slot picker

## StartScreen.tsx Changes

Remove: all CSS scene components from the current blank slate.
Add: `import bgSrc from '@/assets/icons/title_bg.png'` and `<img src={bgSrc}>` as background.
Keep: STARS array, RAIN_DROPS array, glow divs, bench/bridge imgs, logo/menu/slot picker — identical to the version before the reset.

## Existing Smoke Tests

`tests/StartScreen.test.tsx` — 4 tests (logo alt, NEW GAME, EXIT, CONTINUE disabled) must continue to pass after StartScreen.tsx is updated.
