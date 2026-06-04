-- title_bg_03_stars.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.aseprite"
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
spr:saveAs(ASEPRITE_PATH)
app.exit()
