import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/')({
  component: DashboardComponent,
  beforeLoad: async ({ context }) => {
    // Check authentication - redirect to login if user is not authenticated
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
})

function DashboardComponent() {
  const { user } = Route.useRouteContext() as { user: { id: string, name: string, email: string | null, partnerType: string } }

  const navigationCards = [
    {
      to: '/partners',
      title: 'Mitra',
      description: 'Kelola data mitra dan kandidat',
      icon: '🤝',
      color: '#3b82f6',
    },
    {
      to: '/interviews',
      title: 'Wawancara',
      description: 'Kelola sesi wawancara',
      icon: '🎤',
      color: '#8b5cf6',
    },
    {
      to: '/assessments',
      title: 'Penilaian',
      description: 'Kelola penilaian dan asesmen',
      icon: '📝',
      color: '#10b981',
    },
  ]

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: '2rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0 0 0.5rem 0',
  }

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    margin: 0,
  }

  const welcomeStyle: React.CSSProperties = {
    color: '#4b5563',
    marginBottom: '2rem',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  }

  const cardStyle: React.CSSProperties = {
    display: 'block',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: '1px solid #e5e7eb',
  }

  const cardContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  }

  const iconContainerStyle = (color: string): React.CSSProperties => ({
    width: '3rem',
    height: '3rem',
    borderRadius: '0.5rem',
    backgroundColor: `${color}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    flexShrink: 0,
  })

  const cardTextStyle: React.CSSProperties = {
    flex: 1,
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 0.25rem 0',
  }

  const cardDescriptionStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Dasbor</h1>
        <p style={subtitleStyle}>Sistem Manajemen Interview & Assessment</p>
      </div>

      <div style={welcomeStyle}>
        Selamat datang,
        {' '}
        <strong>{user.name}</strong>
        !
      </div>

      <div style={gridStyle}>
        {navigationCards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={cardContentStyle}>
              <div style={iconContainerStyle(card.color)}>
                {card.icon}
              </div>
              <div style={cardTextStyle}>
                <h3 style={cardTitleStyle}>{card.title}</h3>
                <p style={cardDescriptionStyle}>{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
