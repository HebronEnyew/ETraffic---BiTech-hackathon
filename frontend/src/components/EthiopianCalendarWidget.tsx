'use client'

import { useState, useEffect } from 'react'
import { 
  gregorianToEthiopian, 
  getCurrentEthiopianDate,
  getEthiopianCalendarGrid,
  ETHIOPIAN_MONTHS_AM,
  ETHIOPIAN_MONTHS_EN,
  ETHIOPIAN_DAYS_AM,
  ETHIOPIAN_DAYS_EN,
  EthiopianDate 
} from '@/lib/ethiopianCalendar'
import { useLanguage } from '@/app/providers'
import { api } from '@/lib/api'

/**
 * Compact Ethiopian Calendar Widget
 * Phone-style calendar with Amharic support, 30 days per month, year selector
 */
export default function EthiopianCalendarWidget() {
  const [currentEthDate, setCurrentEthDate] = useState<EthiopianDate | null>(null)
  const [selectedDate, setSelectedDate] = useState<EthiopianDate | null>(null)
  const [calendarGrid, setCalendarGrid] = useState<(EthiopianDate | null)[][]>([])
  const [roadClosures, setRoadClosures] = useState<any[]>([])
  const [loadingClosures, setLoadingClosures] = useState(false)
  const [showYearSelector, setShowYearSelector] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const { language } = useLanguage()

  // Initialize current date on mount - ensure it always sets a date immediately
  useEffect(() => {
    // Always run initialization
    const now = new Date()
    let ethDate: EthiopianDate | null = null
    
    try {
      ethDate = getCurrentEthiopianDate()
      if (ethDate && ethDate.year && ethDate.month && ethDate.month >= 1 && ethDate.month <= 13) {
        setCurrentEthDate(ethDate)
        setHasInitialized(true)
        return
      }
    } catch (error) {
      console.error('Error getting current Ethiopian date:', error)
    }
    
    // Fallback: create a valid date synchronously
    const gregYear = now.getFullYear()
    const gregMonth = now.getMonth() + 1
    const gregDay = now.getDate()
    
    // Simple Ethiopian year calculation
    const ethYear = gregYear - 8
    let ethMonth = gregMonth >= 9 ? gregMonth - 8 : gregMonth + 4
    if (ethMonth < 1) {
      ethMonth = 13
    } else if (ethMonth > 13) {
      ethMonth = 13
    }
    
    const ethDay = Math.max(1, Math.min(30, gregDay))
    const dayOfWeek = now.getDay()
    
    const fallbackDate: EthiopianDate = {
      year: ethYear,
      month: ethMonth,
      day: ethDay,
      monthNameAm: ETHIOPIAN_MONTHS_AM[ethMonth - 1] || 'መስከረም',
      monthNameEn: ETHIOPIAN_MONTHS_EN[ethMonth - 1] || 'Meskerem',
      dayNameAm: ETHIOPIAN_DAYS_AM[dayOfWeek] || 'እሑድ',
      dayNameEn: ETHIOPIAN_DAYS_EN[dayOfWeek] || 'Sunday',
      isHoliday: false,
    }
    
    setCurrentEthDate(fallbackDate)
    setHasInitialized(true)
  }, []) // Empty dependency array - only run once on mount

  // Generate year options (10 years back to current year)
  const currentYear = currentEthDate?.year || 2016
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i)

  useEffect(() => {
    if (currentEthDate && currentEthDate.year && currentEthDate.month) {
      updateCalendar()
    }
  }, [currentEthDate?.year, currentEthDate?.month])

  useEffect(() => {
    if (selectedDate) {
      // Fetch road closures whenever a date is selected
      fetchRoadClosures(selectedDate)
    } else {
      // Clear closures when no date is selected
      setRoadClosures([])
    }
  }, [selectedDate])

  const updateCalendar = () => {
    if (!currentEthDate || !currentEthDate.year || !currentEthDate.month) {
      console.warn('Cannot update calendar: missing date', currentEthDate)
      return
    }
    try {
      const grid = getEthiopianCalendarGrid(currentEthDate.year, currentEthDate.month)
      if (grid && Array.isArray(grid) && grid.length > 0) {
        setCalendarGrid(grid)
      } else {
        console.warn('Calendar grid is empty or invalid, generating fallback grid')
        // Generate a simple fallback grid
        const daysInMonth = currentEthDate.month === 13 ? 6 : 30
        const fallbackGrid: (EthiopianDate | null)[][] = []
        let week: (EthiopianDate | null)[] = []
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dayOfWeek = (day - 1) % 7
          week.push({
            year: currentEthDate.year,
            month: currentEthDate.month,
            day: day,
            monthNameAm: ETHIOPIAN_MONTHS_AM[currentEthDate.month - 1] || 'መስከረም',
            monthNameEn: ETHIOPIAN_MONTHS_EN[currentEthDate.month - 1] || 'Meskerem',
            dayNameAm: ETHIOPIAN_DAYS_AM[dayOfWeek] || 'እሑድ',
            dayNameEn: ETHIOPIAN_DAYS_EN[dayOfWeek] || 'Sunday',
            isHoliday: false,
          })
          if (week.length === 7) {
            fallbackGrid.push(week)
            week = []
          }
        }
        if (week.length > 0) {
          while (week.length < 7) week.push(null)
          fallbackGrid.push(week)
        }
        setCalendarGrid(fallbackGrid)
      }
    } catch (error) {
      console.error('Error updating calendar:', error)
      // Generate simple fallback
      const daysInMonth = currentEthDate.month === 13 ? 6 : 30
      const fallbackGrid: (EthiopianDate | null)[][] = []
      let week: (EthiopianDate | null)[] = []
      for (let day = 1; day <= daysInMonth; day++) {
        week.push({
          year: currentEthDate.year,
          month: currentEthDate.month,
          day: day,
          monthNameAm: ETHIOPIAN_MONTHS_AM[currentEthDate.month - 1] || 'መስከረም',
          monthNameEn: ETHIOPIAN_MONTHS_EN[currentEthDate.month - 1] || 'Meskerem',
          dayNameAm: ETHIOPIAN_DAYS_AM[day % 7] || 'እሑድ',
          dayNameEn: ETHIOPIAN_DAYS_EN[day % 7] || 'Sunday',
          isHoliday: false,
        })
        if (week.length === 7) {
          fallbackGrid.push(week)
          week = []
        }
      }
      if (week.length > 0) {
        while (week.length < 7) week.push(null)
        fallbackGrid.push(week)
      }
      setCalendarGrid(fallbackGrid)
    }
  }

  const fetchRoadClosures = async (date: EthiopianDate) => {
    // Always fetch closures for selected dates (holiday or not)
    setLoadingClosures(true)
    try {
      // Import ethiopianToGregorian for proper conversion
      const { ethiopianToGregorian } = await import('@/lib/ethiopianCalendar')
      
      // Convert Ethiopian date to Gregorian for API call
      const gregDate = ethiopianToGregorian(date.year, date.month, date.day)
      const dateStr = gregDate.toISOString().split('T')[0]
      
      try {
        // Fetch events with closures from database and Google Calendar
        const [eventsResponse, googleEventsResponse] = await Promise.all([
          api.getEventsForDate(dateStr).catch(() => ({ data: { events: [] } })),
          api.getEventsWithClosures(dateStr, dateStr).catch(() => ({ data: { events: [] } })),
        ])
        
        const dbEvents = eventsResponse.data?.events || []
        const calendarEvents = googleEventsResponse.data?.events || []
        
        // Extract all affected roads from both sources
        const closures: string[] = []
        
        // From database events
        dbEvents.forEach((event: any) => {
          if (event.affectedRoads && Array.isArray(event.affectedRoads)) {
            closures.push(...event.affectedRoads)
          } else if (typeof event.affectedRoads === 'string') {
            closures.push(event.affectedRoads)
          }
        })
        
        // From Google Calendar events
        calendarEvents.forEach((event: any) => {
          if (event.affectedRoads && Array.isArray(event.affectedRoads)) {
            closures.push(...event.affectedRoads)
          } else if (typeof event.affectedRoads === 'string') {
            closures.push(event.affectedRoads)
          }
        })
        
        // Remove duplicates
        const uniqueClosures = Array.from(new Set(closures))
        
        if (uniqueClosures.length > 0) {
          setRoadClosures(uniqueClosures.map(road => ({ roadName: road })))
          return
        }
      } catch (apiError) {
        console.warn('Error fetching events from API:', apiError)
      }
      
      // Fallback: Show typical closures for known holidays
      if (date.isHoliday) {
        const holidayClosures: Record<string, string[]> = {
          'እንቁጣጣሽ': ['Meskel Square', 'Adwa Avenue', 'Ras Abebe Aregay Street'],
          'መስቀል': ['Meskel Square', 'Bole Road', 'Churchill Avenue'],
          'ፋሲካ': ['Various Church areas', 'St. George Cathedral area'],
          'ኢድ አል-ፊትር': ['Meskel Square', 'Bole Road'],
          'ኢድ አል-አድሃ': ['Meskel Square', 'Bole Road'],
        }
        
        const closures = holidayClosures[date.holidayName || ''] || []
        setRoadClosures(closures.map(road => ({ roadName: road })))
      } else {
        setRoadClosures([])
      }
    } catch (error) {
      console.error('Error fetching road closures:', error)
      setRoadClosures([])
    } finally {
      setLoadingClosures(false)
    }
  }

  const previousMonth = () => {
    if (!currentEthDate) return
    const newMonth = currentEthDate.month - 1
    if (newMonth < 1) {
      // Go to previous year, month 13 (Pagume)
      setCurrentEthDate({ 
        ...currentEthDate, 
        year: currentEthDate.year - 1, 
        month: 13,
        monthNameAm: ETHIOPIAN_MONTHS_AM[12], // Pagume is index 12
        monthNameEn: ETHIOPIAN_MONTHS_EN[12],
      })
    } else {
      setCurrentEthDate({ 
        ...currentEthDate, 
        month: newMonth,
        monthNameAm: ETHIOPIAN_MONTHS_AM[newMonth - 1],
        monthNameEn: ETHIOPIAN_MONTHS_EN[newMonth - 1],
      })
    }
  }

  const nextMonth = () => {
    if (!currentEthDate) return
    const newMonth = currentEthDate.month + 1
    if (newMonth > 13) {
      // Go to next year, month 1 (Meskerem)
      setCurrentEthDate({ 
        ...currentEthDate, 
        year: currentEthDate.year + 1, 
        month: 1,
        monthNameAm: ETHIOPIAN_MONTHS_AM[0], // Meskerem is index 0
        monthNameEn: ETHIOPIAN_MONTHS_EN[0],
      })
    } else {
      setCurrentEthDate({ 
        ...currentEthDate, 
        month: newMonth,
        monthNameAm: ETHIOPIAN_MONTHS_AM[newMonth - 1],
        monthNameEn: ETHIOPIAN_MONTHS_EN[newMonth - 1],
      })
    }
  }

  const goToToday = () => {
    try {
      const today = getCurrentEthiopianDate()
      setCurrentEthDate(today)
      setSelectedDate(today)
    } catch (error) {
      console.error('Error getting today date:', error)
    }
  }

  const selectYear = (year: number) => {
    if (!currentEthDate) return
    setCurrentEthDate({ ...currentEthDate, year })
    setShowYearSelector(false)
  }

  const isToday = (date: EthiopianDate | null): boolean => {
    if (!date) return false
    try {
      const today = getCurrentEthiopianDate()
      return (
        date.year === today.year &&
        date.month === today.month &&
        date.day === today.day
      )
    } catch {
      return false
    }
  }

  const isSelected = (date: EthiopianDate | null): boolean => {
    if (!date || !selectedDate) return false
    return (
      date.year === selectedDate.year &&
      date.month === selectedDate.month &&
      date.day === selectedDate.day
    )
  }

  const getHolidayColor = (date: EthiopianDate) => {
    // Different colors for different holidays
    if (!date.isHoliday) return ''
    
    const holidayColors: Record<string, string> = {
      'እንቁጣጣሽ': 'bg-red-100 border-red-400 text-red-800',
      'መስቀል': 'bg-purple-100 border-purple-400 text-purple-800',
      'ፋሲካ': 'bg-blue-100 border-blue-400 text-blue-800',
      'ኢድ አል-ፊትር': 'bg-green-100 border-green-400 text-green-800',
      'ኢድ አል-አድሃ': 'bg-green-100 border-green-400 text-green-800',
      'የዓድዋ ድል': 'bg-yellow-100 border-yellow-400 text-yellow-800',
      'የሠራተኞች ቀን': 'bg-orange-100 border-orange-400 text-orange-800',
    }
    
    return holidayColors[date.holidayName || ''] || 'bg-pink-100 border-pink-400 text-pink-800'
  }

  // Force initialization if main useEffect fails - backup timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInitialized || !currentEthDate || !currentEthDate.year || !currentEthDate.month) {
        console.log('Backup initialization triggered')
        const now = new Date()
        const ethYear = now.getFullYear() - 8
        const ethMonth = Math.max(1, Math.min(13, now.getMonth() >= 8 ? now.getMonth() - 7 : now.getMonth() + 5))
        const ethDay = Math.max(1, Math.min(30, now.getDate()))
        
        const fallbackDate: EthiopianDate = {
          year: ethYear,
          month: ethMonth,
          day: ethDay,
          monthNameAm: ETHIOPIAN_MONTHS_AM[ethMonth - 1] || 'መስከረም',
          monthNameEn: ETHIOPIAN_MONTHS_EN[ethMonth - 1] || 'Meskerem',
          dayNameAm: ETHIOPIAN_DAYS_AM[now.getDay()] || 'እሑድ',
          dayNameEn: ETHIOPIAN_DAYS_EN[now.getDay()] || 'Sunday',
          isHoliday: false,
        }
        
        setCurrentEthDate(fallbackDate)
        setHasInitialized(true)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [hasInitialized, currentEthDate])
  
  // Show loading only if we haven't initialized yet
  if (!hasInitialized || !currentEthDate || !currentEthDate.year || !currentEthDate.month) {
    return (
      <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-5 shadow-xl max-w-lg mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oxford-blue"></div>
          <span className="ml-3 text-oxford-blue">Loading calendar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-oxford-blue/20 rounded-xl p-5 shadow-xl max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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
          <div className="relative">
            <button
              onClick={() => setShowYearSelector(!showYearSelector)}
              className="text-xl font-bold text-oxford-blue text-center min-w-[200px] px-3 py-1 hover:bg-tan/20 rounded-lg transition-colors"
            >
              {currentEthDate.monthNameAm} {currentEthDate.year}
            </button>
            {showYearSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border-2 border-oxford-blue/30 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => selectYear(year)}
                    className={`w-full text-left px-4 py-2 hover:bg-tan/20 transition-colors ${
                      year === currentEthDate.year ? 'bg-oxford-blue text-white' : 'text-oxford-blue'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
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
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-oxford-blue text-white rounded-lg hover:bg-[#003366] transition-colors text-sm font-medium"
        >
          {language === 'am' ? 'ዛሬ' : 'Today'}
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {ETHIOPIAN_DAYS_AM.map((day, idx) => (
          <div key={idx} className="text-center text-sm font-semibold text-oxford-blue/70 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarGrid.length === 0 ? (
          // Show placeholder grid while loading
          Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="aspect-square p-1.5 rounded-lg border-2 border-gray-100 bg-gray-50"></div>
          ))
        ) : (
          calendarGrid.map((week, weekIdx) =>
            week.map((date, dayIdx) => {
              if (!date) {
                return (
                  <div key={`${weekIdx}-${dayIdx}`} className="aspect-square" />
                )
              }

              const holidayColor = date.isHoliday ? getHolidayColor(date) : ''
              
              return (
                <button
                  key={`${weekIdx}-${dayIdx}`}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square p-1.5 rounded-lg border-2 transition-all text-sm font-medium
                    ${isToday(date)
                      ? 'bg-oxford-blue text-white border-oxford-blue font-bold'
                      : isSelected(date)
                      ? 'bg-tan/40 border-oxford-blue text-oxford-blue font-bold shadow-md'
                      : date.isHoliday
                      ? `${holidayColor} hover:opacity-80`
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-tan/10 hover:border-tan'
                    }
                  `}
                  title={date.isHoliday ? date.holidayName : `${date.day} ${date.monthNameAm}`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={date.isHoliday ? 'font-bold' : ''}>{date.day}</span>
                    {date.isHoliday && (
                      <span className="text-[10px] opacity-90 mt-0.5">🎉</span>
                    )}
                  </div>
                </button>
              )
            })
          )
        )}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-5 pt-4 border-t border-oxford-blue/20">
          <div className="text-center mb-3">
            <div className="text-base font-semibold text-oxford-blue mb-1">
              {selectedDate.day} {selectedDate.monthNameAm} {selectedDate.year}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {selectedDate.dayNameAm}
            </div>
            {selectedDate.isHoliday && (
              <div className={`text-sm font-semibold ${getHolidayColor(selectedDate)} rounded px-3 py-2 inline-block mb-3`}>
                🎉 {selectedDate.holidayName}
              </div>
            )}
            {!selectedDate.isHoliday && (
              <div className="text-sm text-gray-500 mb-3">
                {language === 'am' ? 'መደበኛ ቀን' : 'Regular day'}
              </div>
            )}
          </div>

          {/* Road Closures - Show for all selected dates */}
          <div className="mt-4 pt-4 border-t border-oxford-blue/10">
            <div className="text-sm font-bold text-oxford-blue mb-2">
              {language === 'am' ? 'ዝጋ የሆኑ መንገዶች' : 'Closed Routes'}
            </div>
            {loadingClosures ? (
              <div className="text-xs text-gray-500 text-center py-2">
                {language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}
              </div>
            ) : roadClosures.length > 0 ? (
              <div className="space-y-2">
                {roadClosures.map((closure, idx) => (
                  <div
                    key={idx}
                    className="bg-red-50 border-2 border-red-200 rounded-lg p-2 text-xs text-red-800"
                  >
                    🚧 {closure.roadName}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                {language === 'am' ? 'ዝጋ የሆኑ መንገዶች የሉም' : 'No road closures'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today indicator */}
      <div className="mt-4 pt-3 border-t border-oxford-blue/10">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-oxford-blue bg-oxford-blue"></div>
            <span>{language === 'am' ? 'ዛሬ' : 'Today'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-red-400 bg-red-100"></div>
            <span>{language === 'am' ? 'በዓል' : 'Holiday'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
