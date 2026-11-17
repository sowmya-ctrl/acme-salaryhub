import { Box, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import BoltIcon from '@mui/icons-material/Bolt'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import InsightsIcon from '@mui/icons-material/Insights'
import DownloadIcon from '@mui/icons-material/Download'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import ChartCard from './ChartCard'

const buttonSx = { justifyContent: 'flex-start', py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }

function QuickActions() {
  return (
    <ChartCard title="Quick Actions" icon={<BoltIcon fontSize="small" />}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, height: '100%', alignContent: 'center' }}>
        <Button variant="outlined" component={Link} to="/employees?add=1" startIcon={<PersonAddIcon />} sx={buttonSx}>
          Add Employee
        </Button>
        <Button variant="outlined" component={Link} to="/analytics" startIcon={<InsightsIcon />} sx={buttonSx}>
          View Salary Analytics
        </Button>
        <Button variant="outlined" href="/api/employees/export" download startIcon={<DownloadIcon />} sx={buttonSx}>
          Export Report
        </Button>
        <Button variant="outlined" component={Link} to="/employees" startIcon={<ManageAccountsIcon />} sx={buttonSx}>
          Manage Employees
        </Button>
      </Box>
    </ChartCard>
  )
}

export default QuickActions
