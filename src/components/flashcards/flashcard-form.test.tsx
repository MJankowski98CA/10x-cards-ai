import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FlashcardForm } from './flashcard-form'
import * as actions from '@/app/flashcards/actions'
import { toast } from 'sonner'

// Mock server actions and dependencies
vi.mock('@/app/flashcards/actions', () => ({
  createFlashcard: vi.fn(),
  updateFlashcard: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('FlashcardForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('CARD-01: should create a new flashcard when in create mode', async () => {
    // Arrange
    const createFlashcardMock = actions.createFlashcard as vi.Mock
    createFlashcardMock.mockResolvedValue({ success: true })

    render(<FlashcardForm />)

    const frontTextarea = screen.getByPlaceholderText(
      'Wpisz treść przodu fiszki...',
    )
    const backTextarea = screen.getByPlaceholderText(
      'Wpisz treść tyłu fiszki...',
    )
    const submitButton = screen.getByRole('button', { name: /Utwórz/i })

    // Act
    const frontText = 'Front of the flashcard'
    const backText = 'Back of the flashcard'
    fireEvent.change(frontTextarea, { target: { value: frontText } })
    fireEvent.change(backTextarea, { target: { value: backText } })
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('Zapisywanie...')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(createFlashcardMock).toHaveBeenCalledOnce()
      expect(createFlashcardMock).toHaveBeenCalledWith({
        front: frontText,
        back: backText,
      })
    })

    // According to the action, it should redirect, not show a toast.
    // We can't easily test the redirect here, but we can confirm the action was called.
    // If there were a success toast, we would test for it like this:
    // await waitFor(() => {
    //   expect(toast.success).toHaveBeenCalledWith("Fiszka została utworzona!");
    // });

    // The component remains disabled during transition which resolves upon redirect.
    // In a test environment, the redirect doesn't happen, so we might not see the button re-enabled.
    // The most important part is that the create action was called correctly.
  })

  it('should show an error toast if creating a flashcard fails', async () => {
    // Arrange
    const errorMessage = 'Failed to create'
    const createFlashcardMock = actions.createFlashcard as vi.Mock
    createFlashcardMock.mockResolvedValue({ error: errorMessage })

    render(<FlashcardForm />)

    const frontTextarea = screen.getByPlaceholderText(
      'Wpisz treść przodu fiszki...',
    )
    const backTextarea = screen.getByPlaceholderText(
      'Wpisz treść tyłu fiszki...',
    )
    const submitButton = screen.getByRole('button', { name: /Utwórz/i })

    // Act
    fireEvent.change(frontTextarea, {
      target: { value: 'Test front' },
    })
    fireEvent.change(backTextarea, {
      target: { value: 'Test back' },
    })
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(createFlashcardMock).toHaveBeenCalledOnce()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage)
    })

    expect(submitButton).not.toBeDisabled()
  })
})
