import { useState } from 'react'
import QuestionRenderer from './questions'
import { PERSONS, emptyDraft, draftToEntry, entryToDraft, validateEntry } from '../lib/studio'
import { previewQuestionFor } from '../lib/studioPreview'
import { supportsFileSystemAccess, openJsonFile, writeJsonFile } from '../lib/studioFile'

const BANK_TABS = [
  { key: 'words', label: 'Words', fileName: 'words.json' },
  { key: 'verbs', label: 'Verbs', fileName: 'verbs.json' },
  { key: 'compounds', label: 'Compounds', fileName: 'compounds.json' },
  { key: 'phrases', label: 'Phrases', fileName: 'phrases.json' },
]

function Field({ label, children }) {
  return (
    <label className="studio-field">
      <span className="studio-field__label">{label}</span>
      {children}
    </label>
  )
}

function LevelField({ draft, onChange }) {
  return (
    <Field label="Level">
      <select value={draft.level} onChange={(e) => onChange({ level: Number(e.target.value) })}>
        <option value={1}>1</option>
        <option value={2}>2</option>
      </select>
    </Field>
  )
}

function ArticleGenderFields({ draft, onChange }) {
  return (
    <>
      <Field label="Article">
        <select value={draft.article} onChange={(e) => onChange({ article: e.target.value })}>
          <option value="o">o</option>
          <option value="a">a</option>
        </select>
      </Field>
      <Field label="Gender">
        <select value={draft.gender} onChange={(e) => onChange({ gender: e.target.value })}>
          <option value="m">m</option>
          <option value="f">f</option>
        </select>
      </Field>
    </>
  )
}

function BankForm({ bank, draft, onChange }) {
  const text = (key) => ({ value: draft[key], onChange: (e) => onChange({ [key]: e.target.value }) })

  if (bank === 'words') {
    return (
      <>
        <Field label="ID">
          <input {...text('id')} placeholder="e.g. cavalo" />
        </Field>
        <Field label="Portuguese">
          <input {...text('pt')} />
        </Field>
        <Field label="English">
          <input {...text('en')} />
        </Field>
        <ArticleGenderFields draft={draft} onChange={onChange} />
        <Field label="Emoji">
          <input {...text('emoji')} />
        </Field>
        <Field label="Emoji variants (space-separated, optional)">
          <input {...text('emojiVariants')} />
        </Field>
        <Field label="Category">
          <select value={draft.category} onChange={(e) => onChange({ category: e.target.value })}>
            {['food', 'animals', 'drinks', 'everyday'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <LevelField draft={draft} onChange={onChange} />
        <label className="studio-field studio-field--checkbox">
          <input
            type="checkbox"
            checked={draft.hasFemaleForm}
            onChange={(e) => onChange({ hasFemaleForm: e.target.checked })}
          />
          <span>Has a distinct female form (e.g. cão/cadela)</span>
        </label>
        {draft.hasFemaleForm && (
          <>
            <Field label="Female article">
              <select value={draft.femaleArticle} onChange={(e) => onChange({ femaleArticle: e.target.value })}>
                <option value="a">a</option>
                <option value="o">o</option>
              </select>
            </Field>
            <Field label="Female word">
              <input {...text('femalePt')} />
            </Field>
          </>
        )}
      </>
    )
  }

  if (bank === 'verbs') {
    return (
      <>
        <Field label="ID">
          <input {...text('id')} placeholder="e.g. correr" />
        </Field>
        <Field label="English">
          <input {...text('en')} />
        </Field>
        <Field label="Emoji">
          <input {...text('emoji')} />
        </Field>
        <LevelField draft={draft} onChange={onChange} />
        {PERSONS.map((p) => (
          <Field key={p.key} label={p.pronoun}>
            <input
              value={draft.conjugations[p.key]}
              onChange={(e) => onChange({ conjugations: { ...draft.conjugations, [p.key]: e.target.value } })}
            />
          </Field>
        ))}
      </>
    )
  }

  if (bank === 'compounds') {
    return (
      <>
        <Field label="ID">
          <input {...text('id')} placeholder="e.g. galao" />
        </Field>
        <Field label="Portuguese">
          <input {...text('pt')} />
        </Field>
        <Field label="English">
          <input {...text('en')} />
        </Field>
        <ArticleGenderFields draft={draft} onChange={onChange} />
        <Field label="Emoji sequence (space-separated)">
          <input {...text('emojis')} />
        </Field>
        <LevelField draft={draft} onChange={onChange} />
      </>
    )
  }

  // phrases
  return (
    <>
      <Field label="ID">
        <input {...text('id')} placeholder="e.g. como-estas" />
      </Field>
      <Field label="Emoji">
        <input {...text('emoji')} />
      </Field>
      <Field label="Prompt">
        <input {...text('prompt')} />
      </Field>
      <Field label="Reply">
        <input {...text('reply')} />
      </Field>
      <LevelField draft={draft} onChange={onChange} />
    </>
  )
}

export default function Studio({ onBack }) {
  const [bank, setBank] = useState('words')
  const [files, setFiles] = useState({}) // { [bank]: { handle, entries } }
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(() => emptyDraft('words'))
  const [errors, setErrors] = useState([])
  const [status, setStatus] = useState(null)

  const current = files[bank]
  const entries = current?.entries ?? []
  const currentTab = BANK_TABS.find((t) => t.key === bank)

  function switchBank(nextBank) {
    setBank(nextBank)
    setEditingId(null)
    setDraft(emptyDraft(nextBank))
    setErrors([])
    setStatus(null)
  }

  async function handleOpen() {
    try {
      const { handle, data } = await openJsonFile(currentTab.fileName)
      setFiles((f) => ({ ...f, [bank]: { handle, entries: data } }))
      setStatus(`Loaded ${data.length} entries from ${currentTab.fileName}.`)
    } catch (err) {
      if (err.name !== 'AbortError') setStatus(`Couldn't open the file: ${err.message}`)
    }
  }

  function startNew() {
    setEditingId(null)
    setDraft(emptyDraft(bank))
    setErrors([])
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setDraft(entryToDraft(bank, entry))
    setErrors([])
  }

  function handleDraftChange(patch) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function handleAddOrSave() {
    const entry = draftToEntry(bank, draft)
    const validationErrors = validateEntry(bank, entry, entries, editingId)
    if (validationErrors.length) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setFiles((f) => {
      const list = f[bank]?.entries ?? []
      const nextList = editingId ? list.map((e) => (e.id === editingId ? entry : e)) : [...list, entry]
      return { ...f, [bank]: { ...f[bank], entries: nextList } }
    })
    setStatus(`${editingId ? 'Updated' : 'Added'} "${entry.id}" — not saved to disk yet.`)
    startNew()
  }

  async function handleSaveFile() {
    if (!current?.handle) return
    try {
      await writeJsonFile(current.handle, current.entries)
      setStatus(`Saved ${current.entries.length} entries to ${currentTab.fileName}.`)
    } catch (err) {
      setStatus(`Couldn't save: ${err.message}`)
    }
  }

  let previewEntry = null
  try {
    previewEntry = draftToEntry(bank, draft)
  } catch {
    previewEntry = null
  }
  const previewQuestion = previewEntry?.id ? previewQuestionFor(bank, previewEntry, entries) : null

  if (!supportsFileSystemAccess()) {
    return (
      <div className="studio">
        <button className="icon-exit-button" onClick={onBack}>
          ✕
        </button>
        <h2>Studio</h2>
        <p>
          This tool saves directly to your data files using the File System Access API, which your
          browser doesn't support — try Chrome or Edge. (A download-based fallback for other
          browsers is planned.)
        </p>
      </div>
    )
  }

  return (
    <div className="studio">
      <div className="studio__header">
        <button className="icon-exit-button" onClick={onBack}>
          ✕
        </button>
        <div className="studio__tabs">
          {BANK_TABS.map((t) => (
            <button
              key={t.key}
              className={`studio__tab${bank === t.key ? ' studio__tab--active' : ''}`}
              onClick={() => switchBank(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!current && (
        <button className="studio__button studio__button--primary" onClick={handleOpen}>
          Open {currentTab.fileName}
        </button>
      )}

      {current && (
        <div className="studio__body">
          <div className="studio__list">
            <div className="studio__list-header">
              <span>{entries.length} entries</span>
              <button className="studio__button" onClick={handleOpen}>
                Reload
              </button>
            </div>
            <ul>
              {entries.map((e) => (
                <li key={e.id}>
                  <button
                    className={`studio__list-item${editingId === e.id ? ' studio__list-item--active' : ''}`}
                    onClick={() => startEdit(e)}
                  >
                    {e.id}
                  </button>
                </li>
              ))}
            </ul>
            <button className="studio__button studio__button--primary" onClick={handleSaveFile}>
              Save to disk
            </button>
          </div>

          <div className="studio__form">
            <h3>{editingId ? `Edit "${editingId}"` : 'New entry'}</h3>
            <BankForm bank={bank} draft={draft} onChange={handleDraftChange} />
            {errors.length > 0 && (
              <ul className="studio__errors">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <div className="studio__form-actions">
              <button className="studio__button studio__button--primary" onClick={handleAddOrSave}>
                {editingId ? 'Save changes' : 'Add entry'}
              </button>
              {editingId && (
                <button className="studio__button" onClick={startNew}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="studio__preview">
            <h3>Preview</h3>
            {previewQuestion ? (
              <QuestionRenderer question={previewQuestion} feedback={null} onAnswer={() => {}} />
            ) : (
              <p>Fill in the required fields to see a preview.</p>
            )}
          </div>
        </div>
      )}

      {status && <p className="progress-io__message">{status}</p>}
    </div>
  )
}
