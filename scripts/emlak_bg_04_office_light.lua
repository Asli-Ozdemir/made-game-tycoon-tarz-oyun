-- emlak_bg_04_office_light.lua
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

local img = celImgFrame("light", 1)
local CX, CY = 210, 62   -- glow center

-- Lamp post: 1px wide vertical from y=44 to y=62
rect(img, CX, 44, CX, 62, Color{r=90, g=45, b=0, a=255})

-- Lamp head (horizontal): x=200-220, y=40-45
rect(img, 200, 40, 220, 45, Color{r=90, g=45, b=0, a=255})

-- Radial amber glow: fades from center outward
for y = 0, H-1 do
  for x = 80, W-1 do
    local dx = x - CX
    local dy = y - CY
    local dist = math.sqrt(dx*dx + dy*dy)
    local radius = 90
    if dist < radius then
      local t = 1 - dist / radius
      local a = math.floor(t * t * 180)
      if a > 10 then
        img:drawPixel(x, y, Color{r=245, g=158, b=11, a=a})  -- #f59e0b
      end
    end
  end
end
print("office light done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
