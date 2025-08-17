'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlashcardDto } from '@/types'

interface FlashcardCarouselProps {
  flashcards: FlashcardDto[]
  startId?: string
  onClose: () => void
}

export function FlashcardCarousel({
  flashcards,
  startId,
  onClose,
}: FlashcardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (startId) {
      const startIndex = flashcards.findIndex(
        (f) => f.id === parseInt(startId, 10),
      )
      if (startIndex !== -1) {
        setCurrentIndex(startIndex)
      }
    }
  }, [startId, flashcards])

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  const nextCard = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const prevCard = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length,
    )
    setTimeout(() => setIsAnimating(false), 300)
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevCard()
    if (e.key === 'ArrowRight') nextCard()
    if (e.key === ' ') {
      e.preventDefault()
      flipCard()
    }
    if (e.key === 'Escape') onClose()
  }

  useEffect(() => {
    const handleKeyDownScoped = (e: KeyboardEvent) => handleKeyDown(e)
    window.addEventListener('keydown', handleKeyDownScoped)
    return () => window.removeEventListener('keydown', handleKeyDownScoped)
  }, [flashcards, currentIndex, isFlipped]) // Re-bind to keep state fresh

  if (flashcards.length === 0) return null

  const currentCard = flashcards[currentIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 z-10 text-white transition-colors hover:text-gray-300"
        >
          <X size={32} />
        </button>

        {/* Card counter */}
        <div className="absolute -top-12 left-0 font-medium text-white">
          {currentIndex + 1} z {flashcards.length}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={prevCard}
          disabled={isAnimating}
          className="absolute top-1/2 -left-8 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30 disabled:opacity-50"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextCard}
          disabled={isAnimating}
          className="absolute top-1/2 -right-8 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30 disabled:opacity-50"
        >
          <ChevronRight size={24} />
        </button>

        {/* Flashcard */}
        <div className="mx-16">
          <div
            className={cn(
              'preserve-3d relative h-80 w-full cursor-pointer transition-transform duration-500',
              isFlipped && 'rotate-y-180',
            )}
            onClick={flipCard}
          >
            {/* Front of card */}
            <div
              className={cn(
                'absolute inset-0 h-full w-full backface-hidden',
                'rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl',
                'flex items-center justify-center p-8',
                'text-center text-white',
              )}
            >
              <div>
                <div className="mb-4 text-sm opacity-80">PYTANIE</div>
                <h2 className="text-2xl leading-relaxed font-bold">
                  {currentCard.front}
                </h2>
                <div className="mt-6 text-sm opacity-80">
                  Kliknij aby zobaczyć odpowiedź
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div
              className={cn(
                'absolute inset-0 h-full w-full rotate-y-180 backface-hidden',
                'rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 shadow-2xl',
                'flex items-center justify-center p-8',
                'text-center text-white',
              )}
            >
              <div>
                <div className="mb-4 text-sm opacity-80">ODPOWIEDŹ</div>
                <p className="text-xl leading-relaxed">{currentCard.back}</p>
                <div className="mt-6 text-sm opacity-80">
                  Kliknij aby wrócić do pytania
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-8 flex justify-center space-x-2">
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-3 w-3 rounded-full transition-colors',
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/40 hover:bg-white/60',
              )}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-white/80">
          <p>Użyj strzałek ← → aby przełączać fiszki</p>
          <p>Spacja aby obrócić fiszkę • Esc aby zamknąć</p>
        </div>
      </div>
    </div>
  )
}
