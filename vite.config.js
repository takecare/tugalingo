import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

function commitSha() {
  // Set by the deploy workflow to the commit that triggered it; falls back
  // to the local working tree's commit so `npm run dev`/`build` still show
  // something meaningful outside CI.
  if (process.env.VITE_COMMIT_SHA) return process.env.VITE_COMMIT_SHA
  try {
    return execSync('git rev-parse HEAD').toString().trim()
  } catch {
    return null
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/tugalingo/',
  plugins: [react()],
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha()),
  },
})
