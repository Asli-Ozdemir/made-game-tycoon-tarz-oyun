import { useWorldStore } from '../worldStore'

beforeEach(() => {
  useWorldStore.setState({
    currentRoomId: 'coast',
    transitionState: 'idle',
    pendingRoomId: null,
  })
})

describe('worldStore room transitions', () => {
  it('beginTransition sets fading-out and pendingRoomId', () => {
    useWorldStore.getState().beginTransition('bridge')
    const s = useWorldStore.getState()
    expect(s.transitionState).toBe('fading-out')
    expect(s.pendingRoomId).toBe('bridge')
  })

  it('setTransitionFadedOut sets fading-in', () => {
    useWorldStore.getState().beginTransition('bridge')
    useWorldStore.getState().setTransitionFadedOut()
    expect(useWorldStore.getState().transitionState).toBe('fading-in')
  })

  it('completeTransition sets idle and updates currentRoomId', () => {
    useWorldStore.getState().beginTransition('bridge')
    useWorldStore.getState().setTransitionFadedOut()
    useWorldStore.getState().completeTransition()
    const s = useWorldStore.getState()
    expect(s.transitionState).toBe('idle')
    expect(s.currentRoomId).toBe('bridge')
    expect(s.pendingRoomId).toBeNull()
  })

  it('beginTransition is ignored when already transitioning', () => {
    useWorldStore.getState().beginTransition('bridge')
    useWorldStore.getState().beginTransition('city')
    expect(useWorldStore.getState().pendingRoomId).toBe('bridge')
  })
})
