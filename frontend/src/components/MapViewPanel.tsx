'use client'

import { useEffect, useRef } from 'react'

export default function MapViewPanel() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const width = mapRef.current.clientWidth || 200
    const height = mapRef.current.clientHeight || 192
    const centerLat = 9.0249
    const centerLng = 38.7469
    const zoom = 0.01

    // Create SVG mini map
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.style.background = '#f3f4f6'

    // Convert lat/lng to pixel coordinates
    const latLngToPixel = (lat: number, lng: number) => {
      const x = ((lng - centerLng) / zoom + 0.5) * width
      const y = ((centerLat - lat) / zoom + 0.5) * height
      return { x, y }
    }

    // Draw simplified roads
    const mockRoads = [
      {
        name: 'Bole Road',
        coordinates: [
          { lat: 9.0125, lng: 38.7561 },
          { lat: 9.0150, lng: 38.7570 },
          { lat: 9.0180, lng: 38.7580 },
        ],
        color: '#ef4444', // Red for high congestion
      },
      {
        name: 'Churchill Avenue',
        coordinates: [
          { lat: 9.0120, lng: 38.7555 },
          { lat: 9.0140, lng: 38.7565 },
        ],
        color: '#eab308', // Yellow for medium
      },
      {
        name: 'Africa Avenue',
        coordinates: [
          { lat: 9.0100, lng: 38.7500 },
          { lat: 9.0120, lng: 38.7520 },
        ],
        color: '#22c55e', // Green for low
      },
    ]

    mockRoads.forEach((road) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
      const points = road.coordinates
        .map((coord) => {
          const { x, y } = latLngToPixel(coord.lat, coord.lng)
          return `${x},${y}`
        })
        .join(' ')

      path.setAttribute('points', points)
      path.setAttribute('stroke', road.color)
      path.setAttribute('stroke-width', '2')
      path.setAttribute('fill', 'none')
      path.setAttribute('opacity', '0.8')
      svg.appendChild(path)
    })

    mapRef.current.innerHTML = ''
    mapRef.current.appendChild(svg)
  }, [])

  return (
    <div className="w-full h-48 border border-gray-300 rounded overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
