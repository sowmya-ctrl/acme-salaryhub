import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import InsightsIcon from '@mui/icons-material/Insights'
import PaymentsIcon from '@mui/icons-material/Payments'

export const DRAWER_WIDTH = 220
const NAVY = '#0b1f4d'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon />, title: 'Dashboard', subtitle: 'Overview of your workforce and compensation' },
  { to: '/employees', label: 'Employees', icon: <PeopleIcon />, title: 'Employees', subtitle: 'Find, add and manage employees and their salaries' },
  { to: '/analytics', label: 'Salary Analytics', icon: <InsightsIcon />, title: 'Salary Analytics', subtitle: 'How the organisation pays, by department and country' },
]

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = NAV_ITEMS.find((item) => item.to === pathname) ?? NAV_ITEMS[0]

  const search = (event) => {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/employees?search=${encodeURIComponent(term)}` : '/employees')
    setMobileOpen(false)
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: NAVY, color: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2 }}>
        <PaymentsIcon />
        <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
          ACME
          <br />
          SalaryHub
        </Typography>
      </Box>

      <List component="nav" aria-label="Main navigation" sx={{ px: 1.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end
            selected={item.to === current.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 0.75,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              '&.Mui-selected, &.Mui-selected:hover': { bgcolor: '#2563eb', color: '#fff' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', width: 32, height: 32, fontSize: 12 }}>HR</Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            HR Manager
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            ACME Corp
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f6fb' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` }, bgcolor: '#f3f6fb' }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            aria-label="open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box component="form" onSubmit={search} sx={{ width: '100%', maxWidth: 440 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search employees..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': 'Search employees' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { bgcolor: '#fff', borderRadius: 6 },
                },
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="aside" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', p: { xs: 2, md: 2 } }}
      >
        <Toolbar variant="dense" />
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#0f1f45', lineHeight: 1.25 }}>
            {current.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current.subtitle}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout
