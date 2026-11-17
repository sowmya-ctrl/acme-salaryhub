import { Box, LinearProgress, Typography } from '@mui/material'
import PublicIcon from '@mui/icons-material/Public'
import ChartCard from './ChartCard'
import { PALETTE } from './DepartmentChart'

/** Ranked countries with headcount, share of total and a proportional bar. */
function CountryChart({ data }) {
  const total = data.reduce((sum, c) => sum + c.employee_count, 0)
  const sorted = [...data].sort((a, b) => b.employee_count - a.employee_count)

  return (
    <ChartCard title="Country Distribution" icon={<PublicIcon fontSize="small" />}>
      <Box
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', overflow: 'auto' }}
      >
        {sorted.map((c, i) => {
          const pct = total ? (c.employee_count / total) * 100 : 0
          return (
            <Box key={c.country_code}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.country}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {c.employee_count.toLocaleString()} · {Math.round(pct)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                aria-label={`${c.country} share`}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#eef2f8',
                  '& .MuiLinearProgress-bar': { bgcolor: PALETTE[i % PALETTE.length], borderRadius: 4 },
                }}
              />
            </Box>
          )
        })}
      </Box>
    </ChartCard>
  )
}

export default CountryChart
