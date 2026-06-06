import type { NPCDef } from '@/data/npcDialogues'
import type { Employee } from '@/types/employee'

// Reşit olan bir NPC'yi işe-alınabilir "yerel aday"a çevirir.
// Şimdilik junior-programcı varsayılanı (tek reşit-olan NPC Tessa programcı).
// İleride NPC'ye göre yetenek dağılımı zenginleştirilebilir.
export function npcToCandidate(def: NPCDef): Employee {
  return {
    id: `npc-${def.id}`,
    name: def.name,
    skills: { programming: 3, design: 1, sound: 1, management: 1 },
    salary: 1200,
    loyalty: 70,   // hayranlıkla katılır
    energy: 100,
    personality: 'odakli',
    assignedProjectId: null,
    xp: { programming: 0, design: 0, sound: 0, management: 0 },
    activeCourseId: null,
    traits: [],
  }
}
