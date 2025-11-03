'use client'

import { useState, useEffect, useRef } from 'react'
import { mockLocations } from '@/lib/mockData'
import { useLanguage } from '@/app/providers'

interface LocationInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon?: React.ReactNode
  isFrom?: boolean
  defaultToGps?: boolean
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void
}

/**
 * Reusable Location Input Component with Dropdown Suggestions
 */
export default function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  isFrom = false,
  defaultToGps = false,
  onLocationSelect,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [gpsLocation, setGpsLocation] = useState<{ name: string; lat: number; lng: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, language } = useLanguage()

  // Get GPS location for "From" input
  useEffect(() => {
    if (isFrom && defaultToGps && !value && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            name: 'Current Location',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setGpsLocation(loc)
          onChange('Current Location')
          if (onLocationSelect) {
            onLocationSelect(loc)
          }
        },
        () => {
          // GPS failed, don't set default
        }
      )
    }
  }, [isFrom, defaultToGps, value, onChange, onLocationSelect])

  // Show suggestions when focused (even if no value)
  useEffect(() => {
    if (showSuggestions) {
      if (value) {
        const filtered = mockLocations.filter((loc) =>
          loc.name.toLowerCase().includes(value.toLowerCase()) ||
          loc.nameAm.toLowerCase().includes(value.toLowerCase())
        )
        setSuggestions(filtered.slice(0, isFrom ? 8 : 20)) // More suggestions for "To"
      } else {
        // Show all locations when focused but empty
        setSuggestions(isFrom ? mockLocations.slice(0, 8) : mockLocations.slice(0, 20))
      }
    }
  }, [value, showSuggestions, isFrom])

  const handleSelect = (location: any) => {
    onChange(location.name)
    setShowSuggestions(false)
    if (onLocationSelect) {
      onLocationSelect({
        name: location.name,
        lat: location.latitude,
        lng: location.longitude,
      })
    }
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-oxford-blue/80 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full border-2 border-oxford-blue/25 rounded-lg px-4 py-2.5 pr-10 text-oxford-blue placeholder-oxford-blue/40 
                   focus:outline-none focus:ring-2 focus:ring-[#002147]/30 focus:border-[#002147]/50 transition-all
                   bg-gradient-to-r from-[#002147]/5 via-[#d2b48c]/10 to-[#002147]/5 shadow-sm hover:shadow-md text-sm font-medium backdrop-blur-sm"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {icon || (
            <svg className="w-5 h-5 text-oxford-blue/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        {/* Dropdown Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-md border-2 border-oxford-blue/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {suggestions.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelect(location)}
                className="w-full text-left px-4 py-3 hover:bg-tan/30 transition-colors border-b border-oxford-blue/10 last:border-b-0"
              >
                <div className="font-medium text-oxford-blue">
                  {language === 'am' ? location.nameAm : location.name}
                </div>
                <div className="text-sm text-oxford-blue/60">
                  {language === 'am' ? location.name : location.nameAm}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

