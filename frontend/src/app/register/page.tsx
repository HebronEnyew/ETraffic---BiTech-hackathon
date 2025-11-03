'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/app/providers'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * Registration Page Component
 * Modern card-style form with Full Name, Email, Username, Password, Confirm Password, and ID Photo upload
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    nationalIdPhoto: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { t } = useLanguage()
  const router = useRouter()

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.nationalIdPhoto) {
      newErrors.nationalIdPhoto = 'National ID photo is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, nationalIdPhoto: 'Please upload an image file' })
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, nationalIdPhoto: 'File size must be less than 5MB' })
        return
      }
      setFormData({ ...formData, nationalIdPhoto: file })
      setErrors({ ...errors, nationalIdPhoto: undefined })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('username', formData.username)
      formDataToSend.append('password', formData.password)
      
      // Note: Backend needs to handle file upload - for now using placeholder
      // In production, upload to backend endpoint that accepts multipart/form-data
      if (formData.nationalIdPhoto) {
        formDataToSend.append('nationalIdPhoto', formData.nationalIdPhoto)
      }

      // For now, convert image to base64 and send as JSON
      // In production, use proper file upload endpoint
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        await axios.post(`${API_URL}/api/auth/register`, {
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          nationalIdPhoto: base64String,
        })

        toast.success('Registration successful! Please verify your email.')
        router.push('/login')
      }
      
      if (formData.nationalIdPhoto) {
        reader.readAsDataURL(formData.nationalIdPhoto)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed'
      toast.error(errorMessage)
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Unauthorized. Please check your information.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tan py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-oxford-blue">
            {t('auth.register')}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-oxford-blue">
                {t('auth.fullName')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value })
                  setErrors({ ...errors, fullName: undefined })
                }}
                className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-oxford-blue">
                {t('auth.email')} <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setErrors({ ...errors, email: undefined })
                }}
                className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-oxford-blue">
                {t('auth.username')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value })
                  setErrors({ ...errors, username: undefined })
                }}
                className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-oxford-blue">
                  {t('auth.password')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setErrors({ ...errors, password: undefined })
                  }}
                  className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-oxford-blue">
                  {t('auth.confirmPassword')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    setErrors({ ...errors, confirmPassword: undefined })
                  }}
                  className={`w-full border-2 rounded-xl px-4 py-3 text-oxford-blue placeholder-oxford-blue/50 
                         focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue transition-all
                         bg-white shadow-md ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-oxford-blue">
                {t('auth.nationalIdPhoto')} <span className="text-red-600">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  {formData.nationalIdPhoto ? (
                    <div>
                      <p className="text-sm text-gray-600">{formData.nationalIdPhoto.name}</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, nationalIdPhoto: null })}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-black hover:text-gray-800">
                          <span>{t('auth.uploadPhoto')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
              {errors.nationalIdPhoto && (
                <p className="mt-1 text-sm text-red-600">{errors.nationalIdPhoto}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-oxford-blue text-white py-3 px-4 rounded-xl hover:bg-[#003366] 
                       transition-all disabled:bg-oxford-blue/50 disabled:cursor-not-allowed 
                       font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? 'Registering...' : t('auth.registerButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-oxford-blue/80">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="text-oxford-blue hover:text-[#003366] font-bold underline">
              {t('auth.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
