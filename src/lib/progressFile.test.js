import { describe, expect, it } from 'vitest'
import { parseProgressFile } from './progressFile'

function fakeFile(contents) {
  return { text: async () => contents }
}

describe('parseProgressFile', () => {
  it('accepts a valid progress export', async () => {
    const valid = {
      history: [{ completedAt: '2026-07-11T00:00:00.000Z', correct: 9, total: 10 }],
      activityByDate: { '2026-07-11': { lessonsCompleted: 1 } },
    }
    const result = await parseProgressFile(fakeFile(JSON.stringify(valid)))
    expect(result).toEqual(valid)
  })

  it('accepts an empty-but-well-shaped export', async () => {
    const valid = { history: [], activityByDate: {} }
    const result = await parseProgressFile(fakeFile(JSON.stringify(valid)))
    expect(result).toEqual(valid)
  })

  it('rejects invalid JSON', async () => {
    await expect(parseProgressFile(fakeFile('not json{'))).rejects.toThrow(/valid JSON/)
  })

  it('rejects a well-formed JSON file that is not a progress export', async () => {
    await expect(parseProgressFile(fakeFile(JSON.stringify({ not: 'a progress file' })))).rejects.toThrow(
      /doesn't look like/,
    )
  })

  it('rejects a history entry missing a required field', async () => {
    const invalid = {
      history: [{ completedAt: '2026-07-11T00:00:00.000Z', correct: 9 }], // missing total
      activityByDate: {},
    }
    await expect(parseProgressFile(fakeFile(JSON.stringify(invalid)))).rejects.toThrow(/doesn't look like/)
  })

  it('rejects a history entry with a field of the wrong type', async () => {
    const invalid = {
      history: [{ completedAt: '2026-07-11T00:00:00.000Z', correct: '9', total: 10 }], // correct is a string
      activityByDate: {},
    }
    await expect(parseProgressFile(fakeFile(JSON.stringify(invalid)))).rejects.toThrow(/doesn't look like/)
  })

  it('rejects an activityByDate entry missing lessonsCompleted', async () => {
    const invalid = { history: [], activityByDate: { '2026-07-11': {} } }
    await expect(parseProgressFile(fakeFile(JSON.stringify(invalid)))).rejects.toThrow(/doesn't look like/)
  })

  it('rejects when history is not an array', async () => {
    const invalid = { history: 'nope', activityByDate: {} }
    await expect(parseProgressFile(fakeFile(JSON.stringify(invalid)))).rejects.toThrow(/doesn't look like/)
  })

  it('rejects when the file cannot be read', async () => {
    const brokenFile = {
      text: async () => {
        throw new Error('boom')
      },
    }
    await expect(parseProgressFile(brokenFile)).rejects.toThrow(/Couldn't read/)
  })
})
