'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { useLanguage } from '@/app/providers'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

/**
 * Register Modal Component
 * Glass modal popup for registration with ID photo upload
 */
export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
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
    } else {
      // Validate file metadata
      const file = formData.nationalIdPhoto
      const fileSizeKB = file.size / 1024
      
      if (fileSizeKB < 200) {
        newErrors.nationalIdPhoto = 'File size must be greater than 200 KB'
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        newErrors.nationalIdPhoto = 'Only JPG, PNG, and PDF files are allowed'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, nationalIdPhoto: 'Only JPG, PNG, and PDF files are allowed' })
        return
      }
      // Validate file size (max 10MB, min 200KB)
      const fileSizeKB = file.size / 1024
      if (fileSizeKB < 200) {
        setErrors({ ...errors, nationalIdPhoto: 'File size must be greater than 200 KB' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, nationalIdPhoto: 'File size must be less than 10MB' })
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
      
      if (formData.nationalIdPhoto) {
        formDataToSend.append('nationalIdPhoto', formData.nationalIdPhoto)
      }

      const response = await axios.post(`${API_URL}/api/auth/register`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024,
      })

      toast.success('Registration successful! ' + (response.data.isTrusted ? 'Your account is trusted.' : 'Please verify your email.'))
      onClose()
      onSwitchToLogin()
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Extract detailed error information
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed'
      const errorDetails = error.response?.data?.details || []
      const statusCode = error.response?.status
      
      // Build comprehensive error message
      let fullErrorMessage = errorMessage
      
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        fullErrorMessage += ': ' + errorDetails.join(', ')
      }
      
      // Handle specific status codes
      if (statusCode === 413) {
        fullErrorMessage = 'File too large. Please upload a smaller file (max 10MB).'
      } else if (statusCode === 400) {
        // Keep the backend error message for 400 errors
        fullErrorMessage = errorMessage
      } else if (statusCode === 429) {
        fullErrorMessage = 'Too many requests. Please wait a few minutes before trying again.'
      } else if (!error.response) {
        fullErrorMessage = 'Network error. Please check your connection and try again.'
      }
      
      // Show error alert with full details
      toast.error(fullErrorMessage, {
        duration: 6000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auth.register')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
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
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-black">
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
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
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
            <label className="block text-sm font-medium mb-2 text-black">
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
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
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
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            {t('auth.nationalIdPhoto')} <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              {formData.nationalIdPhoto ? (
                <div>
                  <p className="text-sm text-gray-600">{formData.nationalIdPhoto.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.nationalIdPhoto.size / 1024).toFixed(2)} KB
                  </p>
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
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">JPG, PNG, PDF (min 200 KB)</p>
                  <p className="text-xs text-gray-500">Must contain ID number, name, birthdate, and "ETHIOPIA"</p>
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
          className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Registering...' : t('auth.registerButton')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('auth.hasAccount')}{' '}
        <button
          onClick={() => {
            onClose()
            onSwitchToLogin()
          }}
          className="text-black hover:text-gray-800 font-medium"
        >
          {t('auth.loginLink')}
        </button>
      </p>
    </Modal>
  )
}

