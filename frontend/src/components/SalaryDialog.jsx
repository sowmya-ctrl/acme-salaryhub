import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import api from '../services/api'
import { formatMoney, netSalary } from '../utils/format'

const emptyForm = {
  basic_salary: '',
  allowances: '0',
  bonus: '0',
  deductions: '0',
  currency: '',
  effective_from: '',
}

/** Salary history for one employee plus a form to add a revision (history is never overwritten). */
function SalaryDialog({ employee, onClose }) {
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await api.get(`/employees/${employee.id}/salaries`)
    setHistory(data)
    setForm((f) => ({ ...f, currency: f.currency || data[0]?.currency || '' }))
  }, [employee.id])

  useEffect(() => {
    load().catch(() => setError('Unable to load salary history.'))
  }, [load])

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post(`/employees/${employee.id}/salaries`, {
        ...form,
        currency: form.currency.toUpperCase(),
      })
      setForm({ ...emptyForm, currency: form.currency })
      await load()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Please check the values entered.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Salary history: {employee.first_name} {employee.last_name} ({employee.employee_code})
      </DialogTitle>
      <DialogContent>
        <Table size="small" sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Effective from</TableCell>
              <TableCell>To</TableCell>
              <TableCell align="right">Basic</TableCell>
              <TableCell align="right">Allowances</TableCell>
              <TableCell align="right">Bonus</TableCell>
              <TableCell align="right">Deductions</TableCell>
              <TableCell align="right">Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.effective_from}</TableCell>
                <TableCell>{r.effective_to ?? 'Current'}</TableCell>
                <TableCell align="right">{formatMoney(r.basic_salary, r.currency)}</TableCell>
                <TableCell align="right">{formatMoney(r.allowances, r.currency)}</TableCell>
                <TableCell align="right">{formatMoney(r.bonus, r.currency)}</TableCell>
                <TableCell align="right">{formatMoney(r.deductions, r.currency)}</TableCell>
                <TableCell align="right">
                  <strong>{formatMoney(netSalary(r), r.currency)}</strong>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Add salary revision
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={submit} display="flex" gap={2} flexWrap="wrap">
          <TextField label="Basic" type="number" size="small" required value={form.basic_salary} onChange={set('basic_salary')} />
          <TextField label="Allowances" type="number" size="small" value={form.allowances} onChange={set('allowances')} />
          <TextField label="Bonus" type="number" size="small" value={form.bonus} onChange={set('bonus')} />
          <TextField label="Deductions" type="number" size="small" value={form.deductions} onChange={set('deductions')} />
          <TextField label="Currency" size="small" required value={form.currency} onChange={set('currency')} slotProps={{ htmlInput: { maxLength: 3 } }} sx={{ width: 100 }} />
          <TextField label="Effective from" type="date" size="small" required value={form.effective_from} onChange={set('effective_from')} slotProps={{ inputLabel: { shrink: true } }} />
          <Button type="submit" variant="contained" disabled={saving}>
            Save revision
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default SalaryDialog
