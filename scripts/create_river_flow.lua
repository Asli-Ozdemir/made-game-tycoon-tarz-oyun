-- create_river_flow.lua
-- Creates an 8-frame animated GIF: horizontal scan-lines scrolling downward.
-- Transparent background, opaque light-blue lines.
-- Overlaid in React at the river position with CSS opacity ~0.28.

local FRAMES  = 8      -- loop length
local SPACING = 8      -- px between each scan-line group
local W, H    = 160, 80
local DUR     = 0.08   -- 80 ms per frame → 640 ms loop

local spr = Sprite{ width=W, height=H, colorMode=ColorMode.RGBA }

-- Add extra frames
for i = 2, FRAMES do spr:newFrame(i) end

local layer = spr.layers[1]
layer.name  = "flow"

-- Colours (fully opaque — CSS opacity scales them down)
local BRIGHT = app.pixelColor.rgba(210, 242, 255, 255)   -- bright highlight
local MED    = app.pixelColor.rgba(155, 220, 255, 200)   -- softer edge

for fi = 1, FRAMES do
  local frame = spr.frames[fi]
  frame.duration = DUR

  local cel = spr:newCel(layer, frame)
  local img = cel.image

  local offset = (fi - 1) % SPACING   -- shifts 0..7 each frame → scroll down

  local y = offset
  while y < H do
    -- Bright lead line
    for x = 0, W - 1 do img:putPixel(x, y, BRIGHT) end
    -- Softer trailing line
    if y + 1 < H then
      for x = 0, W - 1 do img:putPixel(x, y + 1, MED) end
    end
    y = y + SPACING
  end
end

-- ── Export ───────────────────────────────────────────────────────
local I   = string.char(0xC4, 0xB1)   -- ı
local S   = string.char(0xC5, 0x9F)   -- ş
local out = "C:\\Users\\umutm\\Desktop\\mad-game-tarz" .. I ..
            "-oyun\\src\\assets\\icons\\river_flow.gif"

spr:saveCopyAs(out)
app.alert("river_flow.gif saved → " .. out)
