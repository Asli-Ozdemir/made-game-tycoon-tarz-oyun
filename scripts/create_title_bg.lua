-- Title screen background — 683×384 pixel art (2× scale)
-- Run: "C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe" --batch --script scripts/create_title_bg.lua

local OUTPUT = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.png"
local W, H   = 683, 384

local spr = Sprite(W, H, ColorMode.RGB)
local img = spr.cels[1].image

-- ── Helpers ─────────────────────────────────────────────
local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end

local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end

local function lerp(a, b, t) return math.floor(a + t * (b - a)) end

local function lerpColor(r0,g0,b0, r1,g1,b1, t)
  return Color{ r=lerp(r0,r1,t), g=lerp(g0,g1,t), b=lerp(b0,b1,t), a=255 }
end

-- ── Sky gradient ─────────────────────────────────────────
local SKY = {
  { 0.00,  27, 42, 74 },
  { 0.18,  46, 63,110 },
  { 0.42,  74, 32, 96 },
  { 0.62, 107, 26, 58 },
  { 0.80,  61, 26,  6 },
  { 1.00,  42, 15,  4 },
}

local function skyColor(yn)
  for i = 1, #SKY - 1 do
    local y0 = SKY[i][1];   local r0,g0,b0 = SKY[i][2],   SKY[i][3],   SKY[i][4]
    local y1 = SKY[i+1][1]; local r1,g1,b1 = SKY[i+1][2], SKY[i+1][3], SKY[i+1][4]
    if yn <= y1 then
      local t = (yn - y0) / (y1 - y0)
      return lerpColor(r0,g0,b0, r1,g1,b1, t)
    end
  end
  return Color{r=42, g=15, b=4, a=255}
end

print("Drawing sky...")
for y = 0, H-1 do
  local c = skyColor(y / (H - 1))
  for x = 0, W-1 do img:drawPixel(x, y, c) end
end
print("Sky done.")

-- ── Stars ────────────────────────────────────────────────
local STARS = {
  { 55, 31 }, { 188, 50 }, { 266, 23 }, { 109, 69 },
  { 229, 38 }, { 304, 19 }, { 27,  77 }, { 157, 11 },
  { 239, 58 }, { 314, 35 },
}
local SW = Color{r=255, g=255, b=255, a=200}
local SW2 = Color{r=220, g=220, b=255, a=140}
for _, s in ipairs(STARS) do
  px(s[1], s[2], SW)
  px(s[1]+1, s[2], SW2)
  px(s[1], s[2]+1, SW2)
end

-- ── City skyline — right side, blended faint ─────────────
local GROUND_Y = 299

local BLDGS = {
  { 659, 299-140, 16, 192, 24, 95  },
  { 633, 299-210, 22, 155, 48, 255 },
  { 615, 299-100, 14, 192, 24, 95  },
  { 585, 299-260, 26, 155, 48, 255 },
  { 564, 299-160, 17, 192, 24, 95  },
  { 547, 299- 90, 12, 155, 48, 255 },
  { 518, 299-230, 24, 192, 24, 95  },
  { 498, 299-130, 15, 155, 48, 255 },
  { 474, 299-180, 19, 192, 24, 95  },
  { 456, 299-110, 13, 155, 48, 255 },
  { 430, 299-200, 21, 192, 24, 95  },
  { 415, 299- 75, 10, 155, 48, 255 },
  { 392, 299-150, 18, 192, 24, 95  },
  { 362, 299-240, 25, 155, 48, 255 },
}

local OPACITY = 0.28
print("Drawing buildings...")
for _, b in ipairs(BLDGS) do
  local xl, yt, bw, br, bg, bb = b[1], b[2], b[3], b[4], b[5], b[6]
  for y = yt, GROUND_Y - 1 do
    local sky = skyColor(y / (H - 1))
    local c = Color{
      r = lerp(sky.red,   br, OPACITY),
      g = lerp(sky.green, bg, OPACITY),
      b = lerp(sky.blue,  bb, OPACITY),
      a = 255,
    }
    for x = xl, xl + bw - 1 do px(x, y, c) end
  end
end

spr:saveCopyAs(OUTPUT)
print("Saved: " .. OUTPUT)
app.exit()
