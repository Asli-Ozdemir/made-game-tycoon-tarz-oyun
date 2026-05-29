import { useState } from 'react'
import BackgroundStep from './character/BackgroundStep'
import PersonalityStep from './character/PersonalityStep'
import IdentityStep from './character/IdentityStep'
import { useCharacterStore } from '@/store/characterStore'
import { useGameStore } from '@/store/gameStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { BACKGROUNDS } from '@/data/backgrounds'

type Step = 1 | 2 | 3

export default function CharacterCreationWizard() {
  const [step, setStep] = useState<Step>(1)
  const background  = useCharacterStore((s) => s.background)
  const finalize    = useCharacterStore((s) => s.finalize)
  const setMoney    = useGameStore((s) => s.setMoney)
  const setRep      = useGameStore((s) => s.setReputation)

  function handleFinalize(name: string, studioName: string) {
    useCharacterStore.getState().setIdentity(name, studioName)

    const bg = BACKGROUNDS.find((b) => b.id === background)!
    setMoney(bg.houseSale)
    if (bg.startRep > 0) setRep(bg.startRep)

    finalize()
    useCutsceneStore.getState().startCutscene('kovulma')
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Adım göstergesi */}
        <div className="flex justify-center gap-4 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {step === 1 && <BackgroundStep onNext={() => setStep(2)} />}
        {step === 2 && <PersonalityStep onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <IdentityStep onBack={() => setStep(2)} onFinalize={handleFinalize} />}
      </div>
    </div>
  )
}
