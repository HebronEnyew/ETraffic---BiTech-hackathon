'use client'

import { useState } from 'react'
import { useLanguage } from '@/app/providers'
import MapViewPanel from './MapViewPanel'
import CalendarPanel from './CalendarPanel'

interface SidebarProps {
  activeTab: 'map' | 'alerts' | 'analytics' | 'calendar'
  setActiveTab: (tab: 'map' | 'alerts' | 'analytics' | 'calendar') => void
}

/**
 * Sidebar Component
 * Collapsible sidebar with icons and navigation tabs
 */
export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { language, setLanguage, t } = useLanguage()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Icon components (using SVG)
  const MapIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  )

  const AlertsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )

  const AnalyticsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )

  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  const ChevronIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
    </svg>
  )

  return (
    <div className={`bg-white/90 backdrop-blur-sm border-r-2 border-oxford-blue/20 flex flex-col transition-all duration-300 shadow-xl ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Language Toggle & Collapse Button */}
      <div className="p-4 border-b border-tan/30 flex items-center justify-between">
        {!isCollapsed && (
          <button
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="text-sm px-3 py-1 bg-oxford-blue text-white rounded-lg hover:bg-[#003366] transition-colors font-medium"
          >
            {language === 'en' ? 'አማርኛ' : 'English'}
          </button>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto p-1 hover:bg-tan/20 rounded transition-colors text-oxford-blue"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronIcon />
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'map'
                  ? 'bg-oxford-blue text-white'
                  : 'hover:bg-tan/20 text-oxford-blue'
              }`}
              title={isCollapsed ? t('sidebar.mapView') : ''}
            >
              <MapIcon />
              {!isCollapsed && <span>{t('sidebar.mapView')}</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'alerts'
                  ? 'bg-oxford-blue text-white'
                  : 'hover:bg-tan/20 text-oxford-blue'
              }`}
              title={isCollapsed ? t('sidebar.alerts') : ''}
            >
              <AlertsIcon />
              {!isCollapsed && <span>{t('sidebar.alerts')}</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-oxford-blue text-white'
                  : 'hover:bg-tan/20 text-oxford-blue'
              }`}
              title={isCollapsed ? t('sidebar.analytics') : ''}
            >
              <AnalyticsIcon />
              {!isCollapsed && <span>{t('sidebar.analytics')}</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-oxford-blue text-white'
                  : 'hover:bg-tan/20 text-oxford-blue'
              }`}
              title={isCollapsed ? t('sidebar.calendar') : ''}
            >
              <CalendarIcon />
              {!isCollapsed && <span>{t('sidebar.calendar')}</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Map View Panel (when Map View is active and not collapsed) */}
      {activeTab === 'map' && !isCollapsed && (
        <div className="border-t border-tan/30 p-4">
          <MapViewPanel />
        </div>
      )}

      {/* Calendar Panel (when Calendar is active and not collapsed) */}
      {activeTab === 'calendar' && !isCollapsed && (
        <div className="border-t border-tan/30 p-4">
          <CalendarPanel />
        </div>
      )}
    </div>
  )
}
