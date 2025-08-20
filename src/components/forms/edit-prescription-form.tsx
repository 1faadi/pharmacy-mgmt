'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MedicineSelector from './medicine-selector'

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

interface EditPrescriptionFormProps {
  prescription: {
    id: string
    diagnosis: string
    recommendation: string
    notes: string | null
    patient: {
      id: string
      patientCode: string
      pii: {
        fullName: string
      } | null
    }
    items: {
      medicine: {
        name: string
        strength: string
        form: string
      }
      dosage: string
      frequency: string
      duration: string
      remarks: string | null
    }[]
  }
}

export default function EditPrescriptionForm({ prescription }: EditPrescriptionFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(prescription.patient.id)
  const [diagnosis, setDiagnosis] = useState(prescription.diagnosis)
  const [recommendation, setRecommendation] = useState(prescription.recommendation)
  const [notes, setNotes] = useState(prescription.notes || '')
  const [items, setItems] = useState<PrescriptionItem[]>(
    prescription.items.map(item => ({
      medicineName: item.medicine.name,
      strength: item.medicine.strength,
      form: item.medicine.form,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      remarks: item.remarks || ''
    }))
  )
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
      const response = await fetch(`/api/prescriptions/${prescription.id}`, {
        method: 'PUT',
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
        throw new Error('Failed to update prescription')
      }

      const result = await response.json()
      router.push(`/doctor/prescriptions/${prescription.id}`)
      
    } catch (error) {
      console.error('Error updating prescription:', error)
      setErrors({ submit: 'Failed to update prescription. Please try again.' })
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

      {/* Current Patient Info */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Current Patient:</strong> {prescription.patient.pii?.fullName} ({prescription.patient.patientCode})
            </p>
          </div>
        </div>
      </div>

      {/* Patient Selection */}
      <div>
        <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
          Patient *
        </label>
        <select
          id="patient"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className={`bg-white text-black mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.patient ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select a patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.pii?.fullName} ({patient.patientCode})
            </option>
          ))}
        </select>
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
          className={`bg-white text-black mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.diagnosis ? 'border-red-300' : 'border-gray-300'
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
          className={`bg-white text-black mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.recommendation ? 'border-red-300' : 'border-gray-300'
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
          className="bg-white text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any additional notes or observations..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push(`/doctor/prescriptions/${prescription.id}`)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Updating...' : 'Update Prescription'}
        </button>
      </div>
    </form>
  )
}
