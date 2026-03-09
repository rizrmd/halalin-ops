import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  createAssessment,
  getAssessmentFormOptions,
  type ValidationError,
  type AssessmentFormOptionsResponse,
} from '../server/assessments'

export const Route = createFileRoute('/assessments/new')({
  component: CreateAssessmentComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('UNAUTHORIZED')
    }
    return { user: context.user }
  },
  loader: async (): Promise<AssessmentFormOptionsResponse> => {
    return await getAssessmentFormOptions()
  },
})

interface FormData {
  participant_id: string
  bank_id: string
}

const initialFormData: FormData = {
  participant_id: '',
  bank_id: '',
}

function CreateAssessmentComponent() {
  const initialData = Route.useLoaderData() as AssessmentFormOptionsResponse
  const [formData, setFormData] = React.useState<FormData>(initialFormData)
  const [options, setOptions] = React.useState<AssessmentFormOptionsResponse>(initialData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
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
    if (!formData.participant_id) {
      newErrors.participant_id = 'Peserta wajib dipilih'
    }
    if (!formData.bank_id) {
      newErrors.bank_id = 'Template pertanyaan wajib dipilih'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createAssessment({
        data: {
          participant_id: formData.participant_id,
          bank_id: formData.bank_id,
        },
      })

      if (result.success && result.assessmentId) {
        setSubmitSuccess(true)
        setFormData(initialFormData)
        // Redirect to assessment take page
        setTimeout(() => {
          window.location.href = `/assessments/${result.assessmentId}/take`
        }, 1500)
      } else if (result.errors) {
        const fieldErrors: Record<string, string> = {}
        result.errors.forEach((err: ValidationError) => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      }
    } catch (error) {
      console.error('Error creating assessment:', error)
      setSubmitError('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    window.location.href = '/assessments'
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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem',
  }

  const inputErrorStyle: React.CSSProperties = {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
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
      <style>{`
        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div style={headerStyle}>
        <h1 style={titleStyle}>Mulai Penilaian Baru</h1>
        <p style={subtitleStyle}>Pilih peserta dan template pertanyaan untuk memulai penilaian</p>
      </div>

      {submitError && <div style={errorAlertStyle} role="alert">{submitError}</div>}
      {submitSuccess && (
        <div style={successAlertStyle} role="alert">
          Assessment berhasil dibuat! Mengalihkan ke halaman penilaian...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formContainerStyle}>
          <h2 style={sectionTitleStyle}>Informasi Penilaian</h2>

          <div className="form-grid" style={formGridStyle}>
            <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
              <label htmlFor="participant_id" style={labelStyle}>
                Peserta<span style={requiredMarkStyle}>*</span>
              </label>
              <select
                id="participant_id"
                value={formData.participant_id}
                onChange={(e) => handleChange('participant_id', e.target.value)}
                style={{ ...selectStyle, ...(errors.participant_id ? inputErrorStyle : {}) }}
                disabled={isSubmitting || submitSuccess}
              >
                <option value="">Pilih Peserta</option>
                {options.participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.full_name} {participant.partner_type && `(${participant.partner_type})`}
                  </option>
                ))}
              </select>
              {errors.participant_id && <span style={errorStyle}>{errors.participant_id}</span>}
              {options.participants.length === 0 && (
                <span style={{ ...errorStyle, color: '#f59e0b' }}>
                  Belum ada peserta terdaftar. Silakan tambahkan peserta terlebih dahulu.
                </span>
              )}
            </div>

            <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
              <label htmlFor="bank_id" style={labelStyle}>
                Template Pertanyaan<span style={requiredMarkStyle}>*</span>
              </label>
              <select
                id="bank_id"
                value={formData.bank_id}
                onChange={(e) => handleChange('bank_id', e.target.value)}
                style={{ ...selectStyle, ...(errors.bank_id ? inputErrorStyle : {}) }}
                disabled={isSubmitting || submitSuccess}
              >
                <option value="">Pilih Template</option>
                {options.questionBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.title} {bank.template_code && `(${bank.template_code})`}
                  </option>
                ))}
              </select>
              {errors.bank_id && <span style={errorStyle}>{errors.bank_id}</span>}
              {options.questionBanks.length === 0 && (
                <span style={{ ...errorStyle, color: '#f59e0b' }}>
                  Belum ada template self-assessment tersedia.
                </span>
              )}
            </div>
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
              disabled={
                isSubmitting || 
                submitSuccess || 
                options.participants.length === 0 || 
                options.questionBanks.length === 0
              }
              style={primaryButtonStyle}
            >
              {isSubmitting ? 'Menyimpan...' : 'Mulai Penilaian'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
