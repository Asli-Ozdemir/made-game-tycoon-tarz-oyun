-- emlak_bg_01_create.lua
-- Creates 440×80 Aseprite file: 2 frames, 6 named layers, animation tags.

local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_bg.aseprite"
local W, H = 440, 80

local spr = Sprite(W, H, ColorMode.RGB)
spr.layers[1].name = "bg"

local LAYER_NAMES = {"arch", "light", "furniture", "detail", "atmosphere"}
for _, name in ipairs(LAYER_NAMES) do
  local l = spr:newLayer()
  l.name = name
end

-- Add second frame
spr:newFrame()

-- Animation tags: office = frame 1, negotiation = frame 2
spr:newTag(1, 1).name = "office"
spr:newTag(2, 2).name = "negotiation"

spr:saveAs(ASEPRITE_PATH)
print("Created " .. ASEPRITE_PATH)
print("Frames: " .. #spr.frames .. ", Layers: " .. #spr.layers)
for i, t in ipairs(spr.tags) do
  print("  tag[" .. i .. "] " .. t.name .. " frames " .. t.fromFrame.frameNumber .. "-" .. t.toFrame.frameNumber)
end
app.exit()
