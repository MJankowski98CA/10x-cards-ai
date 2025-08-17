import type { Tables, TablesInsert, TablesUpdate } from './db/database.types'

// ============================================================================
// DTOs (Data Transfer Objects)
//
// These types represent the data that is sent from the server to the client.
// They are derived from the database table types to ensure consistency.
// ============================================================================

/**
 * Represents a single flashcard record as returned by the API.
 * This is a direct mapping from the 'flashcards' table row type.
 */
export type FlashcardDto = Tables<'flashcards'>

/**
 * Represents the 'generation' part of the response after creating a new
 * AI generation task. It's a subset of the full 'generations' table record.
 */
export type GenerationDto = Pick<
  Tables<'generations'>,
  | 'id'
  | 'user_id'
  | 'model'
  | 'generated_count'
  | 'source_text_length'
  | 'created_at'
>

/**
 * Represents a flashcard that was just created as part of an AI generation task.
 * It's a subset of the full 'flashcards' table record, containing only the
 * essential information for the client.
 */
export type GeneratedFlashcardDto = Pick<
  Tables<'flashcards'>,
  'id' | 'generation_id' | 'front' | 'back' | 'status' | 'source' | 'is_edited'
>

/**
 * Represents the complete response object after a successful AI generation task.
 * It includes details about the generation job and the list of flashcards created.
 */
export interface GenerationResponseDto {
  generation: GenerationDto
  flashcards: GeneratedFlashcardDto[]
}

// ============================================================================
// Command Models
//
// These types represent the data sent from the client to the server to
// perform an action (e.g., create or update a resource).
// ============================================================================

/**
 * Command model for creating a new AI generation task.
 * This is not directly mapped to a database insert type, as it serves as
 * input for a business process that involves calling an AI service.
 */
export interface CreateGenerationCommand {
  /** The source text to generate flashcards from. */
  source_text: string
  /** The desired number of flashcards to generate. */
  count: number
}

/**
 * Command model for manually creating a new flashcard.
 * It's derived from the 'flashcards' insert type, containing only the fields
 * provided by the user. Other fields like 'user_id' and 'source' are set
 * on the server.
 */
export type CreateFlashcardCommand = Pick<
  TablesInsert<'flashcards'>,
  'front' | 'back'
>

/**
 * Command model for updating an existing flashcard.
 * It's derived from the 'flashcards' update type. All fields are optional.
 */
export type UpdateFlashcardCommand = Pick<
  TablesUpdate<'flashcards'>,
  'front' | 'back' | 'status'
>
