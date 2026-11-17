import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AssessmentIcon from '@mui/icons-material/Assessment'
import DownloadIcon from '@mui/icons-material/Download'
import api from '../services/api'
import { formatMoney } from '../utils/format'

const EMPTY_FILTERS = {
  department_id: '',
  country_id: '',
  status: '',
  joined_from: '',
  joined_to: '',
  currency: '',
  min_salary: '',
  max_salary: '',
}

const clean = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))

/**
 * Employee report. Nothing is fetched while filters are edited; the report is
 * generated only when the user submits, and paging/export reuse those submitted filters.
 */
function ReportsPage() {
  const [departments, setDepartments] = useState([])
  const [countries, setCountries] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [submitted, setSubmitted] = useState(null) // filters the current report was generated with
  const [report, setReport] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/departments'), api.get('/countries')])
      .then(([d, c]) => {
        setDepartments(d.data)
        setCountries(c.data)
      })
      .catch(() => setError('Unable to load filter options.'))
  }, [])

  const currencies = [...new Set(countries.map((c) => c.currency_code))].sort()
  const set = (field) => (event) => setFilters({ ...filters, [field]: event.target.value })

  const run = async (activeFilters, pageIndex, size) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/reports/employees', {
        params: { ...clean(activeFilters), skip: pageIndex * size, limit: size },
      })
      setReport(data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Unable to generate the report.')
    } finally {
      setLoading(false)
    }
  }

  const generate = (event) => {
    event.preventDefault()
    setSubmitted(filters)
    setPage(0)
    run(filters, 0, rowsPerPage)
  }

  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setSubmitted(null)
    setReport(null)
    setError('')
    setPage(0)
  }

  const exportUrl = submitted
    ? `/api/reports/employees/export?${new URLSearchParams(clean(submitted))}`
    : null

  const date = (field, label) => (
    <TextField
      label={label}
      type="date"
      size="small"
      value={filters[field]}
      onChange={set(field)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  )

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Employee report
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choose the filters you need, then generate the report. Leave everything blank for all employees.
          </Typography>

          <Box
            component="form"
            onSubmit={generate}
            sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' } }}
          >
            <TextField select label="Department" size="small" value={filters.department_id} onChange={set('department_id')}>
              <MenuItem value="">All departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Country" size="small" value={filters.country_id} onChange={set('country_id')}>
              <MenuItem value="">All countries</MenuItem>
              {countries.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" size="small" value={filters.status} onChange={set('status')}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <TextField select label="Currency" size="small" value={filters.currency} onChange={set('currency')}>
              <MenuItem value="">Any</MenuItem>
              {currencies.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            {date('joined_from', 'Joined from')}
            {date('joined_to', 'Joined to')}
            <TextField label="Min net salary" type="number" size="small" value={filters.min_salary} onChange={set('min_salary')} helperText="Requires a currency" />
            <TextField label="Max net salary" type="number" size="small" value={filters.max_salary} onChange={set('max_salary')} helperText="Requires a currency" />

            <Box sx={{ gridColumn: { md: '1 / -1' } }} display="flex" gap={1}>
              <Button type="submit" variant="contained" startIcon={<AssessmentIcon />} disabled={loading}>
                Generate report
              </Button>
              <Button onClick={reset} disabled={loading}>
                Reset
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && !report && <CircularProgress />}

      {!report && !loading && !error && (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AssessmentIcon fontSize="large" color="disabled" />
            <Typography color="text.secondary">
              No report yet. Set your filters and click “Generate report”.
            </Typography>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card elevation={2} sx={{ opacity: loading ? 0.6 : 1 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Results: {report.total.toLocaleString()} employees
                <Typography component="span" color="text.secondary" ml={1}>
                  ({report.active.toLocaleString()} active, {report.inactive.toLocaleString()} inactive)
                </Typography>
              </Typography>
              <Button startIcon={<DownloadIcon />} href={exportUrl} download>
                Export CSV
              </Button>
            </Box>

            {report.salary_summary.length > 0 && (
              <Table size="small" sx={{ mb: 3 }} aria-label="Salary summary">
                <TableHead>
                  <TableRow>
                    <TableCell>Currency</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Min</TableCell>
                    <TableCell align="right">Average</TableCell>
                    <TableCell align="right">Max</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.salary_summary.map((s) => (
                    <TableRow key={s.currency}>
                      <TableCell>{s.currency}</TableCell>
                      <TableCell align="right">{s.headcount.toLocaleString()}</TableCell>
                      <TableCell align="right">{formatMoney(s.min_salary, s.currency)}</TableCell>
                      <TableCell align="right">{formatMoney(s.avg_salary, s.currency)}</TableCell>
                      <TableCell align="right">{formatMoney(s.max_salary, s.currency)}</TableCell>
                      <TableCell align="right">{formatMoney(s.total_salary, s.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Table size="small" aria-label="Report results">
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Net salary</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No employees match these filters.</TableCell>
                  </TableRow>
                )}
                {report.items.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.employee_code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.department}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.joining_date}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={r.status === 'active' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      {r.net_salary == null ? '-' : formatMoney(r.net_salary, r.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={report.total}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={(_, newPage) => {
                setPage(newPage)
                run(submitted, newPage, rowsPerPage)
              }}
              onRowsPerPageChange={(event) => {
                const size = parseInt(event.target.value, 10)
                setRowsPerPage(size)
                setPage(0)
                run(submitted, 0, size)
              }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default ReportsPage
