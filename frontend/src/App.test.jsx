import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from './services/api'
import App from './App'
import { AUTH_EXPIRED_EVENT } from './auth/storage'

vi.mock('./services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
// Page content is tested elsewhere; this file is about the shell, navigation and auth.
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>dashboard page</div> }))
vi.mock('./components/EmployeeTable', () => ({
  default: ({ initialSearch, openAdd }) => (
    <div>
      employee table search=[{initialSearch}] add=[{String(openAdd)}]
    </div>
  ),
}))
vi.mock('./components/SalaryAnalytics', () => ({ default: () => <div>salary analytics table</div> }))

const USER = { id: 1, email: 'hr@acme.example', full_name: 'Hannah Roe' }
const signIn = () =>
  window.sessionStorage.setItem('salaryhub.auth', JSON.stringify({ token: 'tok', user: USER }))

beforeEach(() => {
  vi.clearAllMocks()
  window.location.hash = '#/'
  window.localStorage.clear()
  window.sessionStorage.clear()
})

const nav = () => screen.getAllByRole('navigation', { name: /main navigation/i })[0]

describe('when signed out', () => {
  it('sends the user to the login page instead of the app', async () => {
    render(<App />)

    expect(await screen.findByRole('button', { name: /sign in/i })).toBeTruthy()
    expect(screen.queryByText('dashboard page')).toBeNull()
  })

  it('protects deep links too', async () => {
    window.location.hash = '#/employees'
    render(<App />)

    expect(await screen.findByRole('button', { name: /sign in/i })).toBeTruthy()
    expect(screen.queryByText(/employee table/)).toBeNull()
  })

  it('logs in with valid credentials, stores the session and opens the dashboard', async () => {
    api.post.mockResolvedValue({ data: { access_token: 'tok', user: USER } })
    render(<App />)

    await userEvent.type(await screen.findByLabelText(/email/i), 'hr@acme.example')
    await userEvent.type(screen.getByLabelText(/password/i), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('dashboard page')).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'hr@acme.example', password: 'correct-horse' })
    expect(JSON.parse(window.sessionStorage.getItem('salaryhub.auth')).token).toBe('tok')
  })

  it('shows a clear message for wrong credentials and stays on the login page', async () => {
    api.post.mockRejectedValue({ response: { status: 401 } })
    render(<App />)

    await userEvent.type(await screen.findByLabelText(/email/i), 'hr@acme.example')
    await userEvent.type(screen.getByLabelText(/password/i), 'nope')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeTruthy()
    expect(window.sessionStorage.getItem('salaryhub.auth')).toBeNull()
  })

  it('shows a different message when the server cannot be reached', async () => {
    api.post.mockRejectedValue(new Error('Network Error'))
    render(<App />)

    await userEvent.type(await screen.findByLabelText(/email/i), 'hr@acme.example')
    await userEvent.type(screen.getByLabelText(/password/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/unable to sign in right now/i)).toBeTruthy()
  })
})

describe('when signed in', () => {
  beforeEach(signIn)

  it('opens on the dashboard and shows who is signed in', async () => {
    render(<App />)

    expect(await screen.findByText('dashboard page')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.getAllByText('Hannah Roe').length).toBeGreaterThan(0)
  })

  it('does not show the login page to someone already signed in', async () => {
    window.location.hash = '#/login'
    render(<App />)

    expect(await screen.findByText('dashboard page')).toBeTruthy()
  })

  it('logs out: clears the session and returns to the login page', async () => {
    render(<App />)
    await screen.findByText('dashboard page')

    await userEvent.click(screen.getAllByRole('button', { name: /log out/i })[0])

    expect(await screen.findByRole('button', { name: /sign in/i })).toBeTruthy()
    expect(window.sessionStorage.getItem('salaryhub.auth')).toBeNull()
  })

  it('returns to the login page when the API reports an expired session', async () => {
    render(<App />)
    await screen.findByText('dashboard page')

    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))

    expect(await screen.findByRole('button', { name: /sign in/i })).toBeTruthy()
  })

  it('navigates between pages from the sidebar', async () => {
    render(<App />)
    await screen.findByText('dashboard page')

    await userEvent.click(nav().querySelector('a[href="#/employees"]'))
    expect(await screen.findByText(/employee table/)).toBeTruthy()

    await userEvent.click(nav().querySelector('a[href="#/analytics"]'))
    expect(await screen.findByText('salary analytics table')).toBeTruthy()
  })

  it('top-bar search opens the employees page with that search applied', async () => {
    render(<App />)
    await screen.findByText('dashboard page')

    await userEvent.type(screen.getByLabelText('Search employees'), 'asha{Enter}')

    expect(await screen.findByText(/search=\[asha\]/)).toBeTruthy()
  })

  it('?add=1 opens the employees page ready to add', async () => {
    window.location.hash = '#/employees?add=1'
    render(<App />)

    expect(await screen.findByText(/add=\[true\]/)).toBeTruthy()
  })

  it('sidebar toggle collapses to icons only, remembers the choice, and expands again', async () => {
    const { unmount } = render(<App />)
    await screen.findByText('dashboard page')

    await userEvent.click(screen.getByRole('button', { name: 'collapse sidebar' }))

    expect(nav().querySelector('a[href="#/analytics"]')).toBeTruthy() // links remain, labels hidden
    expect(window.localStorage.getItem('salaryhub.sidebarCollapsed')).toBe('true')

    unmount()
    render(<App />) // a fresh load stays collapsed
    await screen.findByText('dashboard page')
    expect(screen.getByRole('button', { name: 'expand sidebar' })).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'expand sidebar' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'collapse sidebar' })).toBeTruthy())
  })
})
