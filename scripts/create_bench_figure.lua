-- Bench + sitting silhouette — 48x36 px, transparent bg
-- Figure faces RIGHT clearly (toward city)

local OUTPUT = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\bench_figure.png"

local W, H = 48, 36
local spr  = Sprite(W, H, ColorMode.RGB)
local img  = spr.cels[1].image

local T   = Color{r=0,  g=0,  b=0,  a=0  }
local FIG = Color{r=10, g=3,  b=0,  a=255}
local BNC = Color{r=38, g=14, b=6,  a=255}
local SHD = Color{r=18, g=6,  b=2,  a=255}

for y = 0, H-1 do for x = 0, W-1 do img:drawPixel(x, y, T) end end

local function px(x, y, c)
  if x >= 0 and x < W and y >= 0 and y < H then img:drawPixel(x, y, c) end
end
local function rect(x1, y1, x2, y2, c)
  for y = y1, y2 do for x = x1, x2 do px(x, y, c) end end
end
local function ellipse(cx, cy, rx, ry, c)
  for y = cy-ry, cy+ry do for x = cx-rx, cx+rx do
    local dx = (x-cx)/(rx+0.5)
    local dy = (y-cy)/(ry+0.5)
    if dx*dx + dy*dy <= 1.0 then px(x, y, c) end
  end end
end

-- ── BENCH ──────────────────────────────────────────────
rect(2, 13, 42, 14, BNC)   -- backrest
rect(5, 15, 8,  20, BNC)   -- left support
rect(29, 15, 32, 20, BNC)  -- right support
rect(2, 20, 42, 21, BNC)   -- seat
rect(2, 22, 42, 22, SHD)   -- seat shadow
rect(4,  23, 7,  33, BNC)  -- left leg
rect(32, 23, 35, 33, BNC)  -- right leg
rect(5,  34, 34, 34, Color{r=10,g=4,b=1,a=100}) -- ground shadow

-- ── FIGURE facing RIGHT ─────────────────────────────────
-- The figure's BACK is on the LEFT, face looks RIGHT
-- Back of head at x≈8, face at x≈18

-- Head (back-left to face-right)
ellipse(13, 5, 5, 5, FIG)
-- Hair / hat suggestion (flat cap)
rect(9, 1, 17, 2, FIG)
rect(8, 2, 18, 3, FIG)

-- Neck
rect(11, 10, 14, 12, FIG)

-- Torso (upright, sitting)
rect(8, 12, 17, 21, FIG)

-- Left arm (back arm, barely visible behind body)
rect(7, 13, 9, 18, FIG)

-- Right arm: reaches FORWARD-RIGHT (toward city direction)
rect(17, 13, 22, 16, FIG)  -- upper arm going right
rect(20, 16, 30, 18, FIG)  -- forearm extending right
rect(28, 17, 32, 20, FIG)  -- hand resting on knee

-- Thighs extending right (sitting position)
rect(10, 20, 28, 22, FIG)

-- Right lower leg (hanging forward-right)
rect(22, 23, 26, 33, FIG)
-- Left lower leg (hanging straight)
rect(13, 23, 17, 33, FIG)

-- Feet
rect(20, 31, 28, 34, FIG)  -- right foot (forward)
rect(11, 31, 18, 34, FIG)  -- left foot

-- ── SAVE ───────────────────────────────────────────────
spr:saveCopyAs(OUTPUT)
print("bench_figure saved → " .. OUTPUT)
app.exit()
