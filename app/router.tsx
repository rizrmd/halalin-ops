import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createAppRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPendingComponent: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '1rem',
        color: '#6b7280',
      }}
      >
        Memuat...
      </div>
    ),
    defaultErrorComponent: ({ error }) => {
      // Check if this is a client-side error boundary (browser environment)
      if (typeof window !== 'undefined') {
        // Handle unauthorized errors
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          window.location.href = '/login'
          return null
        }
      }

      return (
        <div style={{
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}
        >
          <h1 style={{ color: '#dc2626', fontSize: '1.5rem' }}>Terjadi Kesalahan</h1>
          <p style={{ color: '#6b7280' }}>
            {error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui'}
          </p>
        </div>
      )
    },
  })
  return router
}

// For type-safe router
export type AppRouter = ReturnType<typeof createAppRouter>
