'use server'

import { createClient } from '@/lib/supabase/server'
import { CreateGenerationSchema } from '@/lib/validators'
import { GenerationService } from '@/services/generationService'
import { revalidatePath } from 'next/cache'

export async function generateFlashcards(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    }
  }

  const rawFormData = {
    source_text: formData.get('source_text'),
    count: Number(formData.get('count')),
  }

  const validationResult = CreateGenerationSchema.safeParse({
    ...rawFormData,
    count: [rawFormData.count],
  })

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Invalid data',
    }
  }

  try {
    const generationService = new GenerationService(supabase)
    await generationService.createGeneration(validationResult.data, user.id)

    revalidatePath('/', 'layout')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error creating generation:', error)
    return {
      success: false,
      error: 'Could not create generation.',
    }
  }
}
