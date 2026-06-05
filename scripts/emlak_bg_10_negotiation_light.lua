-- emlak_bg_10_negotiation_light.lua
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

-- Fluorescent strip: y=0-4 across x=70-370. Glow fades downward.
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
