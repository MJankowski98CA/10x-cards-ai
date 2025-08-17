import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/db/database.types'
import { CreateFlashcardCommand, UpdateFlashcardCommand } from '@/types'

type FlashcardDto = Database['public']['Tables']['flashcards']['Row']

interface GetFlashcardsOptions {
  userId: string
  status?: 'approved' | 'waiting_for_approval'
  source?: 'AI' | 'MANUAL'
  generation_id?: number
  limit: number
  offset: number
}

export class FlashcardService {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  public async getFlashcards(
    options: GetFlashcardsOptions,
  ): Promise<FlashcardDto[]> {
    const { userId, status, source, generation_id, limit, offset } = options

    let query = this.supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    if (source) {
      query = query.eq('source', source)
    }

    if (generation_id) {
      query = query.eq('generation_id', generation_id)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching flashcards from Supabase:', error)
      throw new Error('Could not fetch flashcards.')
    }

    return data || []
  }

  public async createFlashcard(
    command: CreateFlashcardCommand,
    userId: string,
  ): Promise<FlashcardDto> {
    const { front, back } = command

    const { data, error } = await this.supabase
      .from('flashcards')
      .insert({
        front,
        back,
        user_id: userId,
        status: 'approved',
        source: 'MANUAL',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating flashcard in Supabase:', error)
      throw new Error('Could not create flashcard.')
    }

    return data
  }

  public async updateFlashcard(
    id: number,
    userId: string,
    command: UpdateFlashcardCommand,
  ): Promise<FlashcardDto> {
    const existingFlashcard = await this.getFlashcardById(id, userId)
    if (!existingFlashcard) {
      throw new Error('Flashcard not found or user does not have permission.')
    }

    const updateObject: Partial<UpdateFlashcardCommand> & {
      is_edited?: boolean
    } = {
      ...command,
    }

    if (existingFlashcard.source === 'AI' && (command.front || command.back)) {
      updateObject.is_edited = true
    }

    const { data, error } = await this.supabase
      .from('flashcards')
      .update(updateObject)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating flashcard in Supabase:', error)
      throw new Error('Could not update flashcard.')
    }

    return data
  }

  public async deleteFlashcard(id: number, userId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting flashcard in Supabase:', error)
      throw new Error('Could not delete flashcard.')
    }

    if (count === 0) {
      throw new Error('Flashcard not found or user does not have permission.')
    }
  }

  public async getFlashcardById(
    id: number,
    userId: string,
  ): Promise<FlashcardDto | null> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching flashcard by id from Supabase:', error)
      throw new Error('Could not fetch flashcard.')
    }

    return data
  }
}
