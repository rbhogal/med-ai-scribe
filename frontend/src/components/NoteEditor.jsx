import { useEffect, useState } from 'react'
import { apiUrl } from '../api.js'

async function readErrorDetail(response) {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
    }
    return JSON.stringify(data)
  } catch {
    return response.statusText || 'Request failed'
  }
}

/**
 * @param {object} props
 * @param {string} props.transcript
 * @param {string} props.structured_note
 * @param {(note: string) => void} props.onStructuredNoteChange
 * @param {(busy: boolean) => void} props.onBusyChange
 * @param {(message: string | null) => void} props.onError
 * @param {boolean} [props.savingDisabled]
 */
export function NoteEditor({
  transcript,
  structured_note,
  onStructuredNoteChange,
  onBusyChange,
  onError,
  savingDisabled,
}) {
  const [saveMessage, setSaveMessage] = useState(null)

  useEffect(() => {
    setSaveMessage(null)
  }, [transcript])

  const handleSave = async () => {
    onError(null)
    setSaveMessage(null)
    onBusyChange(true)
    try {
      const res = await fetch(apiUrl('/api/visits/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, structured_note }),
      })
      if (!res.ok) {
        throw new Error(await readErrorDetail(res))
      }
      setSaveMessage('Visit saved.')
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Save failed. Try again.'
      onError(msg)
    } finally {
      onBusyChange(false)
    }
  }

  const hasContent = Boolean(transcript || structured_note)

  return (
    <div className="space-y-4">
      {!hasContent ? (
        <p className="text-sm text-slate-500">
          Record audio to generate a transcript and SOAP note.
        </p>
      ) : (
        <>
          <details className="rounded-md border border-slate-200 bg-slate-50/80 open:bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-700 marker:text-blue-600">
              Transcript
            </summary>
            <div className="border-t border-slate-200 px-4 py-3 text-left text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {transcript || (
                <span className="text-slate-400">No transcript.</span>
              )}
            </div>
          </details>

          <div>
            <label
              htmlFor="soap-note"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              SOAP note
            </label>
            <textarea
              id="soap-note"
              value={structured_note}
              onChange={(e) => onStructuredNoteChange(e.target.value)}
              rows={16}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-slate-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              spellCheck={true}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                savingDisabled || (!transcript && !structured_note)
              }
            >
              Save visit
            </button>
            {saveMessage ? (
              <span className="text-sm text-emerald-700">{saveMessage}</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
