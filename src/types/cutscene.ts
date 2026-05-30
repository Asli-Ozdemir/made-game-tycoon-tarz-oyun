import type { BackgroundId } from '@/data/backgrounds'
import type { ResolutionChoice } from '@/types/rival'

export interface DialogLine {
  speaker: string
  text:    string
}

export interface CutsceneFrame {
  background:
    | 'office' | 'bedroom' | 'studio'
    | 'server_room' | 'gallery' | 'boardroom'
    | 'court' | 'coast'
  lines: DialogLine[]
}

export type CutsceneId =
  | 'kovulma' | 'ilk_yayin'
  | 'nexus_notice' | 'nexus_meeting'
  | 'awards_win' | 'awards_win_gallery' | 'awards_win_boardroom' | 'awards_lose_to_nexus'
  | 'nexus_resolution' | 'indie_resolution'

export interface CutsceneDef {
  id:              CutsceneId
  frames?:         CutsceneFrame[]
  variants?:       Record<BackgroundId, CutsceneFrame[]>
  choiceVariants?: Partial<Record<ResolutionChoice, CutsceneFrame[]>>
}
