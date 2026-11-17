import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'

// Page content is tested elsewhere; this file is about the shell and navigation.
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>dashboard page</div> }))
vi.mock('./components/EmployeeTable', () => ({
  default: ({ initialSearch, openAdd }) => (
    <div>
      employee table search=[{initialSearch}] add=[{String(openAdd)}]
    </div>
  ),
}))
vi.mock('./components/SalaryAnalytics', () => ({ default: () => <div>salary analytics table</div> }))

beforeEach(() => {
  window.location.hash = '#/'
})

const nav = () => screen.getAllByRole('navigation', { name: /main navigation/i })[0]

it('opens on the dashboard', async () => {
  render(<App />)

  expect(await screen.findByText('dashboard page')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
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
