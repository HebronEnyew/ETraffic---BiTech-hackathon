'use client'

import { useEffect, useRef, useState } from 'react'
import { mockLocations, mockRoutes, mockIncidents, getRoute, getIncidentsNear } from '@/lib/mockData'
import IncidentSummary from './IncidentSummary'
import LeafletMap from './LeafletMap'
import { useLanguage } from '@/app/providers'

/**
 * Full-Page Map Component with From/Destination Search
 * When showSearchBar is false, only displays the map
 * Publicly accessible - no login required
 */
export default function MapWithSearch({ showSearchBar = false }: { showSearchBar?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const [fromLocation, setFromLocation] = useState<string>('')
  const [toLocation, setToLocation] = useState<string>('')
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('all')

  useEffect(() => {
    renderMap()
  }, [])

  useEffect(() => {
    if (fromLocation && toLocation) {
      const route = getRoute(fromLocation, toLocation)
      if (route) {
        setSelectedRoute(route)
        // Get incidents near the route
        const midPoint = route.coordinates[Math.floor(route.coordinates.length / 2)]
        const incidents = getIncidentsNear(midPoint.lat, midPoint.lng, 5)
        let filtered = incidents
        
        // Apply type filter
        if (incidentTypeFilter !== 'all') {
          filtered = filtered.filter((inc) => inc.type === incidentTypeFilter)
        }
        
        setFilteredIncidents(filtered)
      } else {
        // If no route found, show all incidents with filter
        let filtered = mockIncidents
        if (incidentTypeFilter !== 'all') {
          filtered = filtered.filter((inc) => inc.type === incidentTypeFilter)
        }
        setFilteredIncidents(filtered)
        setSelectedRoute(null)
      }
    } else {
      // No route selected, show all incidents with filter
      let filtered = mockIncidents
      if (incidentTypeFilter !== 'all') {
        filtered = filtered.filter((inc) => inc.type === incidentTypeFilter)
      }
      setFilteredIncidents(filtered)
      setSelectedRoute(null)
    }
  }, [fromLocation, toLocation, incidentTypeFilter])

  const renderMap = () => {
    if (!mapRef.current) return

    const width = mapRef.current.clientWidth || 1200
    const height = mapRef.current.clientHeight || 800
    const centerLat = 9.0249
    const centerLng = 38.7469
    const zoom = 0.01

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.style.background = '#f3f4f6'

    const latLngToPixel = (lat: number, lng: number) => {
      const x = ((lng - centerLng) / zoom + 0.5) * width
      const y = ((centerLat - lat) / zoom + 0.5) * height
      return { x, y }
    }

    // Draw all routes
    mockRoutes.forEach((route) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
      const points = route.coordinates
        .map((coord) => {
          const { x, y } = latLngToPixel(coord.lat, coord.lng)
          return `${x},${y}`
        })
        .join(' ')

      const color = route.congestion === 'high' ? '#ef4444' : 
                   route.congestion === 'medium' ? '#eab308' : '#22c55e'
      const strokeWidth = route.congestion === 'high' ? '4' : 
                          route.congestion === 'medium' ? '3' : '2'

      path.setAttribute('points', points)
      path.setAttribute('stroke', color)
      path.setAttribute('stroke-width', strokeWidth)
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('fill', 'none')
      path.setAttribute('opacity', '0.7')
      svg.appendChild(path)
    })

    // Draw selected route with highlight
    if (selectedRoute) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
      const points = selectedRoute.coordinates
        .map((coord: any) => {
          const { x, y } = latLngToPixel(coord.lat, coord.lng)
          return `${x},${y}`
        })
        .join(' ')

      path.setAttribute('points', points)
      path.setAttribute('stroke', '#3b82f6')
      path.setAttribute('stroke-width', '5')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('stroke-dasharray', '10,5')
      path.setAttribute('fill', 'none')
      path.setAttribute('opacity', '0.9')
      svg.appendChild(path)
    }

    // Draw incident markers (only active incidents)
    const incidentsToShow = (fromLocation && toLocation ? filteredIncidents : mockIncidents).filter(
      (inc: any) => !inc.status || inc.status === 'active'
    )
    
    incidentsToShow.forEach((incident) => {
      const { x, y } = latLngToPixel(incident.latitude, incident.longitude)
      const severityColor = 
        incident.severity === 'major' ? '#ef4444' :
        incident.severity === 'medium' ? '#eab308' : '#22c55e'

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', x.toString())
      circle.setAttribute('cy', y.toString())
      circle.setAttribute('r', '12')
      circle.setAttribute('fill', severityColor)
      circle.setAttribute('stroke', '#000')
      circle.setAttribute('stroke-width', '2')
      circle.setAttribute('opacity', '0.9')
      circle.style.cursor = 'pointer'

      circle.addEventListener('click', () => {
        alert(`${incident.type}\n${incident.description}`)
      })

      svg.appendChild(circle)
    })

    mapRef.current.innerHTML = ''
    mapRef.current.appendChild(svg)
  }

  // Re-render map when route or incidents change
  useEffect(() => {
    if (mapRef.current) {
      renderMap()
    }
  }, [selectedRoute, filteredIncidents, fromLocation, toLocation])

  // Initial map render
  useEffect(() => {
    renderMap()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Search Bar - Only show if showSearchBar is true */}
      {showSearchBar && (
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('map.from')}</label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">{t('map.selectLocation')}</option>
                {mockLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('map.to')}</label>
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">{t('map.selectLocation')}</option>
                {mockLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Info */}
          {selectedRoute && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {selectedRoute.from} → {selectedRoute.to}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedRoute.distance} km • {selectedRoute.duration} min
                  </p>
                  {selectedRoute.alternateRoutes && selectedRoute.alternateRoutes.length > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      {t('map.alternateRoutes')}: {selectedRoute.alternateRoutes.join(', ')}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedRoute.congestion === 'high' ? 'bg-red-100 text-red-800' :
                  selectedRoute.congestion === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedRoute.congestion}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Map - Use Leaflet when search bar is hidden */}
      {!showSearchBar ? (
        <div className="flex-1 overflow-hidden">
          <LeafletMap />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-500"></div>
                  <span>{t('map.highCongestion')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-yellow-500"></div>
                  <span>{t('map.mediumCongestion')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500"></div>
                  <span>{t('map.lowCongestion')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Summary Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <IncidentSummary
              incidents={filteredIncidents}
              fromLocation={fromLocation}
              toLocation={toLocation}
              incidentTypeFilter={incidentTypeFilter}
              setIncidentTypeFilter={setIncidentTypeFilter}
            />
          </div>
        </div>
      )}
    </div>
  )
}

