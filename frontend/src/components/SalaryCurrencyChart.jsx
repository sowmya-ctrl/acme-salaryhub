
import { useEffect, useState } from 'react'
import ChartCard from './ChartCard'
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

const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n)

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
    <ChartCard
      title="Salary Expenditure by Currency"
      subtitle="Net totals in original currencies; never combined"
    >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="currency" />
            <YAxis tickFormatter={compact} width={50} />
            <Tooltip />
            <Bar dataKey="total_salary" name="Total Salary" fill="#2e7d32" />
          </BarChart>
        </ResponsiveContainer>
    </ChartCard>
  )
}

export default SalaryCurrencyChart
