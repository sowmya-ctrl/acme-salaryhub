import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from './services/api'
import App from './App'

vi.mock('./services/api', () => ({ default: { get: vi.fn() } }))
// Charts are covered by the backend tests; keep this test about navigation.
vi.mock('./components/DepartmentChart', () => ({ default: () => <div>department chart</div> }))
vi.mock('./components/CountryChart', () => ({ default: () => <div>country chart</div> }))
vi.mock('./components/SalaryCurrencyChart', () => ({ default: () => <div>currency chart</div> }))
vi.mock('./components/EmployeeTable', () => ({ default: () => <div>employee table</div> }))
vi.mock('./components/SalaryAnalytics', () => ({ default: () => <div>salary analytics table</div> }))

beforeEach(() => {
  window.location.hash = '#/'
  api.get.mockResolvedValue({
    data: { total_employees: 10000, active_employees: 7500, inactive_employees: 2500 },
  })
})

it('opens on the dashboard with headcount cards', async () => {
  render(<App />)

  expect(await screen.findByText('10,000')).toBeTruthy()
  expect(screen.getByText('department chart')).toBeTruthy()
})

it('navigates between pages from the sidebar', async () => {
  render(<App />)
  await screen.findByText('10,000')

  const nav = screen.getAllByRole('navigation', { name: /main navigation/i })[0]
  await userEvent.click(nav.querySelector('a[href="#/employees"]'))
  expect(await screen.findByText('employee table')).toBeTruthy()

  await userEvent.click(nav.querySelector('a[href="#/analytics"]'))
  expect(await screen.findByText('salary analytics table')).toBeTruthy()
})
