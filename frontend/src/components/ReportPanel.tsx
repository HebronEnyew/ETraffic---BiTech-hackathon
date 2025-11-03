'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/app/providers'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ReportPanelProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Report Analysis Panel
 * In-page panel for reporting incidents with multiple photo uploads
 */
export default function ReportPanel({ isOpen, onClose }: ReportPanelProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
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
  const [locationError, setLocationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user || !user.isVerified) {
      toast.error('Only verified users can report incidents')
      onClose()
      return
    }

    // Get GPS location
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
  }, [user, onClose])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    
    if (imageFiles.length + photos.length > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    setPhotos((prev) => [...prev, ...imageFiles])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.isVerified) {
      toast.error('Only verified users can report incidents')
      return
    }

    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentType', formData.incidentType)
      formDataToSend.append('latitude', formData.latitude.toString())
      formDataToSend.append('longitude', formData.longitude.toString())
      formDataToSend.append('reportedLatitude', formData.reportedLatitude.toString())
      formDataToSend.append('reportedLongitude', formData.reportedLongitude.toString())
      formDataToSend.append('locationDescription', formData.locationDescription)
      formDataToSend.append('description', formData.description)
      
      if (formData.route) {
        formDataToSend.append('route', formData.route)
      }
      if (formData.numberOfVehicles) {
        formDataToSend.append('numberOfVehicles', formData.numberOfVehicles)
      }

      // Append photos
      photos.forEach((photo) => {
        formDataToSend.append('photos', photo)
      })

      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/api/reports`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      })

      toast.success(`Incident reported! You earned ${response.data.coinsAwarded || 0} coins.`)
      onClose()
      // Reset form
      setFormData({
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
      setPhotos([])
    } catch (error: any) {
      if (error.response?.status === 413) {
        toast.error('File size too large. Please upload smaller photos.')
      } else if (error.response?.status === 401) {
        toast.error('Please login to report incidents')
      } else {
        toast.error(error.response?.data?.error || 'Failed to report incident')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">{t('report.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black transition-colors rounded-full p-1 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                {t('report.incidentType')} <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">{t('report.selectType')}</option>
                <option value="major_accident">{t('incidents.majorAccident')}</option>
                <option value="heavy_congestion">{t('incidents.heavyCongestion')}</option>
                <option value="road_construction">{t('incidents.roadConstruction')}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  {t('report.location')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                  placeholder="e.g., Bole Road near Kazanchis"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {locationError && (
                  <p className="mt-1 text-sm text-red-600">{locationError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-black">
                  {t('report.route')}
                </label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="e.g., From Kazanchis to Wollo Sefer"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                {t('report.numberOfVehicles')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.numberOfVehicles}
                onChange={(e) => setFormData({ ...formData, numberOfVehicles: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                {t('report.description')} <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                minLength={10}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('report.descriptionPlaceholder')}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">
                {t('report.photos')} (Max 5)
              </label>
              <div className="border-2 border-gray-300 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center justify-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-600">{t('report.uploadPhotos')}</span>
                </label>
                
                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">{t('report.photoNote')}</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.latitude || !formData.longitude}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? t('report.submitting') : t('report.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

