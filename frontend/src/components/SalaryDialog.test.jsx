import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from '../services/api'
import SalaryDialog from './SalaryDialog'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const employee = { id: 7, employee_code: 'ACME00007', first_name: 'Ben', last_name: 'Smith' }
const record = {
  id: 1, employee_id: 7, basic_salary: '100000', allowances: '0', bonus: '0',
  deductions: '0', currency: 'USD', effective_from: '2020-01-01', effective_to: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: [record] })
})

it('lists history in the record currency and marks the open record as current', async () => {
  render(<SalaryDialog employee={employee} onClose={() => {}} />)

  expect((await screen.findAllByText('$100,000')).length).toBeGreaterThan(0)
  expect(screen.getByText('Current')).toBeTruthy()
})

it('posts a revision with an upper-cased currency and reloads history', async () => {
  api.post.mockResolvedValue({ data: {} })
  render(<SalaryDialog employee={employee} onClose={() => {}} />)
  await screen.findByText('Current')

  await userEvent.type(screen.getByLabelText(/^basic/i), '120000')
  await userEvent.type(screen.getByLabelText(/effective from/i), '2024-01-01')
  await userEvent.click(screen.getByRole('button', { name: /save revision/i }))

  await waitFor(() => expect(api.post).toHaveBeenCalled())
  const [url, body] = api.post.mock.calls[0]
  expect(url).toBe('/employees/7/salaries')
  expect(body).toMatchObject({ basic_salary: '120000', currency: 'USD', effective_from: '2024-01-01' })
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
})

it('shows the server validation message', async () => {
  api.post.mockRejectedValue({ response: { data: { detail: 'New salary must have a later effective date' } } })
  render(<SalaryDialog employee={employee} onClose={() => {}} />)
  await screen.findByText('Current')

  await userEvent.type(screen.getByLabelText(/^basic/i), '1')
  await userEvent.type(screen.getByLabelText(/effective from/i), '2019-01-01')
  await userEvent.click(screen.getByRole('button', { name: /save revision/i }))

  expect(await screen.findByText(/later effective date/i)).toBeTruthy()
})
