import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// Set up axios interceptor to add token to all requests
axios.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Set auth token from localStorage if available (fallback for initial load)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}

export const api = {
  // Incidents
  getIncidents: (params?: any) =>
    axios.get(`${API_URL}/api/incidents`, { params }),
  getIncident: (id: number) =>
    axios.get(`${API_URL}/api/incidents/${id}`),
  reportIncident: (data: any) =>
    axios.post(`${API_URL}/api/incidents`, data),
  reportIncidentWithPhotos: (formData: FormData) => {
    const token = getAuthToken()
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return axios.post(`${API_URL}/api/reports`, formData, {
      headers,
    })
  },

  // Analytics
  getDailyAnalytics: () =>
    axios.get(`${API_URL}/api/analytics/daily`),
  getWeeklySummary: (startDate?: string, endDate?: string) =>
    axios.get(`${API_URL}/api/analytics/weekly-summary`, {
      params: { startDate, endDate },
    }),
  getPeakHours: () =>
    axios.get(`${API_URL}/api/analytics/peak-hours`),

  // Events
  getEvents: (startDate?: string, endDate?: string) =>
    axios.get(`${API_URL}/api/events`, { params: { startDate, endDate } }),
  getEventsForDate: (date: string) =>
    axios.get(`${API_URL}/api/events/${date}`),

  // Alerts
  getAlerts: (latitude: number, longitude: number, radius?: number) =>
    axios.get(`${API_URL}/api/alerts`, {
      params: { latitude, longitude, radius },
    }),

  // Coins
  getCoinBalance: () =>
    axios.get(`${API_URL}/api/coins/balance`),
  getCoinTransactions: () =>
    axios.get(`${API_URL}/api/coins/transactions`),
  convertCoins: (coins: number) =>
    axios.post(`${API_URL}/api/coins/convert`, { coins }),

  // Admin
  verifyIncident: (id: number, verified: boolean, notes?: string) =>
    axios.put(`${API_URL}/api/admin/incidents/${id}/verify`, {
      verified,
      notes,
    }),
  banUser: (id: number, banned: boolean, reason?: string) =>
    axios.put(`${API_URL}/api/admin/users/${id}/ban`, { banned, reason }),
  getAdminIncidents: () =>
    axios.get(`${API_URL}/api/admin/incidents`),

  // Location Tracking
  trackLocation: (data: {
    latitude: number
    longitude: number
    locationName: string
    locationType: 'travel_start' | 'travel_end' | 'search'
  }) =>
    axios.post(`${API_URL}/api/locations/track`, data),

  // Location History
  getLocationHistory: () =>
    axios.get(`${API_URL}/api/locations/history`),
  getSearchHistory: () =>
    axios.get(`${API_URL}/api/locations/search-history`),
  getLocationPredictions: () =>
    axios.get(`${API_URL}/api/locations/predictions`),

  // Personalized Analytics
  getPersonalizedAnalytics: () =>
    axios.get(`${API_URL}/api/analytics/personalized`),
  getPredictions: () =>
    axios.get(`${API_URL}/api/analytics/predictions`),

  // Auth
  getMe: () =>
    axios.get(`${API_URL}/api/auth/me`),

  // Calendar & Google Calendar
  getGoogleCalendarEvents: (startDate?: string, endDate?: string) =>
    axios.get(`${API_URL}/api/calendar/google-events`, {
      params: { startDate, endDate },
    }),
  getEventsWithClosures: (startDate?: string, endDate?: string) =>
    axios.get(`${API_URL}/api/calendar/events-with-closures`, {
      params: { startDate, endDate },
    }),
}

