-- emlak_bg_09_negotiation_arch.lua
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

-- Glass partition: x=375-438, y=0-62. Dark glass panel with thin frame.
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
