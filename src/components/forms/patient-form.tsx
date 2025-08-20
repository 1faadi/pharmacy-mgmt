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

  const ageBands = [
    { value: '0-1', label: 'Infant (0-1 years)' },
    { value: '2-12', label: 'Child (2-12 years)' },
    { value: '13-17', label: 'Teenager (13-17 years)' },
    { value: '18-35', label: 'Young Adult (18-35 years)' },
    { value: '36-55', label: 'Adult (36-55 years)' },
    { value: '56-70', label: 'Senior (56-70 years)' },
    { value: '70+', label: 'Elderly (70+ years)' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required'
    } else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC format should be: 12345-1234567-1'
    }

    if (!formData.ageBand) {
      newErrors.ageBand = 'Age band is required'
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
        throw new Error('Failed to create patient')
      }

      const result = await response.json()
      
      if (onSuccess) {
        onSuccess(result.patient.id)
      } else {
        router.push(`/doctor/patients/${result.patient.id}`)
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      setErrors({ submit: 'Failed to create patient. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCNIC = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    if (numbers.length <= 12) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`
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
            placeholder="Enter patient's full name"
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
            {ageBands.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
          {errors.ageBand && (
            <p className="mt-1 text-sm text-red-600">{errors.ageBand}</p>
          )}
        </div>
      </div>

      <div>
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
