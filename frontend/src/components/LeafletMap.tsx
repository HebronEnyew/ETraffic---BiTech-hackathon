'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { api } from '@/lib/api'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface LeafletMapProps {
  incidents?: any[]
  center?: [number, number]
  zoom?: number
  routeCoordinates?: [number, number][]
  fromCoords?: [number, number] | null
  toCoords?: [number, number] | null
  destinationCenter?: [number, number] | null // Center map on destination when provided
}

/**
 * Leaflet Map Component with OpenStreetMap
 * Free, GPS-based map integration without Google Maps API key
 */
export default function LeafletMap({ 
  incidents: propsIncidents, 
  center, 
  zoom = 13,
  routeCoordinates = [],
  fromCoords,
  toCoords,
  destinationCenter,
}: LeafletMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [Leaflet, setLeaflet] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    // Import Leaflet and CSS on client side
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        setLeaflet(L.default)
      })
      import('leaflet/dist/leaflet.css')
    }
  }, [])

  // Use props incidents if provided, otherwise fetch
  useEffect(() => {
    if (propsIncidents && propsIncidents.length > 0) {
      setIncidents(propsIncidents)
      setLoading(false)
    } else if (mounted) {
      fetchIncidents()
    }
  }, [propsIncidents, mounted])

  // Get user's GPS location
  useEffect(() => {
    if (!mounted) return

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ]
          setUserLocation(loc)
          if (!propsIncidents || propsIncidents.length === 0) {
            setLoading(false)
          }
        },
        (err) => {
          console.error('Error getting location:', err)
          setError('Unable to get your location. Please enable location services.')
          // Fallback to Addis Ababa default
          setUserLocation([9.0249, 38.7469])
          if (!propsIncidents || propsIncidents.length === 0) {
            setLoading(false)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } else {
      setError('Geolocation is not supported by your browser.')
      // Fallback to Addis Ababa default
      setUserLocation([9.0249, 38.7469])
      if (!propsIncidents || propsIncidents.length === 0) {
        setLoading(false)
      }
    }
  }, [mounted, propsIncidents])

  const fetchIncidents = async () => {
    try {
      const response = await api.getIncidents({ limit: 100 })
      setIncidents(response.data || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching incidents:', error)
      setIncidents([])
      setLoading(false)
    }
  }

  const createIcon = (color: string = '#002147') => {
    if (!Leaflet) return null
    
    return Leaflet.divIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return '#ef4444'
      case 'medium':
        return '#eab308'
      case 'minor':
        return '#22c55e'
      default:
        return '#002147'
    }
  }

  // Priority: destinationCenter > center > toCoords > fromCoords > userLocation > default
  const mapCenter = destinationCenter || center || toCoords || fromCoords || userLocation || [9.0249, 38.7469]

  if (!mounted || !Leaflet) {
    return (
      <div className="flex items-center justify-center h-full bg-tan">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue font-medium">Loading map...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-tan">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue font-medium">Loading map...</p>
        </div>
      </div>
    )
  }

  const userIcon = createIcon('#002147')

  return (
    <div className="relative w-full h-full bg-tan" style={{ zIndex: 0 }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when center changes
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#002147"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* From marker */}
        {fromCoords && userIcon && (
          <Marker position={fromCoords} icon={createIcon('#22c55e')}>
            <Popup>
              <div className="font-bold text-oxford-blue">Starting Point</div>
            </Popup>
          </Marker>
        )}

        {/* To marker */}
        {toCoords && userIcon && (
          <Marker position={toCoords} icon={createIcon('#ef4444')}>
            <Popup>
              <div className="font-bold text-oxford-blue">Destination</div>
            </Popup>
          </Marker>
        )}

        {/* User location marker */}
        {userLocation && !center && !fromCoords && userIcon && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="font-bold text-oxford-blue">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Incident markers */}
        {incidents
          .filter((inc) => !inc.status || inc.status === 'active')
          .map((incident) => {
            const lat = parseFloat(incident.latitude || incident.lat)
            const lng = parseFloat(incident.longitude || incident.lng)
            if (isNaN(lat) || isNaN(lng)) return null

            const severity = incident.severity || 'medium'
            const color = getSeverityColor(severity)
            const icon = createIcon(color)

            if (!icon) return null

            return (
              <Marker
                key={incident.id}
                position={[lat, lng]}
                icon={icon}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold text-oxford-blue mb-1">
                      {(incident.incidentType || incident.incident_type || 'Incident')
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {incident.description || 'No description available'}
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Severity:</span>{' '}
                        <span className="capitalize">{severity}</span>
                      </p>
                      {incident.locationDescription || incident.location_description ? (
                        <p>
                          <span className="font-semibold">Location:</span>{' '}
                          {incident.locationDescription || incident.location_description}
                        </p>
                      ) : null}
                      {incident.isVerified || incident.is_verified ? (
                        <p className="text-green-600 font-medium">✓ Verified</p>
                      ) : (
                        <p className="text-gray-500">Unverified</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
      </MapContainer>

      {/* Error banner */}
      {error && (
        <div className="absolute top-4 left-4 bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-[1000] max-w-md">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-oxford-blue/20 rounded-xl p-4 shadow-xl z-[1000]">
        <h4 className="font-bold text-oxford-blue mb-2 text-sm">Incident Severity</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <span>Major</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            <span>Minor</span>
          </div>
        </div>
      </div>
    </div>
  )
}
