'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import PersonalizedAnalytics from './PersonalizedAnalytics'
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
} from 'recharts'

interface AnalyticsViewProps {
  user: any
}

export default function AnalyticsView({ user }: AnalyticsViewProps) {
  const [dailyAnalytics, setDailyAnalytics] = useState<any>(null)
  const [weeklySummary, setWeeklySummary] = useState<any>(null)
  const [peakHours, setPeakHours] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useLanguage()

  useEffect(() => {
    // Remove login restriction - fetch analytics for all users
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setError(null)
      // Fetch analytics - handle auth errors gracefully
      let daily, weekly, peak
      try {
        [daily, weekly, peak] = await Promise.all([
          api.getDailyAnalytics().catch(() => ({ data: null })),
          api.getWeeklySummary().catch(() => ({ data: null })),
          api.getPeakHours().catch(() => ({ data: null })),
        ])
      } catch (err: any) {
        // If all fail, use public endpoints or show limited data
        weekly = await api.getWeeklySummary().catch(() => ({ data: { summary: 'No analytics available. Please login for detailed insights.' } }))
        daily = { data: null }
        peak = { data: null }
      }

      setDailyAnalytics(daily.data)
      setWeeklySummary(weekly.data)
      setPeakHours(peak.data)
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      if (error.response?.status === 401) {
        setError(t('analytics.pleaseLogin') || 'Please login to view analytics')
      } else {
        setError(t('analytics.failedToLoad') || 'Failed to load analytics. Please try again later.')
      }
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue">{t('analytics.loadingAnalytics') || 'Loading analytics...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <p className="text-red-800 font-semibold mb-2">{error}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-oxford-blue text-white rounded-lg hover:bg-[#003366] transition-colors"
          >
            {t('analytics.goToLogin') || 'Go to Login'}
          </a>
        </div>
      </div>
    )
  }

  const normalDaysData = peakHours?.normalDays
    ? Object.entries(peakHours.normalDays).map(([hour, count]) => ({
        hour,
        normal: count,
        events: peakHours.eventDays?.[hour] || 0,
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Overall System Traffic Analytics */}
      <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-oxford-blue">{t('analytics.overallSystemTraffic') || 'Overall System Traffic Analytics'}</h2>
        <p className="text-gray-600 mb-4">
          {t('analytics.overallSystemTrafficDescription') || 'View comprehensive traffic data and incident statistics across the entire ETraffic system.'}
        </p>
      </div>

      {/* Weekly AI Summary */}
      <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-oxford-blue">{t('analytics.weeklySummary') || 'Weekly Traffic Summary'}</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed text-base">
            {weeklySummary?.summary || (t('analytics.noSummaryAvailable') || 'No summary available for this week.')}
          </p>
        </div>
        {weeklySummary?.weekRange && (
          <p className="text-sm text-gray-500 mt-4">
            {t('analytics.period') || 'Period'}: {new Date(weeklySummary.weekRange.start).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')} - {new Date(weeklySummary.weekRange.end).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US')}
          </p>
        )}
      </div>

      {/* System-Wide Peak Hour */}
      {peakHours && Object.keys(peakHours.normalDays || {}).length > 0 && (
        <div className="bg-gradient-to-r from-oxford-blue to-[#003366] text-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">{t('analytics.systemWidePeakTraffic') || 'System-Wide Peak Traffic Hours'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90 mb-2">{t('analytics.peakHourToday') || 'Peak Hour Today'}</p>
              <p className="text-2xl font-bold">
                {Object.entries(peakHours.normalDays || {})
                  .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90 mb-2">{t('analytics.totalIncidentsToday') || 'Total Incidents Today'}</p>
              <p className="text-2xl font-bold">
                {Object.values(peakHours.normalDays || {}).reduce((a: any, b: any) => a + b, 0)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90 mb-2">{t('analytics.activeRoutes') || 'Active Routes'}</p>
              <p className="text-2xl font-bold">
                {peakHours.activeRoutes || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Peak Hour Comparison */}
      {normalDaysData.length > 0 && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.peakHourComparison') || 'Peak Hour Traffic Comparison'}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('analytics.comparingNormalVsEvent') || 'Comparing normal days vs event days'}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={normalDaysData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#002147" />
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
                dataKey="normal"
                stroke="#002147"
                strokeWidth={2}
                name={t('analytics.normalDays') || 'Normal Days'}
                dot={{ fill: '#002147' }}
              />
              <Line
                type="monotone"
                dataKey="events"
                stroke="#d2b48c"
                strokeWidth={2}
                name={t('analytics.eventDays') || 'Event Days'}
                dot={{ fill: '#d2b48c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Incident Frequency */}
      {weeklySummary?.statistics && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.incidentFrequencyByType') || 'Incident Frequency by Type'}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(weeklySummary.statistics.incidentTypes).map(
                ([type, count]) => ({
                  type: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                  count,
                })
              )}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" stroke="#002147" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#002147" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #d2b48c',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="count" fill="#002147" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* System-Wide Incident Statistics */}
      {weeklySummary?.statistics && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-oxford-blue">{t('analytics.systemTrafficStatistics') || 'System Traffic Statistics'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-tan/20 rounded-lg p-4 border-2 border-tan/40">
              <p className="text-sm text-gray-600 mb-1">{t('analytics.totalIncidentsThisWeek') || 'Total Incidents This Week'}</p>
              <p className="text-2xl font-bold text-oxford-blue">
                {weeklySummary.statistics.totalIncidents || 0}
              </p>
            </div>
            <div className="bg-tan/20 rounded-lg p-4 border-2 border-tan/40">
              <p className="text-sm text-gray-600 mb-1">{t('analytics.activeUsers') || 'Active Users'}</p>
              <p className="text-2xl font-bold text-oxford-blue">
                {weeklySummary.statistics.activeUsers || 0}
              </p>
            </div>
            <div className="bg-tan/20 rounded-lg p-4 border-2 border-tan/40">
              <p className="text-sm text-gray-600 mb-1">{t('analytics.verifiedReports') || 'Verified Reports'}</p>
              <p className="text-2xl font-bold text-oxford-blue">
                {weeklySummary.statistics.verifiedReports || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

