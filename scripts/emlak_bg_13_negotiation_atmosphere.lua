-- emlak_bg_13_negotiation_atmosphere.lua
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

-- Left-edge cold light seeping in: x=0-5, fading right.
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
