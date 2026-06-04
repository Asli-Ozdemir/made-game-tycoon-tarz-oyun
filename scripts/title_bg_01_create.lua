-- title_bg_01_create.lua
-- Creates 683×384 Aseprite file with 9 named layers, bottom-to-top order.

local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.aseprite"
local W, H = 683, 384

local spr = Sprite(W, H, ColorMode.RGB)
spr.layers[1].name = "sky"

local LAYER_NAMES = {"stars","buildings","fog","ground","river","hill","trees","house"}
for _, name in ipairs(LAYER_NAMES) do
  local l = spr:newLayer()
  l.name = name
end

spr:saveAs(ASEPRITE_PATH)
print("Created " .. ASEPRITE_PATH)
print("Layer count: " .. #spr.layers)
for i, l in ipairs(spr.layers) do
  print("  [" .. i .. "] " .. l.name)
end
app.exit()
