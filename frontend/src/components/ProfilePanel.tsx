'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useLanguage } from '@/app/providers'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface ProfilePanelProps {
  user: any
  onClose: () => void
  onLogout: () => void
}

/**
 * Profile Panel Component
 * Shows username, email, coins, total photos uploaded, submitted incident links
 */
export default function ProfilePanel({ user, onClose, onLogout }: ProfilePanelProps) {
  const { t } = useLanguage()
  const [userData, setUserData] = useState(user)
  const [submittedIncidents, setSubmittedIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchSubmittedIncidents()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await api.getMe()
      setUserData(response.data)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchSubmittedIncidents = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      // Filter incidents by current user (note: API may need to support filtering by user_id)
      // For now, get all incidents and filter client-side
      // In production, add ?user_id=${user.id} query param
      const allIncidents = response.data
      const userIncidents = allIncidents.filter((inc: any) => inc.userId === user.id)
      setSubmittedIncidents(userIncidents)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching incidents:', error)
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-16 right-4 z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[80vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-lg">{t('profile.title')}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar */}
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {userData.username?.[0]?.toUpperCase() || userData.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-black">{userData.username || userData.email}</p>
            <p className="text-sm text-gray-600">{userData.email}</p>
          </div>
        </div>

        {/* Coins & Photos */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">{t('profile.coins')}</p>
            <p className="text-2xl font-bold text-black">💰 {userData.coinsBalance || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t('profile.photos')}</p>
            <p className="text-2xl font-bold text-black">📷 {userData.photoCount || 0}</p>
          </div>
        </div>

        {/* Submitted Incidents */}
        <div>
          <h4 className="font-semibold mb-2">{t('profile.submittedIncidents')}</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : submittedIncidents.length === 0 ? (
            <p className="text-sm text-gray-500">{t('profile.noIncidents')}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {submittedIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/?incident=${incident.id}`}
                  onClick={onClose}
                  className="block p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-black">{incident.locationDescription || 'Unknown location'}</p>
                  <p className="text-xs text-gray-500">{incident.incidentType}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            onLogout()
            onClose()
          }}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
        >
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}

