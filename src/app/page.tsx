import { Suspense } from 'react'

import { AppHeader } from '@/components/layout/app-header'
import { FlashcardListSkeleton } from '@/components/flashcards/flashcard-list-skeleton'
import { FlashcardListControls } from '@/components/flashcards/flashcard-list-controls'
import { FlashcardList } from '@/components/flashcards/flashcard-list'
import { getFlashcards } from '@/services/flashcardService'
import { PaginationControls } from '@/components/flashcards/pagination-controls'
import type { FlashcardSearchParams } from '@/types'
import { validateFlashcardSearchParams } from '@/lib/validators'

interface FlashcardsPageProps {
  searchParams: {
    view?: string
    source?: string
    page?: string
  }
}

export default async function FlashcardsPage({
  searchParams: { view, source, page },
}: FlashcardsPageProps) {
  const validatedParams = validateFlashcardSearchParams(view, source, page)

  return (
    <div className="container mx-auto py-8">
      <AppHeader />
      <main className="space-y-6">
        <FlashcardListControls
          initialView={validatedParams.view}
          initialSource={validatedParams.source}
        />
        <Suspense fallback={<FlashcardListSkeleton />}>
          <FlashcardListContainer {...validatedParams} />
        </Suspense>
      </main>
    </div>
  )
}

async function FlashcardListContainer(params: FlashcardSearchParams) {
  const { flashcards, totalCount } = await getFlashcards(params)
  return (
    <>
      <FlashcardList flashcards={flashcards} />
      {totalCount > params.limit && (
        <PaginationControls
          totalCount={totalCount}
          currentPage={params.page}
          perPage={params.limit}
        />
      )}
    </>
  )
}
