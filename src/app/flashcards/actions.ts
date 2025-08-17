'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { create, update, remove } from '@/services/flashcardService'
import type { FlashcardDto } from '@/types'
import type { FlashcardFormViewModel } from '@/lib/validators'
import { createClient } from '@/lib/supabase/server'

export async function createFlashcard(data: FlashcardFormViewModel) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'User not authenticated',
    }
  }

  try {
    await create(data)
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to create flashcard.',
    }
  }

  revalidatePath('/')
  redirect('/')
}

export async function updateFlashcard(
  id: number,
  originalData: FlashcardDto,
  formData: FlashcardFormViewModel,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'User not authenticated',
    }
  }

  try {
    const payload = { ...formData }
    if (originalData.status === 'waiting_for_approval') {
      // @ts-ignore
      payload.status = 'approved'
    }

    await update(id, payload)
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Failed to update flashcard.',
    }
  }

  revalidatePath('/')
  redirect('/')
}

export async function approveFlashcard(flashcardId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  try {
    await update(flashcardId, { status: 'approved' })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error approving flashcard:', error)
    return { success: false, error: 'Nie udało się zatwierdzić fiszki.' }
  }
}

export async function deleteFlashcard(flashcardId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'User not authenticated',
    }
  }

  try {
    await remove(flashcardId)
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    return {
      success: false,
      error: `Failed to delete flashcard: ${errorMessage}`,
    }
  }
}
export async function getApprovedFlashcardsForStudy(params: {
  source: 'ai' | 'manual' | 'all'
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { source } = params

  let query = supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  if (source !== 'all') {
    query = query.eq('source', source)
  }

  // Fetch all approved flashcards, limit for safety
  query = query.limit(1000)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching flashcards for study:', error)
    throw new Error('Could not fetch flashcards for study session.')
  }

  return data || []
}
