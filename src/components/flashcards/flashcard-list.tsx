import { FlashcardDto } from '@/types'
import { Flashcard } from './flashcard'

interface FlashcardListProps {
  flashcards: FlashcardDto[]
}

export function FlashcardList({ flashcards }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Brak fiszek</h3>
          <p className="text-sm text-gray-500">
            Nie znaleziono żadnych fiszek. Wygeneruj nowe lub dodaj je ręcznie!
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {flashcards.map((flashcard) => (
        <Flashcard key={flashcard.id} flashcard={flashcard} />
      ))}
    </div>
  )
}
