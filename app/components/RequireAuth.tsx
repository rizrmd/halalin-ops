import * as React from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { getAuthUser } from '../server/auth'

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * RequireAuth component that redirects to login if user is not authenticated
 * Uses loader data for SSR compatibility
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [authState, setAuthState] = React.useState<{
    user: { id: string; name: string; email: string | null; partnerType: string } | null
    loading: boolean
  }>({ user: null, loading: true })

  React.useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const user = await getAuthUser()
        if (!cancelled) {
          setAuthState({ user, loading: false })
          if (!user) {
            // Redirect to login
            const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
            const redirectTo = encodeURIComponent(currentPath)
            navigate({ to: '/', search: { redirectTo } })
          }
        }
      } catch (error) {
        if (!cancelled) {
          setAuthState({ user: null, loading: false })
        }
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (authState.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        <div>Memuat...</div>
      </div>
    )
  }

  if (!authState.user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        <div>Mengarahkan ke halaman masuk...</div>
      </div>
    )
  }

  return <>{children}</>
}
