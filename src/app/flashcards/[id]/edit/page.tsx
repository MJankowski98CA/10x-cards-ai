import { notFound } from 'next/navigation'
import { FlashcardForm } from '@/components/flashcards/flashcard-form'
import { findById } from '@/services/flashcardService'

interface EditFlashcardPageProps {
  params: {
    id: string
  }
}

export default async function EditFlashcardPage({
  params,
}: EditFlashcardPageProps) {
  const flashcardId = Number(params.id)
  if (isNaN(flashcardId)) {
    notFound()
  }

  const flashcard = await findById(flashcardId)

  if (!flashcard) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <FlashcardForm initialData={flashcard} />
    </div>
  )
}
