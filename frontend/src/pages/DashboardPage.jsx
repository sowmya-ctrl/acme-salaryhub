import { useEffect, useState } from 'react'
import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material'
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
    <>
      <Typography color="text.secondary" mb={3}>
        Workforce overview
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, md: 4 }} key={card.title}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  {card.icon}
                  <Box>
                    <Typography color="text.secondary">{card.title}</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12, md: 6 }}>
          <DepartmentChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CountryChart />
        </Grid>
        <Grid size={12}>
          <SalaryCurrencyChart />
        </Grid>
      </Grid>
    </>
  )
}

export default DashboardPage
