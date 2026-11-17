import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import InsightsIcon from '@mui/icons-material/Insights'
import PaymentsIcon from '@mui/icons-material/Payments'

export const DRAWER_WIDTH = 240

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon />, title: 'HR Dashboard' },
  { to: '/employees', label: 'Employees', icon: <PeopleIcon />, title: 'Employees' },
  { to: '/analytics', label: 'Salary Analytics', icon: <InsightsIcon />, title: 'Salary Analytics' },
]

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const current = NAV_ITEMS.find((item) => item.to === pathname) ?? NAV_ITEMS[0]

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1 }}>
        <PaymentsIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ACME SalaryHub
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end
            selected={item.to === current.to}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            aria-label="open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {current.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            HR Manager
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="aside" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', p: { xs: 2, md: 3 } }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout
