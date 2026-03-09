import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { logout } from '../server/auth'

interface HeaderProps {
  user: { id: string; name: string; email: string | null; partnerType: string } | null
}

export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const navigationItems = [
    { to: '/', label: 'Dasbor' },
    { to: '/partners', label: 'Mitra' },
    { to: '/interviews', label: 'Wawancara' },
    { to: '/assessments', label: 'Penilaian' },
  ]

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#1f2937',
    color: 'white',
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1rem',
  }

  const navWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
  }

  const logoStyle: React.CSSProperties = {
    flexShrink: 0,
  }

  const logoLinkStyle: React.CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  }

  const desktopNavStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }

  const navItemStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#d1d5db',
    textDecoration: 'none',
  }

  const userSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }

  const userNameStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#9ca3af',
  }

  const logoutButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  }

  const loginLinkStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
  }

  const mobileMenuButtonStyle: React.CSSProperties = {
    display: 'none',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    color: '#9ca3af',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  }

  const mobileNavStyle: React.CSSProperties = {
    display: 'none',
    backgroundColor: '#1f2937',
  }

  const mobileNavItemStyle: React.CSSProperties = {
    display: 'block',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: 500,
    color: '#d1d5db',
    textDecoration: 'none',
  }

  const mobileUserSectionStyle: React.CSSProperties = {
    paddingTop: '1rem',
    paddingBottom: '0.75rem',
    borderTop: '1px solid #374151',
  }

  const mobileUserNameStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'white',
  }

  const mobileUserEmailStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#9ca3af',
  }

  const mobileLogoutButtonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: 500,
    color: '#f87171',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  }

  // Responsive media query simulation via inline styles
  const responsiveStyle = `
    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .desktop-user { display: none !important; }
      .mobile-menu-btn { display: block !important; }
      .mobile-nav { display: block !important; }
    }
    @media (min-width: 769px) {
      .mobile-menu-btn { display: none !important; }
      .mobile-nav { display: none !important; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyle }} />
      <header style={headerStyle}>
        <div style={containerStyle}>
          <div style={navWrapperStyle}>
            {/* Logo */}
            <div style={logoStyle}>
              <Link to="/" style={logoLinkStyle}>
                Halal Form
              </Link>
            </div>

            {/* Desktop Navigation */}
            {user && (
              <nav style={desktopNavStyle} className="desktop-nav">
                {navigationItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={navItemStyle}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* User Section & Logout */}
            <div style={userSectionStyle} className="desktop-user">
              {user ? (
                <>
                  <span style={userNameStyle}>
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    style={logoutButtonStyle}
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <a href="/login" style={loginLinkStyle}>
                  Masuk
                </a>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={mobileMenuButtonStyle}
              className="mobile-menu-btn"
              aria-expanded={isMobileMenuOpen}
              aria-label="Buka menu utama"
            >
              {isMobileMenuOpen ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div style={mobileNavStyle} className="mobile-nav">
            <div style={{ padding: '0.5rem 0.75rem' }}>
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={mobileNavItemStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {user && (
              <div style={mobileUserSectionStyle}>
                <div style={{ padding: '0 1rem' }}>
                  <div style={mobileUserNameStyle}>{user.name}</div>
                  <div style={mobileUserEmailStyle}>{user.email}</div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0 0.5rem' }}>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    style={mobileLogoutButtonStyle}
                  >
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  )
}
