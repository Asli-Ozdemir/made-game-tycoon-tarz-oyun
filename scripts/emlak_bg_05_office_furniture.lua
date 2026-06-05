-- emlak_bg_05_office_furniture.lua
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

local img = celImgFrame("furniture", 1)
local DESK_TOP  = Color{r=90, g=46, b=0, a=255}   -- #5a2e00 — top edge
local DESK_BODY = Color{r=61, g=26, b=0, a=255}   -- #3d1a00 — body
local DESK_DARK = Color{r=42, g=20, b=0, a=255}   -- #2a1400 — front face

-- Desk top edge
rect(img, 80, 70, 390, 71, DESK_TOP)
-- Desk body
rect(img, 80, 72, 390, 75, DESK_BODY)
-- Desk front panel (bottom 4px)
rect(img, 80, 76, 390, H-1, DESK_DARK)

print("office furniture done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
