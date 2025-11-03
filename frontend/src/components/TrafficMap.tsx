'use client'

import { useEffect, useRef, useState } from 'react'

interface TrafficMapProps {
  incidents: any[]
  onRouteCalculated?: (route: any) => void
}

// Mock road data for Addis Ababa with traffic colors
interface MockRoad {
  name: string
  coordinates: Array<{ lat: number; lng: number }>
  congestion: 'high' | 'medium' | 'low'
}

const mockRoads: MockRoad[] = [
  {
    name: 'Bole Road',
    coordinates: [
      { lat: 9.0125, lng: 38.7561 },
      { lat: 9.0150, lng: 38.7570 },
      { lat: 9.0180, lng: 38.7580 },
      { lat: 9.0200, lng: 38.7590 },
    ],
    congestion: 'high',
  },
  {
    name: 'Churchill Avenue',
    coordinates: [
      { lat: 9.0120, lng: 38.7555 },
      { lat: 9.0140, lng: 38.7565 },
      { lat: 9.0160, lng: 38.7575 },
    ],
    congestion: 'medium',
  },
  {
    name: 'Africa Avenue',
    coordinates: [
      { lat: 9.0100, lng: 38.7500 },
      { lat: 9.0120, lng: 38.7520 },
      { lat: 9.0140, lng: 38.7540 },
    ],
    congestion: 'low',
  },
  {
    name: 'Ras Abebe Aregay Street',
    coordinates: [
      { lat: 9.0130, lng: 38.7550 },
      { lat: 9.0145, lng: 38.7560 },
      { lat: 9.0160, lng: 38.7570 },
    ],
    congestion: 'high',
  },
  {
    name: 'Ras Mekonnen Avenue',
    coordinates: [
      { lat: 9.0110, lng: 38.7540 },
      { lat: 9.0130, lng: 38.7550 },
      { lat: 9.0150, lng: 38.7560 },
    ],
    congestion: 'low',
  },
]

// Mock alternate routes
const getAlternateRoute = (roadName: string) => {
  const alternates: Record<string, { route: string; reason: string }> = {
    'Bole Road': {
      route: 'Via Ras Mekonnen Avenue',
      reason: 'Bole Road has heavy congestion',
    },
    'Churchill Avenue': {
      route: 'Via Africa Avenue',
      reason: 'Churchill Avenue has medium congestion',
    },
    'Ras Abebe Aregay Street': {
      route: 'Via Wollo Sefer route',
      reason: 'Ras Abebe Aregay Street has heavy congestion',
    },
  }
  return alternates[roadName]
}

export default function TrafficMap({ incidents, onRouteCalculated }: TrafficMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [currentRoute, setCurrentRoute] = useState<any>(null)

  useEffect(() => {
    renderMockMap()
  }, [])

  useEffect(() => {
    // Check for alternate routes based on incidents
    const highCongestionIncidents = incidents.filter(
      (inc) => inc.incidentType === 'heavy_congestion' || inc.severity === 'major'
    )
    
    if (highCongestionIncidents.length > 0) {
      const affectedRoads = highCongestionIncidents
        .map((inc) => inc.locationDescription)
        .filter(Boolean)
      
      const alternateRoutes = affectedRoads
        .map((roadName) => {
          const alt = getAlternateRoute(roadName || '')
          return alt ? { ...alt, from: roadName } : null
        })
        .filter(Boolean)

      if (alternateRoutes.length > 0 && onRouteCalculated) {
        setCurrentRoute({
          hasAlternate: true,
          suggestions: alternateRoutes,
          message: 'Alternate routes available due to congestion',
        })
        onRouteCalculated({
          hasAlternate: true,
          suggestions: alternateRoutes,
          message: 'Alternate routes available due to congestion',
        })
      }
    }
  }, [incidents, onRouteCalculated])

  const renderMockMap = () => {
    if (!mapRef.current) return

    const width = mapRef.current.clientWidth || 800
    const height = mapRef.current.clientHeight || 600
    const centerLat = 9.0249
    const centerLng = 38.7469
    const zoom = 0.01

    // Create SVG map
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.style.background = '#f3f4f6'

    // Convert lat/lng to pixel coordinates
    const latLngToPixel = (lat: number, lng: number) => {
      const x = ((lng - centerLng) / zoom + 0.5) * width
      const y = ((centerLat - lat) / zoom + 0.5) * height // Invert Y axis
      return { x, y }
    }

    // Draw roads with traffic colors
    mockRoads.forEach((road) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
      const points = road.coordinates
        .map((coord) => {
          const { x, y } = latLngToPixel(coord.lat, coord.lng)
          return `${x},${y}`
        })
        .join(' ')

      const color = road.congestion === 'high' ? '#ef4444' : 
                   road.congestion === 'medium' ? '#eab308' : '#22c55e'
      const strokeWidth = road.congestion === 'high' ? '5' : 
                          road.congestion === 'medium' ? '4' : '3'

      path.setAttribute('points', points)
      path.setAttribute('stroke', color)
      path.setAttribute('stroke-width', strokeWidth)
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('stroke-linejoin', 'round')
      path.setAttribute('fill', 'none')
      path.setAttribute('opacity', '0.8')
      path.setAttribute('data-road-name', road.name)

      svg.appendChild(path)

      // Add road label
      if (road.coordinates.length > 0) {
        const midPoint = road.coordinates[Math.floor(road.coordinates.length / 2)]
        const { x, y } = latLngToPixel(midPoint.lat, midPoint.lng)
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', x.toString())
        text.setAttribute('y', (y - 5).toString())
        text.setAttribute('font-size', '10')
        text.setAttribute('fill', '#000')
        text.setAttribute('font-weight', '500')
        text.textContent = road.name
        svg.appendChild(text)
      }
    })

    // Draw incident markers
    incidents.forEach((incident) => {
      const { x, y } = latLngToPixel(incident.latitude, incident.longitude)

      const severityColor = 
        incident.severity === 'major' ? '#ef4444' :
        incident.severity === 'medium' ? '#eab308' : '#22c55e'

      // Draw marker circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', x.toString())
      circle.setAttribute('cy', y.toString())
      circle.setAttribute('r', '10')
      circle.setAttribute('fill', severityColor)
      circle.setAttribute('stroke', '#000')
      circle.setAttribute('stroke-width', '2')
      circle.setAttribute('opacity', '0.9')
      circle.style.cursor = 'pointer'
      circle.setAttribute('data-incident-id', incident.id.toString())

      circle.addEventListener('click', () => {
        const info = `
          ${incident.incidentType}
          Severity: ${incident.severity}
          
          ${incident.description}
          
          Location: ${incident.locationDescription || 'Unknown'}
          ${incident.isVerified ? '✓ Verified' : ''}
        `
        alert(info)
      })

      svg.appendChild(circle)

      // Draw marker pin
      const pin = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      const pinPoints = `${x},${y + 10} ${x - 5},${y + 5} ${x + 5},${y + 5}`
      pin.setAttribute('points', pinPoints)
      pin.setAttribute('fill', severityColor)
      pin.setAttribute('stroke', '#000')
      pin.setAttribute('stroke-width', '1')
      svg.appendChild(pin)
    })

    mapRef.current.innerHTML = ''
    mapRef.current.appendChild(svg)
  }

  return (
    <div className="relative w-full h-[600px] border border-gray-300 rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Route suggestion overlay */}
      {currentRoute && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded shadow-lg border border-gray-200 max-w-sm z-10">
          <p className="text-sm font-semibold mb-2">⚠️ Alternate Route Available</p>
          <p className="text-xs text-gray-600 mb-2">{currentRoute.message}</p>
          {currentRoute.suggestions && (
            <ul className="text-xs space-y-2">
              {currentRoute.suggestions.map((sug: any, idx: number) => (
                <li key={idx} className="border-l-2 border-yellow-500 pl-2">
                  <strong>{sug.from}</strong> → <strong>{sug.route}</strong>
                  <br />
                  <span className="text-gray-500">{sug.reason}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setCurrentRoute(null)}
            className="mt-2 text-xs text-gray-600 hover:text-black underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg border border-gray-200 text-xs z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span>High Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-yellow-500"></div>
            <span>Medium Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span>Low Congestion</span>
          </div>
        </div>
      </div>
    </div>
  )
}
