import type { PartnerType, ValidationError } from '../server/partners'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { createPartner, PARTNER_TYPE_LABELS, PARTNER_TYPES } from '../server/partners'

export const Route = createFileRoute('/partners/new')({
  component: CreatePartnerComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    if (!context.user.isAdmin) {
      throw new Error('FORBIDDEN')
    }
    return { user: context.user }
  },
})

interface FormData {
  full_name: string
  email: string
  initial_password: string
  phone: string
  partner_type: PartnerType | ''
  domicile_city: string
  domicile_province: string
  experience_level: string
  is_active: boolean
  notes: string
}

const initialFormData: FormData = {
  full_name: '',
  email: '',
  initial_password: '',
  phone: '',
  partner_type: '',
  domicile_city: '',
  domicile_province: '',
  experience_level: '',
  is_active: true,
  notes: '',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

function CreatePartnerComponent() {
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState<FormData>(initialFormData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nama lengkap wajib diisi'
    }
    if (!formData.partner_type) {
      newErrors.partner_type = 'Tipe mitra wajib dipilih'
    }
    if (formData.email.trim()) {
      if (!EMAIL_REGEX.test(formData.email)) {
        newErrors.email = 'Format email tidak valid'
      }
      if (!formData.initial_password.trim()) {
        newErrors.initial_password = 'Kata sandi awal wajib diisi jika email diisi'
      }
      else if (formData.initial_password.trim().length < 8) {
        newErrors.initial_password = 'Kata sandi awal minimal 8 karakter'
      }
    }
    if (formData.phone.trim() && formData.phone.length < 8) {
      newErrors.phone = 'Nomor telepon minimal 8 karakter'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm())
      return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createPartner({
        data: {
          full_name: formData.full_name,
          email: formData.email || undefined,
          initial_password: formData.initial_password || undefined,
          phone: formData.phone || undefined,
          partner_type: formData.partner_type as PartnerType,
          domicile_city: formData.domicile_city || undefined,
          domicile_province: formData.domicile_province || undefined,
          experience_level: formData.experience_level || undefined,
          is_active: formData.is_active,
          notes: formData.notes || undefined,
        },
      })

      if (result.success && result.partner) {
        setSubmitSuccess(true)
        setFormData(initialFormData)
        setTimeout(() => {
          navigate({ to: '/partners' as never })
        }, 1500)
      }
      else if (result.errors) {
        const fieldErrors: Record<string, string> = {}
        result.errors.forEach((err: ValidationError) => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      }
    }
    catch (error) {
      console.error('Error creating partner:', error)
      if (error instanceof Error && error.message.includes('FORBIDDEN')) {
        setSubmitError('Hanya admin yang dapat menambahkan mitra baru.')
      }
      else {
        setSubmitError('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.')
      }
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: '/partners' as never })
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  }

  const formContainerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  }

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1.5rem',
  }

  const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  }

  const formGroupFullWidthStyle: React.CSSProperties = {
    gridColumn: '1 / -1',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '0.375rem',
  }

  const requiredMarkStyle: React.CSSProperties = {
    color: '#dc2626',
    marginLeft: '0.125rem',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  }

  const inputErrorStyle: React.CSSProperties = {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical' as const,
  }

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  }

  const checkboxStyle: React.CSSProperties = {
    width: '1.125rem',
    height: '1.125rem',
  }

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#dc2626',
    marginTop: '0.25rem',
  }

  const errorAlertStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '0.375rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#dc2626',
  }

  const successAlertStyle: React.CSSProperties = {
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '0.375rem',
    padding: '1rem',
    marginBottom: '1rem',
    color: '#166534',
  }

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  }

  const buttonBaseStyle: React.CSSProperties = {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    minHeight: '44px',
  }

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    color: '#374151',
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: '#2563eb',
    border: '1px solid #2563eb',
    color: 'white',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem',
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}
      </style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Tambah Mitra Baru</h1>
        <p style={subtitleStyle}>Isi formulir di bawah untuk mendaftarkan mitra baru</p>
      </div>

      {submitError && <div style={errorAlertStyle} role="alert">{submitError}</div>}
      {submitSuccess && (
        <div style={successAlertStyle} role="alert">
          Mitra berhasil dibuat! Mengalihkan ke daftar mitra...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formContainerStyle}>
          <h2 style={sectionTitleStyle}>Informasi Dasar</h2>

          <div className="form-grid" style={formGridStyle}>
            <div style={formGroupStyle}>
              <label htmlFor="full_name" style={labelStyle}>
                Nama Lengkap
                <span style={requiredMarkStyle}>*</span>
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={e => handleChange('full_name', e.target.value)}
                style={{ ...inputStyle, ...(errors.full_name ? inputErrorStyle : {}) }}
                placeholder="Masukkan nama lengkap"
                disabled={isSubmitting || submitSuccess}
              />
              {errors.full_name && <span style={errorStyle}>{errors.full_name}</span>}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="partner_type" style={labelStyle}>
                Tipe Mitra
                <span style={requiredMarkStyle}>*</span>
              </label>
              <select
                id="partner_type"
                value={formData.partner_type}
                onChange={e => handleChange('partner_type', e.target.value as PartnerType)}
                style={{ ...selectStyle, ...(errors.partner_type ? inputErrorStyle : {}) }}
                disabled={isSubmitting || submitSuccess}
              >
                <option value="">Pilih Tipe Mitra</option>
                {PARTNER_TYPES.map(type => (
                  <option key={type} value={type}>{PARTNER_TYPE_LABELS[type]}</option>
                ))}
              </select>
              {errors.partner_type && <span style={errorStyle}>{errors.partner_type}</span>}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                style={{ ...inputStyle, ...(errors.email ? inputErrorStyle : {}) }}
                placeholder="email@contoh.com"
                disabled={isSubmitting || submitSuccess}
              />
              {errors.email && <span style={errorStyle}>{errors.email}</span>}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="initial_password" style={labelStyle}>Kata Sandi Awal</label>
              <input
                type="password"
                id="initial_password"
                value={formData.initial_password}
                onChange={e => handleChange('initial_password', e.target.value)}
                style={{ ...inputStyle, ...(errors.initial_password ? inputErrorStyle : {}) }}
                placeholder="Minimal 8 karakter"
                disabled={isSubmitting || submitSuccess}
                autoComplete="new-password"
              />
              {errors.initial_password && <span style={errorStyle}>{errors.initial_password}</span>}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="phone" style={labelStyle}>Telepon</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                style={{ ...inputStyle, ...(errors.phone ? inputErrorStyle : {}) }}
                placeholder="08123456789"
                disabled={isSubmitting || submitSuccess}
              />
              {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="domicile_city" style={labelStyle}>Kota Domisili</label>
              <input
                type="text"
                id="domicile_city"
                value={formData.domicile_city}
                onChange={e => handleChange('domicile_city', e.target.value)}
                style={inputStyle}
                placeholder="Nama kota"
                disabled={isSubmitting || submitSuccess}
              />
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="domicile_province" style={labelStyle}>Provinsi Domisili</label>
              <input
                type="text"
                id="domicile_province"
                value={formData.domicile_province}
                onChange={e => handleChange('domicile_province', e.target.value)}
                style={inputStyle}
                placeholder="Nama provinsi"
                disabled={isSubmitting || submitSuccess}
              />
            </div>

            <div style={formGroupStyle}>
              <label htmlFor="experience_level" style={labelStyle}>Level Pengalaman</label>
              <input
                type="text"
                id="experience_level"
                value={formData.experience_level}
                onChange={e => handleChange('experience_level', e.target.value)}
                style={inputStyle}
                placeholder="Contoh: Junior, Senior, Expert"
                disabled={isSubmitting || submitSuccess}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Status</label>
              <label style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => handleChange('is_active', e.target.checked)}
                  style={checkboxStyle}
                  disabled={isSubmitting || submitSuccess}
                />
                <span>Aktif</span>
              </label>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

          <h2 style={sectionTitleStyle}>Catatan Tambahan</h2>

          <div style={{ ...formGroupStyle, ...formGroupFullWidthStyle }}>
            <label htmlFor="notes" style={labelStyle}>Catatan</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={e => handleChange('notes', e.target.value)}
              style={textareaStyle}
              placeholder="Tambahkan catatan tentang mitra ini (opsional)"
              rows={4}
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={handleCancel}
              style={secondaryButtonStyle}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              style={primaryButtonStyle}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
