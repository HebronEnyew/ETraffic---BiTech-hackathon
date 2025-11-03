'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

/**
 * Beautiful Interactive Calendar Component
 * Displays events from database with modern UI
 */
export default function CalendarView() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [currentMonth])

  useEffect(() => {
    if (selectedDate) {
      fetchEventsForDate(selectedDate)
    }
  }, [selectedDate])

  const fetchEvents = async () => {
    try {
      setError(null)
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const response = await api.getEvents(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      )
      setEvents(response.data || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching events:', error)
      setError('Failed to load calendar events')
      setLoading(false)
    }
  }

  const fetchEventsForDate = async (date: string) => {
    try {
      const response = await api.getEventsForDate(date)
      setSelectedEvents(response.data)
    } catch (error) {
      console.error('Error fetching events for date:', error)
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    setSelectedDate(dateStr)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return events.filter((e) => e.eventDate === dateStr)
  }

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      holiday: 'bg-blue-100 text-blue-800 border-blue-300',
      cultural_ceremony: 'bg-purple-100 text-purple-800 border-purple-300',
      road_closure: 'bg-red-100 text-red-800 border-red-300',
      scheduled_event: 'bg-green-100 text-green-800 border-green-300',
    }
    return colors[eventType] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oxford-blue mx-auto"></div>
          <p className="mt-4 text-oxford-blue">Loading calendar...</p>
        </div>
      </div>
    )
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date()
  const isToday = (date: Date | null) => {
    if (!date) return false
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-oxford-blue">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-tan/20 rounded-lg transition-colors"
              title="Previous month"
            >
              <svg className="w-5 h-5 text-oxford-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-oxford-blue text-white rounded-lg hover:bg-[#003366] transition-colors text-sm font-medium"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-tan/20 rounded-lg transition-colors"
              title="Next month"
            >
              <svg className="w-5 h-5 text-oxford-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Day names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-oxford-blue py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            const dateEvents = date ? getEventsForDate(date) : []
            const selected = date && selectedDate === date.toISOString().split('T')[0]

            return (
              <button
                key={idx}
                onClick={() => date && handleDateClick(date)}
                disabled={!date}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all text-sm
                  ${!date ? 'opacity-0 cursor-default' : ''}
                  ${isToday(date) && !selected
                    ? 'bg-tan/20 border-oxford-blue font-bold text-oxford-blue'
                    : selected
                    ? 'bg-oxford-blue text-white border-oxford-blue font-bold'
                    : dateEvents.length > 0
                    ? 'bg-tan/10 border-tan hover:bg-tan/20 text-oxford-blue'
                    : 'bg-white border-gray-200 hover:border-tan hover:bg-tan/5 text-gray-700'
                  }
                `}
                title={dateEvents.map((e) => e.nameEn).join(', ') || (date ? date.toLocaleDateString() : '')}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{date ? date.getDate() : ''}</span>
                  {dateEvents.length > 0 && (
                    <div className="mt-1 flex gap-1 justify-center">
                      {dateEvents.slice(0, 3).map((event, eIdx) => (
                        <div
                          key={eIdx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            selected ? 'bg-white' : 'bg-oxford-blue'
                          }`}
                        />
                      ))}
                      {dateEvents.length > 3 && (
                        <span className={`text-xs ${selected ? 'text-white' : 'text-oxford-blue'}`}>
                          +{dateEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Events & Road Closures */}
      {selectedDate && selectedEvents && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-oxford-blue">
              Events for {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {selectedEvents.events?.length > 0 ? (
              <div className="space-y-4 mb-6">
                {selectedEvents.events.map((event: any) => (
                  <div
                    key={event.id}
                    className={`p-4 border-2 rounded-lg ${getEventTypeColor(event.eventType)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">{event.nameEn}</h4>
                        {event.nameAm && (
                          <p className="text-sm opacity-75 mb-2">{event.nameAm}</p>
                        )}
                        {event.descriptionEn && (
                          <p className="text-sm mt-2">{event.descriptionEn}</p>
                        )}
                        {event.affectedArea && (
                          <p className="text-xs mt-2 opacity-75">
                            📍 Affected Area: {event.affectedArea}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mb-6">No events scheduled for this date</p>
            )}

            {selectedEvents.roadClosures?.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-3 text-oxford-blue">Road Closures</h4>
                <ul className="space-y-3">
                  {selectedEvents.roadClosures.map((closure: any) => (
                    <li
                      key={closure.id}
                      className="p-4 bg-red-50 border-2 border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-red-900 mb-1">{closure.roadName}</p>
                          <p className="text-sm text-red-700">
                            🕐 {new Date(closure.closureStart).toLocaleString()} -{' '}
                            {new Date(closure.closureEnd).toLocaleString()}
                          </p>
                          {closure.alternateRouteDescription && (
                            <p className="text-sm text-red-600 mt-2">
                              🔀 Alternate Route: {closure.alternateRouteDescription}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-red-200 text-red-900 text-xs font-semibold rounded">
                          CLOSED
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No date selected message */}
      {!selectedDate && (
        <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-8 text-center shadow-xl">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-gray-600">Select a date to view events and road closures</p>
        </div>
      )}
    </div>
  )
}
