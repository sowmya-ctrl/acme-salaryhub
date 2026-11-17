// The session lives in sessionStorage: it survives a page refresh but ends when the tab closes.
// Every access is guarded because storage can be unavailable (private mode, blocked site data).
const KEY = 'salaryhub.auth'

export const AUTH_EXPIRED_EVENT = 'salaryhub:auth-expired'

export function loadAuth() {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuth(auth) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(auth))
  } catch {
    /* session just won't survive a refresh */
  }
}

export function clearAuth() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
