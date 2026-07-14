import { describe, expect, it } from 'vitest'
import { isDebugMode, isStudioMode } from './debug'

describe('isDebugMode', () => {
  it('is true only for ?debug=true', () => {
    expect(isDebugMode('?debug=true')).toBe(true)
  })

  it('is false with no query string', () => {
    expect(isDebugMode('')).toBe(false)
  })

  it('is false for any other value, including truthy-looking ones', () => {
    expect(isDebugMode('?debug=1')).toBe(false)
    expect(isDebugMode('?debug=yes')).toBe(false)
    expect(isDebugMode('?debug=True')).toBe(false)
    expect(isDebugMode('?debug=')).toBe(false)
  })

  it('is false when debug is absent but other params are present', () => {
    expect(isDebugMode('?foo=bar')).toBe(false)
  })

  it('works alongside other query params', () => {
    expect(isDebugMode('?foo=bar&debug=true')).toBe(true)
  })
})

describe('isStudioMode', () => {
  it('is true only for ?studio=true, and independent of ?debug', () => {
    expect(isStudioMode('?studio=true')).toBe(true)
    expect(isStudioMode('?debug=true')).toBe(false)
    expect(isStudioMode('?debug=true&studio=true')).toBe(true)
    expect(isStudioMode('')).toBe(false)
  })
})
