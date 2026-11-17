import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import PaymentsIcon from '@mui/icons-material/Payments'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import api from '../services/api'
import EmployeeFormDialog from './EmployeeFormDialog'
import SalaryDialog from './SalaryDialog'

const EMPTY = { search: '', department_id: '', country_id: '', status: '' }

/**
 * Employee directory. Filters are edited in a draft and only applied when the user
 * clicks Search (or presses Enter); paging and CSV export reuse the applied filters.
 */
function EmployeeTable() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [formFor, setFormFor] = useState(undefined) // undefined = closed, null = new, object = edit
  const [salaryFor, setSalaryFor] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const filters = Object.fromEntries(Object.entries(applied).filter(([, v]) => v !== ''))

  useEffect(() => {
    Promise.all([api.get('/departments'), api.get('/countries')])
      .then(([d, c]) => {
        setDepartments(d.data)
        setCountries(c.data)
      })
      .catch(() => setError('Unable to load filter options.'))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    Promise.all([
      api.get('/employees/', {
        params: { ...filters, skip: page * rowsPerPage, limit: rowsPerPage },
        signal: controller.signal,
      }),
      api.get('/employees/count', { params: filters, signal: controller.signal }),
    ])
      .then(([list, count]) => {
        setEmployees(list.data)
        setTotalEmployees(count.data.total_employees)
        setError('')
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setError('Unable to load employees.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, page, rowsPerPage, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const setField = (field) => (event) => setDraft({ ...draft, [field]: event.target.value })

  const submit = (event) => {
    event.preventDefault()
    setApplied(draft)
    setPage(0)
  }

  const reset = () => {
    setDraft(EMPTY)
    setApplied(EMPTY)
    setPage(0)
  }

  const deactivate = async (employee) => {
    if (!window.confirm(`Deactivate ${employee.first_name} ${employee.last_name}? Salary history is kept.`)) return
    await api.delete(`/employees/${employee.id}`)
    reload()
  }

  const exportUrl = `/api/employees/export?${new URLSearchParams(filters)}`

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Employee Directory
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<DownloadIcon />} href={exportUrl} download>
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormFor(null)}>
              Add employee
            </Button>
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={submit}
          sx={{
            display: 'grid',
            gap: 2,
            mb: 3,
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' },
            alignItems: 'start',
          }}
        >
          <TextField
            size="small"
            label="Search by name, employee ID or email"
            value={draft.search}
            onChange={setField('search')}
          />
          <TextField select size="small" label="Department" value={draft.department_id} onChange={setField('department_id')}>
            <MenuItem value="">All departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Country" value={draft.country_id} onChange={setField('country_id')}>
            <MenuItem value="">All countries</MenuItem>
            {countries.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Status" value={draft.status} onChange={setField('status')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
              Search
            </Button>
            <Button onClick={reset}>Reset</Button>
          </Box>
        </Box>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No employees match these filters.</TableCell>
                    </TableRow>
                  )}
                  {employees.map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell>{employee.employee_code}</TableCell>
                      <TableCell>
                        {employee.first_name} {employee.last_name}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {employee.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>{employee.department_name}</TableCell>
                      <TableCell>{employee.country_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={employee.status}
                          color={employee.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Salary history & revision">
                          <IconButton aria-label={`salary ${employee.employee_code}`} onClick={() => setSalaryFor(employee)}>
                            <PaymentsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton aria-label={`edit ${employee.employee_code}`} onClick={() => setFormFor(employee)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {employee.status === 'active' && (
                          <Tooltip title="Deactivate">
                            <IconButton aria-label={`deactivate ${employee.employee_code}`} onClick={() => deactivate(employee)}>
                              <PersonOffIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalEmployees}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </CardContent>

      {formFor !== undefined && (
        <EmployeeFormDialog
          employee={formFor}
          departments={departments}
          countries={countries}
          onClose={() => setFormFor(undefined)}
          onSaved={() => {
            setFormFor(undefined)
            reload()
          }}
        />
      )}
      {salaryFor && <SalaryDialog employee={salaryFor} onClose={() => setSalaryFor(null)} />}
    </Card>
  )
}

export default EmployeeTable
