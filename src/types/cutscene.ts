import type { BackgroundId } from '@/data/backgrounds'

export interface DialogLine {
  speaker: string  // "İK Müdürü", "Patron", "Yeni CEO", "Kurul Başkanı", "Eş", "Hâkim", "{{playerName}}"
  text:    string  // {{playerName}} ve {{studioName}} placeholder destekler
}

export interface CutsceneFrame {
  background: 'office' | 'bedroom' | 'court' | 'coast' | 'studio'
  lines:      DialogLine[]
}

export type CutsceneId = 'kovulma' | 'ilk_yayin'

export interface CutsceneDef {
  id:        CutsceneId
  frames?:   CutsceneFrame[]                          // varyantsız sahneler (ilk_yayin)
  variants?: Record<BackgroundId, CutsceneFrame[]>    // arkaplana özgü sahneler (kovulma)
}
