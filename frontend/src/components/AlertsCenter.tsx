'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/app/providers'

interface AlertsCenterProps {
  user: any
}

export default function AlertsCenter({ user }: AlertsCenterProps) {
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    if (user) {
      fetchSearchHistory()
      fetchPrediction()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSearchHistory = async () => {
    try {
      const response = await api.getSearchHistory()
      setSearchHistory(response.data || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching search history:', error)
      if (error.response?.status === 401) {
        toast.error('Please log in to view your search history')
      } else {
        toast.error('Failed to load search history')
      }
      setLoading(false)
    }
  }

  const fetchPrediction = async () => {
    try {
      const response = await api.getLocationPredictions()
      setPrediction(response.data)
    } catch (error: any) {
      console.error('Error fetching predictions:', error)
    }
  }

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'heavy':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'light':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-200 text-red-900'
      case 'medium':
        return 'bg-yellow-200 text-yellow-900'
      case 'low':
        return 'bg-green-200 text-green-900'
      default:
        return 'bg-gray-200 text-gray-900'
    }
  }

  if (!user) {
    return (
      <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-8 shadow-xl text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-4 text-oxford-blue">{t('alerts.loginRequired') || 'Login Required'}</h2>
        <p className="text-gray-600">
          {t('alerts.pleaseLoginForAlerts') || 'Please log in to view your search history and receive personalized alerts based on your travel patterns.'}
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue">{t('alerts.loadingAlerts') || 'Loading your alerts...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Prediction Card */}
      {prediction?.prediction && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-oxford-blue">🚀 {t('alerts.smartPrediction') || 'Smart Prediction'}</h2>
          <div className="bg-tan/20 border-2 border-oxford-blue/30 rounded-lg p-4 mb-4">
            <p className="text-lg font-medium text-oxford-blue mb-3">{prediction.message}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.from') || 'From'}</div>
                <div className="font-bold text-oxford-blue">{prediction.prediction.from_location}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.to') || 'To'}</div>
                <div className="font-bold text-oxford-blue">{prediction.prediction.to_location}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.predictedTime') || 'Predicted Time'}</div>
                <div className="font-bold text-oxford-blue">{prediction.prediction.predicted_time}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.traffic') || 'Traffic'}</div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTrafficColor(prediction.prediction.predicted_traffic)}`}>
                  {prediction.prediction.predicted_traffic}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.speed') || 'Speed'}</div>
                <div className="font-bold text-oxford-blue">{prediction.prediction.predicted_speed} km/h</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.duration') || 'Duration'}</div>
                <div className="font-bold text-oxford-blue">{prediction.prediction.estimated_duration} min</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.confidence') || 'Confidence'}</div>
                <div className={`font-bold ${prediction.prediction.confidence === 'high' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {prediction.prediction.confidence}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t('alerts.status') || 'Status'}</div>
                <div className={`font-bold ${prediction.prediction.incident_alert === 'Clear route' ? 'text-green-600' : 'text-red-600'}`}>
                  {prediction.prediction.incident_alert === 'Clear route' ? (language === 'am' ? 'ንፁህ መንገድ' : 'Clear route') : prediction.prediction.incident_alert}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search History */}
      <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-oxford-blue">📊 {t('alerts.searchHistory') || 'Search History & Traffic Analysis'}</h2>
        
        {searchHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">{t('alerts.noSearchHistoryYet') || 'No search history yet'}</p>
            <p className="text-sm text-gray-500 mt-2">{t('alerts.startSearching') || 'Start searching routes to build your travel profile!'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchHistory.map((search, idx) => (
              <div
                key={idx}
                className="bg-tan/10 border-2 border-oxford-blue/20 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-oxford-blue">
                        {search.from_location} → {search.to_location}
                      </span>
                      {search.avg_speed_kmh && (
                        <span className="px-2 py-1 bg-oxford-blue/10 text-oxford-blue rounded text-xs font-semibold">
                          {Math.round(search.avg_speed_kmh)} km/h
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>🕐 {new Date(search.search_time).toLocaleString()}</span>
                      {search.search_hour !== null && (
                        <span>Hour: {search.search_hour.toString().padStart(2, '0')}:00</span>
                      )}
                      {search.distance_km && (
                        <span>📍 {search.distance_km.toFixed(1)} km</span>
                      )}
                      {search.estimated_travel_time && (
                        <span>⏱️ {search.estimated_travel_time} min</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Incidents */}
                {search.incidents && search.incidents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-oxford-blue/10">
                    <div className="text-sm font-semibold text-oxford-blue mb-2">
                      🚨 Incidents on Route ({search.incidents.length})
                    </div>
                    <div className="space-y-2">
                      {search.incidents.map((incident: any, incIdx: number) => (
                        <div
                          key={incIdx}
                          className={`p-2 rounded border-2 ${getSeverityColor(incident.severity)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-1">
                                {incident.incident_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </div>
                              {incident.description && (
                                <div className="text-xs opacity-90">{incident.description}</div>
                              )}
                              {incident.distance_km && (
                                <div className="text-xs opacity-75 mt-1">
                                  {incident.distance_km.toFixed(2)} km from route
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(incident.severity)}`}>
                              {incident.severity?.toUpperCase() || 'MEDIUM'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Traffic Status */}
                <div className="mt-3 pt-3 border-t border-oxford-blue/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Traffic Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      search.search_hour >= 7 && search.search_hour <= 9
                        ? getTrafficColor('heavy')
                        : search.search_hour >= 17 && search.search_hour <= 19
                        ? getTrafficColor('heavy')
                        : getTrafficColor('moderate')
                    }`}>
                      {search.search_hour >= 7 && search.search_hour <= 9
                        ? 'Heavy (Rush Hour)'
                        : search.search_hour >= 17 && search.search_hour <= 19
                        ? 'Heavy (Rush Hour)'
                        : 'Moderate'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
