'use server'

import { createClient } from '@/lib/supabase/server'
import { LoginSchema, RegisterSchema } from '@/lib/validators'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function login(formData: z.infer<typeof LoginSchema>) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(formData)

  if (error) {
    return {
      error: 'Nieprawidłowe dane logowania.',
    }
  }
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}

export async function signup(formData: z.infer<typeof RegisterSchema>) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp(formData)

  if (error) {
    return {
      error: 'Użytkownik o tym adresie e-mail już istnieje.',
    }
  }

  redirect('/')
}
