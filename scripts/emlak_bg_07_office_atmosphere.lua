-- emlak_bg_07_office_atmosphere.lua
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
