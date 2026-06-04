-- title_bg_09_export.lua
local ASEPRITE_PATH = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.aseprite"
local PNG_PATH      = "C:\\Users\\umutm\\Desktop\\mad-game-tarzı-oyun\\assets\\title_bg.png"

local spr = app.open(ASEPRITE_PATH)
spr:saveCopyAs(PNG_PATH)
print("Exported: " .. PNG_PATH)
app.exit()
