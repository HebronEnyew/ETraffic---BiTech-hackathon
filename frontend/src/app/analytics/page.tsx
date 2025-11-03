'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnalyticsView from '@/components/AnalyticsView'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'

/**
 * Analytics Page
 * Shows analytics dashboard with personalized insights
 */
export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'analytics' | 'calendar'>('analytics')

  const handleLogoClick = () => {
    router.push('/')
  }

  const handleTabChange = (tab: 'map' | 'alerts' | 'analytics' | 'calendar') => {
    setActiveTab(tab)
    if (tab === 'map') {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-tan text-oxford-blue flex flex-col">
      <Navbar onLogoClick={handleLogoClick} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 bg-tan">
            <AnalyticsView user={user} />
          </div>
        </main>
      </div>
      
      <div className="mb-8"></div>
      <Footer />
    </div>
  )
}

