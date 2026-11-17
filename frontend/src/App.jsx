import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import AppLayout from './layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import theme from './theme'

// HashRouter: deep links work when the built app is served as static files by FastAPI.
function App() {
  return (
    <ThemeProvider theme={theme}>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
