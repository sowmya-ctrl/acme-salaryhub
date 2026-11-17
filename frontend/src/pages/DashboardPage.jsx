import { useEffect, useState } from 'react'
import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import DepartmentChart from '../components/DepartmentChart'
import CountryChart from '../components/CountryChart'
import SalaryCurrencyChart from '../components/SalaryCurrencyChart'
import api from '../services/api'

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard/overview')
      .then((response) => setDashboard(response.data))
      .catch(() => setError('Unable to load dashboard statistics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <CircularProgress />
  if (error) return <Typography color="error">{error}</Typography>

  const cards = [
    { title: 'Total Employees', value: dashboard.total_employees, icon: <PeopleIcon fontSize="large" /> },
    { title: 'Active Employees', value: dashboard.active_employees, icon: <PersonIcon fontSize="large" /> },
    { title: 'Inactive Employees', value: dashboard.inactive_employees, icon: <PersonOffIcon fontSize="large" /> },
  ]

  return (
    // One screen, no page scroll on desktop: KPI row + a chart row that takes the remaining height.
    <Box
      sx={{
        height: { md: '100%' },
        minHeight: { xs: 'auto', md: 420 },
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gridTemplateRows: { xs: 'auto', md: 'auto minmax(0, 1fr)' },
      }}
    >
      {cards.map((card) => (
        <Card elevation={2} key={card.title}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {card.icon}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {card.value.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
      <Box sx={{ minHeight: { xs: 300, md: 0 } }}>
        <DepartmentChart />
      </Box>
      <Box sx={{ minHeight: { xs: 300, md: 0 } }}>
        <CountryChart />
      </Box>
      <Box sx={{ minHeight: { xs: 300, md: 0 } }}>
        <SalaryCurrencyChart />
      </Box>
    </Box>
  )
}

export default DashboardPage
