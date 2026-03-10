import { useLocation, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { getAuthUser } from '../server/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute component that redirects to login if user is not authenticated
 * It preserves the current URL in redirectTo parameter for post-login redirect
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getAuthUser()
        setIsAuthenticated(!!user)
        if (!user) {
          // Redirect to login with redirectTo parameter
          const currentPath = location.pathname + location.search
          const redirectTo = encodeURIComponent(currentPath)
          // Use window.location for external navigation to bypass type checking
          window.location.href = `/login?redirectTo=${redirectTo}`
        }
      }
      catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        const currentPath = location.pathname + location.search
        const redirectTo = encodeURIComponent(currentPath)
        window.location.href = `/login?redirectTo=${redirectTo}`
      }
      finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [location])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <div>Memuat...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <div>Mengarahkan ke halaman masuk...</div>
      </div>
    )
  }

  return <>{children}</>
}
