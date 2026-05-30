import { useGameStore }      from '@/store/gameStore'
import { useCharacterStore } from '@/store/characterStore'
import { useTimeStore }      from '@/store/timeStore'
import { useEconomyStore }   from '@/store/economyStore'
import { useProjectStore }   from '@/store/projectStore'
import { useEmployeeStore }  from '@/store/employeeStore'
import { useRivalStore }     from '@/store/rivalStore'
import { useNewsStore }      from '@/store/newsStore'
import { useAwardsStore }    from '@/store/awardsStore'
import { useTrendStore }     from '@/store/trendStore'
import { useEventStore }     from '@/store/eventStore'
import { useTrainingStore }  from '@/store/trainingStore'
import { useCutsceneStore }  from '@/store/cutsceneStore'
import { useDayTimeStore }   from '@/store/dayTimeStore'
import { useSaveStore }      from '@/store/saveStore'

export default function BankruptcyScreen() {
  const money      = useGameStore((s) => s.money)
  const studioName = useCharacterStore((s) => s.studioName)
  const date       = useTimeStore((s) => s.date)

  function handleMainMenu() {
    useGameStore.getState().reset()
    useProjectStore.getState().reset()
    useEmployeeStore.getState().reset()
    useTimeStore.getState().reset()
    useCharacterStore.getState().reset()
    useRivalStore.getState().reset()
    useNewsStore.getState().reset()
    useAwardsStore.getState().reset()
    useTrendStore.getState().reset()
    useEventStore.getState().reset()
    useTrainingStore.getState().reset()
    useCutsceneStore.getState().reset()
    useDayTimeStore.getState().reset()
    useEconomyStore.getState().reset()
    useSaveStore.getState().initSlots()
    useSaveStore.getState().setShowStartScreen(true)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center">
      <h1 className="text-red-500 text-4xl font-bold mb-4">Stüdyo Kapandı</h1>
      <p className="text-gray-400 text-lg mb-2">
        {studioName || 'Stüdyonuz'} {date.year} {date.season} sezonunda iflas etti.
      </p>
      <p className="text-gray-600 text-sm mb-10">
        Son nakit: ${money.toLocaleString()}
      </p>
      <button
        onClick={handleMainMenu}
        className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-base font-medium transition-colors"
      >
        Ana Menüye Dön
      </button>
    </div>
  )
}
