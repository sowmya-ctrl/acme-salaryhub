import { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import PaymentsIcon from '@mui/icons-material/Payments'
import StatCard from '../components/StatCard'
import DepartmentChart from '../components/DepartmentChart'
import CountryChart from '../components/CountryChart'
import SalaryCurrencyChart from '../components/SalaryCurrencyChart'
import QuickActions from '../components/QuickActions'
import api from '../services/api'
import { formatCompactMoney } from '../utils/format'

const span = (columns, minHeight) => ({
  gridColumn: { md: `span ${columns}` },
  minHeight: { xs: minHeight, md: 0 },
})

function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/departments'),
      api.get('/dashboard/countries'),
      api.get('/dashboard/salary-by-currency'),
    ])
      .then(([overview, departments, countries, currencies]) =>
        setData({
          overview: overview.data,
          departments: departments.data,
          countries: countries.data,
          currencies: currencies.data,
        }),
      )
      .catch(() => setError('Unable to load the dashboard.'))
  }, [])

  if (error) return <Alert severity="error">{error}</Alert>
  if (!data) return <CircularProgress />

  const { overview, departments, countries, currencies } = data
  // Different currencies cannot be summed without exchange rates, so they are listed separately.
  const expenditure = currencies.map((c) => formatCompactMoney(c.total_salary, c.currency)).join(' · ')

  return (
    // Desktop: exactly one screen. KPI row, then two rows of cards sharing the remaining height.
    <Box
      sx={{
        height: { md: '100%' },
        minHeight: { md: 560 },
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
        gridTemplateRows: { xs: 'auto', md: 'auto minmax(0, 1fr) minmax(0, 1fr)' },
      }}
    >
      <Box sx={span(3, 0)}>
        <StatCard icon={<PeopleIcon />} color="#2563eb" title="Total Employees" value={overview.total_employees.toLocaleString()} />
      </Box>
      <Box sx={span(3, 0)}>
        <StatCard icon={<CheckCircleIcon />} color="#22c55e" title="Active Employees" value={overview.active_employees.toLocaleString()} />
      </Box>
      <Box sx={span(3, 0)}>
        <StatCard icon={<PersonOffIcon />} color="#64748b" title="Inactive Employees" value={overview.inactive_employees.toLocaleString()} />
      </Box>
      <Box sx={span(3, 0)}>
        <StatCard
          icon={<PaymentsIcon />}
          color="#7c3aed"
          title="Salary Expenditure"
          value={`${currencies.length} ${currencies.length === 1 ? 'currency' : 'currencies'}`}
          caption={expenditure}
        />
      </Box>

      <Box sx={span(6, 280)}>
        <DepartmentChart data={departments} />
      </Box>
      <Box sx={span(6, 280)}>
        <CountryChart data={countries} />
      </Box>
      <Box sx={span(7, 280)}>
        <SalaryCurrencyChart data={currencies} />
      </Box>
      <Box sx={span(5, 200)}>
        <QuickActions />
      </Box>
    </Box>
  )
}

export default DashboardPage
