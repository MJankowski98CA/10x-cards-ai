import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GeneratorForm } from './generator-form'
import * as actions from '@/app/generate/actions'
import { toast } from 'sonner'

// Mock server actions and dependencies
vi.mock('@/app/generate/actions', () => ({
  generateFlashcards: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useSearchParams: () => ({
    get: () => {},
  }),
}))

describe('GeneratorForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('GEN-01: should generate flashcards on happy path', async () => {
    // Arrange
    const generateFlashcardsMock = actions.generateFlashcards as vi.Mock
    generateFlashcardsMock.mockResolvedValue({ success: true })

    render(<GeneratorForm />)

    const textarea = screen.getByPlaceholderText('Wklej tutaj swój tekst...')
    const slider = screen.getByRole('slider')
    const submitButton = screen.getByRole('button', { name: /Generuj/i })

    // Act
    fireEvent.change(textarea, { target: { value: 'This is a source text.' } })
    // Note: The slider interaction is tricky. For this unit test, we'll assume the default value is used.
    // A more complex test could involve simulating the slider change.
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
    // Check for the loader icon by looking for its parent button's state
    // A better approach would be adding a data-testid to the loader
    await waitFor(() => {
      expect(
        submitButton.querySelector('.lucide-loader-circle'),
      ).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(generateFlashcardsMock).toHaveBeenCalledOnce()
      const formData = generateFlashcardsMock.mock.calls[0][0]
      expect(formData.get('source_text')).toBe('This is a source text.')
      expect(formData.get('count')).toBe('10') // Default value
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Fiszki zostały wygenerowane!')
    })

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/?view=pending')
    })

    expect(submitButton).not.toBeDisabled()
  })

  it('GEN-02: should show an error toast when generation fails', async () => {
    // Arrange
    const errorMessage = 'Generation failed'
    const generateFlashcardsMock = actions.generateFlashcards as vi.Mock
    generateFlashcardsMock.mockResolvedValue({
      success: false,
      error: errorMessage,
    })

    render(<GeneratorForm />)

    const textarea = screen.getByPlaceholderText('Wklej tutaj swój tekst...')
    const submitButton = screen.getByRole('button', { name: /Generuj/i })

    // Act
    fireEvent.change(textarea, { target: { value: 'Another source text.' } })
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })

    await waitFor(() => {
      expect(generateFlashcardsMock).toHaveBeenCalledOnce()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd', {
        description: errorMessage,
      })
    })

    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(submitButton).not.toBeDisabled()
  })
})
