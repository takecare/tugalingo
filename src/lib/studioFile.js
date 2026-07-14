// Thin wrapper around the File System Access API (Chrome/Edge only) — lets
// the studio read and write a data file directly on disk, so "Save" really
// does update src/data/*.json, no manual copy-paste. Not unit tested, same
// as progressFile.js's downloadProgress: it's a real-browser-API call with
// nothing but wiring to test.
export function supportsFileSystemAccess() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export async function openJsonFile(suggestedName) {
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    suggestedName,
  })
  const file = await handle.getFile()
  const text = await file.text()
  const data = JSON.parse(text)
  return { handle, data }
}

export async function writeJsonFile(handle, data) {
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(data, null, 2) + '\n')
  await writable.close()
}
