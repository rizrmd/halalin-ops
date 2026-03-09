import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/interviews')({
  component: InterviewsComponent,
  beforeLoad: async ({ context }) => {
    // Check authentication - redirect to login if user is not authenticated
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
})

function InterviewsComponent() {
  const { user } = Route.useRouteContext() as { user: { id: string; name: string; email: string | null; partnerType: string } }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  }

  const placeholderStyle: React.CSSProperties = {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Daftar Wawancara</h1>
      </div>
      
      <div style={placeholderStyle}>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Daftar wawancara akan ditampilkan di sini.
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Fitur ini sedang dalam pengembangan.
        </p>
      </div>
    </div>
  )
}
