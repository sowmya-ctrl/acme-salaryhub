import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import api from '../services/api'
import EmployeeFormDialog from './EmployeeFormDialog'

const user = userEvent.setup({ delay: null }) // no artificial per-keystroke delay: keeps the tests fast

vi.mock('../services/api', () => ({ default: { post: vi.fn(), patch: vi.fn() } }))

const departments = [{ id: 1, name: 'Engineering' }]
const countries = [{ id: 7, name: 'India', currency_code: 'INR' }]
const existing = {
  id: 3, employee_code: 'ACME00003', first_name: 'Asha', last_name: 'Rao', email: 'asha@example.com',
  designation: 'Engineer', department_id: 1, country_id: 7, joining_date: '2020-01-01',
}

const renderForm = (props = {}) => {
  const onSaved = vi.fn()
  const onClose = vi.fn()
  render(
    <EmployeeFormDialog departments={departments} countries={countries} onSaved={onSaved} onClose={onClose} {...props} />,
  )
  return { onSaved, onClose }
}

async function pick(label, option) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

async function fillNewEmployee({ salary } = {}) {
  await user.type(screen.getByLabelText(/first name/i), 'Eve')
  await user.type(screen.getByLabelText(/last name/i), 'Miller')
  await user.type(screen.getByLabelText(/^email/i), 'eve@example.com')
  await pick(/department/i, 'Engineering')
  await pick(/country/i, 'India')
  await user.type(screen.getByLabelText(/joining date/i), '2024-03-01')
  if (salary) await user.type(screen.getByLabelText(/starting basic salary/i), salary)
}

beforeEach(() => vi.clearAllMocks())

it('creates an employee and records the starting salary in the country currency', async () => {
  api.post.mockResolvedValue({ data: {} })
  const { onSaved } = renderForm({ employee: null })

  await fillNewEmployee({ salary: '90000' })
  await user.click(screen.getByRole('button', { name: /add employee/i }))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  const [url, body] = api.post.mock.calls[0]
  expect(url).toBe('/employees/')
  expect(body).toMatchObject({
    first_name: 'Eve', last_name: 'Miller', email: 'eve@example.com',
    department_id: 1, country_id: 7, joining_date: '2024-03-01',
    salary: { basic_salary: '90000', currency: 'INR', effective_from: '2024-03-01' },
  })
})

it('omits the salary when none is entered', async () => {
  api.post.mockResolvedValue({ data: {} })
  const { onSaved } = renderForm({ employee: null })

  await fillNewEmployee()
  await user.click(screen.getByRole('button', { name: /add employee/i }))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(api.post.mock.calls[0][1]).not.toHaveProperty('salary')
})

it('editing sends a PATCH without the joining date (which cannot change)', async () => {
  api.patch.mockResolvedValue({ data: {} })
  const { onSaved } = renderForm({ employee: existing })

  const designation = screen.getByLabelText(/designation/i)
  await user.clear(designation)
  await user.type(designation, 'Staff Engineer')
  await user.click(screen.getByRole('button', { name: /save changes/i }))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  const [url, body] = api.patch.mock.calls[0]
  expect(url).toBe('/employees/3')
  expect(body.designation).toBe('Staff Engineer')
  expect(body).not.toHaveProperty('joining_date')
  expect(screen.queryByLabelText(/joining date/i)).toBeNull()
})

it('shows the server message and stays open when saving fails', async () => {
  api.post.mockRejectedValue({ response: { data: { detail: 'Email already in use' } } })
  const { onSaved } = renderForm({ employee: null })

  await fillNewEmployee()
  await user.click(screen.getByRole('button', { name: /add employee/i }))

  expect(await screen.findByText('Email already in use')).toBeTruthy()
  expect(onSaved).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /add employee/i }).disabled).toBe(false) // can retry
})

it('cancel closes without saving', async () => {
  const { onClose } = renderForm({ employee: null })

  await user.click(screen.getByRole('button', { name: /cancel/i }))

  expect(onClose).toHaveBeenCalled()
  expect(api.post).not.toHaveBeenCalled()
})
