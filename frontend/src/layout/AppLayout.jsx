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
  Tooltip,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import SearchIcon from '@mui/icons-material/Search'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import InsightsIcon from '@mui/icons-material/Insights'
import PaymentsIcon from '@mui/icons-material/Payments'

export const DRAWER_WIDTH = 220
export const COLLAPSED_WIDTH = 68
const STORAGE_KEY = 'salaryhub.sidebarCollapsed'
const NAVY = '#0b1f4d'

// Remember the choice, but never fail if storage is unavailable (private mode, blocked cookies).
const loadCollapsed = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon />, title: 'Dashboard', subtitle: 'Overview of your workforce and compensation' },
  { to: '/employees', label: 'Employees', icon: <PeopleIcon />, title: 'Employees', subtitle: 'Find, add and manage employees and their salaries' },
  { to: '/analytics', label: 'Salary Analytics', icon: <InsightsIcon />, title: 'Salary Analytics', subtitle: 'How the organisation pays, by department and country' },
]

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = NAV_ITEMS.find((item) => item.to === pathname) ?? NAV_ITEMS[0]
  const isDashboard = current.to === '/'
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* the preference just won't persist */
    }
  }

  const search = (event) => {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/employees?search=${encodeURIComponent(term)}` : '/employees')
    setMobileOpen(false)
  }

  // compact = icon-only rail (desktop, collapsed). The mobile drawer is always full width.
  const renderDrawer = (compact) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: NAVY, color: '#fff', overflowX: 'hidden' }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: compact ? 'center' : 'flex-start', gap: 1.5, px: compact ? 0 : 2.5, py: 2 }}
      >
        <PaymentsIcon />
        {!compact && (
          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
            ACME
            <br />
            SalaryHub
          </Typography>
        )}
      </Box>

      <List component="nav" aria-label="Main navigation" sx={{ px: 1.5 }}>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.to} title={compact ? item.label : ''} placement="right">
            <ListItemButton
              component={NavLink}
              to={item.to}
              end
              selected={item.to === current.to}
              onClick={() => setMobileOpen(false)}
              aria-label={item.label}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 0.75,
                justifyContent: compact ? 'center' : 'flex-start',
                color: 'rgba(255,255,255,0.8)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: '#2563eb', color: '#fff' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: compact ? 0 : 36 }}>{item.icon}</ListItemIcon>
              {!compact && <ListItemText primary={item.label} />}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>

      <Box
        sx={{
          mt: 'auto',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'flex-start',
          gap: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', width: 32, height: 32, fontSize: 12 }}>HR</Avatar>
        {!compact && (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              HR Manager
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              ACME Corp
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f6fb' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          bgcolor: '#f3f6fb',
          transition: 'width 200ms, margin 200ms',
        }}
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
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              edge="start"
              aria-label={collapsed ? 'expand sidebar' : 'collapse sidebar'}
              aria-pressed={collapsed}
              onClick={toggleCollapsed}
              sx={{ mr: 1, display: { xs: 'none', md: 'inline-flex' } }}
            >
              {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>
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

      <Box component="aside" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 }, transition: 'width 200ms' }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0 } }}
        >
          {renderDrawer(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: sidebarWidth, border: 0, transition: 'width 200ms', overflowX: 'hidden' },
          }}
        >
          {renderDrawer(collapsed)}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', p: 2 }}
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
        {/* The dashboard is laid out to fit the window exactly, so it never needs a scrollbar on desktop. */}
        <Box sx={{ flex: 1, minHeight: 0, overflow: { xs: 'auto', md: isDashboard ? 'hidden' : 'auto' } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout
