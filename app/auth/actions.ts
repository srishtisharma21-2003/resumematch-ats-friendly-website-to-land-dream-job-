'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(email: string, password: string) {
  let shouldRedirect = false

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: error.message }
    }

    shouldRedirect = true
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to sign in' }
  }

  if (shouldRedirect) {
    redirect('/dashboard')
  }

  return {}
}

export async function signUp(email: string, password: string, fullName?: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName
        ? {
            data: {
              full_name: fullName,
            },
          }
        : undefined,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to sign up' }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return {}
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to sign out' }
  }
}
