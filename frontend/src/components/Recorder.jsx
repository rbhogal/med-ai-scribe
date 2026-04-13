import { useCallback, useRef, useState } from 'react'
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
 * @param {(payload: { transcript: string, structured_note: string }) => void} props.onComplete
 * @param {(busy: boolean) => void} props.onBusyChange
 * @param {(message: string | null) => void} props.onError
 * @param {boolean} [props.disableStart] when true, Start is disabled (e.g. save in flight)
 */
export function Recorder({ onComplete, onBusyChange, onError, disableStart }) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const pickMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
    ]
    for (const t of candidates) {
      if (MediaRecorder.isTypeSupported(t)) return t
    }
    return ''
  }

  const startRecording = useCallback(async () => {
    if (disableStart) return
    onError(null)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      onError('Microphone access was denied or is not available.')
      return
    }
    streamRef.current = stream
    chunksRef.current = []
    const mimeType = pickMimeType()
    const options = mimeType ? { mimeType } : undefined
    const recorder = new MediaRecorder(stream, options)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onerror = () => {
      onError('Recording failed.')
      setIsRecording(false)
      onBusyChange(false)
      stream.getTracks().forEach((t) => t.stop())
    }

    recorder.start(250)
    setIsRecording(true)
  }, [disableStart, onBusyChange, onError])

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false)
      return
    }

    onBusyChange(true)
    onError(null)

    const mimeType = recorder.mimeType || 'audio/webm'
    const blobPromise = new Promise((resolve, reject) => {
      recorder.addEventListener(
        'stop',
        () => {
          const stream = streamRef.current
          if (stream) {
            stream.getTracks().forEach((t) => t.stop())
            streamRef.current = null
          }
          try {
            const blob = new Blob(chunksRef.current, { type: mimeType })
            resolve(blob)
          } catch (e) {
            reject(e)
          }
        },
        { once: true },
      )
      recorder.addEventListener(
        'error',
        () => reject(new Error('Recording failed')),
        { once: true },
      )
      try {
        recorder.stop()
      } catch (e) {
        reject(e)
      }
    })

    setIsRecording(false)

    try {
      const blob = await blobPromise
      const ext = mimeType.includes('webm')
        ? 'webm'
        : mimeType.includes('mp4')
          ? 'm4a'
          : 'webm'
      const filename = `recording.${ext}`

      const formData = new FormData()
      formData.append('audio', blob, filename)

      const transcribeRes = await fetch(apiUrl('/api/transcribe/'), {
        method: 'POST',
        body: formData,
      })
      if (!transcribeRes.ok) {
        throw new Error(await readErrorDetail(transcribeRes))
      }
      const { transcript } = await transcribeRes.json()

      const structureRes = await fetch(apiUrl('/api/structure/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!structureRes.ok) {
        throw new Error(await readErrorDetail(structureRes))
      }
      const { structured_note } = await structureRes.json()

      onComplete({ transcript, structured_note })
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      onError(msg)
    } finally {
      onBusyChange(false)
      mediaRecorderRef.current = null
      chunksRef.current = []
    }
  }, [onBusyChange, onComplete, onError])

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isRecording ? (
        <button
          type="button"
          onClick={() => void startRecording()}
          disabled={disableStart}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start recording
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void stopRecording()}
          className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
        >
          Stop recording
        </button>
      )}
    </div>
  )
}
