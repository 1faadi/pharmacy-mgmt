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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
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

    // Validate each medicine item
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
      console.error('Error creating prescription:', error)
      setErrors({ submit: 'Failed to create prescription. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      {/* Patient Selection */}
      {/* Patient Selection with Create New Option */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
            Patient *
          </label>
          <Link
            href="/doctor/patients/new"
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            + Create New Patient
          </Link>
        </div>
        <select
          id="patient"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.patient ? 'border-red-300' : 'border-gray-300'
            }`}
        >
          <option value="">Select a patient or create new</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.pii?.fullName} ({patient.patientCode})
            </option>
          ))}
        </select>
        {patients.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            No patients found. <Link href="/doctor/patients/new" className="text-blue-600 hover:text-blue-800">Create your first patient</Link> to start prescribing.
          </p>
        )}
        {errors.patient && (
          <p className="mt-1 text-sm text-red-600">{errors.patient}</p>
        )}
      </div>


      {/* Diagnosis */}
      <div>
        <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
          Diagnosis *
        </label>
        <textarea
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={3}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.diagnosis ? 'border-red-300' : 'border-gray-300'
            }`}
          placeholder="Enter diagnosis details..."
        />
        {errors.diagnosis && (
          <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
        )}
      </div>

      {/* Medicine Selection */}
      <div>
        <MedicineSelector items={items} onChange={setItems} />
        {errors.medicines && (
          <p className="mt-1 text-sm text-red-600">{errors.medicines}</p>
        )}
      </div>

      {/* Recommendation */}
      <div>
        <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700">
          Recommendation / Advice *
        </label>
        <textarea
          id="recommendation"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          rows={3}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.recommendation ? 'border-red-300' : 'border-gray-300'
            }`}
          placeholder="Enter recommendations and advice for the patient..."
        />
        {errors.recommendation && (
          <p className="mt-1 text-sm text-red-600">{errors.recommendation}</p>
        )}
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any additional notes or observations..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Prescription'}
        </button>
      </div>
    </form>
  )
}
