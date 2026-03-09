import { createServerFn } from '@tanstack/react-start'
import { prisma } from './db'
import { createSession, destroySession, getCurrentUser } from './session'

export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): { email: string; password: string } => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data harus berupa objek')
    }
    const { email, password } = data as Record<string, unknown>
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email dan kata sandi harus berupa string')
    }
    return { email, password }
  })
  .handler(async ({ data }): Promise<{ success: boolean; error?: string; user?: { id: string; name: string; email: string | null } }> => {
    const { email, password } = data

    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email dan kata sandi wajib diisi',
      }
    }

    try {
      // Find partner by email
      const partner = await prisma.partners.findFirst({
        where: { email },
      })

      if (!partner) {
        return {
          success: false,
          error: 'Email atau kata sandi salah',
        }
      }

      // For this implementation, we compare plaintext passwords
      // In production, use bcrypt to compare hashed passwords
      // TODO: Implement bcrypt password comparison when passwords are hashed
      if ((partner.notes || '') !== password) {
        // Using notes field as password placeholder (as per existing schema)
        // In proper implementation, use a password_hash field
        return {
          success: false,
          error: 'Email atau kata sandi salah',
        }
      }

      // Create session
      await createSession(partner.id)

      return {
        success: true,
        user: {
          id: partner.id,
          name: partner.full_name,
          email: partner.email,
        },
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat masuk. Silakan coba lagi.',
      }
    }
  })

export const logout = createServerFn({ method: 'POST' })
  .handler(async () => {
    await destroySession()
    return { success: true }
  })

export const getAuthUser = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }

    // Fetch full user details from database
    const partner = await prisma.partners.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        full_name: true,
        email: true,
        partner_type: true,
      },
    })

    if (!partner) {
      return null
    }

    return {
      id: partner.id,
      name: partner.full_name,
      email: partner.email,
      partnerType: partner.partner_type,
    }
  })

export const isAuthenticated = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = await getAuthUser()
    return !!user
  })
