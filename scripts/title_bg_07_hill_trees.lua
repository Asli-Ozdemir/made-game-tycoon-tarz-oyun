-- title_bg_07_hill_trees.lua
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

-- ── Foreground hill (asymmetric ellipse, bottom-left) ─────────────
local hillImg = celImg("hill")
local HILL     = Color{r=21, g=6, b=2, a=255}
local HILL_W   = 376
local HILL_H   = 92
local HILL_CX  = math.floor(HILL_W * 0.30)  -- 113

for y = H - HILL_H, H - 1 do
  local dy = y - H
  for x = 0, HILL_W do
    local dx = x - HILL_CX
    local rx = (dx < 0) and HILL_CX or (HILL_W - HILL_CX)
    if rx > 0 then
      local nx = dx / rx
      local ny = dy / HILL_H
      if nx*nx + ny*ny <= 1.02 then
        hillImg:drawPixel(x, y, HILL)
      end
    end
  end
end
print("Hill done")

-- ── Pine trees ────────────────────────────────────────────────────
local treesImg = celImg("trees")

local function drawTree(cx, scale, alpha)
  local r = lerp(0, 18, alpha)
  local g = lerp(0,  5, alpha)
  local c = Color{r=r, g=g, b=0, a=255}

  local layers = {
    { w=math.floor(13*scale), h=math.floor(9*scale)  },
    { w=math.floor(17*scale), h=math.floor(11*scale) },
    { w=math.floor(20*scale), h=math.floor(13*scale) },
  }
  local trunk_w = math.max(2, math.floor(3*scale))
  local trunk_h = math.max(3, math.floor(5*scale))

  -- Trunk
  local cur_y = GROUND_Y - trunk_h
  for y = cur_y, GROUND_Y - 1 do
    for x = cx - math.floor(trunk_w/2), cx + math.floor(trunk_w/2) do
      if x >= 0 and x < W and y >= 0 and y < H then treesImg:drawPixel(x,y,c) end
    end
  end

  -- 3 triangle layers, bottom to top
  for i = #layers, 1, -1 do
    local L = layers[i]
    local tri_bottom = cur_y
    local overlap = (i < #layers) and math.floor(layers[i+1].h * 0.35) or 0
    cur_y = cur_y - L.h + overlap
    for y = cur_y, tri_bottom do
      local t = (y - cur_y) / math.max(1, L.h - 1)
      local half_w = math.floor(L.w * t / 2)
      for x = cx - half_w, cx + half_w do
        if x >= 0 and x < W and y >= 0 and y < H then treesImg:drawPixel(x,y,c) end
      end
    end
  end
end

-- 4 trees: (canvas_x, scale, alpha)
drawTree(math.floor(683*0.18),  1.00, 0.45)
drawTree(math.floor(683*0.225), 0.78, 0.35)
drawTree(math.floor(683*0.145), 0.60, 0.28)
drawTree(math.floor(683*0.26),  0.50, 0.22)
print("Trees done")

spr:saveAs(ASEPRITE_PATH)
app.exit()
