// Generates SQL to seed the `content_items` table from the original
// src/data/*.json banks — run once against a fresh Supabase project (or to
// re-seed one), via:
//
//   node scripts/seed-content.mjs > /tmp/seed-content.sql
//   psql "$SUPABASE_DB_URL" -f /tmp/seed-content.sql
//
// See docs/architecture.md#content-studio for why the JSON files are kept
// around as the seed fixture even though the app reads from Supabase now.
import { readFileSync } from 'node:fs'

const BANKS = ['words', 'verbs', 'compounds', 'phrases']
const dataDir = new URL('../src/data/', import.meta.url)

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`
}

console.log('begin;')
console.log('delete from content_items;')

for (const bank of BANKS) {
  const entries = JSON.parse(readFileSync(new URL(`${bank}.json`, dataDir), 'utf8'))
  for (const entry of entries) {
    const values = [
      sqlString(bank),
      sqlString(entry.id),
      String(entry.level),
      `${sqlString(JSON.stringify(entry))}::jsonb`,
    ].join(', ')
    console.log(`insert into content_items (kind, id, level, data) values (${values});`)
  }
}

console.log('commit;')
