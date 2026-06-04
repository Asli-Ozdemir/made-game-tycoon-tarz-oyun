-- Title screen background — 683×384 pixel art (2× scale)
-- Run: "C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script scripts/create_title_bg.lua

local OUTPUT = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.png"
local W, H   = 683, 384

local spr = Sprite(W, H, ColorMode.RGB)
local img = spr.cels[1].image

-- ── Helpers ─────────────────────────────────────────────
local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end

local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

local function lerpColor(r0,g0,b0, r1,g1,b1, t)
  return Color{ r=lerp(r0,r1,t), g=lerp(g0,g1,t), b=lerp(b0,b1,t), a=255 }
end

-- ── Sky gradient ─────────────────────────────────────────
local SKY = {
  { 0.00,  27, 42, 74 },
  { 0.18,  46, 63,110 },
  { 0.42,  74, 32, 96 },
  { 0.62, 107, 26, 58 },
  { 0.80,  61, 26,  6 },
  { 1.00,  42, 15,  4 },
}

local function skyColor(yn)
  for i = 1, #SKY - 1 do
    local y0 = SKY[i][1];   local r0,g0,b0 = SKY[i][2],   SKY[i][3],   SKY[i][4]
    local y1 = SKY[i+1][1]; local r1,g1,b1 = SKY[i+1][2], SKY[i+1][3], SKY[i+1][4]
    if yn <= y1 then
      local t = (yn - y0) / (y1 - y0)
      return lerpColor(r0,g0,b0, r1,g1,b1, t)
    end
  end
  return Color{r=42, g=15, b=4, a=255}
end

print("Drawing sky...")
for y = 0, H-1 do
  local c = skyColor(y / (H - 1))
  for x = 0, W-1 do img:drawPixel(x, y, c) end
end
print("Sky done.")

-- ── Stars ────────────────────────────────────────────────
local STARS = {
  { 55, 31 }, { 188, 50 }, { 266, 23 }, { 109, 69 },
  { 229, 38 }, { 304, 19 }, { 27,  77 }, { 157, 11 },
  { 239, 58 }, { 314, 35 },
}
local SW = Color{r=255, g=255, b=255, a=200}
local SW2 = Color{r=220, g=220, b=255, a=140}
for _, s in ipairs(STARS) do
  px(s[1], s[2], SW)
  px(s[1]+1, s[2], SW2)
  px(s[1], s[2]+1, SW2)
end

-- ── City skyline — right side, blended faint ─────────────
local GROUND_Y = 299

local BLDGS = {
  { 659, 299-140, 16, 192, 24, 95  },
  { 633, 299-210, 22, 155, 48, 255 },
  { 615, 299-100, 14, 192, 24, 95  },
  { 585, 299-260, 26, 155, 48, 255 },
  { 564, 299-160, 17, 192, 24, 95  },
  { 547, 299- 90, 12, 155, 48, 255 },
  { 518, 299-230, 24, 192, 24, 95  },
  { 498, 299-130, 15, 155, 48, 255 },
  { 474, 299-180, 19, 192, 24, 95  },
  { 456, 299-110, 13, 155, 48, 255 },
  { 430, 299-200, 21, 192, 24, 95  },
  { 415, 299- 75, 10, 155, 48, 255 },
  { 392, 299-150, 18, 192, 24, 95  },
  { 362, 299-240, 25, 155, 48, 255 },
}

local OPACITY = 0.28
print("Drawing buildings...")
for _, b in ipairs(BLDGS) do
  local xl, yt, bw, br, bg, bb = b[1], b[2], b[3], b[4], b[5], b[6]
  for y = yt, GROUND_Y - 1 do
    local sky = skyColor(y / (H - 1))
    local c = Color{
      r = lerp(sky.red,   br, OPACITY),
      g = lerp(sky.green, bg, OPACITY),
      b = lerp(sky.blue,  bb, OPACITY),
      a = 255,
    }
    for x = xl, xl + bw - 1 do px(x, y, c) end
  end
end

-- ── Fog band (above ground, y=270-299) ──────────────────
print("Drawing fog + ground + river...")
for y = 270, GROUND_Y - 1 do
  local t = (y - 270) / math.max(1, GROUND_Y - 1 - 270)
  for x = 0, W-1 do
    local existing = img:getPixel(x, y)
    local er = math.floor(existing / 65536) % 256
    local eg = math.floor(existing / 256)   % 256
    local eb = existing                      % 256
    local fog_a = t * 0.55
    local c = Color{
      r = lerp(er, 46, fog_a),
      g = lerp(eg, 26, fog_a),
      b = lerp(eb, 68, fog_a),
      a = 255,
    }
    px(x, y, c)
  end
end

-- ── Ground (y=299 to bottom) ─────────────────────────────
local GND = Color{r=26, g=8, b=4, a=255}
rect(0, GROUND_Y, W-1, H-1, GND)

-- ── River ────────────────────────────────────────────────
local function cubicBez(p0, p1, p2, p3, t)
  local u = 1 - t
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
end

local SEG = {
  { -14,323,  55,330, 109,346, 191,342 },
  { 191,342, 260,338, 300,338, 362,334 },
  { 362,334, 424,330, 478,326, 560,330 },
  { 560,330, 615,334, 656,330, 697,326 },
}

local RIV_FILL = Color{r=28, g=65, b=155, a=255}
local RIV_LINE = Color{r=90, g=160,b=255, a=255}
local RIV_SHIM = Color{r=160,g=210,b=255, a=255}

local STEPS = 300
for _, seg in ipairs(SEG) do
  local x0,y0,cx1,cy1,cx2,cy2,x1,y1 = seg[1],seg[2],seg[3],seg[4],seg[5],seg[6],seg[7],seg[8]
  for i = 0, STEPS do
    local t  = i / STEPS
    local rx = math.floor(cubicBez(x0,cx1,cx2,x1, t))
    local ry = math.floor(cubicBez(y0,cy1,cy2,y1, t))
    for dy = -2, 5 do
      local alpha = (dy == -2 or dy == 5) and 0.25 or
                    (dy == -1 or dy == 4) and 0.55 or 0.85
      local c = Color{
        r = lerp(26, RIV_FILL.red,   alpha),
        g = lerp(8,  RIV_FILL.green, alpha),
        b = lerp(4,  RIV_FILL.blue,  alpha),
        a = 255,
      }
      px(rx, ry + dy, c)
    end
    px(rx, ry - 1, RIV_LINE)
  end
end

local SHIM_SEGS = {
  { 80, 335, 105, 333 }, { 250, 338, 270, 336 },
  { 380, 330, 400, 329 }, { 540, 331, 560, 329 },
}
for _, s in ipairs(SHIM_SEGS) do
  for x = s[1], s[3] do
    local t = (x - s[1]) / math.max(1, s[3] - s[1])
    local sy = math.floor(s[2] + t * (s[4] - s[2]))
    px(x, sy, RIV_SHIM)
  end
end
print("Fog + ground + river done.")

-- ── Foreground hill (left side, bottom-left ellipse) ─────
print("Drawing foreground elements...")
local HILL = Color{r=21, g=6, b=2, a=255}
local HILL_W, HILL_H = 376, 92
local HILL_CX = math.floor(HILL_W * 0.30)  -- = 113

for y = H - HILL_H, H-1 do
  local dy = y - H
  for x = 0, HILL_W do
    local dx = x - HILL_CX
    local rx = dx < 0 and HILL_CX or (HILL_W - HILL_CX)
    if rx > 0 then
      local nx = dx / rx
      local ny = dy / HILL_H
      if nx*nx + ny*ny <= 1.02 then
        px(x, y, HILL)
      end
    end
  end
end

-- ── Pine trees ───────────────────────────────────────────
local TREE_BASE = Color{r=18, g=5, b=0, a=255}

local function drawTree(cx, scale, alpha)
  local layers = {
    { w=math.floor(13*scale), h=math.floor(9*scale)  },
    { w=math.floor(17*scale), h=math.floor(11*scale) },
    { w=math.floor(20*scale), h=math.floor(13*scale) },
  }
  local trunk_w = math.max(2, math.floor(3*scale))
  local trunk_h = math.max(3, math.floor(5*scale))
  local c = Color{r=lerp(0,TREE_BASE.red,alpha), g=lerp(0,TREE_BASE.green,alpha), b=lerp(0,TREE_BASE.blue,alpha), a=255}

  local cur_y = GROUND_Y - trunk_h
  for y = cur_y, GROUND_Y-1 do
    for x = cx - math.floor(trunk_w/2), cx + math.floor(trunk_w/2) do px(x, y, c) end
  end
  for i = #layers, 1, -1 do
    local L = layers[i]
    local tri_bottom = cur_y
    cur_y = cur_y - L.h + (i < #layers and math.floor(layers[i+1].h * 0.35) or 0)
    for y = cur_y, tri_bottom do
      local t = (y - cur_y) / math.max(1, L.h - 1)
      local half_w = math.floor(L.w * t / 2)
      for x = cx - half_w, cx + half_w do px(x, y, c) end
    end
  end
end

drawTree(math.floor(683*0.18),  1.0, 0.45)
drawTree(math.floor(683*0.225), 0.78, 0.35)
drawTree(math.floor(683*0.145), 0.60, 0.28)
drawTree(math.floor(683*0.26),  0.50, 0.22)

-- ── House / Garage ───────────────────────────────────────
local HX   = 34
local HY   = 239
local HW   = 90
local HH   = 60
local RW   = 102
local RH   = 33
local RX   = 28
local RY   = 206

local BODY   = Color{r=46, g=17, b=6,  a=255}
local ROOF   = Color{r=30, g=8,  b=3,  a=255}
local ROOF_D = Color{r=20, g=5,  b=1,  a=255}
local DOOR_C = Color{r=32, g=10, b=2,  a=255}
local DOOR_B = Color{r=37, g=16, b=5,  a=255}
local WIN_C  = Color{r=255,g=180,b=60, a=70 }
local FRAME  = Color{r=58, g=18, b=8,  a=255}
local FNDN   = Color{r=26, g=8,  b=4,  a=255}

-- Gabled roof (triangle)
for y = RY, HY - 1 do
  local t  = (y - RY) / math.max(1, HY - 1 - RY)
  local hw = math.floor(RW * 0.5 * (1 - t))
  local cx = RX + math.floor(RW / 2)
  local c  = (y == HY-1) and ROOF_D or ROOF
  for x = cx - hw, cx + hw do px(x, y, c) end
end
-- Eave shadow
rect(RX, HY-2, RX+RW-1, HY-1, ROOF_D)

-- Body fill
rect(HX, HY, HX+HW-1, GROUND_Y-1, BODY)
-- Siding planks
for i = 1, 7 do
  local sy = HY + math.floor(i * HH / 8)
  for x = HX, HX+HW-1 do px(x, sy, DOOR_C) end
end
-- Foundation strip
rect(HX, GROUND_Y-3, HX+HW-1, GROUND_Y-1, FNDN)

-- Side door
local DX, DY, DW, DH = HX+5, HY+14, 14, 25
rect(DX, DY, DX+DW-1, DY+DH-1, DOOR_C)
rect(DX,   DY,   DX+DW-1, DY,   FRAME)
rect(DX,   DY,   DX,       DY+DH-1, FRAME)
rect(DX+DW-1, DY, DX+DW-1, DY+DH-1, FRAME)
rect(DX+2, DY+2, DX+DW-3, DY+10, DOOR_B)
rect(DX+2, DY+13, DX+DW-3, DY+22, DOOR_B)
px(DX+DW-3, DY+14, Color{r=120,g=60,b=30,a=255})

-- Window above door
local WX, WY, WW, WH = HX+7, HY+5, 10, 7
rect(WX, WY, WX+WW-1, WY+WH-1, WIN_C)
rect(WX, WY, WX+WW-1, WY, FRAME)
rect(WX, WY, WX, WY+WH-1, FRAME)
rect(WX+WW-1, WY, WX+WW-1, WY+WH-1, FRAME)
rect(WX, WY+WH-1, WX+WW-1, WY+WH-1, FRAME)
for x = WX, WX+WW-1 do px(x, WY+3, FRAME) end
px(WX+5, WY, FRAME) px(WX+5, WY+1, FRAME) px(WX+5, WY+2, FRAME)
px(WX+5, WY+4, FRAME) px(WX+5, WY+5, FRAME)

-- Garage door
local GDX, GDW, GDH = HX+26, 38, 38
local GDY = GROUND_Y - GDH
rect(GDX, GDY, GDX+GDW-1, GROUND_Y-1, DOOR_C)
for panel = 0, 4 do
  local py = GDY + math.floor(panel * GDH / 5)
  for x = GDX, GDX+GDW-1 do px(x, py, FRAME) end
  for col = 1, 3 do
    local gx = GDX + math.floor(col * GDW / 4)
    px(gx, py+1, DOOR_B) px(gx, py+2, DOOR_B)
  end
end
rect(GDX, GDY, GDX, GROUND_Y-1, FRAME)
rect(GDX+GDW-1, GDY, GDX+GDW-1, GROUND_Y-1, FRAME)
rect(GDX, GDY, GDX+GDW-1, GDY, FRAME)
px(GDX+17, GROUND_Y-4, Color{r=90,g=40,b=20,a=255})
px(GDX+18, GROUND_Y-4, Color{r=90,g=40,b=20,a=255})
px(GDX+19, GROUND_Y-4, Color{r=90,g=40,b=20,a=255})

-- Outdoor lamp
rect(GDX, GDY-5, GDX+2, GDY-1, ROOF)
rect(GDX-1, GDY-1, GDX+3, GDY-1, ROOF)
px(GDX+1, GDY-2, Color{r=255,g=200,b=80,a=180})

-- ── Chimney ──────────────────────────────────────────────
local CX, CY, CW, CH = 97, RY+5, 9, 16
local BRK1 = Color{r=42, g=16, b=8,  a=255}
local BRK2 = Color{r=46, g=18, b=9,  a=255}
rect(CX, CY, CX+CW-1, RY+CH, BRK1)
for row = 0, 3 do
  local by = CY + math.floor(row * CH / 4)
  for x = CX, CX+CW-1 do px(x, by, ROOF_D) end
  if row % 2 == 0 then
    px(CX + math.floor(CW/2), by+1, BRK2)
    px(CX + math.floor(CW/2), by+2, BRK2)
  else
    px(CX+2, by+1, BRK2)
  end
end
rect(CX-2, CY, CX+CW+1, CY+2, ROOF_D)
px(CX+2, CY-2, Color{r=180,g=140,b=120,a=50})
px(CX+4, CY-3, Color{r=180,g=140,b=120,a=35})
px(CX+3, CY-4, Color{r=180,g=140,b=120,a=25})

-- Attic window in roof
local AWX = RX + math.floor(RW/2) - 7
local AWY = HY - 10
rect(AWX, AWY, AWX+13, AWY+7, Color{r=255,g=190,b=70,a=40})
rect(AWX, AWY, AWX+13, AWY, FRAME)
rect(AWX, AWY, AWX, AWY+7, FRAME)
rect(AWX+13, AWY, AWX+13, AWY+7, FRAME)
rect(AWX, AWY+7, AWX+13, AWY+7, FRAME)
for x = AWX, AWX+13 do px(x, AWY+3, FRAME) end
px(AWX+6, AWY, FRAME) px(AWX+6, AWY+1, FRAME) px(AWX+6, AWY+2, FRAME)
px(AWX+6, AWY+4, FRAME) px(AWX+6, AWY+5, FRAME)

print("Foreground elements done.")

spr:saveCopyAs(OUTPUT)
print("Saved: " .. OUTPUT)
app.exit()
