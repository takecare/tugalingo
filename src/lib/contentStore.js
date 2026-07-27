import { supabase } from './supabaseClient'

// Reads every row of the `content_items` table (see supabase/schema.sql) and
// groups it back into the same { words, verbs, compounds, phrases } shape
// lessons.js used to get from statically importing src/data/*.json.
export async function fetchContent() {
  const { data, error } = await supabase.from('content_items').select('kind, data')
  if (error) throw error

  const content = { words: [], verbs: [], compounds: [], phrases: [] }
  for (const row of data) content[row.kind].push(row.data)
  return content
}

// entry is the draftToEntry(bank, draft) shape from src/lib/studio.js — the
// full entry, id and level included, is duplicated into `data` alongside the
// dedicated columns so content_items stays queryable without unpacking jsonb.
export async function upsertContentEntry(kind, entry) {
  const { error } = await supabase
    .from('content_items')
    .upsert({ kind, id: entry.id, level: entry.level, data: entry })
  if (error) throw error
}
