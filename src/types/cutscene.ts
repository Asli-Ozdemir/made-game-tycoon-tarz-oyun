export interface DialogLine {
  speaker: string  // "Patron", "{{playerName}}", "Anlatıcı"
  text:    string  // {{playerName}} ve {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'studio'
  lines:      DialogLine[]
}

export type CutsceneId = 'kovulma' | 'ilk_yayin'

export interface CutsceneDef {
  id:     CutsceneId
  frames: CutsceneFrame[]
}
