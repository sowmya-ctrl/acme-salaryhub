import { Box, Card, Typography } from '@mui/material'

/** KPI tile: tinted icon, label, big value and an optional caption line. */
function StatCard({ icon, color, title, value, caption }) {
  return (
    <Card
      elevation={0}
      sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, height: '100%', boxSizing: 'border-box', border: '1px solid #e6ebf3', borderRadius: 3 }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          color,
          bgcolor: `${color}1a`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }} noWrap>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary" noWrap title={caption} sx={{ display: 'block' }}>
            {caption}
          </Typography>
        )}
      </Box>
    </Card>
  )
}

export default StatCard
