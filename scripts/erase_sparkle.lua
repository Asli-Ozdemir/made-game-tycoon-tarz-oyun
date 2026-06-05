-- erase_sparkle.lua
-- Removes the bright sparkle symbol from the bottom-right water area
-- of Giriş Ekranı.png by replacing bright pixels with nearby water texture.

local I = string.char(0xC4, 0xB1)   -- ı  (U+0131)
local S = string.char(0xC5, 0x9F)   -- ş  (U+015F)

local base    = "C:\\Users\\umutm\\Desktop\\mad-game-tarz" .. I .. "-oyun\\"
local imgPath = base .. "assets\\Giri" .. S .. " Ekran" .. I .. ".png"
local outPath = base .. "assets\\Giri" .. S .. " Ekran" .. I .. ".png"

-- ── Open ─────────────────────────────────────────────────────────
local spr = Sprite{ fromFile = imgPath }
local cel  = spr.cels[1]
local img  = cel.image

-- ── Sparkle bounding box (2732 × 1536 image) ─────────────────────
-- Symbol is a bright star/cross in the bottom-right water reflection
-- approx 86-97 % x  →  x: 2349 – 2650
-- approx 84-96 % y  →  y: 1290 – 1475
local x1, y1 = 2280, 1250
local x2, y2 = 2700, 1500

-- ── Clone offset: sample from 300 px to the left (same water band) ─
local SHIFT = 300

-- First pass: collect a palette of dark-water pixels from the source band
-- (x1-SHIFT .. x2-SHIFT, y1 .. y2) so we can blend them in.
-- We do a simple scanline clone: dst pixel ← src pixel shifted left by SHIFT,
-- but only for pixels that are noticeably brighter than the clone source.

local function brightness(px)
  local r = app.pixelColor.rgbaR(px)
  local g = app.pixelColor.rgbaG(px)
  local b = app.pixelColor.rgbaB(px)
  return (r * 299 + g * 587 + b * 114) / 1000
end

local THRESHOLD = 70   -- replace pixels brighter than this

-- Two-pass: first gather replacement colors (avoid reading modified pixels)
local replacements = {}

for y = y1, y2 do
  for x = x1, x2 do
    local px = img:getPixel(x, y)
    if brightness(px) > THRESHOLD then
      -- Pick clone source: shifted left; clamp to image
      local sx = x - SHIFT
      if sx < 0 then sx = x + SHIFT end   -- fall back: shift right
      if sx < 0 then sx = 0 end
      if sx >= spr.width then sx = spr.width - 1 end
      local srcPx = img:getPixel(sx, y)
      replacements[y * spr.width + x] = srcPx
    end
  end
end

-- Apply replacements
for key, srcPx in pairs(replacements) do
  local x = key % spr.width
  local y = math.floor(key / spr.width)
  img:putPixel(x, y, srcPx)
end

-- ── Export ───────────────────────────────────────────────────────
spr:saveCopyAs(outPath)
app.alert("Done! Sparkle erased → " .. outPath)
