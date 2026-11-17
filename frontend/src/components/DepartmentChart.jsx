
import { useEffect, useState } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import api from '../services/api'

function DepartmentChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/dashboard/departments')
        setData(response.data)
      } catch (error) {
        console.error('Failed to load department analytics:', error)
      }
    }

    fetchDepartments()
  }, [])

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Employees by Department
        </Typography>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="employee_count" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default DepartmentChart
