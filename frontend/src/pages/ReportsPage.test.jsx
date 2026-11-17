import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from '../services/api'
import ReportsPage from './ReportsPage'

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))

const report = {
  total: 2,
  active: 1,
  inactive: 1,
  salary_summary: [
    { currency: 'USD', headcount: 2, min_salary: 80000, avg_salary: 100000, max_salary: 120000, total_salary: 200000 },
  ],
  items: [
    { id: 1, employee_code: 'ACME00002', name: 'Ben Smith', department: 'Engineering', country: 'United States', joining_date: '2020-01-01', status: 'active', currency: 'USD', net_salary: 120000 },
    { id: 2, employee_code: 'ACME00009', name: 'No Pay', department: 'Sales', country: 'India', joining_date: '2021-01-01', status: 'inactive', currency: null, net_salary: null },
  ],
}

const reportCalls = () => api.get.mock.calls.filter(([url]) => url === '/reports/employees')

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockImplementation((url) => {
    if (url === '/departments') return Promise.resolve({ data: [{ id: 1, name: 'Engineering' }] })
    if (url === '/countries') return Promise.resolve({ data: [{ id: 1, name: 'India', currency_code: 'INR' }] })
    return Promise.resolve({ data: report })
  })
})

it('does not fetch a report until the form is submitted', async () => {
  render(<ReportsPage />)

  expect(await screen.findByText(/no report yet/i)).toBeTruthy()
  await userEvent.type(screen.getByLabelText('Min net salary'), '100')
  expect(reportCalls()).toHaveLength(0)
})

it('generates the report with only the filled-in filters', async () => {
  render(<ReportsPage />)
  await screen.findByText(/no report yet/i)

  await userEvent.type(screen.getByLabelText('Joined from'), '2020-01-01')
  await userEvent.click(screen.getByRole('button', { name: /generate report/i }))

  expect(await screen.findByText(/results: 2 employees/i)).toBeTruthy()
  expect(reportCalls()).toHaveLength(1)
  expect(reportCalls()[0][1].params).toEqual({ joined_from: '2020-01-01', skip: 0, limit: 25 })
  expect(screen.getByText('Ben Smith')).toBeTruthy()
  expect(screen.getAllByText('$120,000').length).toBeGreaterThan(0)
})

it('shows a dash for employees without a salary', async () => {
  render(<ReportsPage />)
  await userEvent.click(await screen.findByRole('button', { name: /generate report/i }))

  const row = (await screen.findByText('No Pay')).closest('tr')
  expect(row.textContent).toContain('-')
})

it('shows the server validation message', async () => {
  api.get.mockImplementation((url) => {
    if (url === '/reports/employees') {
      return Promise.reject({ response: { data: { detail: 'Choose a currency to filter by salary range' } } })
    }
    return Promise.resolve({ data: [] })
  })
  render(<ReportsPage />)

  await userEvent.click(await screen.findByRole('button', { name: /generate report/i }))

  expect(await screen.findByText(/choose a currency/i)).toBeTruthy()
})

it('reset clears the report', async () => {
  render(<ReportsPage />)
  await userEvent.click(await screen.findByRole('button', { name: /generate report/i }))
  await screen.findByText(/results: 2 employees/i)

  await userEvent.click(screen.getByRole('button', { name: /reset/i }))

  await waitFor(() => expect(screen.getByText(/no report yet/i)).toBeTruthy())
})
