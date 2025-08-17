import {
  CreateGenerationCommand,
  GeneratedFlashcardDto,
  GenerationResponseDto,
} from '@/types'
import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

interface AIResponse {
  flashcards: Omit<GeneratedFlashcardDto, 'id' | 'generation_id'>[]
}
export class GenerationService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  public async createGeneration(
    command: CreateGenerationCommand,
    userId: string,
  ): Promise<GenerationResponseDto> {
    const aiResponse = await this.generateFlashcardsFromAI(command)

    // 1. Create generation record
    const { data: generation, error: generationError } = await this.supabase
      .from('generations')
      .insert({
        user_id: userId,
        model: 'gpt-4o-mini',
        generated_count: aiResponse.flashcards.length,
        source_text_length: command.source_text.length,
      })
      .select(
        'id, user_id, model, generated_count, source_text_length, created_at',
      )
      .single()

    if (generationError) {
      console.error('Error creating generation record:', generationError)
      throw new Error('Could not save generation record.')
    }

    // 2. Prepare flashcards for insertion
    const flashcardsToInsert = aiResponse.flashcards.map((fc) => ({
      ...fc,
      user_id: userId,
      generation_id: generation.id,
      source: 'ai' as const,
      status: 'pending' as const,
    }))

    // 3. Bulk insert flashcards
    const { data: flashcards, error: flashcardsError } = await this.supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select('id, generation_id, front, back, status, source, is_edited')

    if (flashcardsError) {
      console.error('Error inserting flashcards:', flashcardsError)

      throw new Error('Could not save generated flashcards.')
    }

    return { generation, flashcards }
  }

  private async generateFlashcardsFromAI(
    command: CreateGenerationCommand,
  ): Promise<AIResponse> {
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.NEXT_PUBLICOPENROUTER_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates flashcards from the provided text. Respond with a JSON object containing a single key "flashcards", which is an array of objects. Each object should have "front" and "back" keys. The front should be a question, and the back should be the answer.',
        },
        {
          role: 'user',
          content: `Generate ${command.count} flashcards from the following text: ${command.source_text}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('AI service returned an empty response.')
    }

    try {
      return JSON.parse(response) as AIResponse
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      throw new Error('Invalid JSON response from AI service.')
    }
  }
}
