import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import api from '../services/api'
import { formatMoney } from '../utils/format'

/** Min / avg / max current net salary by department or country, always per currency. */
function SalaryAnalytics() {
  const [groupBy, setGroupBy] = useState('department')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .get('/analytics/salary-summary', { params: { group_by: groupBy } })
      .then(({ data }) => setRows(data))
      .catch(() => setError('Unable to load salary analytics.'))
      .finally(() => setLoading(false))
  }, [groupBy])

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Salary analytics (active employees)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current net pay. Currencies are never combined, so each group is split by currency.
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={groupBy}
          onChange={(_, value) => value && setGroupBy(value)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="department">By department</ToggleButton>
          <ToggleButton value="country">By country</ToggleButton>
        </ToggleButtonGroup>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{groupBy === 'department' ? 'Department' : 'Country'}</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Headcount</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Max</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.group}-${r.currency}`}>
                  <TableCell>{r.group}</TableCell>
                  <TableCell>{r.currency}</TableCell>
                  <TableCell align="right">{r.headcount.toLocaleString()}</TableCell>
                  <TableCell align="right">{formatMoney(r.min_salary, r.currency)}</TableCell>
                  <TableCell align="right">{formatMoney(r.avg_salary, r.currency)}</TableCell>
                  <TableCell align="right">{formatMoney(r.max_salary, r.currency)}</TableCell>
                  <TableCell align="right">{formatMoney(r.total_salary, r.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default SalaryAnalytics
