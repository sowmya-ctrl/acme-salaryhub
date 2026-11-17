import { createTheme } from '@mui/material/styles'

// Compact scale: dashboards read better when dense, and it stays on one screen at common laptop sizes / browser zoom.
const theme = createTheme({
  typography: {
    fontSize: 13,
    h4: { fontSize: '1.5rem' },
    h5: { fontSize: '1.35rem' },
    h6: { fontSize: '1.1rem' },
  },
  components: {
    MuiTable: { defaultProps: { size: 'small' } },
  },
})

export default theme
