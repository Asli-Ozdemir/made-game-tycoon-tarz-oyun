-- zoom_out_bg.lua
-- Scales the scene down to SCALE% and centers it on a dark background,
-- giving the impression the player is viewing from further away.

local SCALE = 0.78   -- adjust if you want more/less zoom-out

local I   = string.char(0xC4, 0xB1)   -- ı
local S   = string.char(0xC5, 0x9F)   -- ş
local base    = "C:\\Users\\umutm\\Desktop\\mad-game-tarz" .. I .. "-oyun\\"
local imgPath = base .. "assets\\Giri" .. S .. " Ekran" .. I .. ".png"
local outPath = imgPath   -- overwrite in-place

-- ── Open ─────────────────────────────────────────────────────────
local spr  = Sprite{ fromFile = imgPath }
local origW = spr.width    -- 2732
local origH = spr.height   -- 1536
local cel   = spr.cels[1]

-- ── Sample sky colour from top-centre of original ────────────────
local origImg = cel.image
local skyPx   = origImg:getPixel(origW // 2, 8)
local skyR    = app.pixelColor.rgbaR(skyPx)
local skyG    = app.pixelColor.rgbaG(skyPx)
local skyB    = app.pixelColor.rgbaB(skyPx)
-- Darken the sample slightly so borders recede
local bgPx = app.pixelColor.rgba(
  math.max(0, skyR - 15),
  math.max(0, skyG - 15),
  math.max(0, skyB - 10),
  255
)

-- ── Build scaled scene (fast C++ resize) ─────────────────────────
local newW = math.floor(origW * SCALE)
local newH = math.floor(origH * SCALE)
local offX = math.floor((origW - newW) / 2)
local offY = math.floor((origH - newH) / 2)

local scaledImg = origImg:clone()
scaledImg:resize(newW, newH)   -- C++ nearest-neighbour, fast

-- ── Create solid background at full canvas size ───────────────────
-- Trick: resize a 1×1 pixel to full canvas = instant solid fill
local bgImg = Image(1, 1, ColorMode.RGBA)
bgImg:putPixel(0, 0, bgPx)
bgImg:resize(origW, origH)    -- C++ resize, fast

-- ── Composite: place scaled scene centred on background ──────────
bgImg:drawImage(scaledImg, Point(offX, offY))

-- ── Write result back to cel (drawImage fully overwrites) ────────
cel.image:drawImage(bgImg, Point(0, 0))

-- ── Export ───────────────────────────────────────────────────────
spr:saveCopyAs(outPath)
app.alert("Done — zoom-out saved to:\n" .. outPath)
