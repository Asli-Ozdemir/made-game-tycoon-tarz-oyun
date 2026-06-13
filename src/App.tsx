import { useEffect, useRef, useState } from 'react'
import GameCanvas from '@/components/GameCanvas'
import HUD from '@/components/HUD'
import Dashboard from '@/components/Dashboard'
import PublishResult from '@/components/PublishResult'
import CafePanel from '@/components/CafePanel'
import FairPanel from '@/components/FairPanel'
import AcademyPanel from '@/components/AcademyPanel'
import SahafPanel   from '@/components/SahafPanel'
import BalikciPanel from '@/components/BalikciPanel'
import PubPanel     from '@/components/PubPanel'
import BarPanel        from '@/components/BarPanel'
import DetectivePanel  from '@/components/DetectivePanel'
import NehirPanel     from '@/components/NehirPanel'
import ArcadePanel    from '@/components/ArcadePanel'
import LawyerPanel   from '@/components/LawyerPanel'
import EmlakcilikPanel from '@/components/EmlakcilikPanel'
import CharacterCreationWizard from '@/components/CharacterCreationWizard'
import CutscenePlayer from '@/components/CutscenePlayer'
import ResolutionScreen from '@/components/ResolutionScreen'
import { useTimeStore } from '@/store/timeStore'
import { useProjectStore } from '@/store/projectStore'
import { useGameStore } from '@/store/gameStore'
import { useEmployeeStore } from '@/store/employeeStore'
import { useDayTimeStore } from '@/store/dayTimeStore'
import { useWorldStore } from '@/store/worldStore'
import { useCharacterStore } from '@/store/characterStore'
import { useCutsceneStore } from '@/store/cutsceneStore'
import { useRivalStore } from '@/store/rivalStore'
import EventModal from '@/components/EventModal'
import { useEventStore } from '@/store/eventStore'
import { useTrainingStore } from '@/store/trainingStore'
import { useSaveStore } from '@/store/saveStore'
import StartScreen from '@/components/StartScreen'
import SaveLoadPanel from '@/components/SaveLoadPanel'
import { useEconomyStore } from '@/store/economyStore'
import SaleEventModal from '@/components/SaleEventModal'
import CrisisModal      from '@/components/CrisisModal'
import BankruptcyScreen from '@/components/BankruptcyScreen'
import { useMarketStore } from '@/store/marketStore'
import OfferModal from '@/components/OfferModal'
import InterviewModal from '@/components/InterviewModal'
import EpiloguePlayer from '@/components/EpiloguePlayer'
import MarketPanel from '@/components/MarketPanel'
import { useCampaignStore } from '@/store/campaignStore'
import SocialEventToast from '@/components/SocialEventToast'
import CampaignPanel    from '@/components/CampaignPanel'
import IndustryEventModal from '@/components/IndustryEventModal'
import IndustryEventPanel from '@/components/IndustryEventPanel'
import { useIndustryEventStore } from '@/store/industryEventStore'
import { transitionToRoom } from '@/pixi/Game'
import SleepOverlay from '@/components/SleepOverlay'
import { useObjectiveStore } from '@/store/objectiveStore'
import ObjectiveBanner from '@/components/ObjectiveBanner'
import MovementHint from '@/components/MovementHint'
import StudioDeskPointer from '@/components/StudioDeskPointer'
import { initSounds, playMusic, stopMusic } from '@/audio/soundService'
import DemoEndScreen from '@/components/DemoEndScreen'
import { DEMO_MODE } from '@/config'

export default function App() {
  const [resultProjectId, setResultProjectId] = useState<string | null>(null)
  const [showDemoEnd, setShowDemoEnd] = useState(false)
  const demoEndShownRef = useRef(false)

  const advance         = useTimeStore((s) => s.advance)
  const tickAllProjects = useProjectStore((s) => s.tickAllProjects)
  const addMoney        = useGameStore((s) => s.addMoney)
  const gamePhase       = useGameStore((s) => s.gamePhase)
  const setGamePhase    = useGameStore((s) => s.setGamePhase)
  const weeklyTick      = useEmployeeStore((s) => s.weeklyTick)
  const setOnWeeklyTick = useDayTimeStore((s) => s.setOnWeeklyTick)
  const gameMode        = useWorldStore((s) => s.gameMode)
  const currentLocation = useWorldStore((s) => s.currentLocation)
  const transitionState = useWorldStore((s) => s.transitionState)
  const currentRoomId   = useWorldStore((s) => s.currentRoomId)
  const pendingRoomId   = useWorldStore((s) => s.pendingRoomId)

  // Wire weeklyTick callback once
  useEffect(() => {
    setOnWeeklyTick(() => {
      useEconomyStore.getState().computeAndApplyCosts()
      useEconomyStore.getState().tickLoan()
      useEconomyStore.getState().activateSaleEvent()
      useEconomyStore.getState().deactivateSaleEvent()
      useEconomyStore.getState().checkCrisis()
      useEconomyStore.getState().tickCrisis()
      useEconomyStore.getState().scheduleSaleEvent()
      useMarketStore.getState().updatePlatformShares()
      useMarketStore.getState().schedulerTick()
      useCampaignStore.getState().weeklyTick()
      useIndustryEventStore.getState().weeklyTick()
      const prevSeason = useTimeStore.getState().date.season
      advance()
      const tickCount = useTimeStore.getState().tickCount
      const { totalSalary } = weeklyTick(tickCount)
      if (totalSalary > 0) addMoney(-totalSalary)
      tickAllProjects()
      const year = useTimeStore.getState().date.year
      useTrainingStore.getState().tickCourses(year)
      // Sezon değişince auto-save
      const newSeason = useTimeStore.getState().date.season
      if (newSeason !== prevSeason && useCharacterStore.getState().isCreated) {
        const { save, activeSlotId } = useSaveStore.getState()
        save(activeSlotId)
      }
    })
  }, [advance, tickAllProjects, addMoney, weeklyTick, setOnWeeklyTick])

  const setOnDailyTick = useDayTimeStore((s) => s.setOnDailyTick)

  useEffect(() => {
    setOnDailyTick(() => {
      if (!useCharacterStore.getState().isCreated) return
      const { save, activeSlotId } = useSaveStore.getState()
      save(activeSlotId)
    })
  }, [setOnDailyTick])

  const setGameMode      = useWorldStore((s) => s.setGameMode)
  const setLocation      = useWorldStore((s) => s.setLocation)
  const setIsPaused      = useDayTimeStore((s) => s.setIsPaused)
  const isCreated        = useCharacterStore((s) => s.isCreated)
  const showStartScreen  = useSaveStore((s) => s.showStartScreen)

  useEffect(() => {
    if (!isCreated) return
    const { save, activeSlotId, showStartScreen } = useSaveStore.getState()
    if (!showStartScreen) save(activeSlotId)
  }, [isCreated])

  const showSavePanel    = useSaveStore((s) => s.showSavePanel)
  const activeCutscene   = useCutsceneStore((s) => s.activeCutscene)
  const pendingResolution = useRivalStore((s) => s.pendingResolution)
  const tryStartOnboarding = useObjectiveStore((s) => s.tryStartOnboarding)
  const pendingEvent = useEventStore((s) => s.pendingEvent)
  const pendingSaleEventModal = useEconomyStore((s) => s.pendingSaleEventModal)
  const isInCrisis = useEconomyStore((s) => s.isInCrisis)
  const isBankrupt = useEconomyStore((s) => s.isBankrupt)
  const pendingOffer = useMarketStore((s) => s.pendingOffer)
  const pendingToast = useCampaignStore((s) => s.pendingToast)
  const pendingEventModal = useIndustryEventStore((s) => s.pendingModal)

  const [toast, setToast] = useState<string | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  // ESC key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Escape') return
      const { gameMode, currentLocation } = useWorldStore.getState()
      if (gameMode === 'tycoon') {
        setGameMode('exploration')
        setIsPaused(false)
      } else if (currentLocation !== null) {
        setLocation(null)
        setIsPaused(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setGameMode, setLocation, setIsPaused])

  // console.info interceptor → toast
  useEffect(() => {
    const orig = console.info.bind(console)
    console.info = (...args: unknown[]) => {
      if (typeof args[0] === 'string') showToast(args[0])
      orig(...args)
    }
    return () => { console.info = orig }
  }, [])

  useEffect(() => {
    void initSounds()
  }, [])

  useEffect(() => {
    if (gamePhase === 'playing') {
      playMusic('coast', { fade: 1200 })
    } else if (gamePhase === 'creation') {
      stopMusic({ fade: 800 })
    }
  }, [gamePhase])

  useEffect(() => {
    if (gamePhase === 'playing') tryStartOnboarding()
  }, [gamePhase, tryStartOnboarding])

  if (isBankrupt) return <BankruptcyScreen />

  if (gamePhase === 'title')    return <StartScreen />
  if (gamePhase === 'creation') return <CharacterCreationWizard />
  if (gamePhase === 'intro')    return <CutscenePlayer onComplete={() => setGamePhase('playing')} />
  if (pendingResolution) return <ResolutionScreen />
  if (pendingEvent)      return <EventModal />

  const isTycoon = gameMode === 'tycoon'

  return (
    <>
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#1a1a2e' }}>
      {/* GameCanvas her zaman mount'ta — cutscene sırasında unmount olmaz */}
      <GameCanvas />
      <ObjectiveBanner />
      <MovementHint />
      <StudioDeskPointer />

      {/* HUD — always visible, z-30 tycoon overlay (z-20) üzerinde */}
      <div className="absolute inset-x-0 top-0 z-30">
        <HUD />
      </div>

      {/* Tycoon overlay — only interactive in tycoon mode */}
      <div
        className="absolute inset-0 z-20"
        style={{
          pointerEvents: isTycoon ? 'all' : 'none',
          opacity: isTycoon ? 1 : 0,
          background: isTycoon ? 'rgba(0,0,0,0.6)' : 'transparent',
          transition: 'opacity 0.2s',
        }}
      >
        <div className="h-full flex flex-col pt-14">
          <div className="flex-1 overflow-auto">
            <Dashboard onPublishResult={(id) => setResultProjectId(id)} />
          </div>
        </div>
      </div>

      {/* Location panels */}
      {currentLocation === 'cafe' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <CafePanel />
        </div>
      )}
      {currentLocation === 'fair' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <FairPanel />
        </div>
      )}
      {currentLocation === 'akademi' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <AcademyPanel />
        </div>
      )}
      {currentLocation === 'sahaf' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <SahafPanel />
        </div>
      )}
      {currentLocation === 'balikci' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <BalikciPanel />
        </div>
      )}
      {currentLocation === 'pub' && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <PubPanel />
        </div>
      )}
      {currentLocation === 'bar' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <BarPanel />
        </div>
      )}
      {currentLocation === 'detective' && (
        <div className="absolute inset-0 z-20 bg-black/75 flex items-center justify-center">
          <DetectivePanel />
        </div>
      )}
      {currentLocation === 'nehir' && (
        <div className="absolute inset-0 z-20 bg-black/65 flex items-center justify-center">
          <NehirPanel />
        </div>
      )}
      {currentLocation === 'arcade' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <ArcadePanel />
        </div>
      )}
      {currentLocation === 'lawyers_office' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <LawyerPanel />
        </div>
      )}
      {currentLocation === 'emlakcilik' && (
        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
          <EmlakcilikPanel />
        </div>
      )}
      {currentLocation === 'sleep' && (
        <SleepOverlay />
      )}

      {/* Publish result */}
      {resultProjectId && (
        <div className="absolute inset-0 z-30">
          <PublishResult
            projectId={resultProjectId}
            onContinue={() => {
              setResultProjectId(null)
              if (
                DEMO_MODE &&
                useGameStore.getState().totalPublished === 1 &&
                !demoEndShownRef.current
              ) {
                demoEndShownRef.current = true
                setShowDemoEnd(true)
              }
            }}
          />
        </div>
      )}

      {showDemoEnd && <DemoEndScreen onClose={() => setShowDemoEnd(false)} />}

      {pendingSaleEventModal && <SaleEventModal />}

      {isInCrisis && !isBankrupt && <CrisisModal />}

      {toast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl text-sm shadow-xl pointer-events-none">
          {toast}
        </div>
      )}

      {pendingOffer !== null && <OfferModal />}
      <MarketPanel />
      {pendingToast !== null && <SocialEventToast />}
      <CampaignPanel />
      {pendingEventModal !== null && <IndustryEventModal />}
      <IndustryEventPanel />
      {showSavePanel && <SaveLoadPanel />}
      <InterviewModal />
      <EpiloguePlayer />

    </div>
    {/* Cutscene overlay — main div dışında, fixed pozisyon için containment yok */}
    {activeCutscene && <CutscenePlayer />}
    <div
      data-testid="room-fade-overlay"
      style={{
        position:   'fixed',
        inset:      0,
        background: '#000',
        opacity:    transitionState === 'fading-out' ? 1 : 0,
        transition: 'opacity 400ms ease',
        pointerEvents: transitionState !== 'idle' ? 'all' : 'none',
        zIndex: 100,
      }}
      onTransitionEnd={() => {
        if (transitionState === 'fading-out' && pendingRoomId) {
          transitionToRoom(pendingRoomId, currentRoomId)
          useWorldStore.getState().setTransitionFadedOut()
        } else if (transitionState === 'fading-in') {
          useWorldStore.getState().completeTransition()
        }
      }}
    />
    </>
  )
}
