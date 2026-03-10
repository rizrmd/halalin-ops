import type { AuthUser } from '../server/auth'
import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { changePassword } from '../server/auth'

export const Route = createFileRoute('/profile')({
  component: ProfileComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }

    return { user: context.user }
  },
})

function ProfileComponent() {
  const { user } = Route.useRouteContext() as { user: AuthUser }
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [successMessage, setSuccessMessage] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const pageStyle: React.CSSProperties = {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '2rem 1rem 3rem',
  }

  const headingStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 0.5rem 0',
  }

  const subheadingStyle: React.CSSProperties = {
    color: '#6b7280',
    margin: '0 0 2rem 0',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    alignItems: 'start',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    padding: '1.5rem',
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 1rem 0',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '0.5rem',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    boxSizing: 'border-box',
  }

  const helpTextStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  }

  const infoRowStyle: React.CSSProperties = {
    marginBottom: '1rem',
  }

  const infoLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.25rem',
  }

  const infoValueStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#111827',
  }

  const alertBaseStyle: React.CSSProperties = {
    padding: '0.875rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua field kata sandi wajib diisi')
      return
    }

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok')
      return
    }

    if (currentPassword === newPassword) {
      setError('Kata sandi baru harus berbeda dari kata sandi saat ini')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await changePassword({
        data: {
          currentPassword,
          newPassword,
        },
      })

      if (!result.success) {
        setError(result.error || 'Gagal mengubah kata sandi')
        return
      }

      setSuccessMessage('Kata sandi berhasil diperbarui')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    catch (error) {
      console.error('Profile password update error:', error)
      setError('Terjadi kesalahan saat mengubah kata sandi')
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Profil</h1>
      <p style={subheadingStyle}>Kelola informasi akun dan perbarui kata sandi Anda.</p>

      <div style={gridStyle}>
        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Informasi Akun</h2>

          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Nama</span>
            <span style={infoValueStyle}>{user.name}</span>
          </div>

          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Email</span>
            <span style={infoValueStyle}>{user.email || '-'}</span>
          </div>

          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Tipe Mitra</span>
            <span style={infoValueStyle}>{user.partnerType}</span>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={cardTitleStyle}>Ubah Kata Sandi</h2>

          {error && (
            <div
              style={{
                ...alertBaseStyle,
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                ...alertBaseStyle,
                backgroundColor: '#dcfce7',
                color: '#166534',
                border: '1px solid #bbf7d0',
              }}
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="currentPassword" style={labelStyle}>Kata Sandi Saat Ini</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="newPassword" style={labelStyle}>Kata Sandi Baru</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                style={inputStyle}
                autoComplete="new-password"
              />
              <div style={helpTextStyle}>Gunakan minimal 8 karakter.</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmPassword" style={labelStyle}>Konfirmasi Kata Sandi Baru</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                style={inputStyle}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
