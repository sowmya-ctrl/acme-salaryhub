
import { useEffect, useState } from 'react'
import DepartmentChart from './components/DepartmentChart'
import CountryChart from './components/CountryChart'
import SalaryCurrencyChart  from './components/SalaryCurrencyChart'
import EmployeeTable from './components/EmployeeTable'

import {
  AppBar,
  Box,
  Card,
  CardContent,
  Grid,
  Toolbar,
  Typography,
  CircularProgress,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import api from './services/api'

function App() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/overview')
        setDashboard(response.data)
      } catch (err) {
        setError('Unable to load dashboard statistics.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const cards = dashboard
    ? [
        {
          title: 'Total Employees',
          value: dashboard.total_employees,
          icon: <PeopleIcon fontSize="large" />,
        },
        {
          title: 'Active Employees',
          value: dashboard.active_employees,
          icon: <PersonIcon fontSize="large" />,
        },
        {
          title: 'Inactive Employees',
          value: dashboard.inactive_employees,
          icon: <PersonOffIcon fontSize="large" />,
        },
      ]
    : []

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" fontWeight="bold">
            ACME SalaryHub
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          HR Dashboard
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Employee workforce overview
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
                    <Grid container spacing={3}>
            {cards.map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <Card elevation={2}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      {card.icon}
                      <Box>
                        <Typography color="text.secondary">
                          {card.title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {card.value.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            <Grid item xs={12} md={6}>
              <DepartmentChart />
            </Grid>

            <Grid item xs={12} md={6}>
              <CountryChart />
            </Grid>
            <Grid item xs={12}>
              <SalaryCurrencyChart />
            </Grid>
            <Grid item xs={12}>
              <EmployeeTable />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  )
}

export default App
