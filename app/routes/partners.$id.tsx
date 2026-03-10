import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { getPartnerById } from '../server/partners'

// Type for partner detail from Prisma
interface PartnerDetail {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  partner_type: string
  domicile_city: string | null
  domicile_province: string | null
  experience_level: string | null
  is_active: boolean
  notes: string | null
  created_at: Date
}

export const Route = createFileRoute('/partners/$id')({
  component: PartnerDetailComponent,
  beforeLoad: async ({ context }) => {
    // Check authentication - redirect to login if user is not authenticated
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async ({ params }): Promise<PartnerDetail> => {
    try {
      const partner = await getPartnerById({ data: { id: params.id } })
      return partner as PartnerDetail
    }
    catch (error) {
      // If partner not found, throw 404
      throw new Error('PARTNER_NOT_FOUND')
    }
  },
  errorComponent: ({ error }) => {
    // Handle 404 errors
    if ((error as Error)?.message?.includes('PARTNER_NOT_FOUND') || (error as Error)?.message?.includes('not found')) {
      return <PartnerNotFound />
    }
    // Handle unauthorized errors
    if ((error as Error)?.message?.includes('UNAUTHORIZED')) {
      return <Unauthorized />
    }
    throw error
  },
})

// Helper to format partner type for display
function formatPartnerType(type: string): string {
  const typeMap: Record<string, string> = {
    candidate: 'Kandidat',
    mitra: 'Mitra',
    penyelia_halal: 'Penyelia Halal',
    tenaga_ahli: 'Tenaga Ahli',
    halal_auditor: 'Auditor Halal',
    interviewer: 'Pewawancara',
  }
  return typeMap[type] || type
}

// Helper to format date
function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function PartnerNotFound() {
  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const emptyStateStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '3rem',
    textAlign: 'center',
  }

  const iconStyle: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: '1rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '0.5rem',
  }

  const descriptionStyle: React.CSSProperties = {
    color: '#6b7280',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  }

  return (
    <div style={containerStyle}>
      <div style={emptyStateStyle}>
        <div style={iconStyle}>🔍</div>
        <h2 style={titleStyle}>Mitra Tidak Ditemukan</h2>
        <p style={descriptionStyle}>
          Mitra yang Anda cari tidak ditemukan atau mungkin telah dihapus.
        </p>
        <a
          href="/partners"
          style={{
            display: 'inline-block',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Kembali ke Daftar Mitra
        </a>
      </div>
    </div>
  )
}

function Unauthorized() {
  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const emptyStateStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '3rem',
    textAlign: 'center',
  }

  return (
    <div style={containerStyle}>
      <div style={emptyStateStyle}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Akses Ditolak</h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Silakan masuk untuk mengakses halaman ini.
        </p>
      </div>
    </div>
  )
}

function PartnerDetailComponent() {
  const partner = Route.useLoaderData() as PartnerDetail

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  }

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  }

  const backLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    minHeight: '44px',
    minWidth: '44px',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#111827',
    fontWeight: 500,
    wordBreak: 'break-word',
  }

  const valueMutedStyle: React.CSSProperties = {
    ...valueStyle,
    color: '#9ca3af',
    fontStyle: 'italic',
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
  }

  const badgeActiveStyle: React.CSSProperties = {
    ...badgeStyle,
    backgroundColor: '#d1fae5',
    color: '#065f46',
  }

  const badgeInactiveStyle: React.CSSProperties = {
    ...badgeStyle,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  }

  const notesStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    padding: '1rem',
    fontSize: '0.875rem',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
  }

  const notesEmptyStyle: React.CSSProperties = {
    ...notesStyle,
    color: '#9ca3af',
    fontStyle: 'italic',
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={headerRowStyle}>
          <h1 style={titleStyle}>Detail Mitra</h1>
        </div>
        <a href="/partners" style={backLinkStyle}>
          ← Kembali ke Daftar Mitra
        </a>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informasi Umum</h2>
        <div style={gridStyle}>
          {/* ID */}
          <div style={fieldStyle}>
            <label style={labelStyle}>ID</label>
            <span style={valueStyle}>{partner.id}</span>
          </div>

          {/* Nama Lengkap */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Nama Lengkap</label>
            <span style={valueStyle}>{partner.full_name}</span>
          </div>

          {/* Email */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            {partner.email
              ? (
                  <a
                    href={`mailto:${partner.email}`}
                    style={{ ...valueStyle, color: '#2563eb', textDecoration: 'none' }}
                  >
                    {partner.email}
                  </a>
                )
              : (
                  <span style={valueMutedStyle}>-</span>
                )}
          </div>

          {/* Telepon */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Telepon</label>
            {partner.phone
              ? (
                  <a
                    href={`tel:${partner.phone}`}
                    style={{ ...valueStyle, color: '#2563eb', textDecoration: 'none' }}
                  >
                    {partner.phone}
                  </a>
                )
              : (
                  <span style={valueMutedStyle}>-</span>
                )}
          </div>

          {/* Tipe Mitra */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Tipe Mitra</label>
            <span style={badgeStyle}>{formatPartnerType(partner.partner_type)}</span>
          </div>

          {/* Status */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Status</label>
            <span style={partner.is_active ? badgeActiveStyle : badgeInactiveStyle}>
              {partner.is_active ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }} />

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informasi Tambahan</h2>
        <div style={gridStyle}>
          {/* Kota Domisili */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Kota Domisili</label>
            <span style={partner.domicile_city ? valueStyle : valueMutedStyle}>
              {partner.domicile_city || '-'}
            </span>
          </div>

          {/* Provinsi Domisili */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Provinsi Domisili</label>
            <span style={partner.domicile_province ? valueStyle : valueMutedStyle}>
              {partner.domicile_province || '-'}
            </span>
          </div>

          {/* Tingkat Pengalaman */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Tingkat Pengalaman</label>
            <span style={partner.experience_level ? valueStyle : valueMutedStyle}>
              {partner.experience_level || '-'}
            </span>
          </div>

          {/* Tanggal Dibuat */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Tanggal Dibuat</label>
            <span style={valueStyle}>{formatDate(partner.created_at)}</span>
          </div>
        </div>

        {/* Catatan */}
        <div style={{ marginTop: '1.5rem' }}>
          <label style={labelStyle}>Catatan</label>
          {partner.notes
            ? (
                <div style={notesStyle}>{partner.notes}</div>
              )
            : (
                <div style={notesEmptyStyle}>Tidak ada catatan</div>
              )}
        </div>
      </div>
    </div>
  )
}
