import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client initialization.
 * 
 * SECURITY WARNING:
 * 1. Never expose the SERVICE_ROLE_KEY on the client side.
 * 2. Always use VITE_ prefix for environment variables to be accessible in the build.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase environment variables are missing. Database features will not work until VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are added to your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
