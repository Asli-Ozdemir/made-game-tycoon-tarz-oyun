// src/components/IntentDialogueWidget.tsx
// Gizli niyet seçimi — oyuncu hangi seçimin hangi bonusu verdiğini bilmez.
import { useSocialSkillStore } from '@/store/socialSkillStore'
import type { IntentDialogue } from '@/data/detectiveCases'

interface Props {
  name:        string
  dialogue:    IntentDialogue
  onComplete:  () => void
}

export default function IntentDialogueWidget({ name, dialogue, onComplete }: Props) {
  function pick(intent: 'suspicious' | 'trusting') {
    const gainXP = useSocialSkillStore.getState().gainXP
    if (intent === 'suspicious') gainXP('sogukkanlilik')
    else                         gainXP('sicakkanlilik')
    onComplete()
  }

  return (
    <div className="mt-3 border border-gray-700 rounded-xl p-4 bg-gray-900/60">
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-mono">{name} söylüyor</p>
      <p className="text-gray-200 text-sm leading-relaxed italic mb-4">"{dialogue.prompt}"</p>
      <div className="flex flex-col gap-2">
        {dialogue.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => pick(choice.intent)}
            className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors"
          >
            <span className="text-gray-500 mr-2">›</span>
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  )
}
