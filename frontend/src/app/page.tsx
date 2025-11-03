'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import DefaultDashboard from '@/components/DefaultDashboard'
import MapWithSearch from '@/components/MapWithSearch'
import Dashboard from '@/components/Dashboard'
import ReportPanel from '@/components/ReportPanel'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/auth'

/**
 * Main Home Page
 * Shows default dashboard with From/To inputs when logo is clicked or page loads
 * Shows full-page map when Map tab is active
 * Shows other tabs (alerts, analytics, calendar) in Dashboard component
 */
export default function Home() {
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'analytics' | 'calendar'>('map')
  const [showDefaultDashboard, setShowDefaultDashboard] = useState(true)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check URL params for report panel
    if (searchParams?.get('report') === 'true') {
      setShowReportPanel(true)
    }
  }, [searchParams])

  // Show default dashboard on initial load
  useEffect(() => {
    if (!searchParams?.get('tab')) {
      setShowDefaultDashboard(true)
      setActiveTab('map')
    }
  }, [])

  const handleTabChange = (tab: 'map' | 'alerts' | 'analytics' | 'calendar') => {
    setActiveTab(tab)
    if (tab === 'map') {
      // When clicking Map tab, show full map view (not default dashboard)
      setShowDefaultDashboard(false)
    } else {
      setShowDefaultDashboard(false)
    }
  }

  const handleLogoClick = () => {
    setShowDefaultDashboard(true)
    setActiveTab('map')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-tan text-oxford-blue flex flex-col">
      <Navbar onOpenReport={() => setShowReportPanel(true)} onLogoClick={handleLogoClick} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        
        <main className="flex-1 overflow-hidden">
          {activeTab === 'map' && showDefaultDashboard ? (
            <DefaultDashboard />
          ) : activeTab === 'map' ? (
            <MapWithSearch showSearchBar={false} />
          ) : (
            <div className="h-full overflow-y-auto p-6 bg-tan">
              <Dashboard activeTab={activeTab} user={user} />
            </div>
          )}
        </main>
      </div>
      
      <div className="mb-8"></div>
      <Footer />

      {/* Report Panel */}
      <ReportPanel
        isOpen={showReportPanel}
        onClose={() => setShowReportPanel(false)}
      />
    </div>
  )
}
