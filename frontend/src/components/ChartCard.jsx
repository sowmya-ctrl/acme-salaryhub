import { Box, Card, Typography } from '@mui/material'

/** Card whose body stretches to fill its grid cell, so charts can size to 100% height. */
function ChartCard({ title, icon, subtitle, children }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        p: 2,
        border: '1px solid #e6ebf3',
        borderRadius: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1e3a8a' }}>
        {icon}
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0, mt: 1 }}>{children}</Box>
    </Card>
  )
}

export default ChartCard
