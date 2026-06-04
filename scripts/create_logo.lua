-- Magenta Reach — pixel art logo
-- "MAGENTA" (magenta) + "REACH" (cyan), 5x5 font, 64x16 canvas

local W, H   = 64, 18
local spr    = Sprite(W, H, ColorMode.RGB)
local img    = spr.cels[1].image

local T  = Color{r=0,   g=0,   b=0,   a=0}
local MG = Color{r=220, g=55,  b=115, a=255}  -- magenta
local CY = Color{r=75,  g=218, b=208, a=255}  -- cyan

-- Clear to transparent
for y=0,H-1 do for x=0,W-1 do img:drawPixel(x,y,T) end end

-- 5×5 pixel font — each row is a 5-bit value, MSB = leftmost pixel
-- bit layout: bit4=col0  bit3=col1  bit2=col2  bit1=col3  bit0=col4
local G = {
  A = {0x0E, 0x11, 0x1F, 0x11, 0x11},  -- .XXX. X...X XXXXX X...X X...X
  C = {0x0E, 0x10, 0x10, 0x10, 0x0E},  -- .XXX. X.... X.... X.... .XXX.
  E = {0x1F, 0x10, 0x1E, 0x10, 0x1F},  -- XXXXX X.... XXXX. X.... XXXXX
  G = {0x0E, 0x10, 0x17, 0x11, 0x0E},  -- .XXX. X.... X.XXX X...X .XXX.
  H = {0x11, 0x11, 0x1F, 0x11, 0x11},  -- X...X X...X XXXXX X...X X...X
  M = {0x11, 0x1B, 0x15, 0x11, 0x11},  -- X...X XX.XX X.X.X X...X X...X
  N = {0x11, 0x19, 0x15, 0x13, 0x11},  -- X...X XX..X X.X.X X..XX X...X
  R = {0x1E, 0x11, 0x1E, 0x14, 0x12},  -- XXXX. X...X XXXX. X.X.. X..X.
  T = {0x1F, 0x04, 0x04, 0x04, 0x04},  -- XXXXX ..X.. ..X.. ..X.. ..X..
}

local function drawText(text, ox, oy, color)
  local cx = ox
  for i = 1, #text do
    local ch    = text:sub(i, i)
    local glyph = G[ch]
    if glyph then
      for row = 0, 4 do
        local bits = glyph[row + 1]
        for col = 0, 4 do
          if bits & (0x10 >> col) ~= 0 then
            img:drawPixel(cx + col, oy + row, color)
          end
        end
      end
    end
    cx = cx + 6  -- 5px glyph + 1px spacing
  end
end

-- "MAGENTA" — centered horizontally, top row
local w1 = #"MAGENTA" * 6 - 1   -- 41px
local x1 = math.floor((W - w1) / 2)
drawText("MAGENTA", x1, 1, MG)

-- River wave motif between the words (2-row flowing wave)
-- Period 6: top 3px then bottom 3px, creating a flowing S-curve
local WC1 = Color{r=90,  g=210, b=200, a=220}  -- main wave
local WC2 = Color{r=140, g=230, b=220, a=110}  -- faded reflection
local wx_start = x1
local wx_end   = x1 + w1
for x = wx_start, wx_end do
  local phase = (x - wx_start) % 6
  if phase < 3 then
    img:drawPixel(x, 7, WC1)
    img:drawPixel(x, 8, WC2)   -- soft shadow row
  else
    img:drawPixel(x, 8, WC1)
    img:drawPixel(x, 7, WC2)   -- soft shadow row
  end
end

-- "REACH" — centered horizontally, bottom row
local w2 = #"REACH" * 6 - 1     -- 29px
local x2 = math.floor((W - w2) / 2)
drawText("REACH", x2, 11, CY)

-- Save as .aseprite
local out = "C:/Users/umutm/Desktop/mad-game-tarzı-oyun/assets/logo_magenta_reach.aseprite"
spr:saveAs(out)
app.refresh()
