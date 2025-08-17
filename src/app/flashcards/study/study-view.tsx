'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FlashcardCarousel } from '@/components/flashcards/flashcard-carousel'
import { FlashcardDto } from '@/types'

interface StudyViewProps {
  flashcards: FlashcardDto[]
  startId?: string
}

export function StudyView({ flashcards, startId }: StudyViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Open the carousel on mount
  useEffect(() => {
    setIsOpen(true)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Allow animation to finish before navigating back
    setTimeout(() => {
      router.back()
    }, 300)
  }

  if (!isOpen) {
    return null
  }

  return (
    <FlashcardCarousel
      flashcards={flashcards}
      startId={startId}
      onClose={handleClose}
    />
  )
}
