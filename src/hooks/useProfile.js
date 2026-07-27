import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Looks up the signed-in user's role (see supabase/schema.sql's `profiles`
// table) so App.jsx can gate admin-only pages like the content studio.
// Every account gets a 'regular' row automatically on signup (via the
// on_auth_user_created trigger) — admin is only ever granted by hand, in the
// Supabase dashboard/SQL editor.
export function useProfile(userId) {
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setRole(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load profile', error)
        setRole(data?.role ?? 'regular')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { role, isAdmin: role === 'admin', isLoading }
}
