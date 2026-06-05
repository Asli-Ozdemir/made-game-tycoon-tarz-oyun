-- emlak_bg_03_office_arch.lua
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

local img = celImgFrame("arch", 1)
local WALL  = Color{r=42, g=18, b=0, a=255}    -- #2a1200
local SHELF = Color{r=61, g=26, b=0, a=255}    -- #3d1a00

-- Shelf back wall
rect(img, 0, 0, 62, H-1, WALL)

-- Vertical shelf edge (right border of bookcase)
rect(img, 62, 0, 65, H-1, Color{r=32, g=14, b=0, a=255})

-- 3 horizontal shelf dividers
rect(img, 0, 25, 62, 26, SHELF)
rect(img, 0, 50, 62, 51, SHELF)
rect(img, 0, 75, 62, 76, SHELF)

print("office arch done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
