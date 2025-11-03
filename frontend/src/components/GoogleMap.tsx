'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

interface GoogleMapProps {
  showSearchBar?: boolean
  incidents?: any[]
}

/**
 * Google Maps Component with Live GPS Location
 * Replaces mock map data with real Google Maps integration
 */
export default function GoogleMap({ showSearchBar = false, incidents: propsIncidents }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

  // Use props incidents if provided, otherwise fetch
  useEffect(() => {
    if (propsIncidents && propsIncidents.length > 0) {
      setIncidents(propsIncidents)
    } else {
      fetchIncidents()
    }
  }, [propsIncidents])

  // Get user's GPS location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(loc)
        },
        (err) => {
          console.error('Error getting location:', err)
          setError('Unable to get your location. Please enable location services.')
          // Fallback to Addis Ababa default
          setUserLocation({ lat: 9.0249, lng: 38.7469 })
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
      setUserLocation({ lat: 9.0249, lng: 38.7469 })
    }
  }, [])

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }

    function initMap() {
      if (!mapRef.current || !userLocation) return

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      setMapInstance(map)

      // Add user location marker
      const userMarker = new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#002147',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      // Fetch incidents from database
      fetchIncidents()
    }
  }, [userLocation])

  const fetchIncidents = async () => {
    try {
      const response = await api.getIncidents({ limit: 100 })
      setIncidents(response.data || [])
    } catch (error: any) {
      console.error('Error fetching incidents:', error)
      // Continue even if incidents fail to load
    }
  }

    // Add incident markers to map
  useEffect(() => {
    if (!mapInstance || !incidents.length) return

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null))
    const newMarkers: any[] = []

    incidents
      .filter((inc) => !inc.status || inc.status === 'active')
      .forEach((incident) => {
        const severityColor =
          incident.severity === 'major'
            ? '#ef4444'
            : incident.severity === 'medium'
            ? '#eab308'
            : '#22c55e'

        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(incident.latitude), lng: parseFloat(incident.longitude) },
          map: mapInstance,
          title: `${incident.incidentType || incident.incident_type}: ${incident.description}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: severityColor,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        })

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${(incident.incidentType || incident.incident_type)?.replace(/_/g, ' ') || 'Incident'}</h3>
              <p style="margin: 4px 0; font-size: 14px;">${incident.description || 'No description'}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                Severity: ${incident.severity || 'medium'}<br/>
                ${incident.locationDescription || incident.location_description ? `Location: ${incident.locationDescription || incident.location_description}` : ''}
              </p>
              ${incident.isVerified || incident.is_verified ? '<p style="color: green; font-size: 12px;">✓ Verified</p>' : ''}
            </div>
          `,
        })

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker)
        })

        newMarkers.push(marker)
      })

    setMarkers(newMarkers)
  }, [mapInstance, incidents])

  if (error && !userLocation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Loading map with default location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Error banner */}
      {error && (
        <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {!mapInstance && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oxford-blue mx-auto"></div>
            <p className="mt-4 text-oxford-blue">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any
  }
}

