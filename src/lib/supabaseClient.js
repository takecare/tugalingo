import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null rather than throwing when the env vars aren't set (e.g. running the
// content studio or debug mode locally without a Supabase project) — callers
// check isSupabaseConfigured() before using supabase.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function isSupabaseConfigured() {
  return supabase !== null
}
