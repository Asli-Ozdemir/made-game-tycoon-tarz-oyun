-- title_screen_create.lua
-- Creates 320x180 pixel art title screen for Magenta Reach
-- Layers: bg, left, river, right, ui, logo

local I = string.char(0xC4, 0xB1)  -- ı  (U+0131, UTF-8: C4 B1)
local BASE      = "C:\\Users\\umutm\\Desktop\\mad-game-tarz" .. I .. "-oyun\\"
local OUT_PATH  = BASE .. "assets\\title_screen.aseprite"
local LOGO_PATH = BASE .. "assets\\logo_magenta_reach.aseprite"
local W, H = 320, 180

-- ─── Create sprite ────────────────────────────────────────────────
local spr = Sprite(W, H, ColorMode.RGB)
spr.layers[1].name = "bg"

for _, name in ipairs({"left","river","right","ui","logo"}) do
  spr:newLayer().name = name
end

-- ─── Helpers ─────────────────────────────────────────────────────
local function getCelImg(layerName)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local c = l:cel(1)
      if not c then c = spr:newCel(l, spr.frames[1]) end
      return c.image
    end
  end
  error("layer not found: " .. layerName)
end

local function px(img, x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end

local function rect(img, x1, y1, x2, y2, c)
  for y = y1, y2 do
    for x = x1, x2 do px(img, x, y, c) end
  end
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

-- ─── BG: Sky gradient + stars ────────────────────────────────────
local bgImg = getCelImg("bg")

-- Sky: top 54px, horizontal gradient #1a1208 → #050510
for y = 0, 53 do
  for x = 0, W - 1 do
    local t = x / (W - 1)
    bgImg:drawPixel(x, y, Color{
      r = lerp(0x1a, 0x05, t),
      g = lerp(0x12, 0x05, t),
      b = lerp(0x08, 0x10, t),
      a = 255,
    })
  end
end

-- Ground fill
rect(bgImg, 0,   54, 99,    H-1, Color{r=0x1a, g=0x12, b=0x08, a=255})
rect(bgImg, 100, 54, 219,   H-1, Color{r=0x05, g=0x05, b=0x10, a=255})
rect(bgImg, 220, 54, W-1,   H-1, Color{r=0x05, g=0x05, b=0x10, a=255})

-- Stars (top 54px)
local STARS = {
  {20,8},{85,15},{140,5},{195,22},{260,12},
  {305,28},{55,35},{120,42},{230,18},{280,40},
}
for _, s in ipairs(STARS) do
  px(bgImg, s[1], s[2], Color{r=255, g=255, b=255, a=255})
  px(bgImg, s[1]+1, s[2], Color{r=200, g=200, b=240, a=180})
end
print("BG layer done")

-- ─── LEFT: House + trees + bench + figure ────────────────────────
local leftImg = getCelImg("left")
local TREE_C  = Color{r=0x1B, g=0x3A, b=0x1B, a=255}
local WALL_C  = Color{r=0x5C, g=0x33, b=0x17, a=255}
local ROOF_C  = Color{r=0xD4, g=0x70, b=0x2A, a=255}
local WIN_C   = Color{r=0xFF, g=0xD0, b=0x60, a=220}
local DOOR_C  = Color{r=0x40, g=0x20, b=0x0A, a=255}
local BENCH_C = Color{r=0x8B, g=0x69, b=0x14, a=255}
local MAN_C   = Color{r=0x11, g=0x11, b=0x11, a=255}
local BANK_L  = Color{r=0x25, g=0x15, b=0x08, a=255}

-- Trees (3 pine silhouettes)
local function drawTree(img, cx, top, bot)
  -- trunk
  rect(img, cx, bot-12, cx+1, bot-1, TREE_C)
  -- crown (triangle)
  for y = top, bot-11 do
    local hw = math.floor((y - top) / (bot-11-top+1) * 7)
    for x = cx-hw, cx+hw+1 do px(img, x, y, TREE_C) end
  end
end
drawTree(leftImg,  8, 56, 115)
drawTree(leftImg, 22, 62, 110)
drawTree(leftImg, 70, 59, 118)

-- House body x=32..79, y=80..135
rect(leftImg, 32, 80, 79, 135, WALL_C)
-- Roof (triangle): cx=55, peak at y=60
for y = 60, 80 do
  local hw = math.floor((y - 60) / 20.0 * 26)
  for x = 55-hw, 55+hw do px(leftImg, x, y, ROOF_C) end
end
-- Windows
rect(leftImg, 36, 95, 43, 106, WIN_C)
rect(leftImg, 67, 95, 74, 106, WIN_C)
rect(leftImg, 36, 82, 43, 91,  WIN_C)
rect(leftImg, 67, 82, 74, 91,  WIN_C)
-- Door
rect(leftImg, 50, 118, 61, 135, DOOR_C)
-- Horizontal siding lines
for i = 1, 4 do
  local sy = 80 + math.floor(i * 55 / 5)
  for x = 32, 79 do px(leftImg, x, sy, Color{r=0x4A,g=0x28,b=0x10,a=255}) end
end

-- Bench: seat + legs
rect(leftImg, 28, 140, 58, 143, BENCH_C)
rect(leftImg, 29, 143, 30, 147, BENCH_C)
rect(leftImg, 56, 143, 57, 147, BENCH_C)

-- Man silhouette (sitting, legs dangling)
rect(leftImg, 37, 129, 43, 140, MAN_C)  -- body
rect(leftImg, 38, 125, 43, 129, MAN_C)  -- head
-- feet dangling below bench
rect(leftImg, 37, 143, 39, 150, MAN_C)
rect(leftImg, 41, 143, 43, 148, MAN_C)

-- Ground strip
rect(leftImg, 0, 149, 99, 152, BANK_L)
print("Left layer done")

-- ─── RIVER: Vertical river strip + bridge ────────────────────────
local riverImg = getCelImg("river")
local RIV_BG   = Color{r=0x0D, g=0x2E, b=0x4A, a=255}
local RIV_LINE = Color{r=0x1E, g=0x6B, b=0x9E, a=255}
local RIV_SHIM = Color{r=0x4A, g=0x9E, b=0xCE, a=255}
local BRIDGE_C = Color{r=0x6B, g=0x44, b=0x23, a=255}
local BANK_R   = Color{r=0x14, g=0x0C, b=0x04, a=255}

-- River fill (lower 3/4)
rect(riverImg, 100, 108, 219, H-1, RIV_BG)

-- Water wave lines (dashed)
for _, wy in ipairs({118, 131, 143}) do
  for x = 105, 214 do
    if (x + wy) % 6 < 4 then px(riverImg, x, wy, RIV_LINE) end
  end
end

-- Shimmer highlights
for x = 128, 158 do px(riverImg, x, 125, RIV_SHIM) end
for x = 168, 200 do px(riverImg, x, 137, RIV_SHIM) end

-- Bridge deck (x=138..182, y=108..112) — 4-5px wide
rect(riverImg, 136, 109, 182, 113, BRIDGE_C)
-- Railing (top)
for x = 135, 183 do px(riverImg, x, 107, BRIDGE_C) end
-- Vertical posts
for _, bx in ipairs({137, 148, 159, 170, 181}) do
  rect(riverImg, bx, 107, bx+1, 115, BRIDGE_C)
end

-- Riverbanks
rect(riverImg, 100, 100, 110, H-1, BANK_R)
rect(riverImg, 209, 100, 219, H-1, BANK_R)

-- Ground
rect(riverImg, 100, 149, 219, 152, Color{r=0x08,g=0x08,b=0x18,a=255})
print("River layer done")

-- ─── RIGHT: City silhouette + neon ───────────────────────────────
local rightImg = getCelImg("right")
local BLDG_C   = Color{r=0x0F, g=0x0F, b=0x2A, a=255}
local WIN_Y    = Color{r=0xFF, g=0xD7, b=0x00, a=255}
local WIN_W    = Color{r=0xFF, g=0xFF, b=0xFF, a=255}
local NEON_C   = Color{r=0xFF, g=0x2D, b=0x9B, a=255}

-- {x_left, height, width}  (y from bottom-28)
local BLDGS = {
  {222, 75,  16}, {240, 55,  13}, {255, 105, 20},
  {277, 62,  15}, {294, 50,  12}, {308, 70,  12},
}
for _, b in ipairs(BLDGS) do
  local bx, bh, bw = b[1], b[2], b[3]
  rect(rightImg, bx, H-28-bh, bx+bw-1, H-28, BLDG_C)
end

-- Windows scattered across buildings
local WIN_POS = {
  {225,100},{228,109},{232,95},{227,117},
  {243,85}, {246,94}, {243,102},
  {259,67}, {263,76}, {258,85}, {264,93}, {269,72},
  {280,88}, {283,80}, {281,97},
  {296,75}, {299,82}, {296,89},
  {311,85}, {314,78}, {311,93},
}
for i, wp in ipairs(WIN_POS) do
  local c = (i % 3 == 0) and WIN_W or WIN_Y
  px(rightImg, wp[1], wp[2], c)
  px(rightImg, wp[1]+1, wp[2], c)
end

-- Neon strip on tallest building (x=255..274, left and right edges)
for y = H-28-105, H-28-80 do
  px(rightImg, 255, y, NEON_C)
  px(rightImg, 274, y, NEON_C)
end
for x = 255, 274 do
  px(rightImg, x, H-28-105, NEON_C)  -- top horizontal bar
  px(rightImg, x, H-28-80,  NEON_C)  -- bottom horizontal bar
end

-- Ground
rect(rightImg, 220, 149, W-1, 152, Color{r=0x08,g=0x08,b=0x20,a=255})
print("Right layer done")

-- ─── UI: PRESS ANY KEY text (3×5 pixel font) ─────────────────────
local uiImg = getCelImg("ui")
local TEXT_C = Color{r=0xFF, g=0xFF, b=0xFF, a=255}

-- Minimal 3×5 bitmaps for each needed character
-- Each char: 3 columns, 5 rows, bit 0 = leftmost pixel
local FONT = {
  P = {7,5,7,4,4},  -- 111 101 111 100 100
  R = {7,5,7,5,5},  -- 111 101 111 101 101
  E = {7,4,7,4,7},  -- 111 100 111 100 111
  S = {7,4,7,1,7},  -- 111 100 111 001 111
  A = {7,5,7,5,5},  -- 111 101 111 101 101 (same as R visual)
  N = {5,7,5,5,5},  -- 101 111 101 101 101
  Y = {5,5,2,2,2},  -- 101 101 010 010 010
  K = {5,6,4,6,5},  -- 101 110 100 110 101
  [" "] = {0,0,0,0,0},
}
-- Override A to look different from R
FONT.A = {2,5,7,5,5}  -- 010 101 111 101 101

local msg = "PRESS ANY KEY"
local CW, CH, GAP = 3, 5, 1
local total_w = #msg * (CW + GAP) - GAP
local sx = math.floor((W - total_w) / 2)
local sy = 163

for ci = 1, #msg do
  local ch = msg:sub(ci, ci)
  local bitmap = FONT[ch]
  if bitmap then
    local ox = sx + (ci-1) * (CW + GAP)
    for row = 1, CH do
      local bits = bitmap[row] or 0
      for col = 0, CW-1 do
        if (bits >> (CW-1-col)) & 1 == 1 then
          px(uiImg, ox+col, sy+row-1, TEXT_C)
        end
      end
    end
  end
end
print("UI layer done")

-- ─── LOGO layer: load logo sprite and blit at (128, 12) ──────────
-- Try to load logo and copy first frame, first layer pixels
local ok, err = pcall(function()
  local logoSpr = app.open(LOGO_PATH)
  if logoSpr and #logoSpr.layers > 0 then
    local lc = logoSpr.layers[1]:cel(1)
    if lc then
      local logoImg = getCelImg("logo")
      local lx, ly = 128, 12
      for sy2 = 0, lc.image.height - 1 do
        for sx2 = 0, lc.image.width - 1 do
          local c = lc.image:getPixel(sx2, sy2)
          -- only copy non-transparent pixels
          local a = (c >> 24) & 0xFF
          if a > 0 then
            px(logoImg, lx + sx2, ly + sy2, Color(c))
          end
        end
      end
      print("Logo blit done (" .. lc.image.width .. "x" .. lc.image.height .. ")")
    end
    logoSpr:close()
  end
end)
if not ok then
  print("Logo blit skipped: " .. tostring(err))
  -- Draw a simple magenta "MR" placeholder
  local logoImg = getCelImg("logo")
  local PH = Color{r=0xFF, g=0x2D, b=0x9B, a=255}
  rect(logoImg, 128, 12, 191, 29, Color{r=0x10, g=0x05, b=0x15, a=255})
  -- "MR" text blocks
  for x = 130, 158 do px(logoImg, x, 14, PH) end
  for x = 130, 158 do px(logoImg, x, 27, PH) end
  for y = 14, 27 do px(logoImg, 130, y, PH) end
  for y = 14, 27 do px(logoImg, 158, y, PH) end
  px(logoImg, 140, 20, PH)
end

-- ─── Save ────────────────────────────────────────────────────────
spr:saveAs(OUT_PATH)
print("Saved: " .. OUT_PATH)
app.exit()
