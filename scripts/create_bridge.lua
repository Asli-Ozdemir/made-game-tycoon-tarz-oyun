-- 3-arch bridge — 96x28 px, NO solid base (arches open to bottom edge)
-- River flows THROUGH the transparent arch openings

local OUTPUT = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\bridge.png"

local W, H = 96, 28
local spr  = Sprite(W, H, ColorMode.RGB)
local img  = spr.cels[1].image

local T   = Color{r=0,  g=0,  b=0,  a=0  }
local STN = Color{r=22, g=8,  b=3,  a=255}
local ST2 = Color{r=30, g=11, b=4,  a=255}
local SHD = Color{r=10, g=3,  b=1,  a=255}

for y = 0, H-1 do for x = 0, W-1 do img:drawPixel(x, y, T) end end

local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end
local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end

-- ── ROAD DECK (y 0-9) ───────────────────────────────────
rect(0, 3, 95, 9, STN)
-- Parapet / railing
rect(0, 0, 95, 2, STN)
-- Crenellations (battlements) — gaps in railing
for i = 0, 11 do
  local bx = i * 8 + 2
  rect(bx, 0, bx + 3, 2, T)
end
-- Road surface texture (alternating lighter strips)
for x = 0, 95 do
  if math.floor(x / 6) % 2 == 0 then px(x, 5, ST2) end
end
-- Deck underside shadow
rect(0, 10, 95, 11, SHD)

-- ── PILLAR FILL (y 12 to bottom, solid stone) ────────────
rect(0,  12, 5,  27, STN)   -- left wall
rect(90, 12, 95, 27, STN)   -- right wall
rect(29, 12, 35, 27, STN)   -- center pillar 1
rect(60, 12, 66, 27, STN)   -- center pillar 2

-- Pillar stone-row texture
for _, cx in ipairs({0, 29, 60, 90}) do
  for y = 14, 26, 4 do
    for dx = 0, 4 do px(cx + dx, y, ST2) end
  end
end

-- ── ARCH OPENINGS (transparent, open to bottom edge) ─────
-- Fill arch areas with transparent, then round the top

-- Arch 1: x=6-28
rect(6, 16, 28, 27, T)
-- Arch 1 rounded top (semicircle cut)
local cx1 = 17
for y = 12, 16 do
  for x = 6, 28 do
    local dx = x - cx1
    local dy = y - 16
    if dx*dx + dy*dy <= 12*12 then px(x, y, T) end
  end
end

-- Arch 2: x=36-59
rect(36, 16, 59, 27, T)
local cx2 = 47
for y = 12, 16 do
  for x = 36, 59 do
    local dx = x - cx2
    local dy = y - 16
    if dx*dx + dy*dy <= 12*12 then px(x, y, T) end
  end
end

-- Arch 3: x=67-89
rect(67, 16, 89, 27, T)
local cx3 = 78
for y = 12, 16 do
  for x = 67, 89 do
    local dx = x - cx3
    local dy = y - 16
    if dx*dx + dy*dy <= 12*12 then px(x, y, T) end
  end
end

-- ── SAVE ────────────────────────────────────────────────
spr:saveCopyAs(OUTPUT)
print("bridge saved → " .. OUTPUT)
app.exit()
