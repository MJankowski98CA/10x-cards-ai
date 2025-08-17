import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateGenerationCommandSchema } from '@/lib/validators'
import { GenerationService } from '@/services/generationService'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validationResult = CreateGenerationCommandSchema.safeParse(body)

  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.issues },
      { status: 400 },
    )
  }

  try {
    const generationService = new GenerationService(supabase)
    const result = await generationService.createGeneration(
      validationResult.data,
      user.id,
    )
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating generation:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
