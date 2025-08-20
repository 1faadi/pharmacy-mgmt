'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DispenserPrescriptionActionsProps {
  prescription: {
    id: string
    dispensedAt: Date | null
  }
  userId: string
}

export default function DispenserPrescriptionActions({ 
  prescription,
  userId 
}: DispenserPrescriptionActionsProps) {
  const [isDispensing, setIsDispensing] = useState(false)
  const router = useRouter()

  const handleDispense = async () => {
    if (!confirm('Mark this prescription as dispensed? This action cannot be undone.')) {
      return
    }

    setIsDispensing(true)
    try {
      const response = await fetch(`/api/prescriptions/${prescription.id}/dispense`, {
        method: 'POST'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to dispense prescription')
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error)
      alert('Failed to dispense prescription')
    } finally {
      setIsDispensing(false)
    }
  }

  return (
    <div className="flex space-x-3">
      <Link
        href="/dispenser"
        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
      >
        Back to Dashboard
      </Link>
      
      <Link
        href="/dispenser/prescriptions"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        All Prescriptions
      </Link>

      {!prescription.dispensedAt && (
        <button
          onClick={handleDispense}
          disabled={isDispensing}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isDispensing ? 'Dispensing...' : 'Mark as Dispensed'}
        </button>
      )}
      
      {prescription.dispensedAt && (
        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium">
          Already Dispensed
        </span>
      )}
    </div>
  )
}
