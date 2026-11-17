import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from '../services/api'
import SalaryAnalytics from './SalaryAnalytics'

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }))

const byDepartment = [
  { group: 'Engineering', currency: 'INR', headcount: 2, min_salary: 60000, avg_salary: 85000, max_salary: 110000, total_salary: 170000 },
  { group: 'Engineering', currency: 'USD', headcount: 1, min_salary: 120000, avg_salary: 120000, max_salary: 120000, total_salary: 120000 },
]
const byCountry = [
  { group: 'India', currency: 'INR', headcount: 2, min_salary: 60000, avg_salary: 85000, max_salary: 110000, total_salary: 170000 },
]

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockImplementation((_url, { params }) =>
    Promise.resolve({ data: params.group_by === 'country' ? byCountry : byDepartment }),
  )
})

it('shows min / average / max / total per group, split by currency', async () => {
  render(<SalaryAnalytics />)

  expect(await screen.findAllByText('Engineering')).toHaveLength(2) // one row per currency, never merged
  expect(screen.getByText('₹60,000')).toBeTruthy()
  expect(screen.getByText('₹85,000')).toBeTruthy()
  expect(screen.getByText('$120,000', { selector: 'td:nth-child(4)' })).toBeTruthy() // USD min
  expect(api.get).toHaveBeenCalledWith('/analytics/salary-summary', { params: { group_by: 'department' } })
})

it('switches to grouping by country', async () => {
  render(<SalaryAnalytics />)
  await screen.findAllByText('Engineering')

  await userEvent.click(screen.getByRole('button', { name: /by country/i }))

  expect(await screen.findByText('India')).toBeTruthy()
  expect(screen.queryByText('Engineering')).toBeNull()
  expect(api.get).toHaveBeenLastCalledWith('/analytics/salary-summary', { params: { group_by: 'country' } })
})

it('shows an error message when the data cannot be loaded', async () => {
  api.get.mockRejectedValue(new Error('down'))
  render(<SalaryAnalytics />)

  expect(await screen.findByText(/unable to load salary analytics/i)).toBeTruthy()
})

it('shows a loading spinner until the first result arrives', async () => {
  render(<SalaryAnalytics />)

  expect(screen.getByRole('progressbar')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
})
