-- Macenta Koyu — 36x36 Game Cartridge Icon
-- Represents the game's indie dev identity: magenta label + cyan wave

local outputPath = "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/assets/cartridge_36x36.aseprite"

local spr = Sprite(36, 36, ColorMode.RGB)
local img = spr.cels[1].image

local T  = Color{r=0,  g=0,  b=0,  a=0}
local BD = Color{r=18, g=15, b=38, a=255}   -- dark outline
local BM = Color{r=38, g=34, b=72, a=255}   -- body fill (dark purple)
local BL = Color{r=62, g=58, b=105,a=255}   -- body highlight
local LB = Color{r=168,g=24, b=95, a=255}   -- label bg (magenta)
local LL = Color{r=215,g=75, b=145,a=255}   -- label light edge
local LD = Color{r=110,g=12, b=58, a=255}   -- label dark edge
local WH = Color{r=245,g=235,b=255,a=255}   -- near-white (M letter)
local CY = Color{r=80, g=220,b=210,a=255}   -- cyan wave (coastal theme)

-- Clear to transparent
for y=0,35 do
  for x=0,35 do img:drawPixel(x,y,T) end
end

-- Cartridge body shape: x=3..32, y=2..33
-- Bottom center notch: x=13..22, y=27..33
local function inBody(x,y)
  if x<3 or x>32 or y<2 or y>33 then return false end
  if y>=27 and x>=13 and x<=22 then return false end
  return true
end

-- Fill body
for y=2,33 do
  for x=3,32 do
    if inBody(x,y) then img:drawPixel(x,y,BM) end
  end
end

-- 1px outline
for y=1,34 do
  for x=2,33 do
    if inBody(x,y) then
      if not inBody(x-1,y) or not inBody(x+1,y)
      or not inBody(x,y-1) or not inBody(x,y+1) then
        img:drawPixel(x,y,BD)
      end
    end
  end
end

-- Top highlight strip
for x=4,31 do img:drawPixel(x,3,BL) end

-- Label background (magenta) — x=6..29, y=6..22
for y=6,22 do
  for x=6,29 do img:drawPixel(x,y,LB) end
end

-- Label border: left+top = light, right+bottom = dark
for x=6,29 do
  img:drawPixel(x,6,LL)
  img:drawPixel(x,22,LD)
end
for y=7,21 do
  img:drawPixel(6,y,LL)
  img:drawPixel(29,y,LD)
end

-- "M" letter (5x5 pixel font) at x=14..18, y=9..13
-- X . . . X
-- X X . X X
-- X . X . X
-- X . . . X
-- X . . . X
local M = {
  {0,0},{4,0},
  {0,1},{1,1},{3,1},{4,1},
  {0,2},{2,2},{4,2},
  {0,3},{4,3},
  {0,4},{4,4},
}
for _,p in ipairs(M) do
  img:drawPixel(14+p[1], 9+p[2], WH)
end

-- Cyan wave line (coastal theme) — y oscillates 17-18-19, x=8..27
local waveY = {18,17,18,19,18,17,18,19,18,17,18,19,18,17,18,19,18,17,18,19}
for i=1,20 do
  img:drawPixel(7+i, waveY[i], CY)
end

-- Contact ridges (bottom connector area) — two side pads
for y=24,26 do
  for x=4,12  do img:drawPixel(x,y,BL) end
  for x=23,31 do img:drawPixel(x,y,BL) end
end

-- Save
spr:saveAs(outputPath)
app.refresh()
