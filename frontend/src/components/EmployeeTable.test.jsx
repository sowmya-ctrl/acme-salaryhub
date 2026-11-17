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

const inactive = { ...employee, id: 2, employee_code: 'ACME00002', status: 'inactive' }

beforeEach(() => vi.clearAllMocks())

it('renders employees with department and country names', async () => {
  mockApi()
  render(<EmployeeTable />)

  expect(await screen.findByText('ACME00001')).toBeTruthy()
  expect(screen.getByText('Engineering')).toBeTruthy()
  expect(screen.getByText('India')).toBeTruthy()
})

it('applies the search only when Search is clicked, to both list and count', async () => {
  mockApi()
  render(<EmployeeTable />)
  await screen.findByText('ACME00001')
  const listCalls = () => api.get.mock.calls.filter(([url]) => url === '/employees/')
  const before = listCalls().length

  await userEvent.type(screen.getByLabelText(/search by name/i), 'asha')
  expect(listCalls()).toHaveLength(before) // typing alone must not query

  await userEvent.click(screen.getByRole('button', { name: /^search$/i }))

  await waitFor(() => expect(listCalls()).toHaveLength(before + 1))
  const [, listConfig] = listCalls().at(-1)
  const [, countConfig] = api.get.mock.calls.filter(([url]) => url === '/employees/count').at(-1)
  expect(listConfig.params.search).toBe('asha')
  expect(countConfig.params.search).toBe('asha')
  expect(listConfig.params.skip).toBe(0)
})

it('reset clears the applied filters', async () => {
  mockApi()
  render(<EmployeeTable />)
  await screen.findByText('ACME00001')
  await userEvent.type(screen.getByLabelText(/search by name/i), 'asha{Enter}')
  await waitFor(() =>
    expect(api.get.mock.calls.filter(([u, c]) => u === '/employees/' && c.params.search === 'asha')).toHaveLength(1),
  )

  await userEvent.click(screen.getByRole('button', { name: /reset/i }))

  await waitFor(() => {
    const last = api.get.mock.calls.filter(([u]) => u === '/employees/').at(-1)[1]
    expect(last.params.search).toBeUndefined()
  })
  expect(screen.getByLabelText(/search by name/i).value).toBe('')
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

it('offers Activate (not Deactivate) for an inactive employee and reactivates via PATCH', async () => {
  mockApi({ employees: [inactive] })
  api.patch.mockResolvedValue({ data: {} })
  render(<EmployeeTable />)

  const activateButton = await screen.findByLabelText('activate ACME00002')
  expect(screen.queryByLabelText('deactivate ACME00002')).toBeNull()

  await userEvent.click(activateButton)

  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/employees/2', { status: 'active' }))
})
