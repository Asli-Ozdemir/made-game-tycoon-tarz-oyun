# Title Screen — Aseprite Pixel Art Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all CSS div scene layers in StartScreen.tsx with a single 683×384 Aseprite-drawn pixel art PNG background, keeping only animated overlays (rain, star twinkle, garage glow) and the React UI (logo + menu) in code.

**Architecture:** One Lua script (`scripts/create_title_bg.lua`) draws the entire background at 683×384 (2× pixel art scale — displays at exact 2× on 1366×768) using per-pixel drawing. Background covers: sky gradient, static stars, blurred city skyline, fog band, dark ground, winding river, foreground hill, pine trees, and the pixel-art house/garage. The existing `bench_figure.png` and `bridge.png` sprites (already Aseprite-made) stay as CSS-positioned `<img>` tags at user-measured coordinates. CSS animations (rain drops, star twinkle divs, garage window glow div) stay minimal in StartScreen.tsx. React menu overlay (logo + buttons + slot picker) unchanged.

**Tech Stack:** Aseprite 1.x Lua CLI (`C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe`), React 19 + TypeScript, Vite asset pipeline.

---

## Canvas coordinate reference

All Lua pixel coordinates are for **683 × 384** canvas (displayed 2× full-screen).

| Scene element | Canvas coords |
|---|---|
| Ground top edge | y = 299 (= 384 × 0.78) |
| River curve point (left:53%, bottom:13%) | x = 362, y = 334 |
| House body: left edge, bottom | x = 34, y_bottom = 299 |
| House body: W × H | 90 × 60 px |
| House roof: top | y = 206 |
| Chimney: left edge, top | x = 97, y = 211 |
| Bench center (left:23%, bottom:32%) | x = 157, y = 261 ← CSS only, not in PNG |
| Bridge center (left:48%, bottom:19%) | x = 328, y = 311 ← CSS only, not in PNG |

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `scripts/create_title_bg.lua` | Create | Draws entire background scene, exports PNG |
| `assets/title_bg.png` | Generated | 683×384 background (run the script) |
| `src/assets/icons/title_bg.png` | Copy | Vite-importable version |
| `src/components/StartScreen.tsx` | Modify | Replace CSS layers with `<img>` background |

---

## Task 1: Script skeleton + sky gradient + city skyline

**Files:**
- Create: `scripts/create_title_bg.lua`

- [ ] **Step 1: Create the Lua script with canvas setup and sky gradient**

```lua
-- Title screen background — 683×384 pixel art (2× scale)
-- Run: "C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script scripts/create_title_bg.lua

local OUTPUT = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.png"
local W, H   = 683, 384

local spr = Sprite(W, H, ColorMode.RGB)
local img = spr.cels[1].image

-- ── Helpers ─────────────────────────────────────────────
local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end

local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

local function lerpColor(r0,g0,b0, r1,g1,b1, t)
  return Color{ r=lerp(r0,r1,t), g=lerp(g0,g1,t), b=lerp(b0,b1,t), a=255 }
end

-- ── Sky gradient ─────────────────────────────────────────
-- CSS: 160deg, stops: #1b2a4a 0%, #2e3f6e 18%, #4a2060 42%,
--                     #6b1a3a 62%, #3d1a06 80%, #2a0f04 100%
local SKY = {
  { 0.00,  27, 42, 74 },
  { 0.18,  46, 63,110 },
  { 0.42,  74, 32, 96 },
  { 0.62, 107, 26, 58 },
  { 0.80,  61, 26,  6 },
  { 1.00,  42, 15,  4 },
}

local function skyColor(yn)
  for i = 1, #SKY - 1 do
    local y0 = SKY[i][1];   local r0,g0,b0 = SKY[i][2],   SKY[i][3],   SKY[i][4]
    local y1 = SKY[i+1][1]; local r1,g1,b1 = SKY[i+1][2], SKY[i+1][3], SKY[i+1][4]
    if yn <= y1 then
      local t = (yn - y0) / (y1 - y0)
      return lerpColor(r0,g0,b0, r1,g1,b1, t)
    end
  end
  return Color{r=42, g=15, b=4, a=255}
end

print("Drawing sky...")
for y = 0, H-1 do
  local c = skyColor(y / (H - 1))
  for x = 0, W-1 do img:drawPixel(x, y, c) end
end
print("Sky done.")
```

- [ ] **Step 2: Add static stars**

Append to `create_title_bg.lua` after the sky section:

```lua
-- ── Stars ────────────────────────────────────────────────
-- Positions are 50% of the CSS % values (683px canvas)
local STARS = {
  { 55, 31 }, { 188, 50 }, { 266, 23 }, { 109, 69 },
  { 229, 38 }, { 304, 19 }, { 27,  77 }, { 157, 11 },
  { 239, 58 }, { 314, 35 },
}
local SW = Color{r=255, g=255, b=255, a=200}
local SW2 = Color{r=220, g=220, b=255, a=140}
for _, s in ipairs(STARS) do
  px(s[1], s[2], SW)
  px(s[1]+1, s[2], SW2)
  px(s[1], s[2]+1, SW2)
end
```

- [ ] **Step 3: Add faint city skyline (right side)**

Append to `create_title_bg.lua`:

```lua
-- ── City skyline — right side, blended faint ─────────────
-- Each building: {x_left, y_top, width, r, g, b}
-- CSS values halved (683px canvas). Buildings blend at ~28% opacity
-- onto sky by mixing with sky color at each pixel.
local GROUND_Y = 299  -- ground top edge (384 * 0.78)

local BLDGS = {
  { 659, 299-140, 16, 192, 24, 95  },
  { 633, 299-210, 22, 155, 48, 255 },
  { 615, 299-100, 14, 192, 24, 95  },
  { 585, 299-260, 26, 155, 48, 255 },
  { 564, 299-160, 17, 192, 24, 95  },
  { 547, 299- 90, 12, 155, 48, 255 },
  { 518, 299-230, 24, 192, 24, 95  },
  { 498, 299-130, 15, 155, 48, 255 },
  { 474, 299-180, 19, 192, 24, 95  },
  { 456, 299-110, 13, 155, 48, 255 },
  { 430, 299-200, 21, 192, 24, 95  },
  { 415, 299- 75, 10, 155, 48, 255 },
  { 392, 299-150, 18, 192, 24, 95  },
  { 362, 299-240, 25, 155, 48, 255 },
}

-- Blend building color at 28% over existing sky pixel
local OPACITY = 0.28
print("Drawing buildings...")
for _, b in ipairs(BLDGS) do
  local xl, yt, bw, br, bg, bb = b[1], b[2], b[3], b[4], b[5], b[6]
  for y = yt, GROUND_Y - 1 do
    local sky = skyColor(y / (H - 1))
    local c = Color{
      r = lerp(sky.red,   br, OPACITY),
      g = lerp(sky.green, bg, OPACITY),
      b = lerp(sky.blue,  bb, OPACITY),
      a = 255,
    }
    for x = xl, xl + bw - 1 do px(x, y, c) end
  end
end
```

- [ ] **Step 4: Add export and run the script to verify sky + buildings work**

Append to end of `create_title_bg.lua` (temporary, will grow in later tasks):

```lua
spr:saveCopyAs(OUTPUT)
print("Saved: " .. OUTPUT)
app.exit()
```

Run:
```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script scripts/create_title_bg.lua
```

Expected output:
```
Drawing sky...
Sky done.
Drawing buildings...
Saved: C:\Users\umutm\Desktop\mad-game-tarzı-oyun\assets\title_bg.png
```

Open `assets/title_bg.png` — should show dark navy-to-brown diagonal gradient with faint magenta/purple skyscrapers on the right.

- [ ] **Step 5: Commit**

```bash
git add scripts/create_title_bg.lua assets/title_bg.png
git commit -m "feat: title bg lua script — sky gradient + city skyline"
```

---

## Task 2: Fog + ground + river

**Files:**
- Modify: `scripts/create_title_bg.lua` (before the export line)

- [ ] **Step 1: Add fog band above ground**

Insert before the `spr:saveCopyAs` line:

```lua
-- ── Fog band (above ground, y=270-299) ──────────────────
print("Drawing fog + ground + river...")
for y = 270, GROUND_Y - 1 do
  local t = (y - 270) / (GROUND_Y - 1 - 270)  -- 0 at top, 1 at bottom
  for x = 0, W-1 do
    local existing = img:getPixel(x, y)
    local er = (existing >> 16) & 0xFF
    local eg = (existing >>  8) & 0xFF
    local eb =  existing        & 0xFF
    local fog_a = t * 0.55  -- fog opacity increases toward ground
    local c = Color{
      r = lerp(er, 46, fog_a),
      g = lerp(eg, 26, fog_a),
      b = lerp(eb, 68, fog_a),
      a = 255,
    }
    px(x, y, c)
  end
end
```

- [ ] **Step 2: Add dark ground**

```lua
-- ── Ground (y=299 to bottom) ─────────────────────────────
local GND = Color{r=26, g=8, b=4, a=255}
rect(0, GROUND_Y, W-1, H-1, GND)
```

- [ ] **Step 3: Add winding river**

The river passes through canvas point (362, 334) — that is `left:53%, bottom:13%`.
It's a cubic bezier approximated as line segments across the canvas.

The bezier control points (from SVG path translated to canvas coords):
- M (-14, 323)  → start off-left
- C (55, 330) (109, 346) (191, 342)
- C (260, 338) (300, 338) (362, 334)  ← user-measured point
- C (424, 330) (478, 326) (560, 330)
- C (615, 334) (656, 330) (697, 326)  → end off-right

Draw as a filled strip 8px tall (4 above, 4 below the curve) plus a 1px highlight line:

```lua
-- ── River ────────────────────────────────────────────────
-- Bezier approximated as polyline: sample t=0..1 in steps of 0.002
-- 4 cubic bezier segments joined end-to-end

local function cubicBez(p0, p1, p2, p3, t)
  local u = 1 - t
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
end

-- Segments: each is {x0,y0, cx1,cy1, cx2,cy2, x1,y1}
local SEG = {
  { -14,323,  55,330, 109,346, 191,342 },
  { 191,342, 260,338, 300,338, 362,334 },
  { 362,334, 424,330, 478,326, 560,330 },
  { 560,330, 615,334, 656,330, 697,326 },
}

local RIV_FILL = Color{r=28, g=65, b=155, a=255}
local RIV_LINE = Color{r=90, g=160,b=255, a=255}
local RIV_SHIM = Color{r=160,g=210,b=255, a=255}

local STEPS = 300
for _, seg in ipairs(SEG) do
  local x0,y0,cx1,cy1,cx2,cy2,x1,y1 = seg[1],seg[2],seg[3],seg[4],seg[5],seg[6],seg[7],seg[8]
  for i = 0, STEPS do
    local t  = i / STEPS
    local rx = math.floor(cubicBez(x0,cx1,cx2,x1, t))
    local ry = math.floor(cubicBez(y0,cy1,cy2,y1, t))
    -- Fill 8px strip
    for dy = -2, 5 do
      local alpha = (dy == -2 or dy == 5) and 0.25 or
                    (dy == -1 or dy == 4) and 0.55 or 0.85
      local c = Color{
        r = lerp(26, RIV_FILL.red,   alpha),
        g = lerp(8,  RIV_FILL.green, alpha),
        b = lerp(4,  RIV_FILL.blue,  alpha),
        a = 255,
      }
      px(rx, ry + dy, c)
    end
    -- Surface highlight line (top of river)
    px(rx, ry - 1, RIV_LINE)
  end
end

-- Shimmer streaks
local SHIM_SEGS = {
  { 80, 335, 105, 333 }, { 250, 338, 270, 336 },
  { 380, 330, 400, 329 }, { 540, 331, 560, 329 },
}
for _, s in ipairs(SHIM_SEGS) do
  for x = s[1], s[3] do
    local t = (x - s[1]) / (s[3] - s[1])
    local sy = math.floor(s[2] + t * (s[4] - s[2]))
    px(x, sy, RIV_SHIM)
  end
end
print("Fog + ground + river done.")
```

- [ ] **Step 4: Run script and verify**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script scripts/create_title_bg.lua
```

Open `assets/title_bg.png` — should show: sky gradient, faint buildings, dark ground strip at bottom ~22%, winding blue river across the ground area.

- [ ] **Step 5: Commit**

```bash
git add scripts/create_title_bg.lua assets/title_bg.png
git commit -m "feat: title bg — fog, ground, winding river"
```

---

## Task 3: Foreground hill + trees + house/garage

**Files:**
- Modify: `scripts/create_title_bg.lua` (before export line)

- [ ] **Step 1: Add foreground hill**

```lua
-- ── Foreground hill (left side, bottom-left ellipse) ─────
-- CSS: left=0, width=55%=376px, height=24%=92px, clipPath ellipse(55% 100% at 30% 100%)
-- Canvas: width=376, height=92, center_x=0.30*376=113, center_y=384
print("Drawing foreground elements...")
local HILL = Color{r=21, g=6, b=2, a=255}
local HILL_W, HILL_H = 376, 92
local HILL_CX = math.floor(HILL_W * 0.30)  -- = 113

for y = H - HILL_H, H-1 do
  local dy = y - H  -- negative, distance from bottom
  -- Ellipse equation: (x-cx)^2/rx^2 + dy^2/ry^2 <= 1
  -- rx=HILL_CX (left half) or rx=(HILL_W-HILL_CX) (right half)
  for x = 0, HILL_W do
    local dx = x - HILL_CX
    local rx = dx < 0 and HILL_CX or (HILL_W - HILL_CX)
    if rx > 0 then
      local nx = dx / rx
      local ny = dy / HILL_H
      if nx*nx + ny*ny <= 1.02 then
        px(x, y, HILL)
      end
    end
  end
end
```

- [ ] **Step 2: Add pine trees**

```lua
-- ── Pine trees ───────────────────────────────────────────
-- 4 trees: (x_left%, scale, opacity) → canvas x = floor(683 * pct)
-- Tree bottom: GROUND_Y
local TREE_BASE = Color{r=18,  g=5,  b=0, a=255}

local function drawTree(cx, scale, alpha)
  -- 3 stacked triangles + trunk
  local layers = {
    { w=math.floor(13*scale), h=math.floor(9*scale)  },
    { w=math.floor(17*scale), h=math.floor(11*scale) },
    { w=math.floor(20*scale), h=math.floor(13*scale) },
  }
  local trunk_w = math.max(2, math.floor(3*scale))
  local trunk_h = math.max(3, math.floor(5*scale))
  local c = Color{r=lerp(0,TREE_BASE.red,alpha), g=lerp(0,TREE_BASE.green,alpha), b=lerp(0,TREE_BASE.blue,alpha), a=255}

  local cur_y = GROUND_Y - trunk_h
  -- Draw trunk
  for y = cur_y, GROUND_Y-1 do
    for x = cx - math.floor(trunk_w/2), cx + math.floor(trunk_w/2) do px(x, y, c) end
  end
  -- Draw triangles bottom-up
  for i = #layers, 1, -1 do
    local L = layers[i]
    local tri_bottom = cur_y
    cur_y = cur_y - L.h + (i < #layers and math.floor(layers[i+1].h * 0.35) or 0)
    for y = cur_y, tri_bottom do
      local t = (y - cur_y) / math.max(1, L.h - 1)
      local half_w = math.floor(L.w * t / 2)
      for x = cx - half_w, cx + half_w do px(x, y, c) end
    end
  end
end

drawTree(math.floor(683*0.18),  1.0, 0.45)
drawTree(math.floor(683*0.225), 0.78, 0.35)
drawTree(math.floor(683*0.145), 0.60, 0.28)
drawTree(math.floor(683*0.26),  0.50, 0.22)
```

- [ ] **Step 3: Add house/garage body and roof**

```lua
-- ── House / Garage ───────────────────────────────────────
-- Scaled to 683-wide canvas (approx half of CSS values)
-- Body: x=34, y_bottom=299, W=90, H=60
-- Roof: W=102, H=33, from x=28

local HX   = 34   -- body left
local HY   = 239  -- body top  (299 - 60)
local HW   = 90   -- body width
local HH   = 60   -- body height
local RW   = 102  -- roof width
local RH   = 33   -- roof height
local RX   = 28   -- roof left  (HX - 6)
local RY   = 206  -- roof top   (HY - RH)

local BODY   = Color{r=46, g=17, b=6,  a=255}
local ROOF   = Color{r=30, g=8,  b=3,  a=255}
local ROOF_D = Color{r=20, g=5,  b=1,  a=255}  -- darker roof edge
local DOOR_C = Color{r=32, g=10, b=2,  a=255}
local DOOR_B = Color{r=37, g=16, b=5,  a=255}
local WIN_C  = Color{r=255,g=180,b=60, a=70 }  -- warm window glow (faint, CSS anim adds real glow)
local FRAME  = Color{r=58, g=18, b=8,  a=255}
local FNDN   = Color{r=26, g=8,  b=4,  a=255}

-- Gabled roof (triangle)
for y = RY, HY - 1 do
  local t  = (y - RY) / math.max(1, HY - 1 - RY)
  local hw = math.floor(RW * 0.5 * (1 - t))
  local cx = RX + math.floor(RW / 2)
  local c  = (y == HY-1) and ROOF_D or ROOF
  for x = cx - hw, cx + hw do px(x, y, c) end
end
-- Eave shadow
rect(RX, HY-2, RX+RW-1, HY-1, ROOF_D)

-- Body fill
rect(HX, HY, HX+HW-1, GROUND_Y-1, BODY)
-- Siding planks (7 horizontal lines)
for i = 1, 7 do
  local sy = HY + math.floor(i * HH / 8)
  for x = HX, HX+HW-1 do px(x, sy, DOOR_C) end
end
-- Foundation strip
rect(HX, GROUND_Y-3, HX+HW-1, GROUND_Y-1, FNDN)

-- Side door (left, x=HX+5 to HX+19, top=HY+14)
local DX, DY, DW, DH = HX+5, HY+14, 14, 25
rect(DX, DY, DX+DW-1, DY+DH-1, DOOR_C)
rect(DX,   DY,   DX+DW-1, DY,   FRAME)
rect(DX,   DY,   DX,       DY+DH-1, FRAME)
rect(DX+DW-1, DY, DX+DW-1, DY+DH-1, FRAME)
-- Door panels
rect(DX+2, DY+2, DX+DW-3, DY+10, DOOR_B)
rect(DX+2, DY+13, DX+DW-3, DY+22, DOOR_B)
-- Door knob
px(DX+DW-3, DY+14, Color{r=120,g=60,b=30,a=255})

-- Window above door
local WX, WY, WW, WH = HX+7, HY+5, 10, 7
rect(WX, WY, WX+WW-1, WY+WH-1, WIN_C)
rect(WX, WY, WX+WW-1, WY, FRAME)
rect(WX, WY, WX, WY+WH-1, FRAME)
rect(WX+WW-1, WY, WX+WW-1, WY+WH-1, FRAME)
rect(WX, WY+WH-1, WX+WW-1, WY+WH-1, FRAME)
-- Window cross
for x = WX, WX+WW-1 do px(x, WY+3, FRAME) end
px(WX+5, WY, FRAME) px(WX+5, WY+1, FRAME) px(WX+5, WY+2, FRAME)
px(WX+5, WY+4, FRAME) px(WX+5, WY+5, FRAME)

-- Garage door (x=HX+26 to HX+85, bottom at GROUND_Y)
local GDX, GDW, GDH = HX+26, 38, 38
local GDY = GROUND_Y - GDH
rect(GDX, GDY, GDX+GDW-1, GROUND_Y-1, DOOR_C)
-- 5 horizontal panels
for panel = 0, 4 do
  local py = GDY + math.floor(panel * GDH / 5)
  for x = GDX, GDX+GDW-1 do px(x, py, FRAME) end
  -- 4 vertical columns per panel
  for col = 1, 3 do
    local gx = GDX + math.floor(col * GDW / 4)
    px(gx, py+1, DOOR_B) px(gx, py+2, DOOR_B)
  end
end
-- Garage door border
rect(GDX, GDY, GDX, GROUND_Y-1, FRAME)
rect(GDX+GDW-1, GDY, GDX+GDW-1, GROUND_Y-1, FRAME)
rect(GDX, GDY, GDX+GDW-1, GDY, FRAME)
-- Handle
px(GDX+17, GROUND_Y-4, Color{r=90,g=40,b=20,a=255})
px(GDX+18, GROUND_Y-4, Color{r=90,g=40,b=20,a=255})
px(GDX+19, GROUND_Y-4, Color{r=90,g=40,b=20,a=255})

-- Outdoor lamp (above garage door left edge)
rect(GDX, GDY-5, GDX+2, GDY-1, ROOF)
rect(GDX-1, GDY-1, GDX+3, GDY-1, ROOF)
-- Small glow dot (static; CSS overlay will animate it)
px(GDX+1, GDY-2, Color{r=255,g=200,b=80,a=180})
```

- [ ] **Step 4: Add chimney (must draw after roof so it overlaps correctly)**

```lua
-- ── Chimney ──────────────────────────────────────────────
-- Position: x=97 (HX + HW*0.72 - 4), top at RY+5, height=16
local CX, CY, CW, CH = 97, RY+5, 9, 16
local BRK1 = Color{r=42, g=16, b=8,  a=255}
local BRK2 = Color{r=46, g=18, b=9,  a=255}
-- Shaft with brick rows
rect(CX, CY, CX+CW-1, RY+CH, BRK1)
for row = 0, 3 do
  local by = CY + math.floor(row * CH / 4)
  for x = CX, CX+CW-1 do px(x, by, ROOF_D) end
  if row % 2 == 0 then
    px(CX + math.floor(CW/2), by+1, BRK2)
    px(CX + math.floor(CW/2), by+2, BRK2)
  else
    px(CX+2, by+1, BRK2)
  end
end
-- Cap (wider than shaft)
rect(CX-2, CY, CX+CW+1, CY+2, ROOF_D)
-- Smoke wisps
px(CX+2, CY-2, Color{r=180,g=140,b=120,a=50})
px(CX+4, CY-3, Color{r=180,g=140,b=120,a=35})
px(CX+3, CY-4, Color{r=180,g=140,b=120,a=25})

print("Foreground elements done.")
```

- [ ] **Step 5: Add attic window glow (baked static, CSS will animate)**

```lua
-- Attic window in roof (center of gable, near bottom)
local AWX = RX + math.floor(RW/2) - 7
local AWY = HY - 10
rect(AWX, AWY, AWX+13, AWY+7, Color{r=255,g=190,b=70,a=40})
rect(AWX, AWY, AWX+13, AWY, FRAME)
rect(AWX, AWY, AWX, AWY+7, FRAME)
rect(AWX+13, AWY, AWX+13, AWY+7, FRAME)
rect(AWX, AWY+7, AWX+13, AWY+7, FRAME)
for x = AWX, AWX+13 do px(x, AWY+3, FRAME) end
px(AWX+6, AWY, FRAME) px(AWX+6, AWY+1, FRAME) px(AWX+6, AWY+2, FRAME)
px(AWX+6, AWY+4, FRAME) px(AWX+6, AWY+5, FRAME)
```

- [ ] **Step 6: Run and verify full scene**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script scripts/create_title_bg.lua
```

Open `assets/title_bg.png` — should show:
- Sky gradient (navy → purple → magenta → brown)
- Faint skyscrapers right side
- Dark ground strip
- Winding blue river across ground
- Foreground hill (dark ellipse bottom-left)
- 4 pine tree silhouettes
- Detailed pixel-art house with gabled roof, chimney, side door, windows, garage door

- [ ] **Step 7: Copy to src assets**

```bash
cp assets/title_bg.png src/assets/icons/title_bg.png
```

- [ ] **Step 8: Commit**

```bash
git add scripts/create_title_bg.lua assets/title_bg.png src/assets/icons/title_bg.png
git commit -m "feat: title bg — hill, trees, pixel-art house"
```

---

## Task 4: Wire background PNG into StartScreen.tsx

**Files:**
- Modify: `src/components/StartScreen.tsx`

The goal: remove all CSS scene layers (STARS array, RAIN_DROPS array, BUILDINGS array, PineTree component, Garage component, all layer divs), replace with `<img>` background + minimal animated overlays.

Keep:
- `RAIN_DROPS` array + rain div loop (CSS animation)
- 10 small star divs with twinkle animation (keep STARS array)
- Garage window glow div (positioned over the house window, CSS animation)
- `bench_figure.png` and `bridge.png` `<img>` tags at user-measured coordinates
- Logo + menu overlay (unchanged)
- Slot picker overlay (unchanged)

- [ ] **Step 1: Write the failing smoke test to confirm component still renders after the rewrite**

`tests/StartScreen.test.tsx` — no changes needed, existing 4 tests still pass. Run them first to establish baseline:

```bash
npx vitest run tests/StartScreen.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 2: Rewrite StartScreen.tsx**

Replace the entire file with:

```tsx
import { useEffect, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import logoSrc       from '@/assets/icons/logo_magenta_reach.png'
import bgSrc         from '@/assets/icons/title_bg.png'
import benchFigureSrc from '@/assets/icons/bench_figure.png'
import bridgeSrc      from '@/assets/icons/bridge.png'

// ── Animated overlay data ────────────────────────────────

// Star positions match title_bg.lua STARS array (683×384 canvas → % of display)
const STARS = [
  { left: '8%',  top: '8%',  dur: '3.2s', delay: '0.0s' },
  { left: '28%', top: '13%', dur: '2.1s', delay: '0.7s' },
  { left: '39%', top: '6%',  dur: '3.8s', delay: '1.4s' },
  { left: '16%', top: '18%', dur: '2.5s', delay: '0.3s' },
  { left: '34%', top: '10%', dur: '4.0s', delay: '1.1s' },
  { left: '45%', top: '5%',  dur: '2.8s', delay: '0.9s' },
  { left: '4%',  top: '20%', dur: '3.5s', delay: '0.5s' },
  { left: '23%', top: '3%',  dur: '2.3s', delay: '1.8s' },
  { left: '35%', top: '15%', dur: '2.9s', delay: '0.4s' },
  { left: '46%', top: '9%',  dur: '3.6s', delay: '1.2s' },
]

const RAIN_DROPS = Array.from({ length: 32 }, (_, i) => {
  const dur   = (0.45 + (i % 6) * 0.11).toFixed(2)
  const delay = ((i * 0.14) % 1.2).toFixed(2)
  return {
    left:      `${(i * 3.2 + 1) % 100}%`,
    height:    18 + (i % 8) * 3,
    animation: `fall ${dur}s linear ${delay}s infinite`,
  }
})

// ── Component ────────────────────────────────────────────

export default function StartScreen() {
  const slots              = useSaveStore((s) => s.slots)
  const setActiveSlot      = useSaveStore((s) => s.setActiveSlot)
  const setShowStartScreen = useSaveStore((s) => s.setShowStartScreen)
  const load               = useSaveStore((s) => s.load)
  const initSlots          = useSaveStore((s) => s.initSlots)

  const [overlay, setOverlay] = useState<'none' | 'new' | 'continue'>('none')

  useEffect(() => { initSlots() }, [initSlots])

  async function handleContinue(slotId: 1 | 2 | 3) {
    await load(slotId)
    setShowStartScreen(false)
  }

  function handleNewGame(slotId: 1 | 2 | 3) {
    setActiveSlot(slotId)
    setShowStartScreen(false)
  }

  const hasSave = slots.some((s) => !s.isEmpty)

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', animation: 'titleFadeIn 1s forwards' }}>

      {/* Background: pixel art scene PNG (683×384, displays 2×) */}
      <img
        src={bgSrc}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'fill',
        }}
      />

      {/* Animated star twinkle overlay */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: s.top, left: s.left,
            width: 2, height: 2, borderRadius: '50%',
            background: '#ffffff',
            animation: `twinkle ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}

      {/* Garage window glow — positioned over house attic window in background PNG */}
      {/* House at left:5%, bottom:22%. Attic window is ~left:6.8%, bottom:34% */}
      <div style={{
        position: 'absolute',
        left: 'calc(5% + 42px)',
        bottom: 'calc(22% + 58px)',
        width: 28, height: 16,
        background: 'rgba(255,190,70,0.0)',
        boxShadow: '0 0 14px 6px rgba(255,180,60,0.35)',
        borderRadius: 2,
        animation: 'garageLight 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Side window glow */}
      <div style={{
        position: 'absolute',
        left: 'calc(5% + 14px)',
        bottom: 'calc(22% + 46px)',
        width: 20, height: 14,
        background: 'rgba(255,180,60,0.0)',
        boxShadow: '0 0 10px 4px rgba(255,180,60,0.28)',
        borderRadius: 1,
        animation: 'garageLight 2.5s ease-in-out 0.4s infinite',
        pointerEvents: 'none',
      }} />

      {/* Bench figure — left:23%, bottom:32% (user-measured, centered) */}
      <img
        src={benchFigureSrc}
        alt=""
        style={{
          position: 'absolute',
          left: 'calc(23% - 72px)',
          bottom: 'calc(32% - 54px)',
          width: 144, height: 108,
          imageRendering: 'pixelated',
        }}
      />

      {/* Bridge — centered at left:48%, river at bottom:13% */}
      <img
        src={bridgeSrc}
        alt=""
        style={{
          position: 'absolute',
          left: 'calc(48% - 144px)',
          bottom: 'calc(13% - 10px)',
          width: 288, height: 84,
          imageRendering: 'pixelated',
        }}
      />

      {/* Rain drops */}
      {RAIN_DROPS.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', top: 0,
            left: r.left, width: 1, height: r.height,
            background: 'linear-gradient(transparent, rgba(160,196,255,0.6))',
            animation: r.animation,
          }}
        />
      ))}

      {/* Logo + menu */}
      <div
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <img
          src={logoSrc}
          alt="Magenta Reach"
          style={{ imageRendering: 'pixelated', width: 384, height: 108, maxWidth: '80vw', objectFit: 'contain' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 8 }}>
          <MenuButton onClick={() => setOverlay('new')} color="magenta">NEW GAME</MenuButton>
          <MenuButton onClick={() => hasSave ? setOverlay('continue') : undefined} color="white" disabled={!hasSave}>CONTINUE</MenuButton>
          <button
            onClick={() => window.close()}
            style={{
              padding: '4px 24px', border: 'none',
              color: '#666688', background: 'transparent',
              fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
              cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9999aa' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666688' }}
          >EXIT</button>
        </div>
      </div>

      {/* Slot picker */}
      {overlay !== 'none' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,2,15,0.75)', backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOverlay('none') }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 32 }}>
            <div style={{ color: '#c8a87a', fontFamily: 'monospace', fontSize: 10, letterSpacing: 4, opacity: 0.7 }}>
              {overlay === 'new' ? 'SELECT SLOT' : 'LOAD GAME'}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {slots.map((slot) => {
                const isDisabled = overlay === 'continue' && slot.isEmpty
                return (
                  <button
                    key={slot.slotId}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return
                      overlay === 'new' ? handleNewGame(slot.slotId) : handleContinue(slot.slotId)
                    }}
                    style={{
                      width: 140, padding: '16px 12px',
                      background: 'rgba(20,10,40,0.9)',
                      border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.06)' : 'rgba(192,24,95,0.4)'}`,
                      borderRadius: 4, cursor: isDisabled ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = 'rgba(192,24,95,0.9)' }}
                    onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = 'rgba(192,24,95,0.4)' }}
                  >
                    <div style={{ color: '#888899', fontFamily: 'monospace', fontSize: 8, letterSpacing: 2 }}>SLOT {slot.slotId}</div>
                    {slot.isEmpty ? (
                      <div style={{ color: isDisabled ? '#333344' : '#f0a0c0', fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
                        {isDisabled ? '— empty —' : '+ new game'}
                      </div>
                    ) : (
                      <>
                        <div style={{ color: '#e8d5b0', fontFamily: 'monospace', fontSize: 10 }}>{slot.label}</div>
                        <div style={{ color: '#665544', fontFamily: 'monospace', fontSize: 8 }}>{new Date(slot.savedAt).toLocaleDateString('en-GB')}</div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setOverlay('none')}
              style={{ color: '#444455', fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, background: 'none', border: 'none', cursor: 'pointer' }}
            >BACK</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MenuButton ───────────────────────────────────────────

function MenuButton({
  children, onClick, color, disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  color: 'magenta' | 'white'
  disabled?: boolean
}) {
  const isMagenta  = color === 'magenta'
  const borderBase = isMagenta ? 'rgba(220,55,115,0.5)' : 'rgba(255,255,255,0.15)'
  const borderHov  = isMagenta ? 'rgba(220,55,115,1)'   : 'rgba(255,255,255,0.4)'
  const textColor  = disabled ? '#444458' : isMagenta ? '#f0a0c0' : '#aaaacc'

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: '6px 24px',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : borderBase}`,
        color: textColor,
        background: isMagenta && !disabled ? 'rgba(192,24,95,0.08)' : 'transparent',
        fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
        borderRadius: 2, cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = borderHov
        if (isMagenta) e.currentTarget.style.boxShadow = '0 0 10px rgba(192,24,95,0.35)'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.borderColor = borderBase
        e.currentTarget.style.boxShadow   = 'none'
      }}
    >{children}</button>
  )
}
```

- [ ] **Step 3: Run smoke tests**

```bash
npx vitest run tests/StartScreen.test.tsx
```

Expected: 4 tests pass (logo alt text, NEW GAME, EXIT, CONTINUE disabled).

- [ ] **Step 4: Run dev server and verify visually**

```bash
npm run dev
```

Check:
- Background PNG fills the screen (pixelated 2× scaling)
- Stars twinkle (CSS animation)
- Rain falls (CSS animation)
- Garage windows glow (CSS animation)
- Bench figure at left:23%, bottom:32%
- Bridge at left:48%, bottom:13% (river visible through arch openings)
- Logo and menu centered
- NEW GAME → slot picker opens
- BACK closes slot picker

- [ ] **Step 5: Commit**

```bash
git add src/components/StartScreen.tsx
git commit -m "feat: StartScreen — replace CSS scene with Aseprite pixel art background"
```

---

## Self-review

**Spec coverage:**
- ✅ Sky gradient → Task 1 Step 1
- ✅ Stars → Task 1 Step 2
- ✅ City skyline (blurred, faint) → Task 1 Step 3
- ✅ Fog band → Task 2 Step 1
- ✅ Ground → Task 2 Step 2
- ✅ River (winding, user-measured point) → Task 2 Step 3
- ✅ Foreground hill → Task 3 Step 1
- ✅ Trees → Task 3 Step 2
- ✅ House/garage (dominant, pixel art) → Task 3 Steps 3-5
- ✅ Bench figure (user-measured position) → Task 4 Step 2
- ✅ Bridge (user-measured position) → Task 4 Step 2
- ✅ Animated rain → Task 4 Step 2
- ✅ Animated stars → Task 4 Step 2
- ✅ Garage window glow → Task 4 Step 2
- ✅ Logo + menu unchanged → Task 4 Step 2
- ✅ Slot picker unchanged → Task 4 Step 2

**Placeholder scan:** No TBDs or TODOs. All code blocks complete.

**Type consistency:** `slotId` typed as `1 | 2 | 3` via `handleNewGame`/`handleContinue` — matches existing saveStore API. `MenuButton` component props unchanged from previous version.
