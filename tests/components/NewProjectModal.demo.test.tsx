// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/config', () => ({
  DEMO_MODE: true,
  DEMO_BLOCKED_ROOMS: new Set(),
  DEMO_BLOCKED_LOCATIONS: new Set(),
}))
vi.mock('@/audio/soundService', () => ({ sfx: vi.fn() }))

import NewProjectModal from '@/components/NewProjectModal'
import { useGameStore } from '@/store/gameStore'

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('DEMO_MODE=true — NewProjectModal ikinci proje kilidi', () => {
  it('totalPublished >= 1 ise kilit mesajı gösterilir', () => {
    useGameStore.setState({ totalPublished: 1 })
    render(<NewProjectModal onClose={() => {}} />)
    expect(screen.getByText(/tam sürümde seni bekliyor/i)).toBeTruthy()
  })

  it('totalPublished 0 ise normal form gösterilir (kilit mesajı yok)', () => {
    render(<NewProjectModal onClose={() => {}} />)
    expect(screen.queryByText(/tam sürümde seni bekliyor/i)).toBeNull()
  })
})
