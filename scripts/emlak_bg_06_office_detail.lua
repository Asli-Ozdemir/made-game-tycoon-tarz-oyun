-- emlak_bg_06_office_detail.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\emlak_bg.aseprite"
local W, H = 440, 80
local spr = app.open(ASEPRITE_PATH)

local function celImgFrame(layerName, frameIdx)
  for _, l in ipairs(spr.layers) do
    if l.name == layerName then
      local f = spr.frames[frameIdx]
      local c = l:cel(f)
      if not c then c = spr:newCel(l, f) end
      return c.image, l
    end
  end
  error("layer not found: " .. layerName)
end

local function px(img, x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end

local function rect(img, x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(img, x, y, c) end end
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

local img = celImgFrame("detail", 1)

-- Book colors
local BOOK_A = Color{r=124, g=45,  b=18, a=255}  -- #7c2d12
local BOOK_B = Color{r=146, g=64,  b=14, a=255}  -- #92400e
local BOOK_C = Color{r=69,  g=26,  b=3,  a=255}  -- #451a03
local PAPER  = Color{r=231, g=213, b=184, a=255} -- #e7d5b8

-- Top shelf (y=3-22): books x=2-58
local books_top = {
  {x1=2,  x2=7,  c=BOOK_A},
  {x1=8,  x2=13, c=BOOK_B},
  {x1=14, x2=18, c=BOOK_C},
  {x1=19, x2=24, c=BOOK_A},
  {x1=25, x2=29, c=BOOK_B},
  {x1=31, x2=35, c=BOOK_C},
  {x1=36, x2=42, c=BOOK_A},
  {x1=43, x2=48, c=BOOK_B},
  {x1=50, x2=55, c=BOOK_C},
}
for _, b in ipairs(books_top) do
  rect(img, b.x1, 3, b.x2, 23, b.c)
end

-- Middle shelf (y=28-47): fewer, looser
local books_mid = {
  {x1=3,  x2=9,  c=BOOK_C},
  {x1=11, x2=18, c=BOOK_A},
  {x1=20, x2=24, c=BOOK_B},
  {x1=34, x2=40, c=BOOK_A},
  {x1=42, x2=47, c=BOOK_C},
}
for _, b in ipairs(books_mid) do
  rect(img, b.x1, 28, b.x2, 48, b.c)
end

-- Bottom shelf (y=53-68): sparse
local books_bot = {
  {x1=5,  x2=12, c=BOOK_B},
  {x1=14, x2=19, c=BOOK_C},
  {x1=28, x2=35, c=BOOK_A},
}
for _, b in ipairs(books_bot) do
  rect(img, b.x1, 53, b.x2, 68, b.c)
end

-- Paper stack on desk surface (center-ish)
rect(img, 215, 65, 248, 67, PAPER)
rect(img, 218, 63, 245, 65, PAPER)
rect(img, 220, 61, 242, 63, PAPER)

print("office detail done")
spr:saveAs(ASEPRITE_PATH)
app.exit()
