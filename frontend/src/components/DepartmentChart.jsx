import { Box, Typography } from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import ChartCard from './ChartCard'

export const PALETTE = ['#2563eb', '#14b8a6', '#7c3aed', '#f97316', '#22c55e', '#ef4444']

/** Donut of headcount by department with a percentage legend. Data comes from the page. */
function DepartmentChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.employee_count, 0)
  const sorted = [...data].sort((a, b) => b.employee_count - a.employee_count)

  return (
    <ChartCard title="Department Distribution" icon={<BarChartIcon fontSize="small" />}>
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0, height: '100%', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sorted}
                dataKey="employee_count"
                nameKey="department"
                innerRadius="62%"
                outerRadius="95%"
                paddingAngle={1}
                stroke="none"
              >
                {sorted.map((d, i) => (
                  <Cell key={d.department} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                {total.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          component="ul"
          aria-label="Department legend"
          sx={{ listStyle: 'none', m: 0, p: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
          {sorted.map((d, i) => (
            <Box component="li" key={d.department} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }}
              />
              <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                {d.department}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {total ? Math.round((d.employee_count / total) * 100) : 0}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </ChartCard>
  )
}

export default DepartmentChart
