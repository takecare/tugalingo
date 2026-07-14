// Debug mode is opt-in via a URL query param (?debug=true) rather than a
// persisted setting, so it never accidentally leaks into a normal session
// and never needs to be remembered or reset.
export function isDebugMode(search = window.location.search) {
  return new URLSearchParams(search).get('debug') === 'true'
}
