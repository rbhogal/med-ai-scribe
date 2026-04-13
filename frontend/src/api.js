/**
 * Public API origin, set at **build time** via `VITE_API_BASE_URL` (Vite exposes
 * only env vars prefixed with `VITE_`). Configure in `.env` locally and in
 * Railway → your frontend service → Variables before `npm run build`.
 *
 * @returns {string}
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL
  const str = typeof raw === 'string' ? raw.trim() : ''
  if (!str) {
    throw new Error(
      'Missing VITE_API_BASE_URL. Add it to frontend/.env (see .env.example) or set it in your host’s build environment (e.g. Railway Variables for the frontend).',
    )
  }
  return str.replace(/\/$/, '')
}

/**
 * @param {string} path e.g. "/api/transcribe/"
 */
export function apiUrl(path) {
  const base = getApiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
