'use client'

import { useLanguage } from '@/app/providers'

interface IncidentSummaryProps {
  incidents: any[]
  fromLocation?: string
  toLocation?: string
  incidentTypeFilter: string
  setIncidentTypeFilter: (type: string) => void
  loading?: boolean
}

/**
 * IncidentSummary Component
 * Modern design with Type Breakdown cards, filtering, and incident list
 */
export default function IncidentSummary({
  incidents,
  fromLocation,
  toLocation,
  incidentTypeFilter,
  setIncidentTypeFilter,
  loading = false,
}: IncidentSummaryProps) {
  const { t } = useLanguage()

  // Filter only active incidents
  const activeIncidents = incidents.filter((inc) => !inc.status || inc.status === 'active')
  const totalActive = activeIncidents.length

  // Get incident type breakdown
  const typeBreakdown = activeIncidents.reduce(
    (acc, inc) => {
      const type = inc.incidentType || inc.incident_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Incident type configurations with colors and icons
  const incidentTypeConfig: Record<string, { name: string; color: string; bgColor: string; icon: string }> = {
    heavy_congestion: {
      name: 'Heavy Congestion',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      icon: '🚗',
    },
    major_accident: {
      name: 'Major Accident',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      icon: '⚠️',
    },
    road_construction: {
      name: 'Road Construction',
      color: 'text-orange-800',
      bgColor: 'bg-orange-100',
      icon: '🚧',
    },
    flooding: {
      name: 'Flooding',
      color: 'text-blue-800',
      bgColor: 'bg-blue-100',
      icon: '🌊',
    },
    traffic_light_failure: {
      name: 'Traffic Light Failure',
      color: 'text-purple-800',
      bgColor: 'bg-purple-100',
      icon: '🚦',
    },
  }

  const getTypeConfig = (type: string) => {
    return incidentTypeConfig[type] || {
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
      icon: '📍',
    }
  }

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue font-medium">Loading incidents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-white">
      <h2 className="text-2xl font-bold mb-6 text-oxford-blue">{t('incidents.summary')}</h2>

      {/* Location Filter Info */}
      {(fromLocation || toLocation) && (
        <div className="mb-6 p-4 bg-oxford-blue/10 rounded-xl border-2 border-oxford-blue/20">
          <p className="text-sm font-semibold text-oxford-blue mb-2">Filtered By Location:</p>
          {fromLocation && (
            <p className="text-sm text-oxford-blue/80 mb-1">
              <span className="font-medium">From:</span> {fromLocation}
            </p>
          )}
          {toLocation && (
            <p className="text-sm text-oxford-blue/80">
              <span className="font-medium">To:</span> {toLocation}
            </p>
          )}
        </div>
      )}

      {/* Type Filter Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-oxford-blue mb-2">
          {t('incidents.filterByType')}
        </label>
        <select
          value={incidentTypeFilter}
          onChange={(e) => setIncidentTypeFilter(e.target.value)}
          className="w-full border-2 border-oxford-blue/30 rounded-xl px-4 py-3 text-oxford-blue 
                   focus:outline-none focus:ring-4 focus:ring-tan focus:border-oxford-blue 
                   transition-all bg-white shadow-md hover:shadow-lg font-medium"
        >
          <option value="all">{t('incidents.allTypes')}</option>
          <option value="major_accident">{t('incidents.majorAccident')}</option>
          <option value="heavy_congestion">{t('incidents.heavyCongestion')}</option>
          <option value="road_construction">{t('incidents.roadConstruction')}</option>
          <option value="flooding">{t('incidents.flooding')}</option>
          <option value="traffic_light_failure">{t('incidents.trafficLightFailure')}</option>
        </select>
      </div>

      {/* Total Active Incidents */}
      <div className="mb-6 p-5 bg-gradient-to-r from-oxford-blue to-[#003366] rounded-xl shadow-lg text-white">
        <p className="text-sm opacity-90 mb-1">Total Active Incidents</p>
        <p className="text-4xl font-bold">{totalActive}</p>
      </div>

      {/* Type Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-oxford-blue mb-4">{t('incidents.typeBreakdown')}</h3>
        <div className="space-y-3">
          {Object.entries(typeBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const config = getTypeConfig(type)
              return (
                <div
                  key={type}
                  className={`p-4 rounded-xl border-2 border-oxford-blue/20 shadow-md hover:shadow-xl 
                            transition-all transform hover:scale-[1.02] cursor-pointer
                            ${config.bgColor} ${config.color}`}
                  onClick={() => setIncidentTypeFilter(type)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <p className="font-bold text-base">{config.name}</p>
                        <p className="text-xs opacity-75">
                          {type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs opacity-75">incidents</p>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
        {Object.keys(typeBreakdown).length === 0 && (
          <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No incidents found</p>
          </div>
        )}
      </div>

      {/* Incident List */}
      {activeIncidents.length > 0 && (
        <div className="border-t-2 border-oxford-blue/20 pt-6">
          <h3 className="text-lg font-bold text-oxford-blue mb-4">Recent Incidents</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeIncidents.slice(0, 20).map((incident) => {
              const type = incident.incidentType || incident.incident_type || 'unknown'
              const config = getTypeConfig(type)
              const severityColor =
                incident.severity === 'major'
                  ? 'bg-red-500'
                  : incident.severity === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'

              return (
                <div
                  key={incident.id}
                  className="p-4 bg-white border-2 border-oxford-blue/10 rounded-xl 
                           hover:border-oxford-blue/30 hover:shadow-lg transition-all
                           cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${config.bgColor} ${config.color}`}>
                          {config.name}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${severityColor}`}></div>
                      </div>
                      <p className="font-semibold text-sm text-oxford-blue mb-1">
                        {incident.locationDescription || incident.location_description || 'Unknown Location'}
                      </p>
                      <p className="text-xs text-oxford-blue/70 line-clamp-2">
                        {incident.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`px-2 py-1 rounded ${severityColor} text-white font-medium`}>
                          {incident.severity || 'medium'}
                        </span>
                        {incident.isVerified || incident.is_verified ? (
                          <span className="text-green-600 font-medium">✓ Verified</span>
                        ) : (
                          <span className="text-gray-500">Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeIncidents.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No active incidents</p>
          <p className="text-sm text-gray-400 mt-1">All clear in this area!</p>
        </div>
      )}
    </div>
  )
}
