import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import api from '../services/api'

/** Create (employee == null) or edit an employee. New employees can start with a salary. */
function EmployeeFormDialog({ employee, departments, countries, onClose, onSaved }) {
  const editing = Boolean(employee)
  const [form, setForm] = useState({
    first_name: employee?.first_name ?? '',
    last_name: employee?.last_name ?? '',
    email: employee?.email ?? '',
    designation: employee?.designation ?? '',
    department_id: employee?.department_id ?? '',
    country_id: employee?.country_id ?? '',
    joining_date: employee?.joining_date ?? '',
    basic_salary: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const { basic_salary, ...fields } = form
      if (editing) {
        const { joining_date, ...editable } = fields // joining date is not editable
        await api.patch(`/employees/${employee.id}`, editable)
      } else {
        const country = countries.find((c) => c.id === Number(fields.country_id))
        const payload = { ...fields }
        if (basic_salary) {
          payload.salary = {
            basic_salary,
            currency: country.currency_code,
            effective_from: fields.joining_date,
          }
        }
        await api.post('/employees/', payload)
      }
      onSaved()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Please check the values entered.')
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth component="form" onSubmit={submit}>
      <DialogTitle>{editing ? `Edit ${employee.employee_code}` : 'Add employee'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={2}>
            <TextField label="First name" required fullWidth size="small" value={form.first_name} onChange={set('first_name')} />
            <TextField label="Last name" required fullWidth size="small" value={form.last_name} onChange={set('last_name')} />
          </Stack>
          <TextField label="Email" type="email" required size="small" value={form.email} onChange={set('email')} />
          <TextField label="Designation" size="small" value={form.designation} onChange={set('designation')} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Department" required fullWidth size="small" value={form.department_id} onChange={set('department_id')}>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Country" required fullWidth size="small" value={form.country_id} onChange={set('country_id')}>
              {countries.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
          {!editing && (
            <Stack direction="row" spacing={2}>
              <TextField label="Joining date" type="date" required fullWidth size="small" value={form.joining_date} onChange={set('joining_date')} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Starting basic salary (optional)" type="number" fullWidth size="small" value={form.basic_salary} onChange={set('basic_salary')} helperText="Paid in the country's currency" />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {editing ? 'Save changes' : 'Add employee'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmployeeFormDialog
