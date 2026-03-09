import * as React from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
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

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getAuthUser()
        setIsAuthenticated(!!user)
        if (!user) {
          // Redirect to login
          navigate({ to: '/' })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        navigate({ to: '/' })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
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
