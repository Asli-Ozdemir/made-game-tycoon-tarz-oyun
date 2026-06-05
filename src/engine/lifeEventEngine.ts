import type { LifeEvent, LifeCtx } from '@/types/lifeEvent'

function matches(trigger: LifeEvent['trigger'], ctx: LifeCtx): boolean {
  switch (trigger.kind) {
    case 'npcAge':       return ctx.getAge(trigger.npcId) === trigger.age
    case 'npcStage':     return ctx.getStage(trigger.npcId) === trigger.stage
    case 'year':         return ctx.year === trigger.year
    case 'yearsElapsed': return ctx.yearsElapsed === trigger.years
    case 'condition':    return trigger.test(ctx)
  }
}

// Belirli bir yıl için: tetikleyicisi sağlanan ve (once ise) henüz tetiklenmemiş
// olayları döndürür. Saf fonksiyon (uygulamayı lifeStore yapar).
export function eventsForYear(events: LifeEvent[], ctx: LifeCtx, fired: Set<string>): LifeEvent[] {
  return events.filter(e => {
    if ((e.once ?? true) && fired.has(e.id)) return false
    return matches(e.trigger, ctx)
  })
}
