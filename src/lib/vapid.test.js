import { describe, expect, it } from 'vitest'
import { urlBase64ToUint8Array } from './vapid'

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string into the matching bytes', () => {
    // "hello" base64url-encoded, no padding
    expect(Array.from(urlBase64ToUint8Array('aGVsbG8'))).toEqual([104, 101, 108, 108, 111])
  })

  it('handles the URL-safe - and _ characters', () => {
    // bytes [0xfb, 0xff, 0xbf] base64-encode to "+/+/" and base64url to "-_-_"
    const standard = Array.from(Uint8Array.from(atob('+/+/'), (c) => c.charCodeAt(0)))
    expect(Array.from(urlBase64ToUint8Array('-_-_'))).toEqual(standard)
  })

  it('round-trips a real-looking 65-byte VAPID public key', () => {
    const bytes = Uint8Array.from({ length: 65 }, (_, i) => i * 4)
    const base64url = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(Array.from(urlBase64ToUint8Array(base64url))).toEqual(Array.from(bytes))
  })
})
