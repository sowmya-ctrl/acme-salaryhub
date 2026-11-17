import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import api from '../services/api'
import DashboardPage from './DashboardPage'

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))
// Recharts needs real layout to draw; its output is not what these tests are about.
vi.mock('../components/SalaryCurrencyChart', () => ({ default: () => <div>currency chart</div> }))
vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal()),
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: () => <div>pie</div>,
}))

const responses = {
  '/dashboard/overview': { total_employees: 10000, active_employees: 7500, inactive_employees: 2500 },
  '/dashboard/departments': [
    { department: 'Engineering', employee_count: 6000 },
    { department: 'Sales', employee_count: 4000 },
  ],
  '/dashboard/countries': [
    { country: 'India', country_code: 'IND', employee_count: 7000 },
    { country: 'Germany', country_code: 'DEU', employee_count: 3000 },
  ],
  '/dashboard/salary-by-currency': [
    { currency: 'INR', total_salary: 62500000, employee_count: 7000 },
    { currency: 'EUR', total_salary: 10100000, employee_count: 3000 },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockImplementation((url) => Promise.resolve({ data: responses[url] }))
})

it('shows headcount KPIs', async () => {
  renderPage()

  expect((await screen.findAllByText('10,000')).length).toBe(2) // KPI card + donut centre
  expect(screen.getByText('7,500')).toBeTruthy()
  expect(screen.getByText('2,500')).toBeTruthy()
})

it('lists salary expenditure per currency instead of one converted total', async () => {
  renderPage()

  expect(await screen.findByText('2 currencies')).toBeTruthy()
  const caption = screen.getByText(/₹62\.5M/)
  expect(caption.textContent).toContain('€10.1M')
})

it('shows department shares and country shares as percentages', async () => {
  renderPage()
  await screen.findByText('2 currencies')

  const legend = screen.getByLabelText('Department legend')
  expect(legend.textContent).toContain('Engineering')
  expect(legend.textContent).toContain('60%')
  expect(screen.getByText(/7,000 · 70%/)).toBeTruthy()
})

it('offers working quick actions', async () => {
  renderPage()
  await screen.findByText('2 currencies')

  expect(screen.getByRole('link', { name: /add employee/i }).getAttribute('href')).toBe('/employees?add=1')
  expect(screen.getByRole('link', { name: /view salary analytics/i }).getAttribute('href')).toBe('/analytics')
  expect(screen.getByRole('link', { name: /export report/i }).getAttribute('href')).toBe('/api/employees/export')
})

it('shows an error when the data cannot be loaded', async () => {
  api.get.mockRejectedValue(new Error('down'))
  renderPage()

  expect(await screen.findByText(/unable to load the dashboard/i)).toBeTruthy()
})
