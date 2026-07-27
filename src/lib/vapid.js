// PushManager.subscribe() wants the VAPID public key as a Uint8Array, but
// it's distributed (and stored in VITE_VAPID_PUBLIC_KEY) as the base64url
// string the `web-push` library prints. Standard base64url -> bytes decode.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}
