'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import enTranslations from '@/locales/en.json'
import amTranslations from '@/locales/am.json'

interface LanguageContextType {
  language: 'en' | 'am'
  setLanguage: (lang: 'en' | 'am') => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/**
 * Language Provider
 * Provides i18n translations for English and Amharic across entire application
 */
export function Providers({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'am'>('en')

  // Load language preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('etraffic_language') as 'en' | 'am' | null
    if (saved) {
      setLanguage(saved)
    }
  }, [])

  // Save language preference to localStorage
  const handleSetLanguage = (lang: 'en' | 'am') => {
    setLanguage(lang)
    localStorage.setItem('etraffic_language', lang)
  }

  const t = (key: string): string => {
    const translations = language === 'en' ? enTranslations : amTranslations
    
    // Navigate nested keys (e.g., "nav.map" -> translations.nav.map)
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key}`)
        return key
      }
    }
    
    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within Providers')
  }
  return context
}
