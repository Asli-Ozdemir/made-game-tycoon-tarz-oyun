-- title_bg_08_house.lua
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

local img = celImg("house")

local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end
local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end

-- ── Colors ───────────────────────────────────────────────────────
local BODY   = Color{r=46, g=17, b=6,  a=255}  -- house siding
local ROOF   = Color{r=30, g=8,  b=3,  a=255}  -- roof fill
local ROOF_D = Color{r=20, g=5,  b=1,  a=255}  -- roof dark edge / eave
local DOOR_C = Color{r=32, g=10, b=2,  a=255}  -- door / siding gap
local DOOR_B = Color{r=37, g=16, b=5,  a=255}  -- door panel highlight
local WIN_C  = Color{r=90, g=55, b=20, a=255}  -- window (pre-blended warm tint)
local FRAME  = Color{r=58, g=18, b=8,  a=255}  -- window/door frame
local FNDN   = Color{r=26, g=8,  b=4,  a=255}  -- foundation strip
local BRICK1 = Color{r=42, g=16, b=8,  a=255}  -- chimney brick base
local BRICK2 = Color{r=46, g=18, b=9,  a=255}  -- chimney brick highlight

-- ── Coordinates ──────────────────────────────────────────────────
local HX, HY, HW, HH = 34, 239, 90, 60   -- body: left, top, W, H
local RX, RY, RW     = 28, 206, 102       -- roof: left, top, width (H=33)

-- ── Gabled roof (triangle fill) ───────────────────────────────────
for y = RY, HY - 1 do
  local t  = (y - RY) / math.max(1, HY - 1 - RY)
  local hw = math.floor(RW * 0.5 * (1 - t))
  local cx = RX + math.floor(RW / 2)
  local c  = (y == HY - 1) and ROOF_D or ROOF
  for x = cx - hw, cx + hw do px(x, y, c) end
end
-- Eave shadow
rect(RX, HY-2, RX+RW-1, HY-1, ROOF_D)

-- ── House body ────────────────────────────────────────────────────
rect(HX, HY, HX+HW-1, GROUND_Y-1, BODY)
-- Horizontal siding planks (7 lines)
for i = 1, 7 do
  local sy = HY + math.floor(i * HH / 8)
  for x = HX, HX+HW-1 do px(x, sy, DOOR_C) end
end
-- Foundation strip
rect(HX, GROUND_Y-3, HX+HW-1, GROUND_Y-1, FNDN)

-- ── Side door (left of body) ──────────────────────────────────────
local DX, DY, DW, DH = HX+5, HY+14, 14, 25
rect(DX, DY, DX+DW-1, DY+DH-1, DOOR_C)
-- Frame: top, left, right sides
for x = DX, DX+DW-1 do px(x, DY, FRAME) end
for y = DY, DY+DH-1 do px(DX, y, FRAME) px(DX+DW-1, y, FRAME) end
-- Two door panels
rect(DX+2, DY+2,  DX+DW-3, DY+10, DOOR_B)
rect(DX+2, DY+13, DX+DW-3, DY+22, DOOR_B)
-- Door knob
px(DX+DW-3, DY+14, Color{r=120, g=60, b=30, a=255})

-- ── Window above side door ────────────────────────────────────────
local WX, WY, WW, WH = HX+7, HY+5, 10, 7
rect(WX, WY, WX+WW-1, WY+WH-1, WIN_C)
-- Frame: all 4 sides
for x = WX, WX+WW-1 do px(x, WY, FRAME) px(x, WY+WH-1, FRAME) end
for y = WY, WY+WH-1 do px(WX, y, FRAME) px(WX+WW-1, y, FRAME) end
-- Cross: horizontal at WY+3
for x = WX, WX+WW-1 do px(x, WY+3, FRAME) end
-- Cross: vertical at WX+5
for y = WY, WY+2 do px(WX+5, y, FRAME) end
for y = WY+4, WY+5 do px(WX+5, y, FRAME) end

-- ── Garage door ───────────────────────────────────────────────────
local GDX, GDW, GDH = HX+26, 38, 38
local GDY = GROUND_Y - GDH  -- = 261
rect(GDX, GDY, GDX+GDW-1, GROUND_Y-1, DOOR_C)
-- 5 horizontal panels
for panel = 0, 4 do
  local panel_y = GDY + math.floor(panel * GDH / 5)
  for x = GDX, GDX+GDW-1 do px(x, panel_y, FRAME) end
  -- 3 vertical dividers per panel
  for col = 1, 3 do
    local gx = GDX + math.floor(col * GDW / 4)
    px(gx, panel_y+1, DOOR_B)
    px(gx, panel_y+2, DOOR_B)
  end
end
-- Garage door border: left, right, top
for y = GDY, GROUND_Y-1 do px(GDX, y, FRAME) px(GDX+GDW-1, y, FRAME) end
for x = GDX, GDX+GDW-1 do px(x, GDY, FRAME) end
-- Handle (3 pixels near bottom-center)
px(GDX+17, GROUND_Y-4, Color{r=90, g=40, b=20, a=255})
px(GDX+18, GROUND_Y-4, Color{r=90, g=40, b=20, a=255})
px(GDX+19, GROUND_Y-4, Color{r=90, g=40, b=20, a=255})

-- ── Outdoor lamp (above garage door left edge) ────────────────────
rect(GDX, GDY-5, GDX+2, GDY-1, ROOF)
rect(GDX-1, GDY-1, GDX+3, GDY-1, ROOF)
px(GDX+1, GDY-2, WIN_C)

-- ── Chimney ───────────────────────────────────────────────────────
-- CX=97, CY=RY+5=211, CW=9, CH=16
local CX, CY, CW, CH = 97, RY+5, 9, 16
rect(CX, CY, CX+CW-1, RY+CH, BRICK1)
-- Brick row lines + alternating mortar highlights
for row = 0, 3 do
  local by = CY + math.floor(row * CH / 4)
  for x = CX, CX+CW-1 do px(x, by, ROOF_D) end
  if row % 2 == 0 then
    px(CX + math.floor(CW/2), by+1, BRICK2)
    px(CX + math.floor(CW/2), by+2, BRICK2)
  else
    px(CX+2, by+1, BRICK2)
  end
end
-- Cap (wider than shaft)
rect(CX-2, CY, CX+CW+1, CY+2, ROOF_D)
-- Smoke wisps (3 pixels, pre-blended with sky color at that height)
px(CX+2, CY-2, Color{r=104, g=50, b=82, a=255})
px(CX+4, CY-3, Color{r=97,  g=38, b=77, a=255})
px(CX+3, CY-4, Color{r=93,  g=33, b=75, a=255})

-- ── Attic window (in gable, center of roof) ───────────────────────
local AWX = RX + math.floor(RW/2) - 7  -- = 72
local AWY = HY - 10                    -- = 229
rect(AWX, AWY, AWX+13, AWY+7, WIN_C)
-- Frame: all 4 sides
for x = AWX, AWX+13 do px(x, AWY, FRAME) px(x, AWY+7, FRAME) end
for y = AWY, AWY+7  do px(AWX, y, FRAME) px(AWX+13, y, FRAME) end
-- Cross: horizontal at AWY+3
for x = AWX, AWX+13 do px(x, AWY+3, FRAME) end
-- Cross: vertical at AWX+6
for y = AWY, AWY+2   do px(AWX+6, y, FRAME) end
for y = AWY+4, AWY+5 do px(AWX+6, y, FRAME) end

print("House done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
