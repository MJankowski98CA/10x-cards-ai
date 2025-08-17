import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FlashcardService } from '@/services/flashcardService'
import { updateFlashcardSchema } from '@/lib/validators'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flashcardId = Number(params.id)
    if (isNaN(flashcardId) || !Number.isInteger(flashcardId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const flashcardService = new FlashcardService(supabase)
    const flashcard = await flashcardService.getFlashcardById(
      flashcardId,
      user.id,
    )

    if (!flashcard) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(flashcard, { status: 200 })
  } catch (error) {
    console.error(`Error fetching flashcard with id: ${params.id}`, error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flashcardId = Number(params.id)
    if (isNaN(flashcardId) || !Number.isInteger(flashcardId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = updateFlashcardSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues },
        { status: 400 },
      )
    }

    const flashcardService = new FlashcardService(supabase)
    const updatedFlashcard = await flashcardService.updateFlashcard(
      flashcardId,
      user.id,
      validationResult.data,
    )

    return NextResponse.json(updatedFlashcard, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Flashcard not found')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error(`Error updating flashcard with id: ${params.id}`, error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flashcardId = Number(params.id)
    if (isNaN(flashcardId) || !Number.isInteger(flashcardId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const flashcardService = new FlashcardService(supabase)
    await flashcardService.deleteFlashcard(flashcardId, user.id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Flashcard not found')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error(`Error deleting flashcard with id: ${params.id}`, error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
