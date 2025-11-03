'use client'

import { useState, useEffect } from 'react'
import TrafficMap from './TrafficMap'
import ActiveIncidents from './ActiveIncidents'
import IncidentSummary from './IncidentSummary'
import AlertsCenter from './AlertsCenter'
import AnalyticsView from './AnalyticsView'
import EthiopianCalendarWidget from './EthiopianCalendarWidget'
import { api } from '@/lib/api'
import { useLanguage } from '@/app/providers'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  isVerified: boolean
  isAdmin: boolean
  coinsBalance: number
}

interface DashboardProps {
  activeTab: 'map' | 'alerts' | 'analytics' | 'calendar'
  user: User | null
}

/**
 * Dashboard Component
 * Handles different views based on active tab
 * Integrates with backend API endpoints
 */
export default function Dashboard({ activeTab, user }: DashboardProps) {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (activeTab === 'alerts' || activeTab === 'analytics') {
      fetchData()
    }
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Remove login restrictions - all tabs should work without auth
      if (activeTab === 'alerts') {
        // Alerts are handled by AlertsCenter component - no need to fetch here
      }

      if (activeTab === 'analytics') {
        // Analytics are handled by AnalyticsView component - no need to fetch here
      }

    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-white border-2 border-oxford-blue/20 rounded-xl shadow-xl max-w-md">
          <p className="text-oxford-blue font-semibold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-oxford-blue text-white rounded-xl hover:bg-[#003366] transition-all font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activeTab === 'alerts' && (
        <div>
          <AlertsCenter user={user} />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <AnalyticsView user={user} />
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="flex items-center justify-center min-h-[600px] p-4">
          <EthiopianCalendarWidget />
        </div>
      )}
    </div>
  )
}
