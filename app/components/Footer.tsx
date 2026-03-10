import * as React from 'react'

export default function Footer() {
  const footerStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    padding: '1.5rem 2rem',
    marginTop: 'auto',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.875rem',
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
  }

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  }

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={wrapperStyle}>
          <p style={{ margin: 0 }}>
            © 2024 Halalin Ops - Partner Qualification, Assessment, and Deployment
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
            Hak cipta dilindungi undang-undang
          </p>
        </div>
      </div>
    </footer>
  )
}
