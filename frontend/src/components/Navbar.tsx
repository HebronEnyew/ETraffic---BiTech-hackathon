'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/app/providers'
import { useState } from 'react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import ProfilePanel from './ProfilePanel'
import Logo from './Logo'

interface NavbarProps {
  onOpenReport?: () => void
  onLogoClick?: () => void
}

/**
 * Navbar Component
 * Logo left, navlinks center, Sign Up/Login buttons right (or profile avatar + coins when logged in)
 */
export default function Navbar({ onOpenReport, onLogoClick }: NavbarProps = {} as NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-sm border-b-2 border-oxford-blue/20 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Left */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <button
                onClick={onLogoClick}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Logo size={40} />
                <span className="text-2xl font-bold text-oxford-blue">ETraffic</span>
              </button>
            </div>

            {/* Navigation Links - Center */}
            <div className="hidden md:flex flex-1 justify-center space-x-8">
              <Link href="/" className="text-oxford-blue hover:text-tan transition-colors font-medium">
                {t('nav.map')}
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (!user) {
                    setShowLoginModal(true)
                  } else {
                    // Navigate to report page
                    router.push('/report')
                  }
                }}
                className="text-oxford-blue hover:text-tan transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-tan/50 rounded px-2 py-1"
              >
                {t('nav.report')}
              </button>
            </div>

            {/* Auth Buttons / Profile - Right */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-oxford-blue font-medium">💰 {user.coinsBalance || 0}</span>
                  </div>
                  <button
                    onClick={() => setShowProfilePanel(!showProfilePanel)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-tan/20 transition-colors"
                  >
                    <div className="w-8 h-8 bg-oxford-blue rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm text-oxford-blue">{user.username || user.email}</span>
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-oxford-blue hover:text-tan transition-colors font-medium"
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 bg-oxford-blue text-white rounded-lg hover:bg-[#003366] transition-all font-medium"
                  >
                    {t('nav.signUp')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />

      {/* Profile Panel */}
      {user && showProfilePanel && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfilePanel(false)}
          onLogout={logout}
        />
      )}
    </>
  )
}
