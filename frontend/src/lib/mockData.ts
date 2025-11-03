/**
 * Expanded Mock Data
 * Many locations, routes, and incidents for development and testing
 */

export interface MockLocation {
  id: string
  name: string
  nameAm: string
  latitude: number
  longitude: number
}

export interface MockRoute {
  id: string
  from: string
  to: string
  coordinates: Array<{ lat: number; lng: number }>
  congestion: 'high' | 'medium' | 'low'
  distance: number // in km
  duration: number // in minutes
  alternateRoutes?: string[]
}

export interface MockIncident {
  id: string
  type: 'major_accident' | 'heavy_congestion' | 'road_construction'
  latitude: number
  longitude: number
  locationDescription: string
  severity: 'minor' | 'medium' | 'major'
  description: string
  isVerified: boolean
  createdAt: string
}

// Expanded locations in Addis Ababa (20+ locations)
export const mockLocations: MockLocation[] = [
  { id: '1', name: 'Bole Road', nameAm: 'የቦሌ መንገድ', latitude: 9.0125, longitude: 38.7561 },
  { id: '2', name: 'Churchill Avenue', nameAm: 'ቻርቺል አቨኑ', latitude: 9.0120, longitude: 38.7555 },
  { id: '3', name: 'Africa Avenue', nameAm: 'የአፍሪካ አቨኑ', latitude: 9.0100, longitude: 38.7500 },
  { id: '4', name: 'Kazanchis', nameAm: 'ካዛንቺስ', latitude: 9.0125, longitude: 38.7561 },
  { id: '5', name: 'Wollo Sefer', nameAm: 'ወሎ ሰፈር', latitude: 9.0300, longitude: 38.7600 },
  { id: '6', name: 'Meskel Square', nameAm: 'መስቀል አደባባይ', latitude: 9.0130, longitude: 38.7550 },
  { id: '7', name: 'Ras Abebe Aregay Street', nameAm: 'ራስ አበበ አረጋይ ወደብ', latitude: 9.0130, longitude: 38.7550 },
  { id: '8', name: 'Ras Mekonnen Avenue', nameAm: 'ራስ መኮንን አቨኑ', latitude: 9.0110, longitude: 38.7540 },
  { id: '9', name: 'Arat Kilo', nameAm: 'አራት ኪሎ', latitude: 9.0200, longitude: 38.7500 },
  { id: '10', name: 'Piazza', nameAm: 'ፒያዛ', latitude: 9.0150, longitude: 38.7450 },
  { id: '11', name: 'Mexico Square', nameAm: 'ሜክሲኮ አደባባይ', latitude: 9.0180, longitude: 38.7400 },
  { id: '12', name: 'Bole International Airport', nameAm: 'የቦሌ ዓለም አቀፍ የአየር ማረፊያ', latitude: 8.9975, longitude: 38.7994 },
  { id: '13', name: 'CMC Area', nameAm: 'ሲ.ኤም.ሲ አካባቢ', latitude: 9.0050, longitude: 38.7600 },
  { id: '14', name: 'Lideta', nameAm: 'ልደታ', latitude: 9.0080, longitude: 38.7350 },
  { id: '15', name: 'Merkato', nameAm: 'መርካቶ', latitude: 9.0050, longitude: 38.7250 },
  { id: '16', name: 'Addis Ababa Stadium', nameAm: 'አዲስ አበባ ስታዲየም', latitude: 9.0085, longitude: 38.7580 },
  { id: '17', name: '4 Kilo', nameAm: 'አራት ኪሎ', latitude: 9.0250, longitude: 38.7520 },
  { id: '18', name: 'Sar Bet', nameAm: 'ሳር ቤት', latitude: 9.0350, longitude: 38.7650 },
  { id: '19', name: 'Gotera', nameAm: 'ጎተራ', latitude: 9.0400, longitude: 38.7700 },
  { id: '20', name: 'Megenagna', nameAm: 'መገናኛ', latitude: 9.0500, longitude: 38.7750 },
  { id: '21', name: 'Ayat', nameAm: 'አያት', latitude: 9.0650, longitude: 38.7850 },
  { id: '22', name: 'Sarbet', nameAm: 'ሳርቤት', latitude: 9.0370, longitude: 38.7670 },
  { id: '23', name: 'Bole Bulbula', nameAm: 'ቦሌ ቡልቡላ', latitude: 9.0480, longitude: 38.7800 },
  { id: '24', name: 'Summit', nameAm: 'ሳምሚት', latitude: 9.0550, longitude: 38.7880 },
]

// Many routes between locations
export const mockRoutes: MockRoute[] = [
  {
    id: 'r1',
    from: 'Bole International Airport',
    to: 'Kazanchis',
    coordinates: [
      { lat: 8.9975, lng: 38.7994 },
      { lat: 9.0050, lng: 38.7900 },
      { lat: 9.0100, lng: 38.7800 },
      { lat: 9.0125, lng: 38.7561 },
    ],
    congestion: 'high',
    distance: 8.5,
    duration: 25,
    alternateRoutes: ['Via CMC', 'Via Ras Mekonnen Avenue'],
  },
  {
    id: 'r2',
    from: 'Kazanchis',
    to: 'Wollo Sefer',
    coordinates: [
      { lat: 9.0125, lng: 38.7561 },
      { lat: 9.0150, lng: 38.7570 },
      { lat: 9.0200, lng: 38.7580 },
      { lat: 9.0250, lng: 38.7590 },
      { lat: 9.0300, lng: 38.7600 },
    ],
    congestion: 'medium',
    distance: 3.2,
    duration: 12,
    alternateRoutes: ['Via Churchill Avenue'],
  },
  {
    id: 'r3',
    from: 'Meskel Square',
    to: 'Arat Kilo',
    coordinates: [
      { lat: 9.0130, lng: 38.7550 },
      { lat: 9.0150, lng: 38.7530 },
      { lat: 9.0170, lng: 38.7510 },
      { lat: 9.0200, lng: 38.7500 },
    ],
    congestion: 'low',
    distance: 2.1,
    duration: 8,
    alternateRoutes: ['Via Africa Avenue'],
  },
  {
    id: 'r4',
    from: 'Piazza',
    to: 'Merkato',
    coordinates: [
      { lat: 9.0150, lng: 38.7450 },
      { lat: 9.0120, lng: 38.7400 },
      { lat: 9.0080, lng: 38.7300 },
      { lat: 9.0050, lng: 38.7250 },
    ],
    congestion: 'high',
    distance: 3.5,
    duration: 18,
    alternateRoutes: ['Via Lideta'],
  },
  {
    id: 'r5',
    from: 'Mexico Square',
    to: 'CMC Area',
    coordinates: [
      { lat: 9.0180, lng: 38.7400 },
      { lat: 9.0150, lng: 38.7450 },
      { lat: 9.0120, lng: 38.7500 },
      { lat: 9.0080, lng: 38.7550 },
      { lat: 9.0050, lng: 38.7600 },
    ],
    congestion: 'medium',
    distance: 4.2,
    duration: 15,
    alternateRoutes: ['Via Churchill Avenue'],
  },
]

// Many incidents for testing
export const mockIncidents: MockIncident[] = [
  {
    id: 'i1',
    type: 'heavy_congestion',
    latitude: 9.0125,
    longitude: 38.7561,
    locationDescription: 'Bole Road near Kazanchis',
    severity: 'major',
    description: 'Heavy traffic due to construction work. Multiple lanes blocked.',
    isVerified: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'i2',
    type: 'major_accident',
    latitude: 9.0300,
    longitude: 38.7600,
    locationDescription: 'Near Wollo Sefer',
    severity: 'major',
    description: 'Two vehicle accident blocking right lane. Emergency services on scene.',
    isVerified: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'i3',
    type: 'road_construction',
    latitude: 9.0100,
    longitude: 38.7500,
    locationDescription: 'Africa Avenue',
    severity: 'minor',
    description: 'Road construction reducing lanes. Expect delays.',
    isVerified: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'i4',
    type: 'heavy_congestion',
    latitude: 9.0130,
    longitude: 38.7550,
    locationDescription: 'Ras Abebe Aregay Street',
    severity: 'major',
    description: 'Severe congestion due to event at Meskel Square.',
    isVerified: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'i5',
    type: 'major_accident',
    latitude: 9.0150,
    longitude: 38.7450,
    locationDescription: 'Piazza intersection',
    severity: 'major',
    description: 'Multi-vehicle collision. Avoid area if possible.',
    isVerified: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'i6',
    type: 'road_construction',
    latitude: 9.0200,
    longitude: 38.7500,
    locationDescription: 'Arat Kilo',
    severity: 'medium',
    description: 'Road maintenance in progress. One lane closed.',
    isVerified: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'i7',
    type: 'heavy_congestion',
    latitude: 9.0050,
    longitude: 38.7250,
    locationDescription: 'Merkato area',
    severity: 'high',
    description: 'Heavy traffic during peak hours. Slow moving traffic.',
    isVerified: false,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'i8',
    type: 'major_accident',
    latitude: 8.9975,
    longitude: 38.7994,
    locationDescription: 'Airport Road',
    severity: 'major',
    description: 'Accident blocking airport exit. Use alternative route.',
    isVerified: true,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
]

// Get route between two locations
export function getRoute(from: string, to: string): MockRoute | null {
  const route = mockRoutes.find(
    (r) =>
      (r.from === from && r.to === to) || (r.from === to && r.to === from)
  )
  return route || null
}

// Get all routes from a location
export function getRoutesFrom(location: string): MockRoute[] {
  return mockRoutes.filter((r) => r.from === location || r.to === location)
}

// Get incidents near a location
export function getIncidentsNear(
  lat: number,
  lng: number,
  radiusKm: number = 5
): MockIncident[] {
  return mockIncidents.filter((incident) => {
    const distance = calculateDistance(
      lat,
      lng,
      incident.latitude,
      incident.longitude
    )
    return distance <= radiusKm
  })
}

// Calculate distance between two coordinates in km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

