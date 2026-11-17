import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from '../services/api'
import EmployeeTable from './EmployeeTable'

vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))

const employee = {
  id: 1, employee_code: 'ACME00001', first_name: 'Asha', last_name: 'Rao',
  email: 'asha@example.com', designation: 'Engineer', department_id: 1, country_id: 1,
  department_name: 'Engineering', country_name: 'India', status: 'active',
}

function mockApi({ employees = [employee], total = 1 } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/departments') return Promise.resolve({ data: [{ id: 1, name: 'Engineering' }] })
    if (url === '/countries') return Promise.resolve({ data: [{ id: 1, name: 'India', currency_code: 'INR' }] })
    if (url === '/employees/count') return Promise.resolve({ data: { total_employees: total } })
    if (url === '/employees/') return Promise.resolve({ data: employees })
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

beforeEach(() => vi.clearAllMocks())

it('renders employees with department and country names', async () => {
  mockApi()
  render(<EmployeeTable />)

  expect(await screen.findByText('ACME00001')).toBeTruthy()
  expect(screen.getByText('Engineering')).toBeTruthy()
  expect(screen.getByText('India')).toBeTruthy()
})

it('sends the search term to both the list and the count endpoints', async () => {
  mockApi()
  render(<EmployeeTable />)
  await screen.findByText('ACME00001')

  await userEvent.type(screen.getByLabelText(/search by name/i), 'asha')

  await waitFor(() => {
    const calls = api.get.mock.calls.filter(([url]) => url === '/employees/' || url === '/employees/count')
    const last = calls.slice(-2)
    expect(last.map(([url]) => url).sort()).toEqual(['/employees/', '/employees/count'])
    last.forEach(([, config]) => expect(config.params.search).toBe('asha'))
  })
})

it('shows an empty state when nothing matches', async () => {
  mockApi({ employees: [], total: 0 })
  render(<EmployeeTable />)

  expect(await screen.findByText(/no employees match/i)).toBeTruthy()
})

it('deactivates an employee after confirmation', async () => {
  mockApi()
  api.delete.mockResolvedValue({ data: {} })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<EmployeeTable />)

  await userEvent.click(await screen.findByLabelText('deactivate ACME00001'))

  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/employees/1'))
})

it('does not deactivate when the confirmation is cancelled', async () => {
  mockApi()
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  render(<EmployeeTable />)

  await userEvent.click(await screen.findByLabelText('deactivate ACME00001'))

  expect(api.delete).not.toHaveBeenCalled()
})
