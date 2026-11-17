
import { useEffect, useState } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import api from '../services/api'

function SalaryCurrencyChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        const response = await api.get('/dashboard/salary-by-currency')
        setData(response.data)
      } catch (error) {
        console.error('Failed to load salary analytics:', error)
      }
    }

    fetchSalaryData()
  }, [])

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Salary Expenditure by Currency
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Net salary totals are shown separately in their original currencies.
        </Typography>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="currency" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_salary" name="Total Salary" fill="#2e7d32" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default SalaryCurrencyChart
