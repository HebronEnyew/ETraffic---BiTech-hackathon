'use client'

import { useEffect, useState } from 'react'
import { mockLocations } from '@/lib/mockData'
import IncidentSummary from './IncidentSummary'
import LeafletMap from './LeafletMap'
import LocationInput from './LocationInput'
import { api } from '@/lib/api'
import { useLanguage } from '@/app/providers'
import { useAuth } from '@/lib/auth'

/**
 * Default Dashboard Component
 * Shows From/To inputs at top, map in middle, Incident Summary on right sidebar
 */
export default function DefaultDashboard() {
  const [fromLocation, setFromLocation] = useState<string>('')
  const [toLocation, setToLocation] = useState<string>('')
  const [incidents, setIncidents] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()
  const { user } = useAuth()

  // Fetch incidents from database
  useEffect(() => {
    fetchIncidents()
  }, [])

  // Filter incidents based on location and type
  useEffect(() => {
    let filtered = [...incidents]

    // Filter by type
    if (incidentTypeFilter !== 'all') {
      filtered = filtered.filter((inc) => inc.incidentType === incidentTypeFilter)
    }

    // Filter by location (if toLocation is set)
    if (toLocation) {
      filtered = filtered.filter((inc) => {
        // Match by location description if available
        if (inc.locationDescription) {
          const locLower = inc.locationDescription.toLowerCase()
          const toLower = toLocation.toLowerCase()
          return locLower.includes(toLower) || toLower.includes(locLower.split(',')[0])
        }
        return true
      })
    }

    setFilteredIncidents(filtered)
  }, [incidents, toLocation, incidentTypeFilter])

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null)
  const [toCoords, setToCoords] = useState<[number, number] | null>(null)

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getIncidents({ limit: 100 })
      setIncidents(response.data || [])
    } catch (error: any) {
      console.error('Error fetching incidents:', error)
      setError('Failed to load incidents. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRouteData = async (from: string, to: string) => {
    // Find coordinates for from and to
    const fromLoc = mockLocations.find(l => l.name === from || l.nameAm === from)
    const toLoc = mockLocations.find(l => l.name === to || l.nameAm === to)

    if (fromLoc && toLoc) {
      setFromCoords([fromLoc.latitude, fromLoc.longitude])
      setToCoords([toLoc.latitude, toLoc.longitude])
      
      // Generate route coordinates (simple straight line with intermediate points for visualization)
      const route: [number, number][] = [
        [fromLoc.latitude, fromLoc.longitude],
        [
          (fromLoc.latitude + toLoc.latitude) / 2,
          (fromLoc.longitude + toLoc.longitude) / 2
        ],
        [toLoc.latitude, toLoc.longitude],
      ]
      setRouteCoordinates(route)
      
      // Fetch incidents along the route
      await fetchIncidents()
    }
  }

  return (
    <div className="flex flex-col h-full bg-tan">
      {/* From/To Input Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b-2 border-oxford-blue/20 shadow-lg p-4 relative z-40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Input */}
            <LocationInput
              label={t('map.from')}
              value={fromLocation}
              onChange={setFromLocation}
              placeholder={t('map.enterStartingPoint') || "Enter starting point..."}
              isFrom={true}
              defaultToGps={true}
              onLocationSelect={(loc) => {
                setFromLocation(loc.name)
                // Track location if user is logged in
                if (typeof window !== 'undefined') {
                  const token = localStorage.getItem('token')
                  if (token) {
                    api.trackLocation({
                      latitude: loc.lat,
                      longitude: loc.lng,
                      locationName: loc.name,
                      locationType: 'travel_start',
                    }).catch(console.error)
                  }
                }
              }}
            />

            {/* To Input */}
            <LocationInput
              label={t('map.to')}
              value={toLocation}
              onChange={setToLocation}
              placeholder={t('map.enterDestination') || "Enter destination..."}
              isFrom={false}
              onLocationSelect={(loc) => {
                setToLocation(loc.name)
                // Set destination coordinates for map centering
                setToCoords([loc.lat, loc.lng])
                // Track location if user is logged in
                if (typeof window !== 'undefined') {
                  const token = localStorage.getItem('token')
                  if (token) {
                    api.trackLocation({
                      latitude: loc.lat,
                      longitude: loc.lng,
                      locationName: loc.name,
                      locationType: 'travel_end',
                    }).catch(console.error)
                  }
                }
                // Trigger route fetch when both are selected
                if (fromLocation) {
                  fetchRouteData(fromLocation, loc.name)
                } else {
                  // If no from location, just center on destination
                  setFromCoords(null)
                  setRouteCoordinates([])
                }
              }}
              icon={
                <svg className="w-6 h-6 text-oxford-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative bg-white rounded-tl-2xl shadow-2xl overflow-hidden z-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-oxford-blue mx-auto"></div>
                <p className="mt-4 text-oxford-blue font-medium">Loading map...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                <p className="text-red-600 font-semibold mb-2">{error}</p>
                <button
                  onClick={fetchIncidents}
                  className="mt-4 px-4 py-2 bg-oxford-blue text-white rounded-lg hover:bg-[#003366] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <LeafletMap 
              incidents={filteredIncidents} 
              routeCoordinates={routeCoordinates}
              fromCoords={fromCoords}
              toCoords={toCoords}
              destinationCenter={toCoords} // Center map on destination when available
            />
          )}
        </div>

        {/* Incident Summary Sidebar */}
        <div className="w-80 bg-white/90 backdrop-blur-sm border-l-2 border-oxford-blue/20 shadow-2xl overflow-y-auto">
          <IncidentSummary
            incidents={filteredIncidents}
            fromLocation={fromLocation}
            toLocation={toLocation}
            incidentTypeFilter={incidentTypeFilter}
            setIncidentTypeFilter={setIncidentTypeFilter}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

