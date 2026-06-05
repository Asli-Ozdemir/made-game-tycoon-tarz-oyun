# Emlakçılık UI — Aseprite Background + Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw two 440×80 pixel art background banners (Vivian'ın ofisi + müzakere odası) in Aseprite, export as PNG, and wire them into a new `EmlakcilikPanel.tsx` component registered in `App.tsx`.

**Architecture:** One `.aseprite` file with 2 frames and 6 shared layers. Tag `office` = frame 1, `negotiation` = frame 2. Each layer is drawn via a separate Lua script run through Aseprite MCP. After drawing, both frames are exported as flat PNGs, copied to `src/assets/icons/`, and imported in `EmlakcilikPanel.tsx`. The panel structure mirrors `LawyerPanel` — fixed 440px width, Tailwind for content, no component tests (codebase pattern: store-only tests).

**Tech Stack:** Aseprite 1.x Lua (via `aseprite_run_lua_script` MCP), React 19 + TypeScript, Tailwind CSS, Zustand (`useEmlakcilikStore`).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `scripts/emlak_bg_01_create.lua` | 440×80 sprite, 2 frames, 6 layers, tags |
| Create | `scripts/emlak_bg_02_office_bg.lua` | frame 1 `bg` layer — solid amber fill |
| Create | `scripts/emlak_bg_03_office_arch.lua` | frame 1 `arch` — bookshelf left side |
| Create | `scripts/emlak_bg_04_office_light.lua` | frame 1 `light` — desk lamp amber glow |
| Create | `scripts/emlak_bg_05_office_furniture.lua` | frame 1 `furniture` — desk silhouette |
| Create | `scripts/emlak_bg_06_office_detail.lua` | frame 1 `detail` — books + paper stack |
| Create | `scripts/emlak_bg_07_office_atmosphere.lua` | frame 1 `atmosphere` — right neon window |
| Create | `scripts/emlak_bg_08_negotiation_bg.lua` | frame 2 `bg` — cold dark blue fill |
| Create | `scripts/emlak_bg_09_negotiation_arch.lua` | frame 2 `arch` — glass partition right |
| Create | `scripts/emlak_bg_10_negotiation_light.lua` | frame 2 `light` — fluorescent strip top |
| Create | `scripts/emlak_bg_11_negotiation_furniture.lua` | frame 2 `furniture` — long table + chairs |
| Create | `scripts/emlak_bg_12_negotiation_detail.lua` | frame 2 `detail` — water glass + folder |
| Create | `scripts/emlak_bg_13_negotiation_atmosphere.lua` | frame 2 `atmosphere` — left edge light |
| Create | `scripts/emlak_bg_14_export.lua` | flatten+export both frames as PNG |
| Create | `src/assets/icons/emlak_office_bg.png` | (generated — copy from assets/) |
| Create | `src/assets/icons/emlak_negotiation_bg.png` | (generated — copy from assets/) |
| Create | `src/components/EmlakcilikPanel.tsx` | React panel — banner + phase content |
| Modify | `src/App.tsx` | Add `emlakcilik` location → `<EmlakcilikPanel />` |

---

## Shared Lua preamble (paste into every drawing script, scripts 02–13)

```lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_bg.aseprite"
local W, H = 440, 80
local spr = app.open(ASEPRITE_PATH)

local function celImgFrame(layerName, frameIdx)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local f = spr.frames[frameIdx]
      local c = l:cel(f)
      if not c then c = spr:newCel(l, f) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local function px(img, x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end

local function rect(img, x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(img, x, y, c) end end
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end
```

## Run command (same for every script)

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/<SCRIPT_NAME>.lua"
```

---

## Task 1: Create emlak_bg.aseprite

**Files:**
- Create: `scripts/emlak_bg_01_create.lua`
- Generated: `assets/emlak_bg.aseprite`

- [ ] **Step 1: Write script**

```lua
-- emlak_bg_01_create.lua
-- Creates 440×80 Aseprite file: 2 frames, 6 named layers, animation tags.

local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_bg.aseprite"
local W, H = 440, 80

local spr = Sprite(W, H, ColorMode.RGB)
spr.layers[1].name = "bg"

local LAYER_NAMES = {"arch", "light", "furniture", "detail", "atmosphere"}
for _, name in ipairs(LAYER_NAMES) do
  local l = spr:newLayer()
  l.name = name
end

-- Add second frame
spr:newFrame()

-- Animation tags: office = frame 1, negotiation = frame 2
spr:newTag(1, 1).name = "office"
spr:newTag(2, 2).name = "negotiation"

spr:saveAs(ASEPRITE_PATH)
print("Created " .. ASEPRITE_PATH)
print("Frames: " .. #spr.frames .. ", Layers: " .. #spr.layers)
for i, t in ipairs(spr.tags) do
  print("  tag[" .. i .. "] " .. t.name .. " frames " .. t.fromFrame.frameNumber .. "-" .. t.toFrame.frameNumber)
end
app.exit()
```

- [ ] **Step 2: Run via Aseprite MCP `aseprite_run_lua_script`**

Pass the script content above. Expected output:
```
Created ...assets/emlak_bg.aseprite
Frames: 2, Layers: 6
  tag[1] office frames 1-1
  tag[2] negotiation frames 2-2
```

- [ ] **Step 3: Commit**

```bash
git add scripts/emlak_bg_01_create.lua assets/emlak_bg.aseprite
git commit -m "feat: emlak_bg.aseprite — create file, 2 frames, 6 layers, tags"
```

---

## Task 2: Office layers (frames 1, layers bg→atmosphere)

**Files:**
- Create: `scripts/emlak_bg_02_office_bg.lua` through `scripts/emlak_bg_07_office_atmosphere.lua`

All scripts start with the **Shared Lua preamble** above (replacing `ASEPRITE_PATH`, `W`, `H`, `spr` definitions with the preamble block). Each ends with `spr:saveAs(ASEPRITE_PATH)` then `app.exit()`.

- [ ] **Step 1: Write `emlak_bg_02_office_bg.lua`**

```lua
-- emlak_bg_02_office_bg.lua
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("bg", 1)
local BG = Color{r=26, g=8, b=0, a=255}
for y = 0, H-1 do for x = 0, W-1 do img:drawPixel(x, y, BG) end end
print("office bg done")

spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 2: Run script 02 via MCP**

- [ ] **Step 3: Write `emlak_bg_03_office_arch.lua`**

```lua
-- emlak_bg_03_office_arch.lua
-- Bookshelf: left strip x=0-62, wall color + 3 shelf dividers.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("arch", 1)
local WALL  = Color{r=42, g=18, b=0, a=255}    -- #2a1200
local SHELF = Color{r=61, g=26, b=0, a=255}    -- #3d1a00

-- Shelf back wall
rect(img, 0, 0, 62, H-1, WALL)

-- Vertical shelf edge (right border of bookcase)
rect(img, 62, 0, 65, H-1, Color{r=32, g=14, b=0, a=255})

-- 3 horizontal shelf dividers
rect(img, 0, 25, 62, 26, SHELF)
rect(img, 0, 50, 62, 51, SHELF)
rect(img, 0, 75, 62, 76, SHELF)

print("office arch done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 4: Run script 03 via MCP**

- [ ] **Step 5: Write `emlak_bg_04_office_light.lua`**

```lua
-- emlak_bg_04_office_light.lua
-- Desk lamp: thin post + warm amber radial glow centered at (210, 62).
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("light", 1)
local CX, CY = 210, 62   -- glow center

-- Lamp post: 1px wide vertical from y=44 to y=62
rect(img, CX, 44, CX, 62, Color{r=90, g=45, b=0, a=255})

-- Lamp head (horizontal): x=200-220, y=40-45
rect(img, 200, 40, 220, 45, Color{r=90, g=45, b=0, a=255})

-- Radial amber glow: fades from center outward
for y = 0, H-1 do
  for x = 80, W-1 do
    local dx = x - CX
    local dy = y - CY
    local dist = math.sqrt(dx*dx + dy*dy)
    local radius = 90
    if dist < radius then
      local t = 1 - dist / radius
      local a = math.floor(t * t * 180)
      if a > 10 then
        img:drawPixel(x, y, Color{r=245, g=158, b=11, a=a})  -- #f59e0b
      end
    end
  end
end
print("office light done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 6: Run script 04 via MCP**

- [ ] **Step 7: Write `emlak_bg_05_office_furniture.lua`**

```lua
-- emlak_bg_05_office_furniture.lua
-- Desk: horizontal strip at y=70-79, x=80-390. Top edge lighter.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("furniture", 1)
local DESK_TOP  = Color{r=90, g=46, b=0, a=255}   -- #5a2e00 — top edge
local DESK_BODY = Color{r=61, g=26, b=0, a=255}   -- #3d1a00 — body
local DESK_DARK = Color{r=42, g=20, b=0, a=255}   -- #2a1400 — front face

-- Desk top edge
rect(img, 80, 70, 390, 71, DESK_TOP)
-- Desk body
rect(img, 80, 72, 390, 75, DESK_BODY)
-- Desk front panel (bottom 4px)
rect(img, 80, 76, 390, H-1, DESK_DARK)

print("office furniture done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 8: Run script 05 via MCP**

- [ ] **Step 9: Write `emlak_bg_06_office_detail.lua`**

```lua
-- emlak_bg_06_office_detail.lua
-- Books on 3 shelves + paper stack on desk.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("detail", 1)

-- Book colors
local BOOK_A = Color{r=124, g=45,  b=18, a=255}  -- #7c2d12
local BOOK_B = Color{r=146, g=64,  b=14, a=255}  -- #92400e
local BOOK_C = Color{r=69,  g=26,  b=3,  a=255}  -- #451a03
local PAPER  = Color{r=231, g=213, b=184, a=255} -- #e7d5b8

-- Top shelf (y=3-22): books x=2-58
local books_top = {
  {x1=2,  x2=7,  c=BOOK_A},
  {x1=8,  x2=13, c=BOOK_B},
  {x1=14, x2=18, c=BOOK_C},
  {x1=19, x2=24, c=BOOK_A},
  {x1=25, x2=29, c=BOOK_B},
  {x1=31, x2=35, c=BOOK_C},
  {x1=36, x2=42, c=BOOK_A},
  {x1=43, x2=48, c=BOOK_B},
  {x1=50, x2=55, c=BOOK_C},
}
for _, b in ipairs(books_top) do
  rect(img, b.x1, 3, b.x2, 23, b.c)
end

-- Middle shelf (y=28-47): fewer, looser
local books_mid = {
  {x1=3,  x2=9,  c=BOOK_C},
  {x1=11, x2=18, c=BOOK_A},
  {x1=20, x2=24, c=BOOK_B},
  {x1=34, x2=40, c=BOOK_A},
  {x1=42, x2=47, c=BOOK_C},
}
for _, b in ipairs(books_mid) do
  rect(img, b.x1, 28, b.x2, 48, b.c)
end

-- Bottom shelf (y=53-68): sparse
local books_bot = {
  {x1=5,  x2=12, c=BOOK_B},
  {x1=14, x2=19, c=BOOK_C},
  {x1=28, x2=35, c=BOOK_A},
}
for _, b in ipairs(books_bot) do
  rect(img, b.x1, 53, b.x2, 68, b.c)
end

-- Paper stack on desk surface (center-ish)
rect(img, 215, 65, 248, 67, PAPER)
rect(img, 218, 63, 245, 65, PAPER)
rect(img, 220, 61, 242, 63, PAPER)

print("office detail done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 10: Run script 06 via MCP**

- [ ] **Step 11: Write `emlak_bg_07_office_atmosphere.lua`**

```lua
-- emlak_bg_07_office_atmosphere.lua
-- Right-side window showing distant neon city: x=370-432, y=4-64.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("atmosphere", 1)
local WIN_FRAME = Color{r=61, g=26, b=0, a=255}   -- #3d1a00
local WIN_GLASS = Color{r=13, g=0,  b=20, a=255}  -- #0d0014 very dark purple
local NEON_1 = Color{r=76, g=29, b=149, a=60}     -- #4c1d95 subtle purple bleed
local NEON_2 = Color{r=168,g=85, b=247, a=30}     -- #a855f7 faint bloom

-- Window frame (outer border 2px)
rect(img, 370, 4,  432, 64, WIN_FRAME)
-- Window glass interior
rect(img, 374, 7,  428, 61, WIN_GLASS)

-- Purple neon ambient in glass — scattered faint pixels
for y = 8, 60 do
  for x = 375, 427 do
    local noise = (x * 7 + y * 13) % 17
    if noise < 3 then
      img:drawPixel(x, y, NEON_1)
    elseif noise < 5 then
      img:drawPixel(x, y, NEON_2)
    end
  end
end

-- Neon glow bleed left of window (x=368-373)
for y = 10, 58 do
  local a = math.floor(40 * (1 - (372 - math.max(368, 372 - (373 - 368))) / 6))
  img:drawPixel(368, y, Color{r=76, g=29, b=149, a=25})
  img:drawPixel(369, y, Color{r=76, g=29, b=149, a=18})
  img:drawPixel(370, y, Color{r=76, g=29, b=149, a=10})
end

print("office atmosphere done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 12: Run script 07 via MCP**

- [ ] **Step 13: Commit all office layer scripts**

```bash
git add scripts/emlak_bg_02_office_bg.lua scripts/emlak_bg_03_office_arch.lua scripts/emlak_bg_04_office_light.lua scripts/emlak_bg_05_office_furniture.lua scripts/emlak_bg_06_office_detail.lua scripts/emlak_bg_07_office_atmosphere.lua assets/emlak_bg.aseprite
git commit -m "feat: emlak_bg — office frame (layers bg, arch, light, furniture, detail, atmosphere)"
```

---

## Task 3: Negotiation layers (frame 2, layers bg→atmosphere)

**Files:**
- Create: `scripts/emlak_bg_08_negotiation_bg.lua` through `scripts/emlak_bg_13_negotiation_atmosphere.lua`

Same pattern as Task 2 — each script starts with the shared preamble, draws on frame 2, saves, exits.

- [ ] **Step 1: Write `emlak_bg_08_negotiation_bg.lua`**

```lua
-- emlak_bg_08_negotiation_bg.lua
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("bg", 2)
local BG = Color{r=7, g=12, b=20, a=255}   -- #070c14
for y = 0, H-1 do for x = 0, W-1 do img:drawPixel(x, y, BG) end end
print("negotiation bg done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 2: Run script 08 via MCP**

- [ ] **Step 3: Write `emlak_bg_09_negotiation_arch.lua`**

```lua
-- emlak_bg_09_negotiation_arch.lua
-- Glass partition: x=375-438, y=0-62. Dark glass panel with thin frame.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("arch", 2)
local FRAME = Color{r=30, g=58, b=95,  a=255}  -- #1e3a5f
local GLASS = Color{r=9,  g=15, b=26,  a=255}  -- #090f1a

-- Outer frame (1px border)
rect(img, 375, 0, 438, 62, FRAME)
-- Glass interior
rect(img, 377, 1, 436, 60, GLASS)

-- Horizontal bar divider at y=30 (structural crossbar)
rect(img, 375, 30, 438, 31, FRAME)

print("negotiation arch done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 4: Run script 09 via MCP**

- [ ] **Step 5: Write `emlak_bg_10_negotiation_light.lua`**

```lua
-- emlak_bg_10_negotiation_light.lua
-- Fluorescent strip: y=0-4 across x=70-370. Glow fades downward.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("light", 2)
local BRIGHT = Color{r=191, g=219, b=254, a=255}  -- #bfdbfe
local MID    = Color{r=30,  g=58,  b=95,  a=255}  -- #1e3a5f

-- Tube: 2px bright line
rect(img, 70, 0, 370, 1, BRIGHT)
-- Diffuser below tube
rect(img, 70, 2, 370, 3, MID)

-- Downward glow gradient (y=4 to y=20)
for y = 4, 20 do
  local t = (y - 4) / 16.0
  local a = math.floor((1 - t) * (1 - t) * 120)
  if a > 5 then
    for x = 60, 380 do
      img:drawPixel(x, y, Color{r=191, g=219, b=254, a=a})
    end
  end
end

print("negotiation light done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 6: Run script 10 via MCP**

- [ ] **Step 7: Write `emlak_bg_11_negotiation_furniture.lua`**

```lua
-- emlak_bg_11_negotiation_furniture.lua
-- Long table y=65-79 x=90-350, two chair backs above on left+right.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("furniture", 2)
local TABLE_TOP  = Color{r=55, g=65, b=81,  a=255}   -- #374151
local TABLE_BODY = Color{r=30, g=41, b=59,  a=255}   -- #1e293b
local CHAIR      = Color{r=15, g=23, b=42,  a=255}   -- #0f172a

-- Table top edge
rect(img, 90, 65, 350, 66, TABLE_TOP)
-- Table body
rect(img, 90, 67, 350, H-1, TABLE_BODY)

-- Left chair back: x=110-148, y=52-65
rect(img, 110, 52, 148, 65, CHAIR)
-- Left chair top rail
rect(img, 108, 51, 150, 52, TABLE_TOP)

-- Right chair back: x=292-330, y=52-65
rect(img, 292, 52, 330, 65, CHAIR)
-- Right chair top rail
rect(img, 290, 51, 332, 52, TABLE_TOP)

print("negotiation furniture done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 8: Run script 11 via MCP**

- [ ] **Step 9: Write `emlak_bg_12_negotiation_detail.lua`**

```lua
-- emlak_bg_12_negotiation_detail.lua
-- Water glass (center, on table surface) + document folder (left of glass).
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("detail", 2)
local GLASS_RIM  = Color{r=147, g=197, b=253, a=255}  -- #93c5fd
local FOLDER     = Color{r=55,  g=65,  b=81,  a=255}  -- #374151
local FOLDER_TAB = Color{r=75,  g=85,  b=99,  a=255}

-- Water glass: thin rectangle outline at x=217-220, y=58-65
for y = 58, 65 do
  img:drawPixel(217, y, GLASS_RIM)
  img:drawPixel(220, y, GLASS_RIM)
end
rect(img, 217, 58, 220, 59, GLASS_RIM)  -- rim top
rect(img, 217, 64, 220, 65, GLASS_RIM)  -- base

-- Single highlight pixel inside glass
img:drawPixel(218, 61, Color{r=191, g=219, b=254, a=180})

-- Document folder: x=168-200, y=62-65
rect(img, 168, 62, 200, 65, FOLDER)
-- Tab cutout (top-right corner)
rect(img, 192, 60, 200, 62, FOLDER_TAB)

print("negotiation detail done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 10: Run script 12 via MCP**

- [ ] **Step 11: Write `emlak_bg_13_negotiation_atmosphere.lua`**

```lua
-- emlak_bg_13_negotiation_atmosphere.lua
-- Left-edge cold light seeping in: x=0-5, fading right.
-- [PASTE SHARED PREAMBLE HERE]

local img = celImgFrame("atmosphere", 2)
local COLD = Color{r=219, g=234, b=254, a=255}  -- #dbeafe

-- Thin bright edge
for y = 0, H-1 do
  img:drawPixel(0, y, Color{r=219, g=234, b=254, a=55})
  img:drawPixel(1, y, Color{r=219, g=234, b=254, a=35})
  img:drawPixel(2, y, Color{r=219, g=234, b=254, a=18})
  img:drawPixel(3, y, Color{r=219, g=234, b=254, a=8})
end

print("negotiation atmosphere done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
```

- [ ] **Step 12: Run script 13 via MCP**

- [ ] **Step 13: Commit all negotiation layer scripts**

```bash
git add scripts/emlak_bg_08_negotiation_bg.lua scripts/emlak_bg_09_negotiation_arch.lua scripts/emlak_bg_10_negotiation_light.lua scripts/emlak_bg_11_negotiation_furniture.lua scripts/emlak_bg_12_negotiation_detail.lua scripts/emlak_bg_13_negotiation_atmosphere.lua assets/emlak_bg.aseprite
git commit -m "feat: emlak_bg — negotiation frame (layers bg, arch, light, furniture, detail, atmosphere)"
```

---

## Task 4: Export PNGs

**Files:**
- Create: `scripts/emlak_bg_14_export.lua`
- Generated: `assets/emlak_office_bg.png`, `assets/emlak_negotiation_bg.png`
- Copy: `src/assets/icons/emlak_office_bg.png`, `src/assets/icons/emlak_negotiation_bg.png`

- [ ] **Step 1: Write `emlak_bg_14_export.lua`**

```lua
-- emlak_bg_14_export.lua
-- Flattens each frame and exports as PNG.
-- Strategy: for each frame, build a composited image by iterating layers top-to-bottom
-- (only opaque pixels overwrite — matches how these layers were drawn).

local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_bg.aseprite"
local OFFICE_PNG      = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_office_bg.png"
local NEGOTIATION_PNG = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_negotiation_bg.png"
local W, H = 440, 80

local spr = app.open(ASEPRITE_PATH)

local function exportFrame(frameIdx, outputPath)
  local out = Sprite(W, H, ColorMode.RGB)
  local outImg = out.cels[1].image

  -- Fill black base
  for y = 0, H-1 do
    for x = 0, W-1 do
      outImg:drawPixel(x, y, Color{r=0, g=0, b=0, a=255})
    end
  end

  -- Composite each layer bottom-to-top
  for i = 1, #spr.layers do
    local layer = spr.layers[i]
    local frame = spr.frames[frameIdx]
    local cel = layer:cel(frame)
    if cel then
      local celImg = cel.image
      local bx = cel.bounds.x
      local by = cel.bounds.y
      for cy = 0, celImg.height - 1 do
        for cx = 0, celImg.width - 1 do
          local rawpx = celImg:getPixel(cx, cy)
          local a = app.pixelColor.rgbaA(rawpx)
          if a > 0 then
            local r = app.pixelColor.rgbaR(rawpx)
            local g = app.pixelColor.rgbaG(rawpx)
            local b = app.pixelColor.rgbaB(rawpx)
            local wx = bx + cx
            local wy = by + cy
            if wx >= 0 and wx < W and wy >= 0 and wy < H then
              -- Alpha-blend onto existing pixel
              local bg = outImg:getPixel(wx, wy)
              local bgr = app.pixelColor.rgbaR(bg)
              local bgg = app.pixelColor.rgbaG(bg)
              local bgb = app.pixelColor.rgbaB(bg)
              local at = a / 255.0
              local nr = math.floor(bgr * (1 - at) + r * at)
              local ng = math.floor(bgg * (1 - at) + g * at)
              local nb = math.floor(bgb * (1 - at) + b * at)
              outImg:drawPixel(wx, wy, Color{r=nr, g=ng, b=nb, a=255})
            end
          end
        end
      end
    end
  end

  out:saveCopyAs(outputPath)
  out:close()
  print("Exported frame " .. frameIdx .. " → " .. outputPath)
end

exportFrame(1, OFFICE_PNG)
exportFrame(2, NEGOTIATION_PNG)

app.exit()
```

- [ ] **Step 2: Run script 14 via Aseprite MCP `aseprite_run_lua_script`**

Expected output:
```
Exported frame 1 → ...assets/emlak_office_bg.png
Exported frame 2 → ...assets/emlak_negotiation_bg.png
```

- [ ] **Step 3: Verify PNG dimensions**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun"
node -e "const s=require('fs').statSync('assets/emlak_office_bg.png'); console.log('office:', s.size, 'bytes')"
node -e "const s=require('fs').statSync('assets/emlak_negotiation_bg.png'); console.log('negotiation:', s.size, 'bytes')"
```

Both files should exist and be non-zero bytes. Visual check: open in Aseprite or any image viewer — office should be warm amber/dark, negotiation should be dark blue.

- [ ] **Step 4: Copy PNGs to src/assets/icons/**

```bash
cp assets/emlak_office_bg.png src/assets/icons/emlak_office_bg.png
cp assets/emlak_negotiation_bg.png src/assets/icons/emlak_negotiation_bg.png
```

- [ ] **Step 5: Commit**

```bash
git add scripts/emlak_bg_14_export.lua assets/emlak_office_bg.png assets/emlak_negotiation_bg.png src/assets/icons/emlak_office_bg.png src/assets/icons/emlak_negotiation_bg.png
git commit -m "feat: emlak_bg — export office + negotiation PNGs"
```

---

## Task 5: EmlakcilikPanel.tsx

**Files:**
- Create: `src/components/EmlakcilikPanel.tsx`

No component test file needed — codebase tests stores only (see `src/store/__tests__/emlakcilikStore.test.ts` for existing coverage).

- [ ] **Step 1: Create `src/components/EmlakcilikPanel.tsx`**

```tsx
// src/components/EmlakcilikPanel.tsx
import { useState } from 'react'
import { useWorldStore }      from '@/store/worldStore'
import { useDayTimeStore }    from '@/store/dayTimeStore'
import { useEmlakcilikStore } from '@/store/emlakcilikStore'
import { PROPERTY_DEALS }     from '@/data/propertyDeals'
import officeBg      from '@/assets/icons/emlak_office_bg.png'
import negotiationBg from '@/assets/icons/emlak_negotiation_bg.png'
import type { NegotiationSignal } from '@/data/propertyDeals'

const BUYER_LABELS: Record<string, string> = {
  kurumsal_yatirimci: 'Kurumsal Yatırımcı',
  genc_girisimci:     'Genç Girişimci',
  spekulatif_yatirimci: 'Spekülatif Yatırımcı',
}

const SIGNAL_LINES: Record<NegotiationSignal, string> = {
  accepted:  'Kabul etti.',
  hesitated: 'Tereddüt etti.',
  smiled:    'Düşündü, gülümsedi.',
  walked:    'Masayı terk etti.',
}

const SIGNAL_COLORS: Record<NegotiationSignal, string> = {
  accepted:  'text-green-400',
  hesitated: 'text-yellow-400',
  smiled:    'text-blue-400',
  walked:    'text-red-400',
}

export default function EmlakcilikPanel() {
  const setLocation = useWorldStore((s) => s.setLocation)
  const setIsPaused = useDayTimeStore((s) => s.setIsPaused)

  const phase              = useEmlakcilikStore((s) => s.phase)
  const activeDealId       = useEmlakcilikStore((s) => s.activeDealId)
  const completedDealIds   = useEmlakcilikStore((s) => s.completedDealIds)
  const rentIndex          = useEmlakcilikStore((s) => s.rentIndex)
  const offerCount         = useEmlakcilikStore((s) => s.offerCount)
  const currentBuyerType   = useEmlakcilikStore((s) => s.currentBuyerType)
  const currentBuyerCeiling = useEmlakcilikStore((s) => s.currentBuyerCeiling)

  const [offerInput, setOfferInput]   = useState('')
  const [lastSignal, setLastSignal]   = useState<NegotiationSignal | null>(null)
  const [dealSuccess, setDealSuccess] = useState<boolean | null>(null)

  const bannerSrc = phase === 'brief' || phase === 'idle'
    ? officeBg
    : negotiationBg

  function close() {
    useEmlakcilikStore.getState().resetDeal()
    setLocation(null)
    setIsPaused(false)
  }

  function handlePickDeal(dealId: string) {
    useEmlakcilikStore.getState().startDeal(dealId)
  }

  function handleConfirmBrief() {
    useEmlakcilikStore.getState().confirmBrief()
    setLastSignal(null)
    setOfferInput('')
  }

  function handleMakeOffer() {
    const price = parseInt(offerInput.replace(/\D/g, ''), 10)
    if (isNaN(price) || price <= 0) return
    const signal = useEmlakcilikStore.getState().makeOffer(price)
    if (!signal) return
    setLastSignal(signal)
    setOfferInput('')
    if (signal === 'accepted') {
      setDealSuccess(true)
    } else if (useEmlakcilikStore.getState().phase === 'result') {
      setDealSuccess(false)
    }
  }

  function handleResetDeal() {
    useEmlakcilikStore.getState().resetDeal()
    setLastSignal(null)
    setDealSuccess(null)
    setOfferInput('')
  }

  const activeDeal = activeDealId ? PROPERTY_DEALS.find(d => d.id === activeDealId) : null

  return (
    <div
      className="bg-gray-950/97 border border-amber-900/40 rounded-xl shadow-2xl flex flex-col font-mono overflow-hidden"
      style={{ width: '440px', minHeight: '200px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-amber-600 tracking-widest">EMLAKÇILIK</span>
        {(phase === 'idle' || phase === 'brief' || phase === 'result') && (
          <button onClick={close} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
        )}
      </div>

      {/* Banner */}
      <div className="relative" style={{ height: '80px', overflow: 'hidden' }}>
        <img
          src={bannerSrc}
          alt=""
          style={{
            width: '100%',
            height: '80px',
            imageRendering: 'pixelated',
            display: 'block',
            transition: 'opacity 300ms ease',
          }}
        />
        {rentIndex > 0 && (
          <div className="absolute bottom-1 right-2 text-xs font-mono text-amber-700/70">
            Kira Endeksi {rentIndex}/100
          </div>
        )}
      </div>

      {/* Phase content */}
      <div className="flex-1 overflow-auto">
        {phase === 'idle' && renderIdle()}
        {phase === 'brief' && renderBrief()}
        {phase === 'negotiation' && renderNegotiation()}
        {phase === 'result' && renderResult()}
      </div>
    </div>
  )

  function renderIdle() {
    const available = PROPERTY_DEALS.filter(d => !completedDealIds.includes(d.id))
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Vivian — Mülk Portföyü</div>
        {available.length === 0 && (
          <div className="text-gray-400 text-sm">Tüm mülkler satıldı.</div>
        )}
        {available.map(deal => (
          <button
            key={deal.id}
            onClick={() => handlePickDeal(deal.id)}
            className="w-full text-left px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-amber-800 rounded text-sm text-gray-200 transition-colors"
          >
            <span className="font-medium">{deal.label}</span>
            <span className="ml-2 text-xs text-gray-500">
              {deal.baseCost.toLocaleString()}₺ maliyet
            </span>
          </button>
        ))}
        <button
          onClick={close}
          className="mt-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded self-start"
        >
          [ESC] Çık
        </button>
      </div>
    )
  }

  function renderBrief() {
    if (!activeDeal) return null
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-amber-600 uppercase tracking-widest">{activeDeal.label}</div>
        <div className="text-sm text-gray-300 italic leading-relaxed">
          "{activeDeal.hint}"
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Tahmini değer:{' '}
          <span className="text-gray-300">
            {activeDeal.buyerCeilingMin.toLocaleString()}₺ – {activeDeal.buyerCeilingMax.toLocaleString()}₺
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleConfirmBrief}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 rounded text-sm text-amber-100"
          >
            Müzakereye Başla
          </button>
          <button
            onClick={() => { useEmlakcilikStore.getState().resetDeal() }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded"
          >
            Geri
          </button>
        </div>
      </div>
    )
  }

  function renderNegotiation() {
    if (!activeDeal) return null
    const offersLeft = 3 - offerCount
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-blue-400 uppercase tracking-widest">{activeDeal.label}</div>
        {currentBuyerType && (
          <div className="text-xs text-gray-500">
            Alıcı: <span className="text-gray-400">{BUYER_LABELS[currentBuyerType]}</span>
            <span className="ml-3 text-gray-600">{offersLeft} teklif hakkı</span>
          </div>
        )}
        {lastSignal && (
          <div className={`text-sm font-medium ${SIGNAL_COLORS[lastSignal]}`}>
            {SIGNAL_LINES[lastSignal]}
          </div>
        )}
        <div className="flex gap-2 items-center mt-1">
          <input
            type="text"
            value={offerInput}
            onChange={e => setOfferInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleMakeOffer()}
            placeholder="Teklif (₺)"
            className="flex-1 bg-gray-900 border border-gray-700 focus:border-blue-700 rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none"
          />
          <button
            onClick={handleMakeOffer}
            disabled={!offerInput}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm text-blue-100"
          >
            Teklif Ver
          </button>
        </div>
        <div className="text-xs text-gray-700 mt-1">
          Maliyet: {activeDeal.baseCost.toLocaleString()}₺
        </div>
      </div>
    )
  }

  function renderResult() {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Sonuç</div>
        {dealSuccess === true && (
          <div className="text-green-400 text-sm font-medium">Anlaşma kapandı.</div>
        )}
        {dealSuccess === false && (
          <div className="text-red-400 text-sm font-medium">Müzakere başarısız.</div>
        )}
        {lastSignal && (
          <div className={`text-xs ${SIGNAL_COLORS[lastSignal]}`}>
            {SIGNAL_LINES[lastSignal]}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleResetDeal}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
          >
            Portföye Dön
          </button>
          <button
            onClick={close}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded"
          >
            Çık
          </button>
        </div>
      </div>
    )
  }
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/EmlakcilikPanel.tsx
git commit -m "feat: EmlakcilikPanel — banner + brief/negotiation/result phases"
```

---

## Task 6: Register EmlakcilikPanel in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import**

In `src/App.tsx`, after the `LawyerPanel` import line:
```ts
import LawyerPanel   from '@/components/LawyerPanel'
```
Add:
```ts
import EmlakcilikPanel from '@/components/EmlakcilikPanel'
```

- [ ] **Step 2: Add location block**

In `src/App.tsx`, after the `lawyers_office` block:
```tsx
      {currentLocation === 'lawyers_office' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <LawyerPanel />
        </div>
      )}
```
Add:
```tsx
      {currentLocation === 'emlakcilik' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <EmlakcilikPanel />
        </div>
      )}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: All existing tests pass (no store logic changed).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx — register EmlakcilikPanel for emlakcilik location"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Canvas 440×80, 1:1 scale | Task 1 — `Sprite(440, 80)` |
| 2 frames, tags `office` + `negotiation` | Task 1 — `spr:newFrame()` + `spr:newTag()` |
| 6 shared layers (bg/arch/light/furniture/detail/atmosphere) | Task 1 — layer list |
| Frame 1 amber palette | Tasks 2 — `#1a0800` bg, `#f59e0b` glow, etc. |
| Frame 2 cold blue palette | Tasks 3 — `#070c14` bg, `#bfdbfe` fluorescent, etc. |
| Office: bookshelf left, lamp glow, desk, books, neon window | Tasks 2 steps 3/5/7/9/11 |
| Negotiation: glass partition, fluorescent strip, table+chairs, glass+folder, cold edge | Tasks 3 steps 3/5/7/9/11 |
| Export as flat PNGs | Task 4 |
| PNG copy to src/assets/icons/ | Task 4 step 4 |
| `imageRendering: pixelated` | Task 5 — `<img>` style |
| Banner src switches on phase | Task 5 — `bannerSrc` logic |
| `transition: opacity 300ms ease` | Task 5 — `<img>` style |
| App.tsx location registration | Task 6 |
| brief/idle → office, negotiation/result → negotiation | Task 5 — `bannerSrc` condition |

### Placeholder scan

No TBD/TODO. All Lua scripts have complete pixel coordinates and colors. All React JSX is complete.

### Type consistency

- `NegotiationSignal` imported from `@/data/propertyDeals` in Panel — matches store definition ✓
- `useEmlakcilikStore` actions: `startDeal`, `confirmBrief`, `makeOffer`, `resetDeal` — all defined in `emlakcilikStore.ts` ✓
- `PROPERTY_DEALS` imported from `@/data/propertyDeals` — defined in `propertyDeals.ts` ✓
- `activeDealId` (not `activeDeal`) in store state — panel uses `activeDealId` and derives `activeDeal` from `PROPERTY_DEALS.find()` ✓
