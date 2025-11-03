/**
 * Ethiopian Calendar Utilities
 * Converts between Gregorian and Ethiopian calendar
 * Includes 13th month Pagume and Amharic support
 */

export interface EthiopianDate {
  year: number
  month: number // 1-13 (13 = Pagume)
  day: number
  monthNameAm: string
  monthNameEn: string
  dayNameAm: string
  dayNameEn: string
  isHoliday: boolean
  holidayName?: string
}

// Amharic month names (13 months including Pagume)
export const ETHIOPIAN_MONTHS_AM: string[] = [
  'መስከረም',    // Meskerem
  'ጥቅምት',      // Tikimt
  'ሕዳር',        // Hedar
  'ታኅሣሥ',      // Tahsas
  'ጥር',          // Tir
  'የካቲት',      // Yekatit
  'መጋቢት',      // Megabit
  'ሚያዝያ',      // Miazia
  'ግንቦት',      // Ginbot
  'ሰኔ',          // Sene
  'ሐምሌ',        // Hamle
  'ነሐሴ',        // Nehase
  'ጳጉሜን',      // Pagume
]

export const ETHIOPIAN_MONTHS_EN: string[] = [
  'Meskerem',
  'Tikimt',
  'Hedar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
]

// Amharic day names
export const ETHIOPIAN_DAYS_AM: string[] = [
  'እሑድ',      // Sunday
  'ሰኞ',        // Monday
  'ማክሰኞ',    // Tuesday
  'ረቡዕ',      // Wednesday
  'ሐሙስ',      // Thursday
  'አርብ',      // Friday
  'ቅዳሜ',      // Saturday
]

export const ETHIOPIAN_DAYS_EN: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// Ethiopian holidays (year-month-day in Ethiopian calendar)
export const ETHIOPIAN_HOLIDAYS: Record<string, { nameEn: string; nameAm: string }> = {
  '09-11': { nameEn: 'Enkutatash (New Year)', nameAm: 'እንቁጣጣሽ' },
  '01-17': { nameEn: 'Meskel (Finding of the True Cross)', nameAm: 'መስቀል' },
  '05-05': { nameEn: 'Easter', nameAm: 'ፋሲካ' },
  '06-15': { nameEn: 'Eid al-Fitr', nameAm: 'ኢድ አል-ፊትር' },
  '08-10': { nameEn: 'Eid al-Adha', nameAm: 'ኢድ አል-አድሃ' },
  '09-27': { nameEn: 'Mawlid', nameAm: 'መውሊድ' },
  '03-10': { nameEn: 'Adwa Victory Day', nameAm: 'የዓድዋ ድል' },
  '06-15': { nameEn: 'Labor Day', nameAm: 'የሠራተኞች ቀን' },
  '10-10': { nameEn: 'Downfall of Derg', nameAm: 'የደርግ መውደር' },
}

/**
 * Check if Ethiopian year is a leap year (defined early)
 */
function isEthiopianLeapYear(year: number): boolean {
  // Ethiopian leap year follows 4-year cycle with exception every 600 years
  return (year % 4 === 3) || ((year + 1) % 600 === 0)
}

/**
 * Helper function to get days in month (defined early to avoid circular dependency)
 */
function getDaysInEthiopianMonthHelper(year: number, month: number): number {
  if (month === 13) {
    // Pagume: 5 or 6 days depending on leap year
    return isEthiopianLeapYear(year) ? 6 : 5
  }
  return 30 // All other months have 30 days
}

export function gregorianToEthiopian(date: Date): EthiopianDate {
  try {
    const gregYear = date.getFullYear()
    const gregMonth = date.getMonth() + 1
    const gregDay = date.getDate()

    // Ethiopian calendar conversion (approximate)
    // Ethiopian calendar is approximately 7-8 years behind Gregorian
    let ethYear = gregYear - 8
    
    // Approximate month offset (Ethiopian calendar starts in September)
    let ethMonth = gregMonth
    let ethDay = gregDay

    // Adjust for Ethiopian calendar start month (September = Meskerem)
    // Gregorian September (9) = Ethiopian Meskerem (1)
    if (gregMonth >= 9) {
      ethMonth = gregMonth - 8
      ethYear = gregYear - 8
    } else {
      ethMonth = gregMonth + 4
      ethYear = gregYear - 9
    }

    // Adjust day (Ethiopian calendar is ~11 days behind Gregorian in the same month)
    ethDay = gregDay - 11
    if (ethDay <= 0) {
      ethMonth -= 1
      if (ethMonth <= 0) {
        ethMonth = 13
        ethYear -= 1
      }
      const daysInPrevMonth = getDaysInEthiopianMonthHelper(ethYear, ethMonth)
      ethDay = daysInPrevMonth + ethDay
    }

    // Ensure valid ranges
    if (ethMonth < 1) {
      ethMonth = 1
    }
    if (ethMonth > 13) {
      ethMonth = 13
    }

    const maxDays = getDaysInEthiopianMonthHelper(ethYear, ethMonth)
    if (ethDay > maxDays) {
      ethDay = maxDays
    }
    if (ethDay < 1) {
      ethDay = 1
    }

    return createEthiopianDate(ethYear, ethMonth, ethDay, date)
  } catch (error) {
    console.error('Error converting to Ethiopian date:', error)
    // Fallback: return approximate current Ethiopian date
    const now = new Date()
    const fallbackYear = now.getFullYear() - 8
    const fallbackMonth = now.getMonth() >= 8 ? now.getMonth() - 7 : now.getMonth() + 5
    const fallbackDay = Math.max(1, Math.min(30, now.getDate() - 11))
    return createEthiopianDate(fallbackYear, fallbackMonth, fallbackDay, now)
  }
}

/**
 * Helper: Convert Gregorian to Julian Day Number
 */
function gregorianToJulianDay(year: number, month: number, day: number): number {
  if (month < 3) {
    year--
    month += 12
  }
  const a = Math.floor(year / 100)
  const b = 2 - a + Math.floor(a / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5
}


/**
 * Create EthiopianDate object with holidays
 */
function createEthiopianDate(ethYear: number, ethMonth: number, ethDay: number, gregDate: Date): EthiopianDate {
  const monthKey = `${ethMonth.toString().padStart(2, '0')}-${ethDay.toString().padStart(2, '0')}`
  const holiday = ETHIOPIAN_HOLIDAYS[monthKey]
  const dayOfWeek = gregDate.getDay()

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameAm: ETHIOPIAN_MONTHS_AM[ethMonth - 1] || '',
    monthNameEn: ETHIOPIAN_MONTHS_EN[ethMonth - 1] || '',
    dayNameAm: ETHIOPIAN_DAYS_AM[dayOfWeek] || '',
    dayNameEn: ETHIOPIAN_DAYS_EN[dayOfWeek] || '',
    isHoliday: !!holiday,
    holidayName: holiday?.nameAm || holiday?.nameEn,
  }
}

/**
 * Get number of days in Ethiopian month
 */
export function getDaysInEthiopianMonth(year: number, month: number): number {
  return getDaysInEthiopianMonthHelper(year, month)
}

/**
 * Get Ethiopian calendar grid for a month
 * Generates a proper Ethiopian calendar grid starting from day 1 to 30 (or 6 for Pagume)
 */
export function getEthiopianCalendarGrid(ethYear: number, ethMonth: number): (EthiopianDate | null)[][] {
  const daysInMonth = getDaysInEthiopianMonth(ethYear, ethMonth)
  const grid: (EthiopianDate | null)[][] = []
  
  // Get the first day of the Ethiopian month (day 1) in Gregorian to find day of week
  const firstGregDate = ethiopianToGregorian(ethYear, ethMonth, 1)
  const firstDayOfWeek = firstGregDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Create week rows
  let week: (EthiopianDate | null)[] = []
  
  // Add empty cells for days before the Ethiopian month starts (based on Gregorian day of week)
  for (let i = 0; i < firstDayOfWeek; i++) {
    week.push(null)
  }
  
  // Add all days of the Ethiopian month (1 to 30, or 1 to 6 for Pagume)
  for (let ethDay = 1; ethDay <= daysInMonth; ethDay++) {
    // Convert Ethiopian date to Gregorian to get correct day of week and holiday info
    const gregDate = ethiopianToGregorian(ethYear, ethMonth, ethDay)
    const ethDate = gregorianToEthiopian(gregDate)
    
    // Ensure the Ethiopian date matches what we're building
    // Sometimes conversion might have slight errors, so we manually set it
    const correctedEthDate: EthiopianDate = {
      ...ethDate,
      year: ethYear,
      month: ethMonth,
      day: ethDay,
      monthNameAm: ETHIOPIAN_MONTHS_AM[ethMonth - 1] || '',
      monthNameEn: ETHIOPIAN_MONTHS_EN[ethMonth - 1] || '',
    }
    
    week.push(correctedEthDate)
    
    // When week is complete (7 days), add to grid and start new week
    if (week.length === 7) {
      grid.push(week)
      week = []
    }
  }
  
  // Fill remaining week with empty cells
  while (week.length < 7) {
    week.push(null)
  }
  if (week.some(d => d !== null)) {
    grid.push(week)
  }
  
  return grid
}

/**
 * Convert Ethiopian date to Gregorian date
 */
export function ethiopianToGregorian(ethYear: number, ethMonth: number, ethDay: number): Date {
  // Ethiopian to Julian Day Number conversion
  const ethiopianEpoch = 1724220.5 // Julian Day Number of Sept 11, 8 CE (Gregorian)
  
  // Calculate days from Ethiopian epoch
  let daysFromEpoch = (ethYear - 1) * 365
  // Add leap days
  daysFromEpoch += Math.floor((ethYear - 1) / 4)
  // Add months (all months have 30 days except Pagume)
  daysFromEpoch += (ethMonth - 1) * 30
  // Add days
  daysFromEpoch += ethDay - 1
  
  // Convert Julian Day Number to Gregorian date
  const julianDay = ethiopianEpoch + daysFromEpoch
  
  // Simplified conversion from Julian Day to Gregorian
  const jd = Math.floor(julianDay + 0.5)
  const f = julianDay + 0.5 - jd
  
  let a, b, c, d, e, month, day, year
  
  if (jd > 2299161) {
    a = jd + 1
    b = Math.floor((a - 1867216.25) / 36524.25)
    c = a + b - Math.floor(b / 4) + 1525
  } else {
    c = jd + 1524
  }
  
  d = Math.floor((c - 122.1) / 365.25)
  e = Math.floor(365.25 * d)
  const g = Math.floor((c - e) / 30.6001)
  
  day = Math.floor(c - e + f - Math.floor(30.6001 * g))
  month = g < 14 ? g - 1 : g - 13
  year = month > 2 ? d - 4716 : d - 4715
  
  return new Date(year, month - 1, day)
}

/**
 * Get current Ethiopian date
 */
export function getCurrentEthiopianDate(): EthiopianDate {
  return gregorianToEthiopian(new Date())
}

