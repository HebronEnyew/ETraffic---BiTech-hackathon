'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function CalendarPanel() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await api.getEvents()
      setEvents(response.data)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.eventDate) >= new Date())
    .slice(0, 5)

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm mb-2">Upcoming Events</h3>
      {upcomingEvents.length === 0 ? (
        <p className="text-xs text-gray-500">No upcoming events</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {upcomingEvents.map((event) => (
            <li
              key={event.id}
              className="border-l-2 border-black pl-2 cursor-pointer hover:bg-gray-100"
              title={event.descriptionEn || event.nameEn}
            >
              <div className="font-medium">{event.nameEn}</div>
              <div className="text-gray-600">
                {new Date(event.eventDate).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

