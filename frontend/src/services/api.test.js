import { vi } from 'vitest'
import api from './api'
import { AUTH_EXPIRED_EVENT, loadAuth, saveAuth } from '../auth/storage'

// Replace the network with a stub so we test only our interceptors.
function stubNetwork(handler) {
  const seen = []
  api.defaults.adapter = (config) => {
    seen.push(config)
    return handler(config)
  }
  return seen
}

beforeEach(() => window.sessionStorage.clear())

it('sends the stored token as a Bearer header', async () => {
  saveAuth({ token: 'abc', user: { id: 1 } })
  const seen = stubNetwork((config) => Promise.resolve({ data: {}, status: 200, headers: {}, config }))

  await api.get('/employees/')

  expect(seen[0].headers.Authorization).toBe('Bearer abc')
})

it('sends no Authorization header when signed out', async () => {
  const seen = stubNetwork((config) => Promise.resolve({ data: {}, status: 200, headers: {}, config }))

  await api.get('/employees/')

  expect(seen[0].headers.Authorization).toBeUndefined()
})

it('a 401 clears the session and announces it', async () => {
  saveAuth({ token: 'old', user: { id: 1 } })
  stubNetwork((config) => Promise.reject({ response: { status: 401 }, config }))
  const expired = vi.fn()
  window.addEventListener(AUTH_EXPIRED_EVENT, expired)

  await expect(api.get('/employees/')).rejects.toBeTruthy()

  expect(loadAuth()).toBeNull()
  expect(expired).toHaveBeenCalledTimes(1)
  window.removeEventListener(AUTH_EXPIRED_EVENT, expired)
})

it('a wrong password on the login call is not treated as an expired session', async () => {
  saveAuth({ token: 'still-good', user: { id: 1 } })
  stubNetwork((config) => Promise.reject({ response: { status: 401 }, config }))
  const expired = vi.fn()
  window.addEventListener(AUTH_EXPIRED_EVENT, expired)

  await expect(api.post('/auth/login', {})).rejects.toBeTruthy()

  expect(expired).not.toHaveBeenCalled()
  expect(loadAuth()).not.toBeNull()
  window.removeEventListener(AUTH_EXPIRED_EVENT, expired)
})
