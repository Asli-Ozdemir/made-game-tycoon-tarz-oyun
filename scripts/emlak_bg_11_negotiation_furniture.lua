-- emlak_bg_11_negotiation_furniture.lua
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

-- Long table y=65-79 x=90-350, two chair backs above on left+right.
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
