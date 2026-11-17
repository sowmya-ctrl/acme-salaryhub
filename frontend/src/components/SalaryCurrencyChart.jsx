import PaymentsIcon from '@mui/icons-material/Payments'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartCard from './ChartCard'
import { PALETTE } from './chartColors'
import { formatCompactMoney, formatMoney } from '../utils/format'

const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n)

/** Current salary expenditure per currency. Never converted or summed across currencies. */
function SalaryCurrencyChart({ data }) {
  const rows = data.map((d) => ({ ...d, total_salary: Number(d.total_salary) }))

  return (
    <ChartCard
      title="Salary by Currency"
      icon={<PaymentsIcon fontSize="small" />}
      subtitle="Net totals in each original currency; not converted or combined"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="currency" tickLine={false} />
          <YAxis tickFormatter={compact} width={48} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value, _name, item) => formatMoney(value, item.payload.currency)} />
          <Bar dataKey="total_salary" name="Total" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {rows.map((r, i) => (
              <Cell key={r.currency} fill={PALETTE[i % PALETTE.length]} />
            ))}
            <LabelList
              dataKey="total_salary"
              position="top"
              content={({ x, y, width, index }) => (
                <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={12} fontWeight={600} fill="#334155">
                  {formatCompactMoney(rows[index].total_salary, rows[index].currency)}
                </text>
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default SalaryCurrencyChart
