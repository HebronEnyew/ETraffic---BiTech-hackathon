'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/app/providers'
import toast from 'react-hot-toast'

/**
 * Login Page Component
 * Modern card-style form with email, password, and Forgot Password link
 */
export default function LoginPage() {
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
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        toast.error('Invalid credentials. Please check your email and password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tan py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-oxford-blue">
            {t('auth.login')}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-oxford-blue">
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
                className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${errors.email ? 'border-red-500' : 'border-oxford-blue/30'}`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-oxford-blue">
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
                className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${errors.password ? 'border-red-500' : 'border-oxford-blue/30'}`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-oxford-blue text-white py-3 px-4 rounded-xl hover:bg-[#003366] 
                       transition-all disabled:bg-oxford-blue/50 disabled:cursor-not-allowed 
                       font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? 'Logging in...' : t('auth.loginButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-oxford-blue/80">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-oxford-blue hover:text-[#003366] font-bold underline">
              {t('auth.signUpLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
