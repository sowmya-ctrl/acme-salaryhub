
import { useEffect, useState } from 'react'
import ChartCard from './ChartCard'
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

const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n)

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
    <ChartCard title="Employees by Department">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis tickFormatter={compact} width={45} />
            <Tooltip />
            <Bar dataKey="employee_count" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
    </ChartCard>
  )
}

export default DepartmentChart
