-- title_bg_04_buildings.lua
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
spr:saveAs(ASEPRITE_PATH)
app.exit()
