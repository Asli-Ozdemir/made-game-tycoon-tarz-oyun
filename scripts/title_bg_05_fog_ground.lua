-- title_bg_05_fog_ground.lua
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

-- ── Fog (y=270-298, purple-ish, opacity increases toward ground) ──
local fogImg = celImg("fog")
for y = 270, GROUND_Y - 1 do
  local t = (y - 270) / math.max(1, GROUND_Y - 1 - 270)
  local a = math.floor(t * 140)  -- 0 at top, 140 (~55%) at bottom
  local c = Color{r=46, g=26, b=68, a=a}
  for x = 0, W - 1 do fogImg:drawPixel(x, y, c) end
end
print("Fog done")

-- ── Ground (y=299-383, solid dark) ───────────────────────────────
local gndImg = celImg("ground")
local GND = Color{r=26, g=8, b=4, a=255}
for y = GROUND_Y, H - 1 do
  for x = 0, W - 1 do gndImg:drawPixel(x, y, GND) end
end
print("Ground done")

spr:saveAs(ASEPRITE_PATH)
app.exit()
