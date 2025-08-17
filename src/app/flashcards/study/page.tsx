import { getFlashcards } from '@/services/flashcardService'
import { FlashcardSearchParams } from '@/types'
import { StudyView } from './study-view'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface StudyPageProps {
  searchParams: {
    source?: string
    start_id?: string
  }
}

function parseSearchParams(searchParams: StudyPageProps['searchParams']) {
  const sourceParam = searchParams.source?.toLowerCase()
  const source: FlashcardSearchParams['source'] =
    sourceParam === 'ai' || sourceParam === 'manual' ? sourceParam : 'all'

  return {
    view: 'approved' as const,
    source,
    page: 1,
    limit: 1000,
    startId: searchParams.start_id,
  }
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  const params = parseSearchParams(searchParams)

  try {
    const { flashcards } = await getFlashcards(params)

    if (flashcards.length === 0) {
      return (
        <div className="flex h-screen flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-2xl font-semibold">Brak fiszek do nauki</h2>
          <p className="text-muted-foreground">
            Nie znaleziono zatwierdzonych fiszek w tej kategorii.
          </p>
          <Button asChild>
            <Link href="/">Powrót do listy</Link>
          </Button>
        </div>
      )
    }
    return <StudyView flashcards={flashcards} startId={params.startId} />
  } catch (error) {
    console.error('Failed to load flashcards for study mode:', error)
    return (
      <div className="text-destructive flex h-screen flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-2xl font-semibold">Wystąpił błąd</h2>
        <p>Nie udało się załadować fiszek. Spróbuj ponownie później.</p>
        <Button variant="destructive" asChild>
          <Link href="/">Powrót do listy</Link>
        </Button>
      </div>
    )
  }
}
