'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Modal from './Modal'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/app/providers'
import toast from 'react-hot-toast'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

/**
 * Login Modal Component
 * Glass modal popup for login (appears over dashboard)
 */
export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const { login } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)

    try {
      await login(email, password)
      toast.success(t('auth.login') + ' successful')
      onClose()
      router.push('/')
    } catch (error: any) {
      // Extract error message from backend response
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      console.error('Login error:', error)
      
      // Show detailed error message
      toast.error(errorMessage, {
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auth.login')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            {t('auth.email')}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors({ ...errors, email: undefined })
            }}
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            {t('auth.password')}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors({ ...errors, password: undefined })
            }}
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Logging in...' : t('auth.loginButton')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('auth.noAccount')}{' '}
        <button
          onClick={() => {
            onClose()
            onSwitchToRegister()
          }}
          className="text-black hover:text-gray-800 font-medium"
        >
          {t('auth.signUpLink')}
        </button>
      </p>
    </Modal>
  )
}

