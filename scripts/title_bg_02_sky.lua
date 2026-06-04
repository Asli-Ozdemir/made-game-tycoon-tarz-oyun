-- title_bg_02_sky.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.aseprite"
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
spr:saveAs(ASEPRITE_PATH)
app.exit()
