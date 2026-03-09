import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { login, getAuthUser } from '../server/auth'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
  beforeLoad: async () => {
    // Check if already authenticated
    const user = await getAuthUser()
    return { user }
  },
})

interface UserData {
  id: string
  name: string
  email: string | null
  partnerType: string
}

function LoginComponent() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const navigate = useNavigate()
  const { user } = Route.useRouteContext() as { user: UserData | null }

  // Get redirectTo from query params using URL API
  const redirectTo = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('redirectTo')
    }
    return null
  }, [])

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate({ to: '/' })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate input
    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi')
      setIsLoading(false)
      return
    }

    try {
      const result = await login({ data: { email, password } })
      if (result.success && result.user) {
        // Navigate to intended page or dashboard
        if (redirectTo) {
          const decodedRedirect = decodeURIComponent(redirectTo)
          window.location.href = decodedRedirect
        } else {
          navigate({ to: '/' })
        }
      } else {
        setError(result.error || 'Terjadi kesalahan saat masuk')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            color: '#333',
          }}
        >
          Masuk
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '1.5rem',
          }}
        >
          Sistem Manajemen Interview & Assessment
        </p>
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="Masukkan email Anda"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="Masukkan kata sandi"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
