'use client'
import { useState } from 'react'

interface PrescriptionItem {
  medicineName: string
  strength: string
  form: string
  dosage: string
  frequency: string
  duration: string
  remarks: string
}

interface MedicineSelectorProps {
  items: PrescriptionItem[]
  onChange: (items: PrescriptionItem[]) => void
  errors?: Record<string, string>        // Add this prop
  onClearError?: (fieldName: string) => void  // Add this prop
}

export default function MedicineSelector({ 
  items, 
  onChange, 
  errors = {},        // Default to empty object
  onClearError        // Add to destructuring
}: MedicineSelectorProps) {
  const addItem = () => {
    const newItem: PrescriptionItem = {
      medicineName: '',
      strength: '',
      form: '',
      dosage: '',
      frequency: '',
      duration: '',
      remarks: ''
    }
    onChange([...items, newItem])
  }

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updatedItems)
    
    // Clear field error when user starts typing
    if (onClearError) {
      onClearError(`${field}_${index}`)
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onChange(updatedItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Medicines *
        </label>
        <button
          type="button"
          onClick={addItem}
          className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
        >
          + Add Medicine
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No medicines added yet.</p>
          <button
            type="button"
            onClick={addItem}
            className="mt-2 text-blue-600 hover:text-blue-900 font-medium"
          >
            Add your first medicine
          </button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border relative">
            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Medicine Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={item.medicineName}
                    onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                    className={`bg-white text-black block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors[`medicineName_${index}`] 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Enter medicine name"
                  />
                  {errors[`medicineName_${index}`] && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Strength */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strength *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={item.strength}
                    onChange={(e) => updateItem(index, 'strength', e.target.value)}
                    className={`bg-white text-black block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors[`strength_${index}`] 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="e.g., 500mg"
                  />
                  {errors[`strength_${index}`] && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form *
                </label>
                <div className="relative">
                  <select
                    value={item.form}
                    onChange={(e) => updateItem(index, 'form', e.target.value)}
                    className={`bg-white text-black block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors[`form_${index}`] 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select form</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Drops</option>
                    <option value="Cream">Cream</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                  {errors[`form_${index}`] && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                    className={`bg-white text-black block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors[`dosage_${index}`] 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="e.g., 1 tablet"
                  />
                  {errors[`dosage_${index}`] && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <div className="relative">
                  <select
                    value={item.frequency}
                    onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                    className={`bg-white text-black block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors[`frequency_${index}`] 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="As needed">As needed</option>
                    <option value="Before meals">Before meals</option>
                    <option value="After meals">After meals</option>
                  </select>
                  {errors[`frequency_${index}`] && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <div className="relative">
                  <select
                    value={item.duration}
                    onChange={(e) => updateItem(index, 'duration', e.target.value)}
                    className={` bg-white text-black block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors[`duration_${index}`] 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select duration</option>
                    <option value="3 days">3 days</option>
                    <option value="5 days">5 days</option>
                    <option value="7 days">7 days</option>
                    <option value="10 days">10 days</option>
                    <option value="14 days">14 days</option>
                    <option value="30 days">30 days</option>
                    <option value="Until finished">Until finished</option>
                    <option value="As needed">As needed</option>
                  </select>
                  {errors[`duration_${index}`] && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={item.remarks}
                onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                rows={2}
                className="bg-white text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors resize-none"
                placeholder="Any special instructions for this medicine..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overall medicines error */}
      {errors.medicines && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-600">At least one medicine is required</span>
          </div>
        </div>
      )}
    </div>
  )
}
