import { describe, it, expect, beforeEach } from 'vitest'
import { serialize, deserialize } from '@/engine/savegameEngine'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { useNPCStore } from '@/store/npcStore'
import { useLifePathStore } from '@/store/lifePathStore'
import { useLifeStore } from '@/store/lifeStore'
import { useRomanceStore } from '@/store/romanceStore'
import { useCharacterStore } from '@/store/characterStore'

function resetAll() {
  useIdeaSeedStore.getState().reset()
  useSkillTreeStore.getState().reset()
  useNPCStore.getState().reset()
  useLifePathStore.getState().reset()
  useLifeStore.getState().reset()
  useRomanceStore.getState().reset()
}

beforeEach(() => {
  resetAll()
  useCharacterStore.setState({ isCreated: true, name: 'Test', studioName: 'Garage' })
})

describe('savegameEngine v2 — RPG store round-trip', () => {
  it('altı RPG store kaydedilip geri yüklenir (Set dönüşümleri dahil)', () => {
    useIdeaSeedStore.getState().addSeed('nostalji', 3)
    useIdeaSeedStore.getState().addKirliSeed('kaos')
    useSkillTreeStore.setState({ unlockedNodeIds: ['nos_t1'], selectedLifePath: 'huzur' })
    useNPCStore.getState().completeDialogue('marcus', 'dia_1', 40)
    useNPCStore.getState().capRelationship('remy', 80)
    useLifePathStore.setState({ progress: { hirs: 0, huzur: 55, emek: 10 }, activePathId: null })
    useLifeStore.setState({
      lastProcessedYear: 2003,
      firedEvents: new Set(['ev_1']),
      flags: new Set(['flag_a']),
      retiredNpcs: new Set(['aldo']),
      dialogueOverrides: { marcus: 'yas' },
    })
    useRomanceStore.setState({
      stage: { chloe: 'sevgili' }, dateCount: { chloe: 2 },
      hasBouquet: true, hasRing: false,
    })

    const json = serialize()
    expect(JSON.parse(json).version).toBe(2)

    resetAll()
    deserialize(json)

    expect(useIdeaSeedStore.getState().seeds.nostalji).toBe(3)
    expect(useIdeaSeedStore.getState().kirliSeeds.kaos).toBe(1)
    expect(useSkillTreeStore.getState().unlockedNodeIds).toEqual(['nos_t1'])
    expect(useSkillTreeStore.getState().selectedLifePath).toBe('huzur')
    expect(useNPCStore.getState().getRelationship('marcus')).toBeGreaterThan(0)
    expect(useNPCStore.getState().npcs.marcus.seenDialogueIds).toContain('dia_1')
    expect(useNPCStore.getState().relationshipCaps.remy).toBe(80)
    expect(useLifePathStore.getState().progress.huzur).toBe(55)
    expect(useLifeStore.getState().firedEvents.has('ev_1')).toBe(true)
    expect(useLifeStore.getState().flags.has('flag_a')).toBe(true)
    expect(useLifeStore.getState().isRetired('aldo')).toBe(true)
    expect(useLifeStore.getState().dialogueOverrides.marcus).toBe('yas')
    expect(useRomanceStore.getState().getStage('chloe')).toBe('sevgili')
    expect(useRomanceStore.getState().hasBouquet).toBe(true)
  })

  it('v1 kaydı yüklenir — RPG store\'lar default\'a döner, hata fırlatılmaz', () => {
    useIdeaSeedStore.getState().addSeed('hikaye', 5)

    const snapshot = JSON.parse(serialize())
    snapshot.version = 1
    delete snapshot.ideaSeeds; delete snapshot.skillTree; delete snapshot.npc
    delete snapshot.lifePath;  delete snapshot.life;      delete snapshot.romance

    expect(() => deserialize(JSON.stringify(snapshot))).not.toThrow()
    expect(useIdeaSeedStore.getState().seeds.hikaye).toBe(0)
    expect(useNPCStore.getState().getRelationship('marcus')).toBe(0)
    expect(useRomanceStore.getState().hasBouquet).toBe(false)
  })

  it('desteklenmeyen versiyon hata fırlatır', () => {
    const snapshot = JSON.parse(serialize())
    snapshot.version = 3
    expect(() => deserialize(JSON.stringify(snapshot))).toThrow()
  })

  it('bozuk npc kaydı (seenDialogueIds eksik) güvenli şekilde normalize edilir', () => {
    const snapshot = JSON.parse(serialize())
    snapshot.npc.npcs.marcus = { relationship: 50 }   // seenDialogueIds yok
    deserialize(JSON.stringify(snapshot))
    expect(useNPCStore.getState().npcs.marcus.seenDialogueIds).toEqual([])
    expect(useNPCStore.getState().getRelationship('marcus')).toBe(50)
    // hasSeenDialogue patlamamalı
    expect(useNPCStore.getState().hasSeenDialogue('marcus', 'dia_1')).toBe(false)
  })
})
