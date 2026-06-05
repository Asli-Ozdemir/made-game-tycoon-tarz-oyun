-- emlak_bg_12_negotiation_detail.lua
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

-- Water glass (center, on table surface) + document folder (left of glass).
local img = celImgFrame("detail", 2)
local GLASS_RIM  = Color{r=147, g=197, b=253, a=255}  -- #93c5fd
local FOLDER     = Color{r=55,  g=65,  b=81,  a=255}  -- #374151
local FOLDER_TAB = Color{r=75,  g=85,  b=99,  a=255}

-- Water glass: thin rectangle outline at x=217-220, y=58-65
for y = 58, 65 do
  img:drawPixel(217, y, GLASS_RIM)
  img:drawPixel(220, y, GLASS_RIM)
end
rect(img, 217, 58, 220, 59, GLASS_RIM)  -- rim top
rect(img, 217, 64, 220, 65, GLASS_RIM)  -- base

-- Single highlight pixel inside glass
img:drawPixel(218, 61, Color{r=191, g=219, b=254, a=180})

-- Document folder: x=168-200, y=62-65
rect(img, 168, 62, 200, 65, FOLDER)
-- Tab cutout (top-right corner)
rect(img, 192, 60, 200, 62, FOLDER_TAB)

print("negotiation detail done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
