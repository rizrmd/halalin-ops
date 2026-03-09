import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RequireAuth } from '../components/RequireAuth'
import { getAuthUser, logout } from '../server/auth'

export const Route = createFileRoute('/')({
  component: DashboardComponent,
  beforeLoad: async () => {
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

function DashboardComponent() {
  const { user } = Route.useRouteContext() as { user: UserData | null }
  const navigate = Route.useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <RequireAuth>
      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0' }}>Dasbor</h1>
            {user && (
              <p style={{ margin: 0, color: '#666' }}>
                Selamat datang, {user.name}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Keluar
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Sistem Manajemen Interview & Assessment
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Mitra</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
              Kelola data mitra dan kandidat
            </p>
          </div>

          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Wawancara</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
              Kelola sesi wawancara
            </p>
          </div>

          <div
            style={{
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Penilaian</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
              Kelola penilaian dan asesmen
            </p>
          </div>
        </div>
      </main>
    </RequireAuth>
  )
}
