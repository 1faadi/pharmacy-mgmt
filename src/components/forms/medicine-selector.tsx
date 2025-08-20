'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

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
}

export default function MedicineSelector({ items, onChange }: MedicineSelectorProps) {
  const addMedicineItem = () => {
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
    const updatedItems = [...items]
    updatedItems[index][field] = value
    onChange(updatedItems)
  }

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onChange(updatedItems)
  }

  const medicineFormOptions = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Ointment', 
    'Cream', 'Gel', 'Powder', 'Inhaler', 'Suppository', 'Other'
  ]

  const frequencyOptions = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'Before meals', 'After meals', 'At bedtime', 'As needed'
  ]

  const durationOptions = [
    '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '30 days',
    '2 months', '3 months', '6 months', 'Until finished', 'Continuous'
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Medicines</h3>
        <button
          type="button"
          onClick={addMedicineItem}
          className="bg-green-600 text-white px-3 py-1 text-sm rounded-md hover:bg-green-700"
        >
          Add Medicine
        </button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-gray-700">Medicine {index + 1}</h4>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Medicine Name, Strength, and Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medicine Name *
              </label>
              <input
                type="text"
                value={item.medicineName}
                onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Paracetamol"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Strength *
              </label>
              <input
                type="text"
                value={item.strength}
                onChange={(e) => updateItem(index, 'strength', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 500mg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Form *
              </label>
              <select
                value={item.form}
                onChange={(e) => updateItem(index, 'form', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select form</option>
                {medicineFormOptions.map((form) => (
                  <option key={form} value={form}>
                    {form}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dosage, Frequency, and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dosage *
              </label>
              <input
                type="text"
                value={item.dosage}
                onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1 tablet, 5ml"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Frequency *
              </label>
              <select
                value={item.frequency}
                onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select frequency</option>
                {frequencyOptions.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Duration *
              </label>
              <select
                value={item.duration}
                onChange={(e) => updateItem(index, 'duration', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select duration</option>
                {durationOptions.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Special Instructions
            </label>
            <textarea
              value={item.remarks}
              onChange={(e) => updateItem(index, 'remarks', e.target.value)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Take after meals, avoid alcohol, etc."
            />
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No medicines added yet.</p>
          <button
            type="button"
            onClick={addMedicineItem}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Add your first medicine
          </button>
        </div>
      )}
    </div>
  )
}
