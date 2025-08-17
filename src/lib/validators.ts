import { z } from 'zod'

export const CreateGenerationCommandSchema = z.object({
  source_text: z.string().min(1000).max(10000),
  count: z.number().min(1).max(50),
})

export const getFlashcardsQuerySchema = z.object({
  status: z.enum(['approved', 'waiting_for_approval']).optional(),
  source: z.enum(['AI', 'MANUAL']).optional(),
  generation_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().min(1).max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export const createFlashcardSchema = z.object({
  front: z.string().min(1, 'Front of the flashcard cannot be empty.'),
  back: z.string().min(1, 'Back of the flashcard cannot be empty.'),
})

export const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Front of the flashcard cannot be empty.')
    .optional(),
  back: z.string().min(1, 'Back of the flashcard cannot be empty.').optional(),
  status: z.enum(['approved', 'waiting_for_approval']).optional(),
})
