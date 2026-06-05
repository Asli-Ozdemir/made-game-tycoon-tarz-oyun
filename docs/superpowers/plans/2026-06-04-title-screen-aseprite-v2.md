# Title Screen — Aseprite Layered Background (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw a 683×384 pixel art title screen background in Aseprite (9 named layers), export as flat PNG, wire into StartScreen.tsx as a `<img>` background with CSS animated overlays on top.

**Architecture:** One Lua script per layer group, run via Aseprite CLI (`--batch --script`). Each script opens the existing `.aseprite` file, draws on the target layer(s), and saves. The `.aseprite` file persists between scripts so layers accumulate. Final export flattens all layers to PNG. StartScreen.tsx keeps rain/star/glow CSS animations and positions bench_figure + bridge as separate `<img>` tags.

**Tech Stack:** Aseprite 1.x Lua CLI (`C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe`), React 19 + TypeScript, Vite.

---

## Canvas coordinate reference

| Scene element | Canvas coords |
|---|---|
| Canvas size | 683 × 384 |
| Ground top edge | y = 299 |
| River keypoint (left:53%, bottom:13%) | x = 362, y = 334 |
| House body: left, top, W×H | x=34, y=239, 90×60 px |
| Roof: left, top, W×H | x=28, y=206, 102×33 px |
| Chimney: left, top | x=97, y=211 |
| Bench (CSS only, not in PNG) | left:23%, bottom:32% |
| Bridge (CSS only, not in PNG) | left:48%, bottom:19% |

## File structure

| File | Action | Responsibility |
|---|---|---|
| `scripts/title_bg_01_create.lua` | Create | Create .aseprite file with 9 named layers |
| `scripts/title_bg_02_sky.lua` | Create | Draw sky gradient on `sky` layer |
| `scripts/title_bg_03_stars.lua` | Create | Draw 10 star pixels on `stars` layer |
| `scripts/title_bg_04_buildings.lua` | Create | Draw city silhouette on `buildings` layer (opacity 28%) |
| `scripts/title_bg_05_fog_ground.lua` | Create | Draw fog band + ground fill |
| `scripts/title_bg_06_river.lua` | Create | Draw winding river bezier |
| `scripts/title_bg_07_hill_trees.lua` | Create | Draw foreground hill ellipse + 4 pine trees |
| `scripts/title_bg_08_house.lua` | Create | Draw pixel-art house/garage |
| `scripts/title_bg_09_export.lua` | Create | Flatten layers → export PNG |
| `assets/title_bg.aseprite` | Generated | Editable layered source |
| `assets/title_bg.png` | Generated | Flat PNG for display |
| `src/assets/icons/title_bg.png` | Copy | Vite-importable version |
| `src/components/StartScreen.tsx` | Modify | Add background img + CSS overlays |

### Shared Lua helper (copy into every script except script 01)

Every drawing script uses this preamble — copy it verbatim at the top of each script:

```lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299

local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
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

### Run command (same for every script)

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/<SCRIPT_NAME>.lua"
```

---

## Task 1: Create layered .aseprite file

**Files:**
- Create: `scripts/title_bg_01_create.lua`
- Generates: `assets/title_bg.aseprite`

- [ ] **Step 1: Write the script**

```lua
-- title_bg_01_create.lua
-- Creates 683×384 Aseprite file with 9 named layers, bottom-to-top order.

local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384

local spr = Sprite(W, H, ColorMode.RGB)
spr.layers[1].name = "sky"

local LAYER_NAMES = {"stars","buildings","fog","ground","river","hill","trees","house"}
for _, name in ipairs(LAYER_NAMES) do
  local l = spr:newLayer()
  l.name = name
end

spr:saveAs(ASEPRITE_PATH)
print("Created " .. ASEPRITE_PATH)
print("Layer count: " .. #spr.layers)
for i, l in ipairs(spr.layers) do
  print("  [" .. i .. "] " .. l.name)
end
app.exit()
```

- [ ] **Step 2: Run it**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_01_create.lua"
```

Expected output:
```
Created C:\Users\umutm\Desktop\mad-game-tarzı-oyun\assets\title_bg.aseprite
Layer count: 9
  [1] sky
  [2] stars
  [3] buildings
  [4] fog
  [5] ground
  [6] river
  [7] hill
  [8] trees
  [9] house
```

- [ ] **Step 3: Verify file exists**

```bash
ls -la "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/assets/title_bg.aseprite"
```

Expected: file exists, size > 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/title_bg_01_create.lua assets/title_bg.aseprite
git commit -m "feat: title bg — create layered aseprite file (9 layers)"
```

---

## Task 2: Sky gradient + stars + buildings

**Files:**
- Create: `scripts/title_bg_02_sky.lua`
- Create: `scripts/title_bg_03_stars.lua`
- Create: `scripts/title_bg_04_buildings.lua`
- Modifies: `assets/title_bg.aseprite`

- [ ] **Step 1: Write sky script**

```lua
-- title_bg_02_sky.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

local img = celImg("sky")

local SKY = {
  {0.00, 27, 42, 74}, {0.18, 46, 63,110}, {0.42, 74, 32, 96},
  {0.62,107, 26, 58}, {0.80, 61, 26,  6}, {1.00, 42, 15,  4},
}

local function skyColor(yn)
  for i = 1, #SKY - 1 do
    local y0,r0,g0,b0 = SKY[i][1],   SKY[i][2],   SKY[i][3],   SKY[i][4]
    local y1,r1,g1,b1 = SKY[i+1][1], SKY[i+1][2], SKY[i+1][3], SKY[i+1][4]
    if yn <= y1 then
      local t = (yn - y0) / math.max(0.0001, y1 - y0)
      return Color{r=lerp(r0,r1,t), g=lerp(g0,g1,t), b=lerp(b0,b1,t), a=255}
    end
  end
  return Color{r=42, g=15, b=4, a=255}
end

for y = 0, H - 1 do
  local c = skyColor(y / (H - 1))
  for x = 0, W - 1 do img:drawPixel(x, y, c) end
end

print("Sky done")
spr:save()
app.exit()
```

- [ ] **Step 2: Run sky script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_02_sky.lua"
```

Expected: `Sky done`

- [ ] **Step 3: Write stars script**

```lua
-- title_bg_03_stars.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local img = celImg("stars")

local STARS = {
  {55,31},{188,50},{266,23},{109,69},{229,38},
  {304,19},{27,77},{157,11},{239,58},{314,35},
}
local SW  = Color{r=255, g=255, b=255, a=255}
local SW2 = Color{r=200, g=200, b=240, a=255}

for _, s in ipairs(STARS) do
  local sx, sy = s[1], s[2]
  if sx >= 0 and sx < W and sy >= 0 and sy < H then
    img:drawPixel(sx, sy, SW)
    if sx + 1 < W then img:drawPixel(sx+1, sy, SW2) end
    if sy + 1 < H then img:drawPixel(sx, sy+1, SW2) end
  end
end

print("Stars done: " .. #STARS .. " stars")
spr:save()
app.exit()
```

- [ ] **Step 4: Run stars script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_03_stars.lua"
```

Expected: `Stars done: 10 stars`

- [ ] **Step 5: Write buildings script**

```lua
-- title_bg_04_buildings.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local img, layer = celImg("buildings")
layer.opacity = 71  -- 28% of 255

-- {x_left, y_top, width, r, g, b}
local BLDGS = {
  {659, 299-140, 16, 192, 24, 95 }, {633, 299-210, 22, 155, 48, 255},
  {615, 299-100, 14, 192, 24, 95 }, {585, 299-260, 26, 155, 48, 255},
  {564, 299-160, 17, 192, 24, 95 }, {547, 299- 90, 12, 155, 48, 255},
  {518, 299-230, 24, 192, 24, 95 }, {498, 299-130, 15, 155, 48, 255},
  {474, 299-180, 19, 192, 24, 95 }, {456, 299-110, 13, 155, 48, 255},
  {430, 299-200, 21, 192, 24, 95 }, {415, 299- 75, 10, 155, 48, 255},
  {392, 299-150, 18, 192, 24, 95 }, {362, 299-240, 25, 155, 48, 255},
}

for _, b in ipairs(BLDGS) do
  local xl, yt, bw, br, bg, bb = b[1],b[2],b[3],b[4],b[5],b[6]
  local c = Color{r=br, g=bg, b=bb, a=255}
  for y = yt, GROUND_Y - 1 do
    for x = xl, xl + bw - 1 do
      if x >= 0 and x < W and y >= 0 and y < H then
        img:drawPixel(x, y, c)
      end
    end
  end
end

print("Buildings done: " .. #BLDGS .. " buildings, layer.opacity=" .. layer.opacity)
spr:save()
app.exit()
```

- [ ] **Step 6: Run buildings script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_04_buildings.lua"
```

Expected: `Buildings done: 14 buildings, layer.opacity=71`

- [ ] **Step 7: Commit**

```bash
git add scripts/title_bg_02_sky.lua scripts/title_bg_03_stars.lua scripts/title_bg_04_buildings.lua assets/title_bg.aseprite
git commit -m "feat: title bg — sky gradient, stars, city silhouette"
```

---

## Task 3: Fog, ground, river

**Files:**
- Create: `scripts/title_bg_05_fog_ground.lua`
- Create: `scripts/title_bg_06_river.lua`
- Modifies: `assets/title_bg.aseprite`

- [ ] **Step 1: Write fog + ground script**

```lua
-- title_bg_05_fog_ground.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

-- ── Fog (y=270-298, purple-ish, opacity increases toward ground) ──
local fogImg = celImg("fog")
for y = 270, GROUND_Y - 1 do
  local t = (y - 270) / math.max(1, GROUND_Y - 1 - 270)
  local a = math.floor(t * 140)  -- 0 at top, 140 (~55%) at bottom
  local c = Color{r=46, g=26, b=68, a=a}
  for x = 0, W - 1 do fogImg:drawPixel(x, y, c) end
end
print("Fog done")

-- ── Ground (y=299-383, solid dark) ───────────────────────────────
local gndImg = celImg("ground")
local GND = Color{r=26, g=8, b=4, a=255}
for y = GROUND_Y, H - 1 do
  for x = 0, W - 1 do gndImg:drawPixel(x, y, GND) end
end
print("Ground done")

spr:save()
app.exit()
```

- [ ] **Step 2: Run fog + ground script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_05_fog_ground.lua"
```

Expected:
```
Fog done
Ground done
```

- [ ] **Step 3: Write river script**

```lua
-- title_bg_06_river.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

local img = celImg("river")

local RIV_FILL = Color{r=28, g=65,  b=155, a=255}
local RIV_LINE = Color{r=90, g=160, b=255, a=255}
local RIV_SHIM = Color{r=160,g=210, b=255, a=255}

-- 4-segment cubic bezier, passes through (362,334) = left:53%, bottom:13%
local SEG = {
  { -14,323,  55,330, 109,346, 191,342 },
  { 191,342, 260,338, 300,338, 362,334 },
  { 362,334, 424,330, 478,326, 560,330 },
  { 560,330, 615,334, 656,330, 697,326 },
}

local function cubicBez(p0, p1, p2, p3, t)
  local u = 1 - t
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
end

for _, seg in ipairs(SEG) do
  local x0,y0,cx1,cy1,cx2,cy2,x1,y1 =
    seg[1],seg[2],seg[3],seg[4],seg[5],seg[6],seg[7],seg[8]
  for i = 0, 300 do
    local t  = i / 300
    local rx = math.floor(cubicBez(x0, cx1, cx2, x1, t))
    local ry = math.floor(cubicBez(y0, cy1, cy2, y1, t))
    -- 8px strip (dy = -2 to +5), feathered edges
    for dy = -2, 5 do
      local alpha = (dy == -2 or dy == 5) and 0.25 or
                    (dy == -1 or dy == 4) and 0.55 or 0.85
      local c = Color{
        r = lerp(26, RIV_FILL.red,   alpha),
        g = lerp(8,  RIV_FILL.green, alpha),
        b = lerp(4,  RIV_FILL.blue,  alpha),
        a = 255,
      }
      if rx >= 0 and rx < W and ry+dy >= 0 and ry+dy < H then
        img:drawPixel(rx, ry+dy, c)
      end
    end
    -- surface highlight line
    if rx >= 0 and rx < W and ry-1 >= 0 and ry-1 < H then
      img:drawPixel(rx, ry-1, RIV_LINE)
    end
  end
end

-- shimmer streaks
local SHIM = {
  {80,335,105,333}, {250,338,270,336},
  {380,330,400,329},{540,331,560,329},
}
for _, s in ipairs(SHIM) do
  local span = math.max(1, s[3] - s[1])
  for x = s[1], s[3] do
    local t = (x - s[1]) / span
    local sy = math.floor(s[2] + t * (s[4] - s[2]))
    if x >= 0 and x < W and sy >= 0 and sy < H then
      img:drawPixel(x, sy, RIV_SHIM)
    end
  end
end

print("River done")
spr:save()
app.exit()
```

- [ ] **Step 4: Run river script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_06_river.lua"
```

Expected: `River done`

- [ ] **Step 5: Commit**

```bash
git add scripts/title_bg_05_fog_ground.lua scripts/title_bg_06_river.lua assets/title_bg.aseprite
git commit -m "feat: title bg — fog, ground, winding river"
```

---

## Task 4: Hill + trees

**Files:**
- Create: `scripts/title_bg_07_hill_trees.lua`
- Modifies: `assets/title_bg.aseprite`

- [ ] **Step 1: Write hill + trees script**

```lua
-- title_bg_07_hill_trees.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

-- ── Foreground hill (asymmetric ellipse, bottom-left) ─────────────
local hillImg = celImg("hill")
local HILL     = Color{r=21, g=6, b=2, a=255}
local HILL_W   = 376
local HILL_H   = 92
local HILL_CX  = math.floor(HILL_W * 0.30)  -- 113

for y = H - HILL_H, H - 1 do
  local dy = y - H
  for x = 0, HILL_W do
    local dx = x - HILL_CX
    local rx = (dx < 0) and HILL_CX or (HILL_W - HILL_CX)
    if rx > 0 then
      local nx = dx / rx
      local ny = dy / HILL_H
      if nx*nx + ny*ny <= 1.02 then
        hillImg:drawPixel(x, y, HILL)
      end
    end
  end
end
print("Hill done")

-- ── Pine trees ────────────────────────────────────────────────────
local treesImg = celImg("trees")

local function drawTree(cx, scale, alpha)
  local r = lerp(0, 18, alpha)
  local g = lerp(0,  5, alpha)
  local c = Color{r=r, g=g, b=0, a=255}

  local layers = {
    { w=math.floor(13*scale), h=math.floor(9*scale)  },
    { w=math.floor(17*scale), h=math.floor(11*scale) },
    { w=math.floor(20*scale), h=math.floor(13*scale) },
  }
  local trunk_w = math.max(2, math.floor(3*scale))
  local trunk_h = math.max(3, math.floor(5*scale))

  -- Trunk
  local cur_y = GROUND_Y - trunk_h
  for y = cur_y, GROUND_Y - 1 do
    for x = cx - math.floor(trunk_w/2), cx + math.floor(trunk_w/2) do
      if x >= 0 and x < W and y >= 0 and y < H then treesImg:drawPixel(x,y,c) end
    end
  end

  -- 3 triangle layers, bottom to top
  for i = #layers, 1, -1 do
    local L = layers[i]
    local tri_bottom = cur_y
    local overlap = (i < #layers) and math.floor(layers[i+1].h * 0.35) or 0
    cur_y = cur_y - L.h + overlap
    for y = cur_y, tri_bottom do
      local t = (y - cur_y) / math.max(1, L.h - 1)
      local half_w = math.floor(L.w * t / 2)
      for x = cx - half_w, cx + half_w do
        if x >= 0 and x < W and y >= 0 and y < H then treesImg:drawPixel(x,y,c) end
      end
    end
  end
end

-- 4 trees: (canvas_x, scale, alpha)
drawTree(math.floor(683*0.18),  1.00, 0.45)
drawTree(math.floor(683*0.225), 0.78, 0.35)
drawTree(math.floor(683*0.145), 0.60, 0.28)
drawTree(math.floor(683*0.26),  0.50, 0.22)
print("Trees done")

spr:save()
app.exit()
```

- [ ] **Step 2: Run script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_07_hill_trees.lua"
```

Expected:
```
Hill done
Trees done
```

- [ ] **Step 3: Commit**

```bash
git add scripts/title_bg_07_hill_trees.lua assets/title_bg.aseprite
git commit -m "feat: title bg — foreground hill, pine trees"
```

---

## Task 5: House / garage

**Files:**
- Create: `scripts/title_bg_08_house.lua`
- Modifies: `assets/title_bg.aseprite`

- [ ] **Step 1: Write house script**

```lua
-- title_bg_08_house.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384
local GROUND_Y = 299
local spr = app.open(ASEPRITE_PATH)

local function celImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local img = celImg("house")

local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end
local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end

-- ── Colors ───────────────────────────────────────────────────────
local BODY   = Color{r=46, g=17, b=6,  a=255}  -- house siding
local ROOF   = Color{r=30, g=8,  b=3,  a=255}  -- roof fill
local ROOF_D = Color{r=20, g=5,  b=1,  a=255}  -- roof dark edge / eave
local DOOR_C = Color{r=32, g=10, b=2,  a=255}  -- door / siding gap
local DOOR_B = Color{r=37, g=16, b=5,  a=255}  -- door panel highlight
local WIN_C  = Color{r=90, g=55, b=20, a=255}  -- window (pre-blended warm tint)
local FRAME  = Color{r=58, g=18, b=8,  a=255}  -- window/door frame
local FNDN   = Color{r=26, g=8,  b=4,  a=255}  -- foundation strip
local BRICK1 = Color{r=42, g=16, b=8,  a=255}  -- chimney brick base
local BRICK2 = Color{r=46, g=18, b=9,  a=255}  -- chimney brick highlight

-- ── Coordinates ──────────────────────────────────────────────────
local HX, HY, HW, HH = 34, 239, 90, 60   -- body: left, top, W, H
local RX, RY, RW     = 28, 206, 102       -- roof: left, top, width (H=33)

-- ── Gabled roof (triangle fill) ───────────────────────────────────
for y = RY, HY - 1 do
  local t  = (y - RY) / math.max(1, HY - 1 - RY)
  local hw = math.floor(RW * 0.5 * (1 - t))
  local cx = RX + math.floor(RW / 2)
  local c  = (y == HY - 1) and ROOF_D or ROOF
  for x = cx - hw, cx + hw do px(x, y, c) end
end
-- Eave shadow
rect(RX, HY-2, RX+RW-1, HY-1, ROOF_D)

-- ── House body ────────────────────────────────────────────────────
rect(HX, HY, HX+HW-1, GROUND_Y-1, BODY)
-- Horizontal siding planks (7 lines)
for i = 1, 7 do
  local sy = HY + math.floor(i * HH / 8)
  for x = HX, HX+HW-1 do px(x, sy, DOOR_C) end
end
-- Foundation strip
rect(HX, GROUND_Y-3, HX+HW-1, GROUND_Y-1, FNDN)

-- ── Side door (left of body) ──────────────────────────────────────
local DX, DY, DW, DH = HX+5, HY+14, 14, 25
rect(DX, DY, DX+DW-1, DY+DH-1, DOOR_C)
-- Frame: top, left, right sides
for x = DX, DX+DW-1 do px(x, DY, FRAME) end
for y = DY, DY+DH-1 do px(DX, y, FRAME) px(DX+DW-1, y, FRAME) end
-- Two door panels
rect(DX+2, DY+2,  DX+DW-3, DY+10, DOOR_B)
rect(DX+2, DY+13, DX+DW-3, DY+22, DOOR_B)
-- Door knob
px(DX+DW-3, DY+14, Color{r=120, g=60, b=30, a=255})

-- ── Window above side door ────────────────────────────────────────
local WX, WY, WW, WH = HX+7, HY+5, 10, 7
rect(WX, WY, WX+WW-1, WY+WH-1, WIN_C)
-- Frame: all 4 sides
for x = WX, WX+WW-1 do px(x, WY, FRAME) px(x, WY+WH-1, FRAME) end
for y = WY, WY+WH-1 do px(WX, y, FRAME) px(WX+WW-1, y, FRAME) end
-- Cross: horizontal at WY+3
for x = WX, WX+WW-1 do px(x, WY+3, FRAME) end
-- Cross: vertical at WX+5
for y = WY, WY+2 do px(WX+5, y, FRAME) end
for y = WY+4, WY+5 do px(WX+5, y, FRAME) end

-- ── Garage door ───────────────────────────────────────────────────
local GDX, GDW, GDH = HX+26, 38, 38
local GDY = GROUND_Y - GDH  -- = 261
rect(GDX, GDY, GDX+GDW-1, GROUND_Y-1, DOOR_C)
-- 5 horizontal panels
for panel = 0, 4 do
  local panel_y = GDY + math.floor(panel * GDH / 5)
  for x = GDX, GDX+GDW-1 do px(x, panel_y, FRAME) end
  -- 3 vertical dividers per panel
  for col = 1, 3 do
    local gx = GDX + math.floor(col * GDW / 4)
    px(gx, panel_y+1, DOOR_B)
    px(gx, panel_y+2, DOOR_B)
  end
end
-- Garage door border: left, right, top
for y = GDY, GROUND_Y-1 do px(GDX, y, FRAME) px(GDX+GDW-1, y, FRAME) end
for x = GDX, GDX+GDW-1 do px(x, GDY, FRAME) end
-- Handle (3 pixels near bottom-center)
px(GDX+17, GROUND_Y-4, Color{r=90, g=40, b=20, a=255})
px(GDX+18, GROUND_Y-4, Color{r=90, g=40, b=20, a=255})
px(GDX+19, GROUND_Y-4, Color{r=90, g=40, b=20, a=255})

-- ── Outdoor lamp (above garage door left edge) ────────────────────
rect(GDX, GDY-5, GDX+2, GDY-1, ROOF)
rect(GDX-1, GDY-1, GDX+3, GDY-1, ROOF)
px(GDX+1, GDY-2, WIN_C)

-- ── Chimney ───────────────────────────────────────────────────────
-- CX=97, CY=RY+5=211, CW=9, CH=16
local CX, CY, CW, CH = 97, RY+5, 9, 16
rect(CX, CY, CX+CW-1, RY+CH, BRICK1)
-- Brick row lines + alternating mortar highlights
for row = 0, 3 do
  local by = CY + math.floor(row * CH / 4)
  for x = CX, CX+CW-1 do px(x, by, ROOF_D) end
  if row % 2 == 0 then
    px(CX + math.floor(CW/2), by+1, BRICK2)
    px(CX + math.floor(CW/2), by+2, BRICK2)
  else
    px(CX+2, by+1, BRICK2)
  end
end
-- Cap (wider than shaft)
rect(CX-2, CY, CX+CW+1, CY+2, ROOF_D)
-- Smoke wisps (3 pixels, pre-blended with sky color at that height)
px(CX+2, CY-2, Color{r=104, g=50, b=82, a=255})
px(CX+4, CY-3, Color{r=97,  g=38, b=77, a=255})
px(CX+3, CY-4, Color{r=93,  g=33, b=75, a=255})

-- ── Attic window (in gable, center of roof) ───────────────────────
local AWX = RX + math.floor(RW/2) - 7  -- = 44
local AWY = HY - 10                    -- = 229
rect(AWX, AWY, AWX+13, AWY+7, WIN_C)
-- Frame: all 4 sides
for x = AWX, AWX+13 do px(x, AWY, FRAME) px(x, AWY+7, FRAME) end
for y = AWY, AWY+7  do px(AWX, y, FRAME) px(AWX+13, y, FRAME) end
-- Cross: horizontal at AWY+3
for x = AWX, AWX+13 do px(x, AWY+3, FRAME) end
-- Cross: vertical at AWX+6
for y = AWY, AWY+2   do px(AWX+6, y, FRAME) end
for y = AWY+4, AWY+5 do px(AWX+6, y, FRAME) end

print("House done")
spr:save()
app.exit()
```

- [ ] **Step 2: Run house script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_08_house.lua"
```

Expected: `House done`

- [ ] **Step 3: Commit**

```bash
git add scripts/title_bg_08_house.lua assets/title_bg.aseprite
git commit -m "feat: title bg — pixel art house/garage with chimney and windows"
```

---

## Task 6: Export PNG + wire into StartScreen.tsx

**Files:**
- Create: `scripts/title_bg_09_export.lua`
- Generates: `assets/title_bg.png`, `src/assets/icons/title_bg.png`
- Modify: `src/components/StartScreen.tsx`

- [ ] **Step 1: Write export script**

```lua
-- title_bg_09_export.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.aseprite"
local PNG_PATH      = "C:\\Users\\umutm\\Desktop\\mad-game-tarz\u0131-oyun\\assets\\title_bg.png"

local spr = app.open(ASEPRITE_PATH)
spr:saveCopyAs(PNG_PATH)
print("Exported: " .. PNG_PATH)
app.exit()
```

- [ ] **Step 2: Run export script**

```bash
"C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/scripts/title_bg_09_export.lua"
```

Expected: `Exported: C:\Users\umutm\Desktop\mad-game-tarzı-oyun\assets\title_bg.png`

- [ ] **Step 3: Verify PNG exists and is non-trivial size**

```bash
ls -la "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/assets/title_bg.png"
```

Expected: file > 20 KB.

- [ ] **Step 4: Copy PNG to src/assets/icons/**

```bash
cp "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/assets/title_bg.png" "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/src/assets/icons/title_bg.png"
```

- [ ] **Step 5: Run existing smoke tests to establish baseline**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/StartScreen.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 6: Rewrite StartScreen.tsx**

Replace the entire file content with:

```tsx
import { useEffect, useState } from 'react'
import { useSaveStore } from '@/store/saveStore'
import logoSrc        from '@/assets/icons/logo_magenta_reach.png'
import bgSrc          from '@/assets/icons/title_bg.png'
import benchFigureSrc from '@/assets/icons/bench_figure.png'
import bridgeSrc      from '@/assets/icons/bridge.png'

// ── Animated overlay data ────────────────────────────────────────
// Star positions match title_bg_03_stars.lua STARS array (canvas→% of display)
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

// ── Component ────────────────────────────────────────────────────
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

      {/* Background: Aseprite pixel art PNG (683×384, 2× scale) */}
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

      {/* Animated star twinkle — positions match stars layer */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', top: s.top, left: s.left,
          width: 2, height: 2, borderRadius: '50%',
          background: '#ffffff',
          animation: `twinkle ${s.dur} ease-in-out ${s.delay} infinite`,
        }} />
      ))}

      {/* Garage attic window glow — positioned over house in background PNG */}
      {/* House at left:5%, bottom:22%. Attic window AWX=44px on 683 canvas ≈ 6.4% */}
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

      {/* Bench figure — centered at user-measured left:23%, bottom:32% */}
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

      {/* Bridge — centered at user-measured left:48%, river at bottom:13% */}
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
        <div key={i} style={{
          position: 'absolute', top: 0,
          left: r.left, width: 1, height: r.height,
          background: 'linear-gradient(transparent, rgba(160,196,255,0.6))',
          animation: r.animation,
        }} />
      ))}

      {/* Logo + menu */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}>
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
            style={{ padding: '4px 24px', border: 'none', color: '#666688', background: 'transparent', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9999aa' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#666688' }}
          >EXIT</button>
        </div>
      </div>

      {/* Slot picker */}
      {overlay !== 'none' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,2,15,0.75)', backdropFilter: 'blur(4px)' }}
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
            <button onClick={() => setOverlay('none')}
              style={{ color: '#444455', fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
              BACK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MenuButton ───────────────────────────────────────────────────
function MenuButton({ children, onClick, color, disabled = false }: {
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

- [ ] **Step 7: Run smoke tests**

```bash
cd "C:/Users/umutm/Desktop/mad-game-tarzı-oyun" && npx vitest run tests/StartScreen.test.tsx
```

Expected: 4 tests pass (logo alt "Magenta Reach", NEW GAME, EXIT, CONTINUE disabled).

- [ ] **Step 8: Commit**

```bash
git add scripts/title_bg_09_export.lua assets/title_bg.png src/assets/icons/title_bg.png src/components/StartScreen.tsx
git commit -m "feat: title screen — wire Aseprite background PNG into StartScreen"
```

---

## Self-review

**Spec coverage:**
- ✅ 683×384 canvas → Task 1
- ✅ 9 named layers → Task 1
- ✅ Sky gradient (6 stops) → Task 2
- ✅ Stars (10 positions matching CSS) → Task 2
- ✅ Buildings (14, layer opacity 28%) → Task 2
- ✅ Fog band (y=270-298, alpha gradient) → Task 3
- ✅ Ground (y=299-383, solid) → Task 3
- ✅ River (bezier through 362,334) → Task 3
- ✅ Hill (asymmetric ellipse) → Task 4
- ✅ Trees (4 silhouettes) → Task 4
- ✅ House: roof, chimney, side door, window, garage door, lamp, attic window → Task 5
- ✅ Export PNG → Task 6
- ✅ Copy to src/assets/icons/ → Task 6
- ✅ StartScreen.tsx: bgSrc import + `<img>` background → Task 6
- ✅ Rain, star twinkle, glow overlays → Task 6
- ✅ bench_figure at left:23% bottom:32% → Task 6
- ✅ bridge at left:48% bottom:13% → Task 6
- ✅ 4 smoke tests pass → Task 6

**Placeholder scan:** No TBDs. All Lua code blocks complete.

**Type consistency:** `handleNewGame`/`handleContinue` typed as `(slotId: 1 | 2 | 3)`. `MenuButton` props unchanged from working version.
