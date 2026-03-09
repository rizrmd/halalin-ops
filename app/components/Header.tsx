import * as React from 'react'
import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header
      style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '1rem 2rem',
      }}
    >
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/"
          style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.25rem',
            fontWeight: 'bold',
          }}
        >
          Halal Form
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/about"
            style={{ color: 'white', textDecoration: 'none' }}
          >
            Tentang
          </Link>
        </div>
      </nav>
    </header>
  )
}
