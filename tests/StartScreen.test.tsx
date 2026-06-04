// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StartScreen from '@/components/StartScreen'

// Mock useSaveStore
vi.mock('@/store/saveStore', () => ({
  useSaveStore: (selector: (s: unknown) => unknown) =>
    selector({
      slots: [
        { slotId: 1, isEmpty: true,  label: '',     savedAt: 0 },
        { slotId: 2, isEmpty: true,  label: '',     savedAt: 0 },
        { slotId: 3, isEmpty: true,  label: '',     savedAt: 0 },
      ],
      setActiveSlot:      vi.fn(),
      setShowStartScreen: vi.fn(),
      load:               vi.fn(),
      initSlots:          vi.fn(),
    }),
}))

describe('StartScreen', () => {
  it('renders logo image', () => {
    render(<StartScreen />)
    expect(screen.getByAltText('Magenta Reach')).toBeTruthy()
  })

  it('renders NEW GAME button', () => {
    render(<StartScreen />)
    expect(screen.getByText('NEW GAME')).toBeTruthy()
  })

  it('renders EXIT button', () => {
    render(<StartScreen />)
    expect(screen.getByText('EXIT')).toBeTruthy()
  })

  it('CONTINUE button is disabled when no saves exist', () => {
    render(<StartScreen />)
    const btn = screen.getByText('CONTINUE') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})
