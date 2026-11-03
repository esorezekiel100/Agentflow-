import { getSupabaseClient, isSupabaseConfigured, supabase } from './supabase'

export type AuthActionResult = {
  ok: boolean
  demo?: boolean
  message?: string
  needsRedirect?: boolean
}

export async function signInWithEmail(input: { email: string; password: string }): Promise<AuthActionResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: true,
      demo: true,
      message: 'Demo mode active: auth is ready for a real Supabase connection.',
      needsRedirect: true,
    }
  }

  try {
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (error) {
      return { ok: false, message: error.message }
    }

    return { ok: true, message: 'Signed in successfully.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in right now.'
    return { ok: false, message }
  }
}

export async function signUpWithEmail(input: {
  email: string
  password: string
  fullName: string
}): Promise<AuthActionResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: true,
      demo: true,
      message: 'Demo mode active: account creation is ready for Supabase auth.',
      needsRedirect: true,
    }
  }

  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
        },
      },
    })

    if (error) {
      return { ok: false, message: error.message }
    }

    if (!data.user?.confirmed_at) {
      return {
        ok: true,
        message: 'Account created. Check your inbox to confirm your email.',
      }
    }

    return { ok: true, message: 'Account created successfully.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create your account.'
    return { ok: false, message }
  }
}

export async function signInWithGoogle(): Promise<AuthActionResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: true,
      demo: true,
      message: 'Demo mode active: Google sign-in is ready for Supabase OAuth setup.',
      needsRedirect: true,
    }
  }

  try {
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      return { ok: false, message: error.message }
    }

    return { ok: true, message: 'Redirecting to Google sign-in.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to continue with Google sign-in.'
    return { ok: false, message }
  }
}
