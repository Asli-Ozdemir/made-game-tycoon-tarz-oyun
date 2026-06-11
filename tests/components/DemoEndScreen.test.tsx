// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/audio/soundService', () => ({ sfx: vi.fn() }))

import DemoEndScreen from '@/components/DemoEndScreen'
import { useGameStore } from '@/store/gameStore'
import { useTimeStore } from '@/store/timeStore'
import { useIdeaSeedStore } from '@/store/ideaSeedStore'
import { useNPCStore } from '@/store/npcStore'

beforeEach(() => {
  useGameStore.getState().reset()
  useGameStore.setState({ gamePhase: 'playing', money: 62_000 })
  useIdeaSeedStore.getState().reset()
  useIdeaSeedStore.getState().addSeed('nostalji', 4)
  useNPCStore.getState().reset()
})

describe('DemoEndScreen', () => {
  it('istatistikleri ve wishlist çağrısını gösterir', () => {
    render(<DemoEndScreen onClose={() => {}} />)
    expect(screen.getByText(/hikaye daha yeni başlıyor/i)).toBeTruthy()
    expect(screen.getByText(/wishlist/i)).toBeTruthy()
    expect(screen.getByText(/62.000|62,000/)).toBeTruthy()
  })

  it('"Keşfe devam et" onClose çağırır', () => {
    const onClose = vi.fn()
    render(<DemoEndScreen onClose={onClose} />)
    fireEvent.click(screen.getByText(/keşfe devam et/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('"Ana menü" gamePhase\'i title yapar', () => {
    render(<DemoEndScreen onClose={() => {}} />)
    fireEvent.click(screen.getByText(/ana menü/i))
    expect(useGameStore.getState().gamePhase).toBe('title')
  })
})
