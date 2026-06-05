-- emlak_bg_14_export.lua
-- Flattens each frame and exports as PNG.

local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_bg.aseprite"
local OFFICE_PNG      = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_office_bg.png"
local NEGOTIATION_PNG = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_negotiation_bg.png"
local W, H = 440, 80

local spr = app.open(ASEPRITE_PATH)

local function exportFrame(frameIdx, outputPath)
  local out = Sprite(W, H, ColorMode.RGB)
  local outImg = out.cels[1].image

  -- Fill black base
  for y = 0, H-1 do
    for x = 0, W-1 do
      outImg:drawPixel(x, y, Color{r=0, g=0, b=0, a=255})
    end
  end

  -- Composite each layer bottom-to-top
  for i = 1, #spr.layers do
    local layer = spr.layers[i]
    local frame = spr.frames[frameIdx]
    local cel = layer:cel(frame)
    if cel then
      local celImg = cel.image
      local bx = cel.bounds.x
      local by = cel.bounds.y
      for cy = 0, celImg.height - 1 do
        for cx = 0, celImg.width - 1 do
          local rawpx = celImg:getPixel(cx, cy)
          local a = app.pixelColor.rgbaA(rawpx)
          if a > 0 then
            local r = app.pixelColor.rgbaR(rawpx)
            local g = app.pixelColor.rgbaG(rawpx)
            local b = app.pixelColor.rgbaB(rawpx)
            local wx = bx + cx
            local wy = by + cy
            if wx >= 0 and wx < W and wy >= 0 and wy < H then
              -- Alpha-blend onto existing pixel
              local bg = outImg:getPixel(wx, wy)
              local bgr = app.pixelColor.rgbaR(bg)
              local bgg = app.pixelColor.rgbaG(bg)
              local bgb = app.pixelColor.rgbaB(bg)
              local at = a / 255.0
              local nr = math.floor(bgr * (1 - at) + r * at)
              local ng = math.floor(bgg * (1 - at) + g * at)
              local nb = math.floor(bgb * (1 - at) + b * at)
              outImg:drawPixel(wx, wy, Color{r=nr, g=ng, b=nb, a=255})
            end
          end
        end
      end
    end
  end

  out:saveCopyAs(outputPath)
  out:close()
  print("Exported frame " .. frameIdx .. " → " .. outputPath)
end

exportFrame(1, OFFICE_PNG)
exportFrame(2, NEGOTIATION_PNG)

app.exit()
