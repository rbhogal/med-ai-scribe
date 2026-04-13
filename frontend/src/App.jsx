import { useCallback, useState } from 'react'
import { NoteEditor } from './components/NoteEditor.jsx'
import { Recorder } from './components/Recorder.jsx'

function Spinner() {
  return (
    <div
      className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      role="status"
      aria-label="Loading"
    />
  )
}

export default function App() {
  const [transcript, setTranscript] = useState('')
  const [structured_note, setStructuredNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRecordingComplete = useCallback(
    ({ transcript: t, structured_note: note }) => {
      setTranscript(t)
      setStructuredNote(note)
    },
    [],
  )

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-6 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Medical scribe
          </h1>
          <p className="text-sm text-slate-600">
            Capture a visit, transcribe with Whisper, structure into SOAP with
            Claude, then save when you are ready.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        {error ? (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Spinner />
            <span>Working…</span>
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Recording</h2>
          <Recorder
            onComplete={handleRecordingComplete}
            onBusyChange={setLoading}
            onError={setError}
            disableStart={loading}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Note</h2>
          <NoteEditor
            transcript={transcript}
            structured_note={structured_note}
            onStructuredNoteChange={setStructuredNote}
            onBusyChange={setLoading}
            onError={setError}
            savingDisabled={loading}
          />
        </section>
      </main>
    </div>
  )
}
