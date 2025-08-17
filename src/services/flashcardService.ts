import { createClient } from '@/lib/supabase/server'
import {
  FlashcardSearchParams,
  UpdateFlashcardCommand,
  CreateFlashcardCommand,
} from '@/types'

export async function findById(id: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error(`Error fetching flashcard #${id}:`, error)
    throw new Error('Failed to fetch flashcard')
  }

  return data
}

export async function create(command: CreateFlashcardCommand): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { error } = await supabase.from('flashcards').insert({
    ...command,
    user_id: user.id,
    source: 'manual',
    status: 'approved',
  })

  if (error) {
    console.error('Error creating flashcard:', error)
    throw new Error('Failed to create flashcard')
  }
}

export async function getFlashcards(params: FlashcardSearchParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { view, source, page, limit } = params
  const offset = (page - 1) * limit

  let query = supabase
    .from('flashcards')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (view === 'pending') {
    query = query.eq('status', 'pending')
  } else {
    query = query.eq('status', 'approved')
    if (source !== 'all') {
      query = query.eq('source', source)
    }
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching flashcards:', error)
    throw new Error('Could not fetch flashcards.')
  }

  return {
    flashcards: data || [],
    totalCount: count || 0,
  }
}

export async function update(
  id: number,
  command: UpdateFlashcardCommand,
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { data: existing } = await supabase
    .from('flashcards')
    .select('source')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    throw new Error('Flashcard not found')
  }

  const updateObject: Record<string, unknown> = { ...command }
  if (
    existing.source === 'ai' &&
    (command.front || command.back) &&
    !command.status
  ) {
    updateObject.is_edited = true
  }

  const { error } = await supabase
    .from('flashcards')
    .update(updateObject)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error(`Error updating flashcard #${id}:`, error)
    throw new Error('Failed to update flashcard')
  }
}

export async function remove(id: number): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error(`Error deleting flashcard #${id}:`, error)
    throw new Error('Failed to delete flashcard')
  }
}
