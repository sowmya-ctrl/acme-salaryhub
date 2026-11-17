import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CircularProgress, Typography, TextField } from '@mui/material'
import PaymentsIcon from '@mui/icons-material/Payments'
import { useAuth } from '../auth/useAuth'

function LoginPage() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Invalid email or password.'
          : 'Unable to sign in right now. Please try again.',
      )
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#0b1f4d', p: 2 }}>
      <Card elevation={6} sx={{ width: '100%', maxWidth: 380, p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: '#0b1f4d' }}>
          <PaymentsIcon fontSize="large" />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            ACME SalaryHub
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Sign in to manage employee salaries.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
          </Button>
        </Box>
      </Card>
    </Box>
  )
}

export default LoginPage
