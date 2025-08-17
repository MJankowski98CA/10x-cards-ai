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

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Proszę podać poprawny adres e-mail.' }),
  password: z.string().min(1, { message: 'Hasło nie może być puste.' }),
})

export type LoginViewModel = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    email: z.string().email({ message: 'Proszę podać poprawny adres e-mail.' }),
    password: z
      .string()
      .min(8, { message: 'Hasło musi mieć co najmniej 8 znaków.' })
      .regex(/[A-Z]/, {
        message: 'Hasło musi zawierać co najmniej jedną wielką literę.',
      })
      .regex(/[a-z]/, {
        message: 'Hasło musi zawierać co najmniej jedną małą literę.',
      })
      .regex(/[0-9]/, {
        message: 'Hasło musi zawierać co najmniej jedną cyfrę.',
      })
      .regex(/[^A-Za-z0-9]/, {
        message: 'Hasło musi zawierać co najmniej jeden znak specjalny.',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być takie same.',
    path: ['confirmPassword'],
  })

export type RegisterViewModel = z.infer<typeof RegisterSchema>

export const CreateGenerationSchema = z.object({
  source_text: z
    .string()
    .min(1, 'Tekst źródłowy jest wymagany.')
    .max(1000, 'Tekst źródłowy nie może przekraczać 1000 znaków.'),
  // Suwak Shadcn/ui zwraca tablicę, więc musimy ją przetransformować
  count: z
    .array(z.number())
    .transform((arr) => arr[0])
    .refine((val) => val >= 10 && val <= 30),
})

export type CreateGenerationViewModel = z.infer<typeof CreateGenerationSchema>

export const FlashcardFormSchema = z.object({
  front: z
    .string()
    .min(1, 'Pole "Przód" jest wymagane.')
    .max(1000, 'Tekst nie może przekraczać 1000 znaków.'),
  back: z
    .string()
    .min(1, 'Pole "Tył" jest wymagane.')
    .max(1000, 'Tekst nie może przekraczać 1000 znaków.'),
})

export type FlashcardFormViewModel = z.infer<typeof FlashcardFormSchema>

const PAGE_SIZE = 8

export function validateFlashcardSearchParams(
  viewParam?: string,
  sourceParam?: string,
  pageParam?: string,
): FlashcardSearchParams {
  const view = viewParam === 'pending' ? 'pending' : 'approved'
  const source =
    view === 'approved' && (sourceParam === 'ai' || sourceParam === 'manual')
      ? sourceParam
      : 'all'

  const page = Math.max(1, Number(pageParam) || 1)

  return { view, source, page, limit: PAGE_SIZE }
}
