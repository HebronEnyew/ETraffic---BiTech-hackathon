'use client'

import { create } from 'zustand'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  id: number
  email: string
  username?: string
  fullName?: string
  isVerified: boolean
  isTrusted?: boolean
  isAdmin: boolean
  coinsBalance: number
  photoCount?: number
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, ethiopianNationalId: string) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
  setUser: (user: User) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      // Update axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      set({ token, user, loading: false })
    } catch (error: any) {
      set({ loading: false })
      // Preserve the full error response details
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      const enhancedError = new Error(errorMessage)
      // Attach response data for detailed error handling
      ;(enhancedError as any).response = error.response
      throw enhancedError
    }
  },

  register: async (email: string, password: string, ethiopianNationalId: string) => {
    set({ loading: true })
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        ethiopianNationalId,
      })
      set({ loading: false })
    } catch (error: any) {
      set({ loading: false })
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    // Remove axios default headers
    delete axios.defaults.headers.common['Authorization']
    set({ user: null, token: null })
    // Redirect to default dashboard
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token)
    // Update axios default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    set({ token })
  },

  setUser: (user: User) => {
    set({ user })
  },
}))

// Initialize auth on mount
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    axios.get(`${API_URL}/api/auth/me`)
      .then((response) => {
        const userData = response.data
        useAuth.getState().setUser({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          fullName: userData.fullName,
          isVerified: userData.isVerified,
          isTrusted: userData.isTrusted,
          isAdmin: userData.isAdmin,
          coinsBalance: userData.coinsBalance || 0,
          photoCount: userData.photoCount || 0,
        })
      })
      .catch(() => {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
      })
  }
}

