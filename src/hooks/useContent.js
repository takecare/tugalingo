import { useEffect, useState } from 'react'
import { fetchContent } from '../lib/contentStore'

function emptyContent() {
  return { words: [], verbs: [], compounds: [], phrases: [] }
}

// Loads the question-bank content (words/verbs/compounds/phrases) from
// Supabase once per signed-in session — see src/lib/contentStore.js and
// supabase/schema.sql's content_items table. Replaces the old build-time
// static import of src/data/*.json; see docs/architecture.md#content-studio.
export function useContent(userId) {
  const [content, setContent] = useState(emptyContent)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setContent(emptyContent())
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetchContent()
      .then((data) => {
        if (cancelled) return
        setContent(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load content', error)
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { content, isLoading }
}
