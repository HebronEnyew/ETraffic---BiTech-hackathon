'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useLanguage } from '@/app/providers'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface PersonalizedAnalyticsProps {
  user: any
}

const COLORS = ['#002147', '#d2b48c', '#003366', '#8b7355', '#004d80']

/**
 * Circular Gauge Component for Congestion Score
 */
function CongestionGauge({ score }: { score: number }) {
  const { t } = useLanguage()
  const percentage = Math.min(100, Math.max(0, score))
  const color = percentage < 33 ? '#22c55e' : percentage < 66 ? '#eab308' : '#ef4444'
  const circumference = 2 * Math.PI * 45 // radius 45

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="transform -rotate-90 w-32 h-32">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-oxford-blue">{Math.round(percentage)}%</div>
          <div className="text-xs text-gray-600">{t('analytics.congestion') || 'Congestion'}</div>
        </div>
      </div>
    </div>
  )
}

export default function PersonalizedAnalytics({ user }: PersonalizedAnalyticsProps) {
  const [personalizedData, setPersonalizedData] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useLanguage()

  useEffect(() => {
    fetchPersonalizedAnalytics()
  }, [])

  const fetchPersonalizedAnalytics = async () => {
    try {
      setError(null)
      setLoading(true)

      // Check if user is logged in
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      if (!token) {
        setError(t('analytics.pleaseLoginPersonalized') || 'Please login to view personalized analytics')
        setLoading(false)
        return
      }

      const [personalized, prediction] = await Promise.all([
        api.getPersonalizedAnalytics().catch(() => ({ data: null })),
        api.getPredictions().catch(() => ({ data: null })),
      ])

      setPersonalizedData(personalized.data)
      setPredictions(prediction.data)
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching personalized analytics:', error)
      if (error.response?.status === 401) {
        setError(t('analytics.pleaseLoginPersonalized') || 'Please login to view personalized analytics')
      } else {
        setError(t('analytics.failedToLoadPersonalized') || 'Failed to load analytics. Please try again later.')
      }
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-tan">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue font-medium">{t('analytics.loadingPersonalized') || 'Loading personalized analytics...'}</p>
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
            onClick={fetchPersonalizedAnalytics}
            className="px-4 py-2 bg-oxford-blue text-white rounded-xl hover:bg-[#003366] transition-all font-medium"
          >
            {t('analytics.retry') || 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  if (!personalizedData && !predictions) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-white border-2 border-oxford-blue/20 rounded-xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-oxford-blue mb-2">{t('analytics.noAnalyticsYet') || 'No Analytics Yet'}</h3>
          <p className="text-gray-600 mb-4">{t('analytics.startTraveling') || 'Start traveling to get personalized insights!'}</p>
          <p className="text-sm text-gray-500">{t('analytics.useFromToInputs') || 'Use the From/To inputs on the dashboard to begin tracking your routes.'}</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const weeklyChartData = personalizedData?.weeklyTrips?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    trips: day.trip_count || 0,
  })) || []

  const routesChartData = personalizedData?.mostFrequentRoutes?.slice(0, 5).map((route: any) => ({
    route: `${route.from} → ${route.to}`,
    count: route.count,
    avgTime: route.avgTravelTime,
  })) || []

  // Calculate congestion score (mock: based on routes and peak hours)
  const congestionScore = predictions
    ? predictions.predictedTraffic === 'high' ? 75
    : predictions.predictedTraffic === 'moderate' ? 50
    : 25
    : 50

  return (
    <div className="space-y-6">
      {/* Predicted Insights Card */}
      {predictions && (
        <div className="bg-gradient-to-r from-oxford-blue to-[#003366] text-white rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">🔮 {t('analytics.predictedInsights') || 'Predicted Insights'}</h2>
          {predictions.message ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold">{predictions.message}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm opacity-90 mb-1">{t('analytics.predictedDestination') || 'Predicted Destination'}</p>
                  <p className="text-xl font-bold">{predictions.predictedDestination || 'N/A'}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm opacity-90 mb-1">{t('analytics.trafficLevel') || 'Traffic Level'}</p>
                  <p className="text-xl font-bold capitalize">{predictions.predictedTraffic || (language === 'am' ? 'ማይታወቅ' : 'Unknown')}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm opacity-90 mb-1">{t('analytics.confidence') || 'Confidence'}</p>
                  <p className="text-xl font-bold capitalize">{predictions.confidence || (language === 'am' ? 'መካከለኛ' : 'Medium')}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-lg">{predictions.message || (t('analytics.noPredictionsAvailable') || 'No predictions available yet.')}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Congestion Score Gauge */}
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.predictedCongestionScore') || 'Predicted Congestion Score'}</h3>
          <CongestionGauge score={congestionScore} />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t('analytics.basedOnTravelPatterns') || 'Based on your travel patterns and current time'}
            </p>
          </div>
        </div>

        {/* Peak Hour Prediction */}
        {personalizedData?.peakHour && (
          <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.yourPeakHour') || 'Your Peak Hour'}</h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-oxford-blue mb-2">
                {personalizedData.peakHour.time}
              </div>
              <p className="text-sm text-gray-600">
                {t('analytics.mostFrequentTravelTime') || 'Most frequent travel time based on your history'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {personalizedData.peakHour.frequency} {t('analytics.tripsAtThisTime') || 'trips at this time'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Traffic Trends */}
      {weeklyChartData.length > 0 && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.weeklyTrafficTrends') || 'Weekly Traffic Trends'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#002147" />
              <YAxis stroke="#002147" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d2b48c',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="trips"
                stroke="#002147"
                strokeWidth={2}
                name={t('analytics.dailyTrips') || 'Daily Trips'}
                dot={{ fill: '#002147' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Most Traveled Routes */}
      {routesChartData.length > 0 && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.mostTraveledRoutes') || 'Most Traveled Routes'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="route" 
                stroke="#002147" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
              />
              <YAxis stroke="#002147" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d2b48c',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#002147" radius={[8, 8, 0, 0]} name={t('analytics.timesTraveled') || 'Times Traveled'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Route Details Cards */}
      {personalizedData?.mostFrequentRoutes && personalizedData.mostFrequentRoutes.length > 0 && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.yourFrequentRoutes') || 'Your Frequent Routes'}</h3>
          <div className="space-y-3">
            {personalizedData.mostFrequentRoutes.slice(0, 5).map((route: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-tan/10 rounded-lg border-2 border-oxford-blue/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-oxford-blue">
                      {route.from} → {route.to}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>📊 {route.count} {t('analytics.times') || 'times'}</span>
                      <span>⏱️ {t('analytics.avg') || 'Avg'}: {route.avgTravelTime} min</span>
                      <span>🕐 {t('analytics.usually') || 'Usually'}: {Math.round(route.avgHour).toString().padStart(2, '0')}:00</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-oxford-blue to-[#003366] text-white rounded-xl p-6 shadow-xl">
          <p className="text-sm opacity-90 mb-1">{t('analytics.totalTrips') || 'Total Trips'}</p>
          <p className="text-4xl font-bold">{personalizedData?.totalTrips || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-tan to-[#8b7355] text-oxford-blue rounded-xl p-6 shadow-xl">
          <p className="text-sm opacity-90 mb-1">{t('analytics.favoriteRoutes') || 'Favorite Routes'}</p>
          <p className="text-4xl font-bold">{personalizedData?.mostFrequentRoutes?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-oxford-blue/80 to-tan/80 text-white rounded-xl p-6 shadow-xl">
          <p className="text-sm opacity-90 mb-1">{t('analytics.thisWeek') || 'This Week'}</p>
          <p className="text-4xl font-bold">
            {personalizedData?.weeklyTrips?.reduce((sum: number, day: any) => sum + (day.trip_count || 0), 0) || 0}
          </p>
        </div>
      </div>
    </div>
  )
}

