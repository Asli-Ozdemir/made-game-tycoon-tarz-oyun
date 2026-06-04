-- title_bg_06_river.lua
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

local img = celImg("river")

local RIV_FILL = Color{r=28, g=65,  b=155, a=255}
local RIV_LINE = Color{r=90, g=160, b=255, a=255}
local RIV_SHIM = Color{r=160,g=210, b=255, a=255}

-- 4-segment cubic bezier, passes through (362,334) = left:53%, bottom:13%
local SEG = {
  { -14,323,  55,330, 109,346, 191,342 },
  { 191,342, 260,338, 300,338, 362,334 },
  { 362,334, 424,330, 478,326, 560,330 },
  { 560,330, 615,334, 656,330, 697,326 },
}

local function cubicBez(p0, p1, p2, p3, t)
  local u = 1 - t
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
end

for _, seg in ipairs(SEG) do
  local x0,y0,cx1,cy1,cx2,cy2,x1,y1 =
    seg[1],seg[2],seg[3],seg[4],seg[5],seg[6],seg[7],seg[8]
  for i = 0, 300 do
    local t  = i / 300
    local rx = math.floor(cubicBez(x0, cx1, cx2, x1, t))
    local ry = math.floor(cubicBez(y0, cy1, cy2, y1, t))
    -- 8px strip (dy = -2 to +5), feathered edges
    for dy = -2, 5 do
      local alpha = (dy == -2 or dy == 5) and 0.25 or
                    (dy == -1 or dy == 4) and 0.55 or 0.85
      local c = Color{
        r = lerp(26, RIV_FILL.red,   alpha),
        g = lerp(8,  RIV_FILL.green, alpha),
        b = lerp(4,  RIV_FILL.blue,  alpha),
        a = 255,
      }
      if rx >= 0 and rx < W and ry+dy >= 0 and ry+dy < H then
        img:drawPixel(rx, ry+dy, c)
      end
    end
    -- surface highlight line
    if rx >= 0 and rx < W and ry-1 >= 0 and ry-1 < H then
      img:drawPixel(rx, ry-1, RIV_LINE)
    end
  end
end

-- shimmer streaks
local SHIM = {
  {80,335,105,333}, {250,338,270,336},
  {380,330,400,329},{540,331,560,329},
}
for _, s in ipairs(SHIM) do
  local span = math.max(1, s[3] - s[1])
  for x = s[1], s[3] do
    local t = (x - s[1]) / span
    local sy = math.floor(s[2] + t * (s[4] - s[2]))
    if x >= 0 and x < W and sy >= 0 and sy < H then
      img:drawPixel(x, sy, RIV_SHIM)
    end
  end
end

print("River done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
