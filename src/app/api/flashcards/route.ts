import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getFlashcardsQuerySchema,
  createFlashcardSchema,
} from '@/lib/validators'
import { FlashcardService } from '@/services/flashcardService'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const validationResult = getFlashcardsQuerySchema.safeParse(searchParams)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues },
        { status: 400 },
      )
    }

    const flashcardService = new FlashcardService(supabase)
    const flashcards = await flashcardService.getFlashcards({
      ...validationResult.data,
      userId: user.id,
    })

    return NextResponse.json(flashcards, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error fetching flashcards:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createFlashcardSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues },
        { status: 400 },
      )
    }

    const flashcardService = new FlashcardService(supabase)
    const newFlashcard = await flashcardService.createFlashcard(
      validationResult.data,
      user.id,
    )

    return NextResponse.json(newFlashcard, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error creating flashcard:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
