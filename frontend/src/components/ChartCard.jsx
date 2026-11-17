import { Card, CardContent, Typography } from '@mui/material'

/** Card whose body stretches to fill its grid cell, so charts can size to 100% height. */
function ChartCard({ title, subtitle, children }) {
  return (
    <Card
      elevation={2}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <CardContent
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, p: 2, '&:last-child': { pb: 2 } }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        <div style={{ flex: 1, minHeight: 0, marginTop: 8 }}>{children}</div>
      </CardContent>
    </Card>
  )
}

export default ChartCard
