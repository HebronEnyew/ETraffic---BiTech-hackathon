'use client'

interface ActiveIncidentsProps {
  incidents: any[]
}

export default function ActiveIncidents({ incidents }: ActiveIncidentsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'minor':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'major_accident':
        return 'Major Accident'
      case 'heavy_congestion':
        return 'Heavy Congestion'
      case 'road_construction':
        return 'Road Construction'
      default:
        return type
    }
  }

  const categorizedIncidents = {
    major_accident: incidents.filter((i) => i.incidentType === 'major_accident'),
    heavy_congestion: incidents.filter((i) => i.incidentType === 'heavy_congestion'),
    road_construction: incidents.filter((i) => i.incidentType === 'road_construction'),
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Active Incidents</h2>
      
      <div className="space-y-4">
        {Object.entries(categorizedIncidents).map(([category, categoryIncidents]) => (
          <div key={category} className="border-b border-gray-200 pb-4 last:border-0">
            <h3 className="font-semibold mb-2">{getIncidentTypeLabel(category)}</h3>
            {categoryIncidents.length === 0 ? (
              <p className="text-sm text-gray-500">No active incidents</p>
            ) : (
              <ul className="space-y-2">
                {categoryIncidents.slice(0, 5).map((incident) => (
                  <li key={incident.id} className="flex items-start justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{incident.locationDescription || 'Unknown location'}</p>
                      <p className="text-gray-600 text-xs">{incident.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                        {incident.isVerified && (
                          <span className="text-xs text-green-600">✓ Verified</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(incident.createdAt).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

