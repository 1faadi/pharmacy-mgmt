'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PatientFormProps {
  onSuccess?: (patientId: string) => void
  initialData?: {
    fullName?: string
    phone?: string
    address?: string
    cnic?: string
    ageBand?: string
  }
}

export default function PatientForm({ onSuccess, initialData }: PatientFormProps) {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    cnic: initialData?.cnic || '',
    ageBand: initialData?.ageBand || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required'
    } else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC must be in format: 12345-1234567-1'
    }

    if (!formData.ageBand) {
      newErrors.ageBand = 'Age group is required'
    }

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
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create patient')
      }

      const result = await response.json()
      
      if (onSuccess) {
        onSuccess(result.patient.id)
      } else {
        // After creating patient, redirect to prescription creation with patient pre-selected
        router.push(`/doctor/prescriptions/new?patientId=${result.patient.id}`)
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create patient. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCNIC = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as 12345-1234567-1
    if (digits.length <= 5) {
      return digits
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.fullName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="03001234567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address *
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter complete address"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="cnic" className="block text-sm font-medium text-gray-700">
            CNIC *
          </label>
          <input
            type="text"
            id="cnic"
            value={formData.cnic}
            onChange={(e) => handleInputChange('cnic', formatCNIC(e.target.value))}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.cnic ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="12345-1234567-1"
            maxLength={15}
          />
          {errors.cnic && (
            <p className="mt-1 text-sm text-red-600">{errors.cnic}</p>
          )}
        </div>

        <div>
          <label htmlFor="ageBand" className="block text-sm font-medium text-gray-700">
            Age Group *
          </label>
          <select
            id="ageBand"
            value={formData.ageBand}
            onChange={(e) => handleInputChange('ageBand', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.ageBand ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select age group</option>
            <option value="Child (0-12)">Child (0-12)</option>
            <option value="Teen (13-19)">Teen (13-19)</option>
            <option value="Adult (20-59)">Adult (20-59)</option>
            <option value="Senior (60+)">Senior (60+)</option>
          </select>
          {errors.ageBand && (
            <p className="mt-1 text-sm text-red-600">{errors.ageBand}</p>
          )}
        </div>
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
          {isLoading ? 'Creating...' : 'Create Patient'}
        </button>
      </div>
    </form>
  )
}
