'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MedicineSelector from './medicine-selector'
import Link from 'next/link'

interface Patient {
  id: string
  patientCode: string
  pii: {
    fullName: string
  } | null
}

interface PrescriptionItem {
  medicineName: string
  strength: string
  form: string
  dosage: string
  frequency: string
  duration: string
  remarks: string
}

interface PrescriptionFormProps {
  initialPatientId?: string
}

export default function PrescriptionForm({ initialPatientId }: PrescriptionFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '')
  const [diagnosis, setDiagnosis] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PrescriptionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchPatients()
  }, [])

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true)
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        showErrorToast('Failed to load patients. Please refresh.')
      }
    } catch (error) {
      showErrorToast('Network error. Please check your connection.')
    } finally {
      setIsLoadingPatients(false)
    }
  }

  const showErrorToast = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedPatientId) {
      newErrors.patient = 'Please select a patient'
    }

    if (!diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required'
    }

    if (!recommendation.trim()) {
      newErrors.recommendation = 'Recommendation is required'
    }

    if (items.length === 0) {
      newErrors.medicines = 'At least one medicine is required'
    }

    items.forEach((item, index) => {
      if (!item.medicineName.trim()) {
        newErrors[`medicineName_${index}`] = 'Medicine name is required'
      }
      if (!item.strength.trim()) {
        newErrors[`strength_${index}`] = 'Strength is required'
      }
      if (!item.form) {
        newErrors[`form_${index}`] = 'Form is required'
      }
      if (!item.dosage.trim()) {
        newErrors[`dosage_${index}`] = 'Dosage is required'
      }
      if (!item.frequency) {
        newErrors[`frequency_${index}`] = 'Frequency is required'
      }
      if (!item.duration) {
        newErrors[`duration_${index}`] = 'Duration is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showErrorToast('Please fix the highlighted fields before submitting.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          diagnosis,
          recommendation,
          notes: notes || undefined,
          items: items.map(item => ({
            medicineName: item.medicineName.trim(),
            strength: item.strength.trim(),
            form: item.form,
            dosage: item.dosage.trim(),
            frequency: item.frequency,
            duration: item.duration,
            remarks: item.remarks.trim() || undefined
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create prescription')
      }

      const result = await response.json()
      router.push(`/doctor/prescriptions/${result.prescription.id}`)

    } catch (error) {
      showErrorToast('Failed to create prescription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshPatients = () => {
    fetchPatients()
  }

  // Clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg border-l-4 border-red-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{toastMessage}</span>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
              Select Patient *
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleRefreshPatients}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                disabled={isLoadingPatients}
              >
                🔄 {isLoadingPatients ? 'Loading...' : 'Refresh'}
              </button>
              <Link
                href="/doctor/patients/new"
                className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
              >
                + Create New Patient
              </Link>
            </div>
          </div>

          <div className="relative">
            {isLoadingPatients ? (
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6z" className="opacity-75" />
                  </svg>
                  Loading your patients...
                </div>
              </div>
            ) : (
              <select
                id="patient"
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value)
                  clearFieldError('patient')
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black ${errors.patient
                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <option value="">
                  Select from your patients {patients.length > 0 && `(${patients.length} available)`}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.pii?.fullName} ({patient.patientCode})
                  </option>
                ))}
              </select>
            )}

            {/* Error indicator icon */}
            {errors.patient && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {!isLoadingPatients && patients.length === 0 && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">No patients found</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    You can only prescribe for patients you have treated before.{' '}
                    <Link href="/doctor/patients/new" className="underline hover:text-blue-600">
                      Create your first patient
                    </Link>{' '}
                    to start prescribing.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diagnosis */}
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis *
          </label>
          <div className="relative">
            <textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => {
                setDiagnosis(e.target.value)
                clearFieldError('diagnosis')
              }}
              rows={3}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none bg-white text-black placeholder-gray-500 ${errors.diagnosis
                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 hover:border-gray-400'
                }`}
              placeholder="Enter detailed diagnosis..."
            />
            {errors.diagnosis && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Medicine Selection */}
        <div>
          <MedicineSelector items={items} onChange={setItems} errors={errors} onClearError={clearFieldError} />
        </div>

        {/* Recommendation */}
        <div>
          <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700 mb-1">
            Recommendation / Advice *
          </label>
          <div className="relative">
            <textarea
              id="recommendation"
              value={recommendation}
              onChange={(e) => {
                setRecommendation(e.target.value)
                clearFieldError('recommendation')
              }}
              rows={3}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none bg-white text-black placeholder-gray-500 ${
    errors.diagnosis 
      ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 hover:border-gray-400'
  }`}
              placeholder="Enter recommendations and advice for the patient..."
            />
            {errors.recommendation && (
              <div className="absolute top-2 right-2 pointer-events-none">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="block w-full px-3 py-2 border bg-white text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors resize-none"
            placeholder="Any additional notes or observations..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || patients.length === 0}
            className="w-[160px] h-[60px] px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0c5.373 0 9.726 4.327 9.999 9.631L24 12l-2.001 2.369C21.726 19.673 17.373 24 12 24v-4c5.373 0 9.726-4.327 9.999-9.631L24 12l-2.001-2.369z"
                  />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Prescription</span>
            )}
          </button>
        </div>

      </form>
    </>
  )
}
