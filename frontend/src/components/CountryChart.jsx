
import { useEffect, useState } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import api from '../services/api'

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f']

function CountryChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/dashboard/countries')
        setData(response.data)
      } catch (error) {
        console.error('Failed to load country analytics:', error)
      }
    }

    fetchCountries()
  }, [])

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Employees by Country
        </Typography>

        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              dataKey="employee_count"
              nameKey="country"
              cx="50%"
              cy="50%"
              outerRadius={105}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.code}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default CountryChart
