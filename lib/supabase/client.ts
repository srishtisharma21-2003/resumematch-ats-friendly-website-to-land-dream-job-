import { createBrowserClient } from '@supabase/ssr'
import type { SessionResponse, SupabaseClient, UserResponse } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

let browserClient: SupabaseClient<Database> | undefined
let getUserPromise: Promise<UserResponse> | undefined
let getSessionPromise: Promise<SessionResponse> | undefined

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    const getUser = browserClient.auth.getUser.bind(browserClient.auth)
    const getSession = browserClient.auth.getSession.bind(browserClient.auth)

    browserClient.auth.getUser = ((jwt?: string) => {
      if (jwt) return getUser(jwt)

      getUserPromise ??= getUser().finally(() => {
        getUserPromise = undefined
      })

      return getUserPromise
    }) as typeof browserClient.auth.getUser

    browserClient.auth.getSession = (() => {
      getSessionPromise ??= getSession().finally(() => {
        getSessionPromise = undefined
      })

      return getSessionPromise
    }) as typeof browserClient.auth.getSession
  }

  return browserClient
}
