'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useLanguage } from '@/app/providers'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ReportIncidentPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { t, language } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    incidentType: '',
    locationDescription: '',
    route: '',
    numberOfVehicles: '',
    description: '',
    latitude: 0,
    longitude: 0,
    reportedLatitude: 0,
    reportedLongitude: 0,
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [locationError, setLocationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/')
        toast.error(t('report.loginRequired') || 'Please login to report incidents')
      }
    }
  }, [user, authLoading, router, t])

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            reportedLatitude: position.coords.latitude,
            reportedLongitude: position.coords.longitude,
          }))
        },
        (error) => {
          setLocationError('Unable to get GPS location. Please enable location services.')
        }
      )
    } else {
      setLocationError('Geolocation is not supported by your browser.')
    }
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5 - photos.length)
      const newPhotos = [...photos, ...files]
      setPhotos(newPhotos)
      
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setPhotoPreviews([...photoPreviews, ...newPreviews])
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newPreviews = photoPreviews.filter((_, i) => i !== index)
    
    URL.revokeObjectURL(photoPreviews[index])
    
    setPhotos(newPhotos)
    setPhotoPreviews(newPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error(t('report.loginRequired') || 'Please login to report incidents')
      return
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('GPS location is required. Please enable location services.')
      return
    }

    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentType', formData.incidentType)
      formDataToSend.append('latitude', formData.latitude.toString())
      formDataToSend.append('longitude', formData.longitude.toString())
      formDataToSend.append('reportedLatitude', (formData.reportedLatitude || formData.latitude).toString())
      formDataToSend.append('reportedLongitude', (formData.reportedLongitude || formData.longitude).toString())
      formDataToSend.append('locationDescription', formData.locationDescription)
      formDataToSend.append('route', formData.route)
      if (formData.numberOfVehicles) {
        formDataToSend.append('numberOfVehicles', formData.numberOfVehicles)
      }
      formDataToSend.append('description', formData.description)
      
      photos.forEach((photo) => {
        formDataToSend.append('photos', photo)
      })

      const response = await api.reportIncidentWithPhotos(formDataToSend)

      // Update user's coin balance in auth context immediately
      const coinsEarned = response.data.coinsAwarded || 1
      const newBalance = response.data.newCoinBalance
      
      if (newBalance !== undefined && user) {
        // Update the user object in auth context to reflect new balance
        const { setUser } = useAuth.getState()
        setUser({
          ...user,
          coinsBalance: newBalance,
        })
      }
      
      toast.success(
        language === 'am' 
          ? `ሪፖርት ተሳክቷል! ${coinsEarned} ሳንቲም አገኛችሁ። ጠቅላላ: ${newBalance || (user?.coinsBalance || 0) + coinsEarned} ሳንቲም።`
          : `Incident reported successfully! You earned ${coinsEarned} coin${coinsEarned !== 1 ? 's' : ''}. Total: ${newBalance || (user?.coinsBalance || 0) + coinsEarned} coins.`
      )
      router.push('/')
    } catch (error: any) {
      console.error('Error reporting incident:', error)
      toast.error(error.response?.data?.error || t('report.error') || 'Failed to report incident')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogoClick = () => {
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tan via-[#d2b48c]/90 to-tan flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#002147]/20 border-t-[#002147] mx-auto"></div>
          <p className="mt-4 text-[#002147] font-medium text-lg">{language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tan via-[#d2b48c]/90 to-tan flex flex-col">
      <Navbar onLogoClick={handleLogoClick} />
      
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="max-w-5xl w-full">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#002147] to-[#003366] rounded-2xl mb-3 shadow-2xl transform hover:scale-105 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#002147] to-[#003366] bg-clip-text text-transparent mb-1">
              {t('report.title') || 'Report Incident'}
            </h1>
            <p className="text-gray-600 text-sm">{language === 'am' ? 'የትራፊክ ክስተት ሪፖርት ያድርጉ' : 'Help keep our roads safe by reporting traffic incidents'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Form - Beautiful Card Design */}
            <div className="lg:col-span-4">
              <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-[#002147]/10">
                <div className="space-y-5">
                  {/* Incident Type */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#002147] mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span>{t('report.incidentType') || 'Incident Type'}</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.incidentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, incidentType: e.target.value }))}
                      className="w-full border-2 border-[#002147]/20 rounded-2xl px-4 py-3 bg-gradient-to-br from-white to-[#002147]/5 focus:outline-none focus:ring-4 focus:ring-[#002147]/20 focus:border-[#002147] text-[#002147] transition-all hover:border-[#002147]/40 shadow-md hover:shadow-lg text-sm font-medium"
                    >
                      <option value="">{t('report.selectType') || 'Select incident type'}</option>
                      <option value="major_accident">{language === 'am' ? 'ዋና አደጋ' : 'Major Accident'}</option>
                      <option value="heavy_congestion">{language === 'am' ? 'ከፍተኛ የትራፊክ መጨናነቅ' : 'Heavy Congestion'}</option>
                      <option value="road_construction">{language === 'am' ? 'የመንገድ ግንባታ' : 'Road Construction'}</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#002147] mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span>{t('report.location') || 'Location / Route'}</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.locationDescription}
                      onChange={(e) => setFormData((prev) => ({ ...prev, locationDescription: e.target.value }))}
                      placeholder={language === 'am' ? 'ምሳሌ፡ ቦሌ አደባባይ ከካዛንቺስ አጠገብ' : 'e.g., Bole Road near Kazanchis'}
                      className="w-full border-2 border-[#002147]/20 rounded-2xl px-4 py-3 bg-gradient-to-br from-white to-[#002147]/5 focus:outline-none focus:ring-4 focus:ring-[#002147]/20 focus:border-[#002147] text-[#002147] transition-all hover:border-[#002147]/40 shadow-md hover:shadow-lg text-sm font-medium"
                    />
                    {locationError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {locationError}
                      </p>
                    )}
                  </div>

                  {/* Route & Vehicles - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Route */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#002147] mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <span>{t('report.route') || 'Route'}</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.route}
                        onChange={(e) => setFormData((prev) => ({ ...prev, route: e.target.value }))}
                        placeholder={language === 'am' ? 'አዲስ አበባ - አርባ ምንጭ' : 'e.g., Addis Ababa - Arba Minch'}
                        className="w-full border-2 border-[#002147]/20 rounded-2xl px-4 py-3 bg-gradient-to-br from-white to-[#002147]/5 focus:outline-none focus:ring-4 focus:ring-[#002147]/20 focus:border-[#002147] text-[#002147] transition-all hover:border-[#002147]/40 shadow-md hover:shadow-lg text-sm font-medium"
                      />
                    </div>

                    {/* Number of Vehicles */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#002147] mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#d2b48c] to-[#c9a968] rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <span>{t('report.numberOfVehicles') || 'Number of Vehicles'}</span>
                        <span className="text-xs text-gray-400">({language === 'am' ? 'እርምጃ' : 'Optional'})</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.numberOfVehicles}
                        onChange={(e) => setFormData((prev) => ({ ...prev, numberOfVehicles: e.target.value }))}
                        placeholder={language === 'am' ? 'የተሳታፊ ተሽከርካሪዎች ብዛት' : 'Number of vehicles'}
                        className="w-full border-2 border-[#002147]/20 rounded-2xl px-4 py-3 bg-gradient-to-br from-white to-[#002147]/5 focus:outline-none focus:ring-4 focus:ring-[#002147]/20 focus:border-[#002147] text-[#002147] transition-all hover:border-[#002147]/40 shadow-md hover:shadow-lg text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#002147] mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span>{t('report.description') || 'Description'}</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      minLength={10}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder={t('report.descriptionPlaceholder') || 'Describe the incident in detail...'}
                      rows={4}
                      className="w-full border-2 border-[#002147]/20 rounded-2xl px-4 py-3 bg-gradient-to-br from-white to-[#002147]/5 focus:outline-none focus:ring-4 focus:ring-[#002147]/20 focus:border-[#002147] text-[#002147] transition-all hover:border-[#002147]/40 resize-none shadow-md hover:shadow-lg text-sm font-medium"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#002147] mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#d2b48c] to-[#c9a968] rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span>{t('report.photos') || 'Photos'}</span>
                      <span className="text-xs text-gray-400">({language === 'am' ? 'እርምጃ' : 'Optional'})</span>
                    </label>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photos.length >= 5}
                        className="w-full border-3 border-dashed border-[#002147]/30 rounded-2xl px-4 py-6 bg-gradient-to-br from-[#002147]/5 via-[#d2b48c]/10 to-[#002147]/5 hover:from-[#002147]/10 hover:via-[#d2b48c]/20 hover:to-[#002147]/10 transition-all text-[#002147] font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] group"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <span className="text-sm">
                            {t('report.uploadPhotos') || 'Upload Photos'} ({photos.length}/5)
                          </span>
                          <span className="text-xs text-gray-600 font-normal">
                            {language === 'am' ? 'እያንዳንዱ ስዕል 10MB እና ከ5 በታች' : 'Max 10MB per image, up to 5 images'}
                          </span>
                        </div>
                      </button>

                      {/* Photo Previews */}
                      {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <div className="relative overflow-hidden rounded-2xl border-3 border-[#002147]/20 shadow-lg hover:shadow-xl transition-all">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-xl transform hover:scale-110"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#002147] to-transparent text-white text-xs p-2">
                                  <p className="truncate">{photos[index]?.name || `Photo ${index + 1}`}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !formData.latitude || !formData.longitude}
                      className="w-full bg-gradient-to-r from-[#002147] via-[#003366] to-[#002147] text-white py-4 px-8 rounded-2xl hover:from-[#003366] hover:via-[#002147] hover:to-[#003366] transition-all font-bold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-2xl hover:shadow-[#002147]/50 text-base transform hover:scale-[1.02] disabled:hover:scale-100 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                            <span>{t('report.submitting') || 'Submitting...'}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{t('report.submit') || 'Submit Report'}</span>
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Guidelines Sidebar - Beautiful Card */}
            <div className="lg:col-span-1">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-5 shadow-2xl border border-[#002147]/10 sticky top-24">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-3 border-gradient-to-r from-[#002147] to-[#d2b48c]">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#d2b48c] to-[#c9a968] rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-base text-[#002147]">
                    {t('report.guidelines') || 'Guidelines'}
                  </h3>
                </div>
                <ul className="space-y-3 text-xs text-[#002147]/90">
                  {[
                    language === 'am' ? 'በግልጽና በእውነት ይግለጹ' : 'Be accurate and truthful',
                    language === 'am' ? 'የቦታ ዝርዝሮችን ያካትቱ' : 'Include location details',
                    language === 'am' ? 'የ GPS አካባቢዎ ይረጋገጣል' : 'GPS will be verified',
                    language === 'am' ? 'ትክክለኛ ሪፖርቶች ሳንቲሞችን ያገኛሉ' : 'Valid reports earn coins',
                    language === 'am' ? 'የተረጋገጡ ሪፖርቶች ተጨማሪ ሳንቲሞችን ያገኛሉ' : 'Verified reports earn bonus',
                    language === 'am' ? 'የተሳሳቱ ሪፖርቶች ማገዶዎችን ሊያመጡ ይችላሉ' : 'False reports may result in bans',
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#d2b48c] to-[#c9a968] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>

                {/* Privacy Section */}
                <div className="mt-6 pt-4 border-t-3 border-gradient-to-r from-[#d2b48c] to-[#002147]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#002147] to-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-base text-[#002147]">
                      {language === 'am' ? 'ግላዊነት' : 'Privacy'}
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#002147]/5 to-[#d2b48c]/10 rounded-xl p-3 border border-[#002147]/10">
                    <p className="text-xs text-[#002147]/90 leading-relaxed">
                      {language === 'am' 
                        ? 'ሁሉም ሪፖርቶች በስም የማይገለጡ ናቸው። የእርስዎ የግል መረጃ ደህንነት የተጠበቀ ነው።' 
                        : 'All reports are anonymous. Your personal information is kept secure and confidential.'}
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="mt-6 pt-4 border-t-3 border-gradient-to-r from-[#d2b48c] to-[#002147]">
                    <p className="text-xs text-[#002147]/60 mb-1.5 font-semibold uppercase tracking-wider">
                      {language === 'am' ? 'የእርስዎ ሳንቲሞች' : 'Your Coins'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#d2b48c] to-[#c9a968] rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-xl">💰</span>
                      </div>
                      <p className="text-2xl font-extrabold bg-gradient-to-r from-[#002147] to-[#003366] bg-clip-text text-transparent">
                        {user.coinsBalance || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
