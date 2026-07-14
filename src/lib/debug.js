// Debug mode is opt-in via a URL query param (?debug=true) rather than a
// persisted setting, so it never accidentally leaks into a normal session
// and never needs to be remembered or reset.
export function isDebugMode(search = window.location.search) {
  return new URLSearchParams(search).get('debug') === 'true'
}

// Same idea as isDebugMode, but for the content studio (?studio=true) — see
// src/components/Studio.jsx. A separate flag since the two tools are
// unrelated: one previews question types, the other edits the data files.
export function isStudioMode(search = window.location.search) {
  return new URLSearchParams(search).get('studio') === 'true'
}
