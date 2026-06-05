import type { CutsceneId } from '@/types/cutscene'
import type { NPCDef } from '@/data/npcDialogues'

export type LifeStage = 'cocuk' | 'ergen' | 'genc_yetiskin' | 'yetiskin' | 'yasli'

export interface LifeCtx {
  year:         number
  yearsElapsed: number
  getAge:       (npcId: string) => number
  getStage:     (npcId: string) => LifeStage
  hasFlag:      (flag: string) => boolean
  heartOf:      (npcId: string) => number
}

export type LifeTrigger =
  | { kind: 'npcAge';       npcId: string; age: number }
  | { kind: 'npcStage';     npcId: string; stage: LifeStage }
  | { kind: 'year';         year: number }
  | { kind: 'yearsElapsed'; years: number }
  | { kind: 'condition';    test: (ctx: LifeCtx) => boolean }

export type LifeEffect =
  | { kind: 'unlockRole';      npcId: string; role: 'hireable' | 'romanceable' }
  | { kind: 'setDialogueNode'; npcId: string; node: string }
  | { kind: 'cutscene';        id: CutsceneId }
  | { kind: 'spawnNpc';        def: NPCDef }
  | { kind: 'retireNpc';       npcId: string; reason?: string }
  | { kind: 'setFlag';         flag: string }

export interface LifeEvent {
  id:      string
  once?:   boolean
  trigger: LifeTrigger
  effect:  LifeEffect
}
